/**
 * Curriculum Design Studio assistant — configuration (CLAUDE.md §10.2).
 *
 * Every model name, limit, and switch lives here so that changing a model is one
 * edit rather than a search across capabilities, and so a reader can see the
 * whole footprint of the assistant on one screen.
 *
 * This module never returns a credential. It reads `GEMINI_API_KEY` for exactly
 * one purpose — to answer "is one configured?" as a boolean — and the value is
 * never returned, logged, interpolated, or stored. Constructing anything with
 * it happens in `client.ts` and nowhere else.
 */

/**
 * The models the studio uses.
 *
 * `gemini-flash-latest` is an alias that tracks the current Flash model, which
 * is what a responsive authoring assistant wants and what keeps this from
 * silently pinning to something obsolete. Both are overridable by environment
 * variable so a model can be changed without a deploy of new code — and so a
 * deployment can pin a specific version if it wants a fixed target.
 */
export const AI_CONFIG = {
  textModel: process.env.GEMINI_TEXT_MODEL ?? "gemini-flash-latest",
  imageModel: process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image",

  /**
   * Ceilings, not targets. They exist so a runaway request costs a bounded
   * amount and so a designer's mistake — pasting a whole unit into an
   * instruction box — fails immediately with a sentence they can act on rather
   * than slowly with a bill.
   */
  limits: {
    /** Characters a designer may type into one instruction field. */
    maxInstructionChars: 2000,
    /** Characters of assembled context sent in one request. */
    maxContextChars: 24_000,
    /** Output tokens per request. */
    maxOutputTokens: 4096,
    /** Wall-clock ceiling for one request. */
    timeoutMs: 45_000,
    /** Requests per person per rolling window. */
    requestsPerWindow: 20,
    windowMs: 5 * 60_000,
  },
} as const;

/**
 * Feature flags (vision §27).
 *
 * Each defaults to a deliberate value rather than to "on if the variable is
 * missing", and the whole studio works with all three off. `CURRICULUM_STUDIO`
 * is on by default because the human authoring workspace is not an experiment;
 * the assistant is on when a key exists, because a studio with a configured key
 * and a hidden assistant is a puzzle rather than a safeguard; and visual
 * generation is OFF by default, because generating an image costs more, needs a
 * visual bible to be worth anything, and should be a decision someone made.
 */
function flag(name: string, whenUnset: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") return whenUnset;
  return value === "1" || value.toLowerCase() === "true";
}

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

export const FEATURES = {
  get curriculumStudio(): boolean {
    return flag("CURRICULUM_STUDIO_ENABLED", true);
  },
  get assistant(): boolean {
    return flag("GEMINI_ASSISTANT_ENABLED", true) && isGeminiConfigured();
  },
  get visualGeneration(): boolean {
    return flag("GEMINI_VISUAL_GENERATION_ENABLED", false) && isGeminiConfigured();
  },
};

/**
 * Why the assistant is unavailable, in a sentence a designer can act on.
 *
 * `null` means it is available. Every caller shows this rather than composing
 * its own explanation, so an author is never told two different things by two
 * different screens.
 */
export function assistantUnavailableReason(): string | null {
  if (!FEATURES.curriculumStudio) {
    return "The Curriculum Design Studio is switched off for this deployment.";
  }
  if (!isGeminiConfigured()) {
    return "Design assistance is not configured for this deployment. Authoring works normally without it.";
  }
  if (!FEATURES.assistant) {
    return "Design assistance is switched off for this deployment. Authoring works normally without it.";
  }
  return null;
}

/**
 * Image types Beyond.Ed is willing to put in an `<img src>`.
 *
 * The mime type on a generated image is the one piece of model output that
 * reaches a browser as something other than text: it is interpolated into a
 * `data:` URI. The SDK types the field as a union ending in `(string & {})`, so
 * it is whatever came back over the wire.
 *
 * `imageMimeType` narrows it against this list. Anything unrecognised becomes
 * PNG, which is what the bytes almost certainly are — the point is that the
 * STRING cannot be chosen by the response.
 *
 * It lives here, beside the other configuration, rather than next to the
 * transport, because the guarantee has to hold wherever the data URI is built
 * — including when the transport is a test double.
 */
export const RENDERABLE_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export function imageMimeType(declared: string | undefined): string {
  return RENDERABLE_IMAGE_TYPES.find((t) => t === declared) ?? "image/png";
}
