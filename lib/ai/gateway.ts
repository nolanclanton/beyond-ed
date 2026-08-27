/**
 * The design assistant's one entry point (vision §4; CLAUDE.md §10.2).
 *
 * ---------------------------------------------------------------------------
 * Twelve steps, in this order, every time
 * ---------------------------------------------------------------------------
 *
 *   1.  The request is parsed against a closed schema. Unknown fields are not
 *       carried through; there is no free-text prompt field and no model field.
 *   2.  The capability name is checked against the registry. Anything else is
 *       refused here, before a record is read.
 *   3.  The studio and the assistant must both be switched on.
 *   4.  The actor must hold curriculum authoring, and whatever grants the
 *       capability requires.
 *   5.  Ids are resolved to records, and every record must be in the actor's
 *       own organization.
 *   6.  A draft narrative belonging to someone else is refused.
 *   7.  The rate limiter sees the request.
 *   8.  Context is assembled from the capability's `allowedContext` and nothing
 *       else.
 *   9.  A generation record is opened, so a failure still leaves a trace.
 *   10. One bounded call is made. No tools, no agent, no environment, no
 *       background, no conversation.
 *   11. The response is validated against the capability's schema. A response
 *       that does not parse is discarded.
 *   12. A PROPOSAL is returned.
 *
 * Step 13 does not exist. Nothing here writes curriculum, and there is no
 * branch that could: the module imports no authoring function, and the only
 * record it writes is the log of its own attempt. Committing a proposal is a
 * separate, authenticated, audited human action in
 * `lib/actions/ai-assistance.ts`.
 */
import { z } from "zod";

import { assertCanAuthorCurriculum, hasCurriculumGrant, NotAuthorizedError } from "@/lib/auth/scope";
import { authoredLesson } from "@/lib/curriculum/lesson-authoring";
import { courseForLesson, findLesson } from "@/lib/curriculum/catalog";
import { db } from "@/lib/db/store";
import { LESSON_SECTIONS, type LessonSection, type User } from "@/lib/db/types";

import {
  AI_CAPABILITIES,
  capability as capabilityFor,
  isCapabilityName,
  type AiCapabilityName,
} from "./capabilities";
import { ask as realAsk, GeminiError, type AskResult } from "./client";
import {
  AI_CONFIG,
  assistantUnavailableReason,
  FEATURES,
  imageMimeType,
} from "./config";
import { buildAIContext, composeInput } from "./context";
import { failGeneration, openGeneration, recordUsage } from "./generations";
import { systemInstructionFor } from "./instructions";
import { checkRateLimit } from "./rate-limit";
import { capabilityDecisions, capabilityEnabledFor } from "./settings";
import { jsonSchemaFor, REWRITE_MODES, validateOutput } from "./schemas";
import { ASSET_ASPECT_RATIOS, ASSET_KINDS } from "@/lib/db/types";

/**
 * What a request may contain.
 *
 * A closed list. There is deliberately no field for a system prompt, a model
 * name, a temperature, a tool, or an arbitrary parameter map: the browser
 * names a task and supplies its own words, and everything about HOW the task
 * runs is decided on the server.
 *
 * `settings` is a fixed set of named controls rather than a free-form object,
 * so a capability's options can be validated by shape instead of by trust.
 */
export const AssistRequest = z.object({
  capability: z.string().min(1).max(64),
  /** The designer's own words. Bounded per capability in `assist`. */
  instructions: z.string().max(AI_CONFIG.limits.maxInstructionChars).default(""),

  courseVersionId: z.string().min(1).max(64).nullish(),
  lessonCode: z.string().min(1).max(64).nullish(),
  section: z.string().min(1).max(32).nullish(),
  /** The passage a designer highlighted, for a rewrite. */
  selection: z.string().max(8000).nullish(),
  narrativeId: z.string().min(1).max(64).nullish(),
  characterId: z.string().min(1).max(64).nullish(),

  settings: z
    .object({
      difficulty: z
        .enum(["introductory", "same", "harder", "much_harder"])
        .nullish(),
      useNegativeNumbers: z.boolean().nullish(),
      moreScaffolding: z.boolean().nullish(),
      rewriteMode: z.enum(REWRITE_MODES).nullish(),
      itemCount: z.number().int().min(1).max(8).nullish(),
      progression: z.enum(["introductory", "mixed", "challenging"]).nullish(),
      wordProblems: z.boolean().nullish(),
      narrativeIntegration: z.enum(["low", "medium", "high"]).nullish(),
      /**
       * Whether the assistant may use a skill the lesson has not taught.
       * Defaults to NO, and the default is the point: an item quietly requiring
       * an untaught skill makes a student's failure look like a failure at this
       * lesson.
       */
      mayIntroduceNewSkill: z.boolean().nullish(),
      assetKind: z.enum(ASSET_KINDS).nullish(),
      aspectRatio: z.enum(ASSET_ASPECT_RATIOS).nullish(),
    })
    .default({}),
});

