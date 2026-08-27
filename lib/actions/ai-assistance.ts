"use server";

/**
 * Accepting a proposal (vision §8; CLAUDE.md §10.2).
 *
 * ---------------------------------------------------------------------------
 * This is the only bridge from a proposal to curriculum, and it is a person
 * ---------------------------------------------------------------------------
 *
 * The gateway returns a proposal and stops. Nothing it produces reaches a
 * lesson until someone submits one of these forms, and each one is an ordinary
 * authenticated server action with the ordinary rules: Zod validation, the
 * draft-only check, a transaction, an idempotency key, and an audit event
 * written in the same transaction (CLAUDE.md §1, §6).
 *
 * Three properties are worth naming because they are what make the boundary
 * real rather than procedural:
 *
 * **The content is re-validated here, from the form.** The server does not keep
 * the proposal and does not trust that what arrives is what Gemini said. What
 * the designer submits is what gets written — which is precisely why "Edit
 * before accepting" is safe, and why a tampered payload is no more dangerous
 * than a person typing the same thing by hand.
 *
 * **Every write goes through the same domain function a hand-typed edit uses.**
 * There is no assistant-specific write path, so alignment rules, the
 * draft-only rule, and the standards check cannot be bypassed by arriving from
 * a proposal. An exit-ticket item drafted by the assistant is refused for the
 * wrong standard exactly as a hand-written one would be.
 *
 * **The decision and the write land together.** `resolveGeneration` runs inside
 * the same `transact` as the content write, so a failure leaves neither — the
 * history never says "accepted" about something that was not written.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { resolveGeneration } from "@/lib/ai/generations";
import { SUPPORT_LEVELS } from "@/lib/ai/schemas";
import { requireUser } from "@/lib/auth/session";
import {
  appendGuidedPractice,
  appendWorkedModel,
  saveLessonBlock,
  saveQuizItem,
} from "@/lib/curriculum/lesson-authoring";
import { transact } from "@/lib/db/store";
import { addAsset, decideAsset } from "@/lib/narrative/assets";
import { saveBeat } from "@/lib/narrative/studio";
import {
  ASSET_ASPECT_RATIOS,
  ASSET_KINDS,
  LESSON_SECTIONS,
  type LessonSection,
} from "@/lib/db/types";

import { toFailure, type ActionResult } from "./result";

const KEY = z.string().min(8).max(200);
const GENERATION = z.string().min(3).max(64);
const REASON = z.string().trim().min(4, "A recorded reason is required.").max(500);

/**
 * Whether the designer changed the proposal before accepting.
 *
 * The browser reports it, and the browser is the only thing that can: it is the
 * only party that saw both the proposal and what was submitted. It is a
 * reporting nicety on the history, not an authorization input — nothing is
 * permitted or refused on the strength of it, so a wrong answer costs a label
 * and nothing else.
 */
const EDITED = z
  .union([z.literal("true"), z.literal("false")])
  .default("false")
  .transform((v) => v === "true");

function acceptanceStatus(edited: boolean): "accepted" | "accepted_edited" {
  return edited ? "accepted_edited" : "accepted";
}

/** Textareas carry one entry per line. */
function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Worked example
// ---------------------------------------------------------------------------

const WorkedExample = z.object({
  generationId: GENERATION,
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  /** `step :: reasoning` per line, as the studio's own worked-model field uses. */
  steps: z
    .array(z.object({ step: z.string().max(1000), reasoning: z.string().max(1000) }))
    .min(1)
    .max(12),
  edited: EDITED,
  reason: REASON,
  idempotencyKey: KEY,
});

/**
 * Accepts a worked example into the lesson's worked model.
 *
 * The problem statement and the final answer become the first and last steps,
 * because the worked model is what the product renders and a step outside it
 * would be content the lesson player never shows.
 */
