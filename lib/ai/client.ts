/**
 * The Gemini client (CLAUDE.md §10.2).
 *
 * The ONLY module in Beyond.Ed that imports an LLM SDK or reads
 * `GEMINI_API_KEY`. Both facts are enforced outside this file — by
 * `eslint.config.mjs` and by `tests/unit/module-boundaries.test.ts`, which
 * cannot be disabled inline — so the blast radius of a generative call is a
 * directory rather than a codebase.
 *
 * ---------------------------------------------------------------------------
 * What this deliberately does not do
 * ---------------------------------------------------------------------------
 *
 * The Interactions API can create agents, attach tools, run in a remote
 * environment, continue in the background, and store conversations. None of
 * that is used, and none of it is reachable from here:
 *
 *   - no `tools`, so the model cannot call anything;
 *   - no `agent` and no `agent_config`, so there is no autonomous loop;
 *   - no `environment`, so there is no machine for it to act on;
 *   - `background` is never set, so a request finishes or fails within one
 *     HTTP round trip and cannot outlive the click that started it;
 *   - `previous_interaction_id` is never sent, so no request inherits another
 *     one's context and there is no conversation to drift inside;
 *   - `store: false`, so Google is not asked to retain the request.
 *
 * One click, one bounded call, one result. `ask` is the only exported way to
 * reach the model and it takes a fully-built request; it has no idea what a
 * capability is, cannot choose a model, and cannot compose a prompt.
 */
import { GoogleGenAI } from "@google/genai";

import { AI_CONFIG, imageMimeType } from "./config";

/** Raised for anything the caller should turn into a sentence for a designer. */
export class GeminiError extends Error {
  constructor(
    message: string,
    readonly kind:
      | "unconfigured"
      | "unauthorized"
      | "rate_limited"
      | "blocked"
      | "timeout"
      | "unavailable"
      | "malformed",
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

/**
 * The client, built once per server process.
 *
 * Cached on `globalThis` for the same reason the data store is: the dev
 * server's module reloading would otherwise build a new one on every edit.
 */
const CLIENT_KEY = Symbol.for("beyond-ed.gemini");
type GlobalWithClient = typeof globalThis & { [CLIENT_KEY]?: GoogleGenAI };

function client(): GoogleGenAI {
  // A browser has no business constructing this, and if a refactor ever put
  // this module in a client bundle the key would be `undefined` there anyway —
  // Next.js inlines only `NEXT_PUBLIC_` variables. This turns a silent
  // misconfiguration into a loud one, on the first line, where it is findable.
  if (typeof window !== "undefined") {
    throw new GeminiError(
      "The design assistant runs on the server only.",
      "unconfigured",
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new GeminiError(
      "Design assistance is not configured for this deployment.",
      "unconfigured",
    );
  }

  const g = globalThis as GlobalWithClient;
  if (!g[CLIENT_KEY]) g[CLIENT_KEY] = new GoogleGenAI({ apiKey });
  return g[CLIENT_KEY];
}

export type AskRequest = {
  model: string;
  /** Server-owned. Never assembled from anything the browser sent. */
  systemInstruction: string;
  /** The assembled context and the designer's instruction, already bounded. */
  input: string;
  /** JSON Schema the response must conform to. Omitted for image requests. */
  responseSchema?: Record<string, unknown>;
  maxOutputTokens?: number;
};

export type AskResult = {
  interactionId: string;
  text: string;
  /** Present only for an image request. Base64 data and its mime type. */
  image: { data: string; mimeType: string } | null;
  inputTokens: number | null;
  outputTokens: number | null;
};

/**
 * One bounded call.
 *
 * Everything about the request is decided by the caller in `/lib/ai`, which in
 * turn was handed a validated capability. This function adds the transport, the
 * timeout, and the translation of a provider failure into something a person
 * can read — and nothing else.
 */
export async function ask(request: AskRequest): Promise<AskResult> {
  const ai = client();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_CONFIG.limits.timeoutMs);

  try {
    const interaction = await ai.interactions.create(
      {
        model: request.model,
        system_instruction: request.systemInstruction,
        input: request.input,
        stream: false,
        // Do not ask Google to retain the request. Beyond.Ed keeps its own
        // record of what was asked, in `ai_generations`.
        store: false,
        generation_config: {
          max_output_tokens: request.maxOutputTokens ?? AI_CONFIG.limits.maxOutputTokens,
        },
        ...(request.responseSchema
          ? {
              response_format: {
                type: "text" as const,
                mime_type: "application/json",
                schema: request.responseSchema,
              },
            }
          : {}),
      },
      {
        // The SDK's own ceiling, plus our signal, so a hung socket cannot
        // outlive the request either way. One retry: a transient 503 should
        // not cost the designer a click, and more than one would turn a slow
        // provider into a slower page.
        timeout: AI_CONFIG.limits.timeoutMs,
        maxRetries: 1,
        fetchOptions: { signal: controller.signal },
      },
    );

    if (interaction.status === "failed" || interaction.status === "cancelled") {
      throw new GeminiError(
        "The design assistant could not complete that request.",
        "unavailable",
      );
    }
    if (interaction.status === "incomplete") {
      throw new GeminiError(
        "The design assistant ran out of room before it finished. Try asking for less at once.",
        "malformed",
      );
    }

    const image = interaction.output_image;
    return {
      interactionId: interaction.id,
      text: interaction.output_text ?? "",
      image:
        image && image.data
          ? { data: image.data, mimeType: imageMimeType(image.mime_type) }
          : null,
      inputTokens: interaction.usage?.total_input_tokens ?? null,
      outputTokens: interaction.usage?.total_output_tokens ?? null,
    };
  } catch (error) {
    throw translate(error);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Provider failure to designer-readable failure.
 *
 * A raw API error is never shown to a person and never logged in full: it can
 * carry request echoes, and a stack trace tells an end user nothing they can
 * act on (vision §25, §28). The status code is enough to say the right sentence.
 */
function translate(error: unknown): GeminiError {
  if (error instanceof GeminiError) return error;

  if (error instanceof Error && error.name === "AbortError") {
    return new GeminiError(
      "The design assistant took too long to answer. Nothing in your lesson changed.",
      "timeout",
    );
  }

  const status = statusOf(error);
  if (status === 401 || status === 403) {
    return new GeminiError(
      "Design assistance is not authorized for this deployment. An administrator needs to check the key.",
      "unauthorized",
    );
  }
  if (status === 429) {
    return new GeminiError(
      "Design assistance is busy right now. Wait a moment and ask again — nothing was changed.",
      "rate_limited",
    );
  }
  if (status === 400) {
    return new GeminiError(
      "The design assistant declined that request. Try rewording your instruction.",
      "blocked",
    );
  }
  return new GeminiError(
    "Design assistance is temporarily unavailable. Your lesson has not been changed.",
    "unavailable",
  );
}

function statusOf(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const candidate = error as { status?: unknown; statusCode?: unknown; code?: unknown };
  for (const value of [candidate.status, candidate.statusCode, candidate.code]) {
    if (typeof value === "number") return value;
  }
  return null;
}