export type AssistInput = z.input<typeof AssistRequest>;

export type Proposal = {
  generationId: string;
  capability: AiCapabilityName;
  model: string;
  /** Validated against the capability's schema. Never raw model output. */
  content: unknown;
  /** An image capability's result, as a data URI ready to preview. */
  image: { dataUri: string; mimeType: string } | null;
  /** Which context parts were sent. Names only — never their contents. */
  contextKeys: string[];
  canRegenerate: boolean;
};

export type AssistOutcome =
  | { ok: true; proposal: Proposal }
  | {
      ok: false;
      /** Written for the designer. Never a provider error or a stack trace. */
      message: string;
      /** Always true. Stated so the interface can say it without deciding it. */
      workPreserved: true;
    };

/** Injected so tests never spend a credit (vision §29). */
export type AssistDeps = { ask: (request: Parameters<typeof realAsk>[0]) => Promise<AskResult> };

function refuse(message: string): AssistOutcome {
  return { ok: false, message, workPreserved: true };
}

export async function assist(
  actor: User,
  rawRequest: unknown,
  deps: AssistDeps = { ask: realAsk },
): Promise<AssistOutcome> {
  // 1. Shape.
  const parsed = AssistRequest.safeParse(rawRequest);
  if (!parsed.success) {
    return refuse("That request was not in a form Beyond.Ed accepts.");
  }
  const request = parsed.data;

  // 2. The capability must be in the registry. This is the boundary; the
  //    interface hiding a button is not.
  if (!isCapabilityName(request.capability)) {
    return refuse("That is not an available design-assistance action.");
  }
  const name: AiCapabilityName = request.capability;
  const cap = capabilityFor(name);
  // Whether this ORGANIZATION allows it — the registry default unless a
  // curriculum administrator decided otherwise. Checked here rather than read
  // from the source constant, so turning something off in the interface
  // actually turns it off.
  if (!capabilityEnabledFor(actor.orgId, name)) {
    return refuse(
      `${cap.label} is switched off for your organization. A curriculum administrator can turn it back on.`,
    );
  }

  // 3. Switched on at all.
  const unavailable = assistantUnavailableReason();
  if (unavailable) return refuse(unavailable);
  if (cap.modality === "image" && !FEATURES.visualGeneration) {
    return refuse(
      "Visual generation is switched off for this deployment. An administrator can enable it.",
    );
  }

  // 4. Authorization. Curriculum authoring first, then whatever the capability
  //    additionally requires.
  try {
    assertCanAuthorCurriculum(actor);
    for (const grant of cap.requiredGrants) {
      if (!hasCurriculumGrant(actor, grant)) {
        throw new NotAuthorizedError(
          `${cap.label} needs the ${grant} authorization, which you do not hold`,
        );
      }
    }
  } catch (error) {
    return refuse(
      error instanceof NotAuthorizedError
        ? error.message
        : "You are not authorized to use design assistance.",
    );
  }

  if (request.instructions.length > cap.maxInstructionChars) {
    return refuse(
      `That instruction is longer than ${cap.label} accepts (${cap.maxInstructionChars} characters). Shorten it and try again.`,
    );
  }

  // 5-6. Resolve ids to records, in this organization.
  const resolved = resolveSources(actor, request);
  if (!resolved.ok) return refuse(resolved.message);

  // 7. Rate limit and double-click guard.
  const signature = JSON.stringify([
    name,
    request.lessonCode,
    request.section,
    request.narrativeId,
    request.instructions,
    request.settings,
  ]);
  const limit = checkRateLimit(actor.id, signature);
  if (!limit.ok) return refuse(limit.message);

  // 8. Context: the capability's allowed kinds, and nothing else.
  const parts = buildAIContext(cap.allowedContext, resolved.sources);
  const input = composeInput(parts, request.instructions, settingsFor(name, request));

  // 9. Open the record before the call, so a failure still leaves a trace.
  const model = cap.modality === "image" ? AI_CONFIG.imageModel : AI_CONFIG.textModel;
  const generation = openGeneration(actor, {
    capability: name,
    model,
    target: resolved.target,
    contextKeys: parts.map((p) => p.kind),
    instructions: request.instructions,
  });

  // 10. One bounded call.
  let result: AskResult;
  try {
    result = await deps.ask({
      model,
      systemInstruction: systemInstructionFor(name),
      input,
      responseSchema: cap.modality === "image" ? undefined : jsonSchemaFor(cap.outputSchema),
      maxOutputTokens: AI_CONFIG.limits.maxOutputTokens,
    });
  } catch (error) {
    const message =
      error instanceof GeminiError
        ? error.message
        : "Design assistance is temporarily unavailable. Your work has not been changed.";
    failGeneration(generation.id, message);
    return refuse(message);
  }

  recordUsage(generation.id, {
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });

  // 11. Validate. An answer we cannot parse is discarded, not displayed.
  if (cap.modality === "image") {
    if (!result.image) {
      const message =
        "The design assistant did not return an image. Nothing was changed — try adjusting the brief.";
      failGeneration(generation.id, message);
      return refuse(message);
    }
    // Narrowed HERE, where the data URI is built, rather than only at the
    // transport. The guarantee has to hold however the bytes arrived.
    const mimeType = imageMimeType(result.image.mimeType);
    return {
      ok: true,
      proposal: {
        generationId: generation.id,
        capability: name,
        model,
        content: null,
        image: {
          dataUri: `data:${mimeType};base64,${result.image.data}`,
          mimeType,
        },
        contextKeys: parts.map((p) => p.kind),
        canRegenerate: cap.supportsRegeneration,
      },
    };
  }

  const validated = validateOutput(cap.outputSchema, result.text);
  if (!validated.ok) {
    failGeneration(generation.id, validated.message);
    return refuse(validated.message);
  }

  // 12. A proposal. Nothing has changed.
  return {
    ok: true,
    proposal: {
      generationId: generation.id,
      capability: name,
      model,
      content: validated.value,
      image: null,
      contextKeys: parts.map((p) => p.kind),
      canRegenerate: cap.supportsRegeneration,
    },
  };
}