export async function acceptWorkedExampleAction(
  formData: FormData,
): Promise<ActionResult<{ lessonCode: string }>> {
  try {
    const actor = await requireUser();
    const input = WorkedExample.parse({
      generationId: formData.get("generationId"),
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      steps: lines(formData.get("steps")).map((line) => {
        const [step, ...rest] = line.split("::");
        return { step: (step ?? "").trim(), reasoning: rest.join("::").trim() };
      }),
      edited: formData.get("edited"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    const lesson = transact(() => {
      const saved = appendWorkedModel(
        actor,
        {
          versionId: input.versionId,
          lessonCode: input.lessonCode,
          steps: input.steps,
          reason: input.reason,
        },
        input.idempotencyKey,
      );
      resolveGeneration(
        actor,
        {
          generationId: input.generationId,
          status: acceptanceStatus(input.edited),
          resultingAuditId: null,
          reason: input.reason,
        },
        input.idempotencyKey,
      );
      return saved;
    });

    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Worked example added to ${lesson.lessonCode}. It is draft content and reaches students only when this version is published.`,
      lessonCode: lesson.lessonCode,
    };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Guided practice
// ---------------------------------------------------------------------------

const Practice = z.object({
  generationId: GENERATION,
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  items: z
    .array(
      z.object({
        prompt: z.string().max(1000),
        hint: z.string().max(600),
        answer: z.string().max(1000),
        supportLevel: z.enum(SUPPORT_LEVELS).optional(),
      }),
    )
    .min(1)
    .max(8),
  edited: EDITED,
  reason: REASON,
  idempotencyKey: KEY,
});

export async function acceptGuidedPracticeAction(
  formData: FormData,
): Promise<ActionResult<{ lessonCode: string }>> {
  try {
    const actor = await requireUser();
    const input = Practice.parse({
      generationId: formData.get("generationId"),
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      // `prompt :: hint :: answer`, matching the studio's own practice field.
      items: lines(formData.get("items")).map((line) => {
        const [prompt, hint, answer] = line.split("::").map((p) => p.trim());
        return { prompt: prompt ?? "", hint: hint ?? "", answer: answer ?? "" };
      }),
      edited: formData.get("edited"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    const lesson = transact(() => {
      const saved = appendGuidedPractice(
        actor,
        {
          versionId: input.versionId,
          lessonCode: input.lessonCode,
          items: input.items.map((i) => ({
            prompt: i.prompt,
            hint: i.hint,
            answer: i.answer,
          })),
          reason: input.reason,
        },
        input.idempotencyKey,
      );
      resolveGeneration(
        actor,
        {
          generationId: input.generationId,
          status: acceptanceStatus(input.edited),
          resultingAuditId: null,
          reason: input.reason,
        },
        input.idempotencyKey,
      );
      return saved;
    });

    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `${input.items.length} practice ${
        input.items.length === 1 ? "item" : "items"
      } added to ${lesson.lessonCode}.`,
      lessonCode: lesson.lessonCode,
    };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Rewrite
// ---------------------------------------------------------------------------

const Rewrite = z.object({
  generationId: GENERATION,
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  blockId: z.string().min(1),
  section: z.enum(LESSON_SECTIONS),
  kind: z.enum(["text", "callout", "heading"]),
  text: z.string().min(1).max(6000),
  /** Callouts keep their title and tone; the rewrite replaces the body only. */
  title: z.string().max(200).default(""),
  tone: z.enum(["note", "important", "example", "memory"]).default("note"),
  edited: EDITED,
  reason: REASON,
  idempotencyKey: KEY,
});

/**
 * Replaces one block's text with the accepted rewrite.
 *
 * `saveLessonBlock` is the studio's own block editor, so the rewrite is subject
 * to the same validation any hand edit is — and lands in the same place in the
 * same section, because the block id and section come from the block that was
 * selected rather than from anything the assistant returned.
 */
export async function acceptRewriteAction(
  formData: FormData,
): Promise<ActionResult<{ lessonCode: string }>> {
  try {
    const actor = await requireUser();
    const input = Rewrite.parse({
      generationId: formData.get("generationId"),
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      blockId: formData.get("blockId"),
      section: formData.get("section"),
      kind: formData.get("kind"),
      text: formData.get("text"),
      title: formData.get("title") ?? "",
      tone: formData.get("tone") ?? "note",
      edited: formData.get("edited"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    transact(() => {
      saveLessonBlock(
        actor,
        {
          versionId: input.versionId,
          lessonCode: input.lessonCode,
          blockId: input.blockId,
          section: input.section satisfies LessonSection,
          kind: input.kind,
          text: input.text,
          title: input.title,
          tone: input.tone,
          // The rest of the block shape. `saveLessonBlock` reads only the
          // fields its `kind` needs, and passing the whole shape is what the
          // studio's own form does.
          ordered: false,
          items: [],
          term: "",
          meaning: "",
          caption: "",
          headers: [],
          rows: [],
          url: "",
          alt: "",
          videoId: "",
          materialId: "",
          reason: input.reason,
        },
        input.idempotencyKey,
      );
      resolveGeneration(
        actor,
        {
          generationId: input.generationId,
          status: acceptanceStatus(input.edited),
          resultingAuditId: null,
          reason: input.reason,
        },
        input.idempotencyKey,
      );
    });

    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `The passage in ${input.lessonCode} was replaced with the version you accepted.`,
      lessonCode: input.lessonCode,
    };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Exit-ticket item
// ---------------------------------------------------------------------------

const ExitItem = z.object({
  generationId: GENERATION,
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  standard: z.string().min(1).max(40),
  stem: z.string().min(1).max(1000),
  rationale: z.string().min(1).max(1000),
  correct: z.string().min(1).max(300),
  /** `text :: error-code` per line. An error code per wrong choice is required. */
  distractors: z
    .array(z.object({ text: z.string().max(300), errorCode: z.string().max(60) }))
    .min(1)
    .max(5),
  edited: EDITED,
  reason: REASON,
  idempotencyKey: KEY,
});

/**
 * Accepts ONE drafted item.
 *
 * One at a time on purpose: an exit ticket decides whether a student advances,
 * and a designer should be reading each item rather than approving a batch.
 * `saveQuizItem` still checks the standard against the lesson's primary
 * coverage and still requires an error family on every distractor, so an item
 * the assistant misaligned is refused here with the same message a hand-written
 * one would get.
 */
export async function acceptExitTicketItemAction(
  formData: FormData,
): Promise<ActionResult<{ lessonCode: string }>> {
  try {
    const actor = await requireUser();
    const input = ExitItem.parse({
      generationId: formData.get("generationId"),
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      standard: formData.get("standard"),
      stem: formData.get("stem"),
      rationale: formData.get("rationale"),
      correct: formData.get("correct"),
      distractors: lines(formData.get("distractors")).map((line) => {
        const [text, ...rest] = line.split("::");
        return { text: (text ?? "").trim(), errorCode: rest.join("::").trim() };
      }),
      edited: formData.get("edited"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    transact(() => {
      saveQuizItem(
        actor,
        {
          versionId: input.versionId,
          lessonCode: input.lessonCode,
          itemId: null,
          purpose: "exit_ticket",
          standard: input.standard,
          stem: input.stem,
          rationale: input.rationale,
          // The correct choice is first, and `correctIndex` says so. The
          // domain requires an error family on every OTHER choice and rejects
          // the item if one is missing.
          choices: [
            { text: input.correct, errorCode: "" },
            ...input.distractors.map((d) => ({
              text: d.text,
              errorCode: d.errorCode,
            })),
          ],
          correctIndex: 0,
          reason: input.reason,
        },
        input.idempotencyKey,
      );
      resolveGeneration(
        actor,
        {
          generationId: input.generationId,
          status: acceptanceStatus(input.edited),
          resultingAuditId: null,
          reason: input.reason,
        },
        input.idempotencyKey,
      );
    });

    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Exit-ticket item added to ${input.lessonCode}, aligned to ${input.standard}.`,
      lessonCode: input.lessonCode,
    };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Narrative beat
// ---------------------------------------------------------------------------

const Beat = z.object({
  generationId: GENERATION,
  narrativeId: z.string().min(1),
  chapterId: z.string().min(1),
  beatId: z.string().min(1).nullable().default(null),
  lessonCode: z.string().max(64).nullable().default(null),
  academicObjective: z.string().max(1000),
  narrativeEvent: z.string().min(1).max(4000),
  learningUnlock: z.string().max(1000),
  edited: EDITED,
  reason: REASON,
  idempotencyKey: KEY,
});

/**
 * Accepts a proposed scene — or a chosen brainstormed hook — as a beat.
 *
 * Note what this does NOT do: it does not touch narrative state, resolve a plot
 * thread, or add a character. A continuation proposal lists what accepting it
 * would imply for the state, and updating the state is the designer's own,
 * separate write. Canon does not move because a suggestion was taken.
 */
export async function acceptNarrativeBeatAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const raw = formData.get("beatId");
    const input = Beat.parse({
      generationId: formData.get("generationId"),
      narrativeId: formData.get("narrativeId"),
      chapterId: formData.get("chapterId"),
      beatId: raw && String(raw).length > 0 ? String(raw) : null,
      lessonCode:
        formData.get("lessonCode") && String(formData.get("lessonCode")).length > 0
          ? String(formData.get("lessonCode"))
          : null,
      academicObjective: formData.get("academicObjective") ?? "",
      narrativeEvent: formData.get("narrativeEvent"),
      learningUnlock: formData.get("learningUnlock") ?? "",
      edited: formData.get("edited"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    transact(() => {
      saveBeat(
        actor,
        {
          narrativeId: input.narrativeId,
          chapterId: input.chapterId,
          beatId: input.beatId,
          lessonCode: input.lessonCode,
          academicObjective: input.academicObjective,
          narrativeEvent: input.narrativeEvent,
          learningUnlock: input.learningUnlock,
          reason: input.reason,
        },
        input.idempotencyKey,
      );
      resolveGeneration(
        actor,
        {
          generationId: input.generationId,
          status: acceptanceStatus(input.edited),
          resultingAuditId: null,
          reason: input.reason,
        },
        input.idempotencyKey,
      );
    });

    revalidatePath("/", "layout");
    return {
      ok: true,
      message:
        "The beat was saved to the chapter. Narrative state was not changed — update it yourself if this scene moves the story on.",
      narrativeId: input.narrativeId,
    };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Visual candidate
// ---------------------------------------------------------------------------

const Visual = z.object({
  generationId: GENERATION,
  narrativeId: z.string().min(1).nullable().default(null),
  lessonCode: z.string().max(64).nullable().default(null),
  kind: z.enum(ASSET_KINDS),
  title: z.string().min(1).max(200),
  brief: z.string().max(2000),
  /** Required to accept. An image without it is missing for part of the class. */
  alt: z.string().min(1, "Alternative text is required.").max(1000),
  aspectRatio: z.enum(ASSET_ASPECT_RATIOS),
  /** The candidate, as the data URI the preview showed. */
  dataUri: z.string().min(1).max(12_000_000),
  edited: EDITED,
  reason: REASON,
  idempotencyKey: KEY,
});

/**
 * Accepts a generated image into the asset library.
 *
 * It is stored as a candidate and immediately decided, so the library's history
 * shows both events rather than an image that appeared already approved. The
 * alternative text is the designer's own, because they are the one who can tell
 * whether a description of the picture is true.
 *
 * Accepting an asset puts it in the LIBRARY. Placing it in a lesson is a
 * further, separate act in the studio — nothing generated is injected into
 * curriculum by being accepted here (vision §18).
 */
export async function acceptVisualAssetAction(
  formData: FormData,
): Promise<ActionResult<{ assetId: string }>> {
  try {
    const actor = await requireUser();
    const input = Visual.parse({
      generationId: formData.get("generationId"),
      narrativeId:
        formData.get("narrativeId") && String(formData.get("narrativeId")).length > 0
          ? String(formData.get("narrativeId"))
          : null,
      lessonCode:
        formData.get("lessonCode") && String(formData.get("lessonCode")).length > 0
          ? String(formData.get("lessonCode"))
          : null,
      kind: formData.get("kind"),
      title: formData.get("title"),
      brief: formData.get("brief") ?? "",
      alt: formData.get("alt"),
      aspectRatio: formData.get("aspectRatio"),
      dataUri: formData.get("dataUri"),
      edited: formData.get("edited"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    if (!input.dataUri.startsWith("data:image/")) {
      return toFailure(new Error("That is not an image."));
    }

    const asset = transact(() => {
      const candidate = addAsset(
        actor,
        {
          narrativeId: input.narrativeId,
          lessonCode: input.lessonCode,
          kind: input.kind,
          title: input.title,
          brief: input.brief,
          alt: "",
          aspectRatio: input.aspectRatio,
          source: "generated",
          url: input.dataUri,
          generationId: input.generationId,
          status: "candidate",
          reason: input.reason,
        },
        `${input.idempotencyKey}:candidate`,
      );
      const decided = decideAsset(
        actor,
        {
          assetId: candidate.id,
          decision: "accepted",
          alt: input.alt,
          reason: input.reason,
        },
        `${input.idempotencyKey}:decision`,
      );
      resolveGeneration(
        actor,
        {
          generationId: input.generationId,
          status: acceptanceStatus(input.edited),
          resultingAuditId: null,
          reason: input.reason,
        },
        input.idempotencyKey,
      );
      return decided;
    });

    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `"${asset.title}" was added to the asset library. Place it in a lesson from the studio when you want a student to see it.`,
      assetId: asset.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Rejecting and acknowledging
// ---------------------------------------------------------------------------

const Dismiss = z.object({
  generationId: GENERATION,
  /**
   * `acknowledged` for advisory results a person read; `rejected` for a
   * proposal they turned down. Both commit nothing, and the distinction keeps
   * the usage figures honest.
   */
  outcome: z.enum(["rejected", "acknowledged"]),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function dismissProposalAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireUser();
    const input = Dismiss.parse({
      generationId: formData.get("generationId"),
      outcome: formData.get("outcome"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    transact(() =>
      resolveGeneration(
        actor,
        {
          generationId: input.generationId,
          status: input.outcome,
          resultingAuditId: null,
          reason: input.reason,
        },
        input.idempotencyKey,
      ),
    );

    revalidatePath("/", "layout");
    return {
      ok: true,
      message:
        input.outcome === "rejected"
          ? "Proposal discarded. Nothing in your lesson changed, and the record says it was turned down."
          : "Marked as read. Nothing in your lesson changed.",
    };
  } catch (error) {
    return toFailure(error);
  }
}
