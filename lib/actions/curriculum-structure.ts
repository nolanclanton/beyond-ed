"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { effectiveCourseForVersionId, locateInCourse } from "@/lib/curriculum/structure";
import {
  moveLesson,
  moveUnit,
  resetSequence,
  setUnitFraming,
} from "@/lib/curriculum/structure";
import {
  addFoundation,
  foundationsFor,
  setFoundationImportance,
  setFoundationRetired,
  toImportance,
} from "@/lib/curriculum/foundations";

import { toFailure, type ActionResult } from "./result";

/**
 * Curriculum governance write endpoints: sequence, framing, and foundations.
 *
 * Same contract as every other action in this directory. Zod validates the
 * input, one transactional domain call does the work and writes its own audit
 * event, and the result is durable (CLAUDE.md §1, §6, §12). Nothing here
 * decides anything — the authorization, the draft-only rule, the within-unit
 * rule, and the "a foundation runs first" rule all live in the domain, so a
 * request that never touched this form still meets them.
 */

const REASON = z.string().trim().min(4, "A recorded reason is required.").max(500);
const KEY = z.string().min(8).max(200);

// ---------------------------------------------------------------------------
// Sequence
// ---------------------------------------------------------------------------

const MoveUnit = z.object({
  versionId: z.string().min(1),
  unitId: z.string().min(1),
  direction: z.enum(["up", "down"]),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function moveUnitAction(
  formData: FormData,
): Promise<ActionResult<{ unitId: string }>> {
  try {
    const actor = await requireUser();
    const input = MoveUnit.parse({
      versionId: formData.get("versionId"),
      unitId: formData.get("unitId"),
      direction: formData.get("direction"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    moveUnit(actor, input, input.idempotencyKey);
    const course = effectiveCourseForVersionId(input.versionId);
    const unit = course.units.find((u) => u.id === input.unitId);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: unit
        ? `${unit.title} now runs as unit ${unit.order}, days ${unit.startDay}–${unit.endDay}. Sections already on another version are unaffected.`
        : "The unit order was saved.",
      unitId: input.unitId,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const MoveLesson = z.object({
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  toPosition: z.number().int().min(1).max(15),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function moveLessonAction(
  formData: FormData,
): Promise<ActionResult<{ lessonCode: string }>> {
  try {
    const actor = await requireUser();
    const input = MoveLesson.parse({
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      toPosition: Number(formData.get("toPosition")),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    moveLesson(actor, input, input.idempotencyKey);
    const course = effectiveCourseForVersionId(input.versionId);
    const at = locateInCourse(course, input.lessonCode);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: at
        ? `${input.lessonCode} now runs on day ${at.lesson.day}, position ${input.toPosition} of ${at.unit.title}.`
        : "The lesson order was saved.",
      lessonCode: input.lessonCode,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const Framing = z.object({
  versionId: z.string().min(1),
  unitId: z.string().min(1),
  title: z.string().trim().min(3).max(160),
  essentialQuestion: z.string().trim().min(8).max(400),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function setUnitFramingAction(
  formData: FormData,
): Promise<ActionResult<{ unitId: string }>> {
  try {
    const actor = await requireUser();
    const input = Framing.parse({
      versionId: formData.get("versionId"),
      unitId: formData.get("unitId"),
      title: formData.get("title"),
      essentialQuestion: formData.get("essentialQuestion"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    setUnitFraming(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Saved. This version teaches the unit as "${input.title}". The workbook's own framing is unchanged and every other version still reads it.`,
      unitId: input.unitId,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const Reset = z.object({
  versionId: z.string().min(1),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function resetSequenceAction(
  formData: FormData,
): Promise<ActionResult<{ versionId: string }>> {
  try {
    const actor = await requireUser();
    const input = Reset.parse({
      versionId: formData.get("versionId"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    resetSequence(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message:
        "This version runs the workbook's own sequence and framing again. Foundation strengths were left as they are.",
      versionId: input.versionId,
    };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Foundations
// ---------------------------------------------------------------------------

const Weight = z.object({
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  targetId: z.string().min(1),
  importance: z.number().int().min(1).max(5),
  note: z.string().trim().max(500),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function setFoundationImportanceAction(
  formData: FormData,
): Promise<ActionResult<{ targetId: string }>> {
  try {
    const actor = await requireUser();
    const input = Weight.parse({
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      targetId: formData.get("targetId"),
      importance: Number(formData.get("importance")),
      note: String(formData.get("note") ?? ""),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    setFoundationImportance(
      actor,
      { ...input, importance: toImportance(input.importance) },
      input.idempotencyKey,
    );
    const saved = foundationsFor(input.versionId, input.lessonCode).find(
      (f) => f.targetId === input.targetId,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message:
        saved && saved.importance !== null && saved.importance >= 4
          ? `${input.targetId} is recorded as foundational for ${input.lessonCode}.`
          : `${input.targetId} is recorded at importance ${input.importance} for ${input.lessonCode}.`,
      targetId: input.targetId,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const Add = z.object({
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  targetId: z.string().trim().min(3).max(40),
  importance: z.number().int().min(1).max(5),
  note: z.string().trim().max(500),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function addFoundationAction(
  formData: FormData,
): Promise<ActionResult<{ targetId: string }>> {
  try {
    const actor = await requireUser();
    const input = Add.parse({
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      targetId: formData.get("targetId"),
      importance: Number(formData.get("importance")),
      note: String(formData.get("note") ?? ""),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    addFoundation(
      actor,
      { ...input, importance: toImportance(input.importance) },
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `${input.targetId.toUpperCase()} is now prior learning for ${input.lessonCode} in this version.`,
      targetId: input.targetId.toUpperCase(),
    };
  } catch (error) {
    return toFailure(error);
  }
}

const Retire = z.object({
  versionId: z.string().min(1),
  lessonCode: z.string().min(1),
  targetId: z.string().min(1),
  retired: z.boolean(),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function setFoundationRetiredAction(
  formData: FormData,
): Promise<ActionResult<{ targetId: string }>> {
  try {
    const actor = await requireUser();
    const input = Retire.parse({
      versionId: formData.get("versionId"),
      lessonCode: formData.get("lessonCode"),
      targetId: formData.get("targetId"),
      retired: String(formData.get("retired") ?? "") === "true",
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    setFoundationRetired(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: input.retired
        ? `${input.targetId} is no longer treated as prior learning for ${input.lessonCode} in this version. The workbook link itself is untouched and stays readable.`
        : `${input.targetId} is prior learning for ${input.lessonCode} again.`,
      targetId: input.targetId,
    };
  } catch (error) {
    return toFailure(error);
  }
}