// ---------------------------------------------------------------------------
// Resolving what the request points at
// ---------------------------------------------------------------------------

type Resolved =
  | {
      ok: true;
      sources: Parameters<typeof buildAIContext>[1];
      target: Parameters<typeof openGeneration>[1]["target"];
    }
  | { ok: false; message: string };

/**
 * Ids to records, with every scope check on the way.
 *
 * A deleted lesson or narrative reference fails here with a sentence rather
 * than producing an empty context and a confident answer about nothing
 * (vision §28).
 */
function resolveSources(actor: User, request: z.infer<typeof AssistRequest>): Resolved {
  const d = db();

  // The narrative, if one was named.
  let narrative = null;
  if (request.narrativeId) {
    const found = d.narratives.find((n) => n.id === request.narrativeId);
    if (!found) {
      return { ok: false, message: "That narrative no longer exists." };
    }
    if (found.orgId !== actor.orgId) {
      return { ok: false, message: "That narrative is outside your organization." };
    }
    if (
      found.status === "draft" &&
      found.ownerUserId !== actor.id &&
      !found.sharedWithUserIds.includes(actor.id)
    ) {
      return {
        ok: false,
        message: "That narrative is an unfinished draft belonging to someone else.",
      };
    }
    narrative = found;
  }

  if (request.characterId && narrative) {
    if (!narrative.characters.some((c) => c.id === request.characterId)) {
      return { ok: false, message: "That character is not in this narrative." };
    }
  }

  // The lesson, if one was named. The catalog is the authority on whether a
  // lesson code exists at all.
  let authored = null;
  if (request.lessonCode) {
    const course = courseForLesson(request.lessonCode);
    if (!course || !findLesson(course, request.lessonCode)) {
      return { ok: false, message: "That lesson is not in the curriculum catalog." };
    }
    if (request.courseVersionId) {
      const version = d.courseVersions.find((v) => v.id === request.courseVersionId);
      if (!version) {
        return { ok: false, message: "That course version no longer exists." };
      }
      authored = authoredLesson(request.courseVersionId, request.lessonCode) ?? null;
    }
  }

  const section: LessonSection | null =
    request.section && LESSON_SECTIONS.some((s) => s === request.section)
      ? (request.section as LessonSection)
      : null;

  // Every request targets exactly one thing, so its record can be found again.
  const target = request.lessonCode
    ? {
        targetEntity: "authored_lesson" as const,
        targetId: authored?.id ?? `${request.courseVersionId ?? "no-version"}:${request.lessonCode}`,
        courseVersionId: request.courseVersionId ?? null,
        lessonCode: request.lessonCode,
        narrativeId: narrative?.id ?? null,
        sectionId: section,
      }
    : narrative
      ? {
          targetEntity: "narrative" as const,
          targetId: narrative.id,
          courseVersionId: null,
          lessonCode: null,
          narrativeId: narrative.id,
          sectionId: request.characterId ?? null,
        }
      : null;

  if (!target) {
    return {
      ok: false,
      message: "A design-assistance request has to be about a lesson or a narrative.",
    };
  }

  return {
    ok: true,
    sources: {
      lessonCode: request.lessonCode ?? null,
      courseVersionId: request.courseVersionId ?? null,
      authored,
      section,
      selection: request.selection ?? null,
      narrative,
      characterId: request.characterId ?? null,
    },
    target,
  };
}

