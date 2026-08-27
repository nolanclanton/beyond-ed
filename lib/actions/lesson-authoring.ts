"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import {
  addLessonMaterial,
  addLessonVideo,
  createDraftVersion,
  moveLessonBlock,
  removeLessonBlock,
  removeLessonMaterial,
  removeLessonVideo,
  removeQuizItem,
  saveLessonBlock,
  saveLessonScript,
  saveQuizItem,
} from "@/lib/curriculum/lesson-authoring";

import {
  LESSON_BLOCK_KINDS,
  LESSON_MATERIAL_KINDS,
  LESSON_SECTIONS,
} from "@/lib/db/types";

import { toFailure, type ActionResult } from "./result";

/**
 * The curriculum studio's write endpoints.
 *
 * Every one validates its input with Zod, runs a single transactional domain
 * call that writes its own audit event, and returns a durable result state
 * (CLAUDE.md §1, §6, §12). Nothing here decides anything: the authorization,
 * the draft-only rule, and the alignment rules all live in the domain, so a
 * request that skips this form still meets them.
 */

const REASON = z
  .string()
  .trim()
  .min(4, "A recorded reason is required.")
  .max(500);

const KEY = z.string().min(8).max(200);

/** Textareas carry one entry per line. Blank lines are dropped, not stored. */
function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** `term :: meaning` per line — one separator, so a meaning may contain colons. */
function pairs(
  value: FormDataEntryValue | null,
  keys: [string, string],
): Record<string, string>[] {
  return lines(value).map((line) => {
    const [first, ...rest] = line.split("::");
    return {
      [keys[0]]: first.trim(),
      [keys[1]]: rest.join("::").trim(),
    };
  });
}