/**
 * The named controls a capability actually reads, as plain sentences.
 *
 * Written out per capability so a setting cannot leak into a request that has
 * no business with it, and so the sentence the model sees is written here
 * rather than assembled from whatever the browser sent.
 */
function settingsFor(
  name: AiCapabilityName,
  request: z.infer<typeof AssistRequest>,
): Record<string, string> {
  const s = request.settings;
  const out: Record<string, string> = {};

  switch (name) {
    case "generate_worked_example":
      if (s.difficulty) {
        out["Difficulty"] = {
          introductory: "Introductory — the gentlest version of this skill.",
          same: "The same difficulty as the examples already in the lesson.",
          harder: "Somewhat harder than the lesson's existing examples.",
          much_harder: "Noticeably harder, but still within this lesson's goal.",
        }[s.difficulty];
      }
      if (s.useNegativeNumbers) out["Numbers"] = "Use negative numbers.";
      if (s.moreScaffolding) {
        out["Scaffolding"] = "Break the reasoning into smaller steps than usual.";
      }
      break;

    case "generate_guided_practice":
      if (s.itemCount) out["Number of items"] = String(s.itemCount);
      if (s.progression) {
        out["Overall level"] = {
          introductory: "Introductory throughout.",
          mixed: "Mixed — a spread from straightforward to demanding.",
          challenging: "Challenging, while staying within this lesson's goal.",
        }[s.progression];
      }
      out["Word problems"] = s.wordProblems ? "Include word problems." : "No word problems.";
      if (s.narrativeIntegration) {
        out["Narrative integration"] = {
          low: "Low — plain mathematics. Do not add a story.",
          medium: "Medium — light framing from the unit's story.",
          high: "High — items sit inside the unit's story.",
        }[s.narrativeIntegration];
      }
      out["New prerequisite skills"] = s.mayIntroduceNewSkill
        ? "Permitted, and say clearly which item introduces one."
        : "NOT permitted. Use only what this lesson teaches and what its prerequisites list.";
      break;

    case "rewrite_selected_section":
      if (s.rewriteMode) {
        out["Mode"] = {
          clarity: "Improve clarity without changing what is taught.",
          simpler_reading_level: "Lower the reading level. Keep the mathematics identical.",
          more_concise: "Say the same thing in fewer words.",
          stronger_scaffolding: "Add scaffolding. Do not add new content.",
          stronger_narrative_integration:
            "Tie it more closely to the unit's story, without changing the mathematics.",
          alternate_explanation: "Explain the same idea a different way.",
        }[s.rewriteMode];
      }
      break;

    case "draft_exit_ticket":
      if (s.itemCount) out["Number of items"] = String(s.itemCount);
      break;

    case "generate_visual_asset":
      if (s.assetKind) out["Asset type"] = s.assetKind.replace(/_/g, " ");
      if (s.aspectRatio) out["Aspect ratio"] = s.aspectRatio;
      break;

    default:
      break;
  }

  return out;
}

/**
 * Every capability as ONE organization sees it.
 *
 * `enabled` is the organization's answer, not the shipped constant, so a panel
 * built from this cannot offer a control the gateway would refuse. `decided`
 * says whether somebody chose it or it is still the default — which is what the
 * administrator's page needs to show and an assistance panel does not care
 * about.
 */
export function capabilityCatalog(orgId: string): {
  name: AiCapabilityName;
  label: string;
  summary: string;
  enabled: boolean;
  decided: boolean;
  changedByName: string | null;
  reason: string;
  modality: "text" | "image";
  requiresHumanApproval: true;
  supportsRegeneration: boolean;
  requiredGrants: string[];
  allowedContext: string[];
}[] {
  const decisions = new Map(capabilityDecisions(orgId).map((d) => [d.capability, d]));
  return (Object.keys(AI_CAPABILITIES) as AiCapabilityName[]).map((name) => {
    const cap = AI_CAPABILITIES[name];
    const decision = decisions.get(name);
    return {
      name,
      label: cap.label,
      summary: cap.summary,
      enabled: decision?.enabled ?? cap.enabled,
      decided: decision?.decided ?? false,
      changedByName: decision?.changedByName ?? null,
      reason: decision?.reason ?? "",
      modality: cap.modality,
      requiresHumanApproval: cap.requiresHumanApproval,
      supportsRegeneration: cap.supportsRegeneration,
      requiredGrants: [...cap.requiredGrants],
      allowedContext: [...cap.allowedContext],
    };
  });
}