const Script = z.object({
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  relevance: z.string().max(4000),
  goal: z.string().max(1000),
  independentTask: z.string().max(4000),
  successCriteria: z.array(z.string().max(500)).max(12),
  notesOutline: z.array(z.string().max(500)).max(24),
  vocabulary: z
    .array(z.object({ term: z.string().max(120), meaning: z.string().max(600) }))
    .max(24),
  workedModel: z
    .array(z.object({ step: z.string().max(1000), reasoning: z.string().max(1000) }))
    .max(16),
  guidedPractice: z
    .array(
      z.object({
        prompt: z.string().max(1000),
        hint: z.string().max(600),
        answer: z.string().max(1000),
      }),
    )
    .max(16),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function saveLessonScriptAction(
  formData: FormData,
): Promise<ActionResult<{ lessonCode: string }>> {
  try {
    const actor = await requireUser();
    const guided = lines(formData.get("guidedPractice")).map((line) => {
      const [prompt, hint, answer] = line.split("::").map((p) => p.trim());
      return { prompt: prompt ?? "", hint: hint ?? "", answer: answer ?? "" };
    });
    const input = Script.parse({
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      relevance: String(formData.get("relevance") ?? ""),
      goal: String(formData.get("goal") ?? ""),
      independentTask: String(formData.get("independentTask") ?? ""),
      successCriteria: lines(formData.get("successCriteria")),
      notesOutline: lines(formData.get("notesOutline")),
      vocabulary: pairs(formData.get("vocabulary"), ["term", "meaning"]),
      workedModel: pairs(formData.get("workedModel"), ["step", "reasoning"]),
      guidedPractice: guided,
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    const lesson = saveLessonScript(
      actor,
      {
        versionId: input.versionId,
        lessonCode: input.lessonCode,
        relevance: input.relevance,
        goal: input.goal,
        successCriteria: input.successCriteria,
        vocabulary: input.vocabulary as { term: string; meaning: string }[],
        workedModel: input.workedModel as { step: string; reasoning: string }[],
        guidedPractice: input.guidedPractice,
        independentTask: input.independentTask,
        notesOutline: input.notesOutline,
        reason: input.reason,
      },
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Script saved for ${lesson.lessonCode}. It reaches students when this version is published.`,
      lessonCode: lesson.lessonCode,
    };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// The lesson canvas
// ---------------------------------------------------------------------------

const Block = z.object({
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  blockId: z.string().min(1).nullable(),
  // Both read from the union's own lists rather than repeated here, so adding a
  // block kind or a lesson section cannot leave this schema quietly rejecting
  // it.
  section: z.enum(LESSON_SECTIONS),
  kind: z.enum(LESSON_BLOCK_KINDS),
  text: z.string().max(8000),
  title: z.string().max(200),
  tone: z.enum(["note", "important", "example", "memory"]),
  ordered: z.boolean(),
  items: z.array(z.string().max(1000)).max(24),
  term: z.string().max(200),
  meaning: z.string().max(1000),
  caption: z.string().max(400),
  headers: z.array(z.string().max(200)).max(6),
  rows: z.array(z.array(z.string().max(400)).max(6)).max(24),
  url: z.string().max(2000),
  alt: z.string().max(600),
  videoId: z.string().max(120),
  materialId: z.string().max(120),
  reason: REASON,
  idempotencyKey: KEY,
});

/** How each block kind is named back to the author in a result message. */
const BLOCK_LABEL: Record<string, string> = {
  heading: "Heading",
  text: "Paragraph",
  callout: "Callout",
  list: "List",
  definition: "Key term",
  table: "Table",
  image: "Image",
  video: "Video",
  material: "Material",
};

/** How each section is named back to the author in a result message. */
const SECTION_LABEL: Record<string, string> = {
  notes: "the notes record",
  relevance: "the introduction",
  goal: "the goal",
  instruction: "the instruction stage",
  worked_model: "the worked model",
  guided_practice: "guided practice",
  independent: "the independent task",
};

/** `a | b | c` per row — one line per row, columns separated by a pipe. */
function pipeRows(value: FormDataEntryValue | null): string[][] {
  return lines(value).map((line) => line.split("|").map((cell) => cell.trim()));
}

export async function saveLessonBlockAction(
  formData: FormData,
): Promise<ActionResult<{ kind: string }>> {
  try {
    const actor = await requireUser();
    const rawBlockId = String(formData.get("blockId") ?? "").trim();
    const input = Block.parse({
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      blockId: rawBlockId === "" ? null : rawBlockId,
      section: formData.get("section"),
      kind: formData.get("kind"),
      text: String(formData.get("text") ?? ""),
      title: String(formData.get("title") ?? ""),
      tone: String(formData.get("tone") ?? "note"),
      ordered: String(formData.get("ordered") ?? "") === "on",
      items: lines(formData.get("items")),
      term: String(formData.get("term") ?? ""),
      meaning: String(formData.get("meaning") ?? ""),
      caption: String(formData.get("caption") ?? ""),
      headers: String(formData.get("headers") ?? "")
        .split("|")
        .map((h) => h.trim())
        .filter(Boolean),
      rows: pipeRows(formData.get("rows")),
      url: String(formData.get("url") ?? ""),
      alt: String(formData.get("alt") ?? ""),
      videoId: String(formData.get("videoId") ?? ""),
      materialId: String(formData.get("materialId") ?? ""),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    const block = saveLessonBlock(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `${BLOCK_LABEL[block.kind]} ${input.blockId ? "saved" : "added"} in ${SECTION_LABEL[block.section]}.`,
      kind: block.kind,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const MoveBlock = z.object({
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  blockId: z.string().min(1),
  direction: z.enum(["up", "down"]),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function moveLessonBlockAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireUser();
    const input = MoveBlock.parse({
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      blockId: formData.get("blockId"),
      direction: formData.get("direction"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    moveLessonBlock(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: `Moved ${input.direction}.` };
  } catch (error) {
    return toFailure(error);
  }
}

const RemoveBlock = z.object({
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  blockId: z.string().min(1),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function removeLessonBlockAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireUser();
    const input = RemoveBlock.parse({
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      blockId: formData.get("blockId"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    removeLessonBlock(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Block removed from the canvas." };
  } catch (error) {
    return toFailure(error);
  }
}

const Video = z.object({
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  title: z.string().trim().min(1, "A video needs a title.").max(200),
  url: z.string().trim().min(1, "A video needs an address.").max(2000),
  minutes: z.coerce.number().min(0).max(600).nullable(),
  transcript: z
    .string()
    .trim()
    .min(1, "A video needs a transcript before it can be attached.")
    .max(200000),
  captionsUrl: z.string().trim().max(2000).nullable(),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function addLessonVideoAction(
  formData: FormData,
): Promise<ActionResult<{ title: string }>> {
  try {
    const actor = await requireUser();
    const rawMinutes = String(formData.get("minutes") ?? "").trim();
    const rawCaptions = String(formData.get("captionsUrl") ?? "").trim();
    const input = Video.parse({
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      title: formData.get("title"),
      url: formData.get("url"),
      minutes: rawMinutes === "" ? null : rawMinutes,
      transcript: formData.get("transcript"),
      captionsUrl: rawCaptions === "" ? null : rawCaptions,
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    const video = addLessonVideo(
      actor,
      {
        versionId: input.versionId,
        lessonCode: input.lessonCode,
        title: input.title,
        url: input.url,
        minutes: input.minutes,
        transcript: input.transcript,
        captionsUrl: input.captionsUrl,
        reason: input.reason,
      },
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `“${video.title}” attached, with its transcript.`,
      title: video.title,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const RemoveVideo = z.object({
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  videoId: z.string().min(1),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function removeLessonVideoAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireUser();
    const input = RemoveVideo.parse({
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      videoId: formData.get("videoId"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    removeLessonVideo(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Video removed from this draft." };
  } catch (error) {
    return toFailure(error);
  }
}

const Material = z.object({
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  kind: z.enum(LESSON_MATERIAL_KINDS),
  title: z.string().trim().min(1, "A material needs a title.").max(200),
  url: z.string().trim().min(1, "A material needs an address.").max(2000),
  purpose: z
    .string()
    .trim()
    .min(1, "Say what the student does with this material.")
    .max(600),
  accessNote: z
    .string()
    .trim()
    .min(1, "Say what format it is and how else a student can get it.")
    .max(600),
  minutes: z.coerce.number().min(0).max(600).nullable(),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function addLessonMaterialAction(
  formData: FormData,
): Promise<ActionResult<{ title: string }>> {
  try {
    const actor = await requireUser();
    const rawMinutes = String(formData.get("minutes") ?? "").trim();
    const input = Material.parse({
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      kind: formData.get("kind"),
      title: formData.get("title"),
      url: formData.get("url"),
      purpose: formData.get("purpose"),
      accessNote: formData.get("accessNote"),
      minutes: rawMinutes === "" ? null : rawMinutes,
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    const material = addLessonMaterial(
      actor,
      {
        versionId: input.versionId,
        lessonCode: input.lessonCode,
        kind: input.kind,
        title: input.title,
        url: input.url,
        purpose: input.purpose,
        accessNote: input.accessNote,
        minutes: input.minutes,
        reason: input.reason,
      },
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `“${material.title}” attached. Place it on the canvas to put it in front of a student.`,
      title: material.title,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const RemoveMaterial = z.object({
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  materialId: z.string().min(1),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function removeLessonMaterialAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireUser();
    const input = RemoveMaterial.parse({
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      materialId: formData.get("materialId"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    removeLessonMaterial(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Material removed from this draft." };
  } catch (error) {
    return toFailure(error);
  }
}

const QuizItem = z.object({
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  itemId: z.string().min(1).nullable(),
  purpose: z.enum(["exit_ticket", "spiral_review", "readiness_check", "transfer_check"]),
  standard: z.string().trim().min(1, "Choose the standard this item measures."),
  stem: z.string().trim().min(8, "An item needs a question a student can read.").max(4000),
  rationale: z
    .string()
    .trim()
    .min(1, "An item needs an explanation, shown after the student answers.")
    .max(4000),
  choices: z
    .array(z.object({ text: z.string().max(1000), errorCode: z.string().max(120) }))
    .min(2, "An item needs at least two choices.")
    .max(6),
  correctIndex: z.coerce.number().int().min(0).max(5),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function saveQuizItemAction(
  formData: FormData,
): Promise<ActionResult<{ itemId: string }>> {
  try {
    const actor = await requireUser();
    const choices: { text: string; errorCode: string }[] = [];
    for (let i = 0; i < 6; i += 1) {
      const text = String(formData.get(`choiceText${i}`) ?? "").trim();
      if (text.length === 0) continue;
      choices.push({
        text,
        errorCode: String(formData.get(`choiceError${i}`) ?? "").trim(),
      });
    }
    // The correct answer is submitted as the index of a filled row; blank rows
    // are dropped above, so re-resolve it against what actually remains.
    const markedIndex = Number(formData.get("correctIndex") ?? -1);
    const markedText = String(formData.get(`choiceText${markedIndex}`) ?? "").trim();
    const correctIndex = choices.findIndex((c) => c.text === markedText);

    const rawItemId = String(formData.get("itemId") ?? "").trim();
    const input = QuizItem.parse({
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      itemId: rawItemId === "" ? null : rawItemId,
      purpose: formData.get("purpose"),
      standard: formData.get("standard"),
      stem: formData.get("stem"),
      rationale: formData.get("rationale"),
      choices,
      correctIndex: correctIndex < 0 ? 0 : correctIndex,
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    if (correctIndex < 0) {
      return {
        ok: false,
        message: "Mark exactly one choice as correct.",
        preserved: "Nothing was changed — the item was not saved.",
        nextStep: "Choose the correct answer, then save again.",
      };
    }

    const item = saveQuizItem(
      actor,
      {
        versionId: input.versionId,
        lessonCode: input.lessonCode,
        itemId: input.itemId,
        purpose: input.purpose,
        standard: input.standard,
        stem: input.stem,
        choices: input.choices,
        correctIndex: input.correctIndex,
        rationale: input.rationale,
        reason: input.reason,
      },
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Item saved against ${item.standard}. It scores on the server, never in the browser.`,
      itemId: item.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const RemoveItem = z.object({
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  itemId: z.string().min(1),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function removeQuizItemAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireUser();
    const input = RemoveItem.parse({
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      itemId: formData.get("itemId"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    removeQuizItem(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Item removed from this draft." };
  } catch (error) {
    return toFailure(error);
  }
}

const NewVersion = z.object({
  courseTitle: z.string().min(1),
  version: z.string().trim().min(1).max(20),
  notes: z.string().trim().max(1000),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function createDraftVersionAction(
  formData: FormData,
): Promise<ActionResult<{ versionId: string }>> {
  try {
    const actor = await requireUser();
    const input = NewVersion.parse({
      courseTitle: formData.get("courseTitle"),
      version: formData.get("version"),
      notes: String(formData.get("notes") ?? ""),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const created = createDraftVersion(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `${created.courseTitle} ${created.version} opened as a draft. Running sections keep the version they were created with.`,
      versionId: created.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}
