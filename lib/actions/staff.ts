"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { enterGrade } from "@/lib/grades/entry";
import { recordObservation } from "@/lib/evidence/observation";
import {
  assignFromRecommendation,
  closeIntervention,
  dismissRecommendation,
  escalateRecommendation,
} from "@/lib/intervention/lifecycle";
import { recordExport } from "@/lib/audit/exports";
import { toFailure, type ActionResult } from "./result";

const Key = z.string().min(8).max(200);
const Reason = z.string().trim().min(4, "A recorded reason is required.").max(500);

const Ref = z.object({
  enrollmentId: z.string().min(1),
  skill: z.string().min(1),
  trigger: z.string().min(1),
});

const Assign = Ref.extend({
  reason: Reason,
  dueExpectation: z.string().trim().min(1).max(120),
  idempotencyKey: Key,
});

/**
 * Accepting a recommendation. The proposal is recomputed server-side from
 * stored evidence before anything is written — the browser cannot assign a
 * support the evidence does not justify (CLAUDE.md §8).
 */
export async function assignRecommendationAction(
  formData: FormData,
): Promise<ActionResult<{ interventionId: string; returnTo: string }>> {
  try {
    const actor = await requireUser();
    const input = Assign.parse({
      enrollmentId: formData.get("enrollmentId"),
      skill: formData.get("skill"),
      trigger: formData.get("trigger"),
      reason: formData.get("reason"),
      dueExpectation: formData.get("dueExpectation") ?? "Before the next intervention-capacity day",
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const plan = assignFromRecommendation(
      actor,
      input,
      input.reason,
      input.dueExpectation,
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Assigned ${plan.interventionLessonId}. The student returns to ${plan.returnLessonCode}, stage ${plan.returnStage}.`,
      interventionId: plan.id,
      returnTo: `${plan.returnLessonCode} stage ${plan.returnStage}`,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const Dismiss = Ref.extend({ reason: Reason, idempotencyKey: Key });

export async function dismissRecommendationAction(
  formData: FormData,
): Promise<ActionResult<{ interventionId: string }>> {
  try {
    const actor = await requireUser();
    const input = Dismiss.parse({
      enrollmentId: formData.get("enrollmentId"),
      skill: formData.get("skill"),
      trigger: formData.get("trigger"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const plan = dismissRecommendation(actor, input, input.reason, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Dismissed with a recorded reason. It stays off the queue until new evidence appears on ${plan.targetSkill}.`,
      interventionId: plan.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function escalateRecommendationAction(
  formData: FormData,
): Promise<ActionResult<{ interventionId: string }>> {
  try {
    const actor = await requireUser();
    const input = Dismiss.parse({
      enrollmentId: formData.get("enrollmentId"),
      skill: formData.get("skill"),
      trigger: formData.get("trigger"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const plan = escalateRecommendation(actor, input, input.reason, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: "Escalated. This is now a teacher-scheduled conference, not another retry.",
      interventionId: plan.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const Close = z.object({
  interventionId: z.string().min(1),
  reason: Reason,
  idempotencyKey: Key,
});

export async function closeInterventionAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireUser();
    const input = Close.parse({
      interventionId: formData.get("interventionId"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    closeIntervention(actor, input.interventionId, input.reason, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Plan closed with a recorded reason." };
  } catch (error) {
    return toFailure(error);
  }
}

const Grade = z.object({
  enrollmentId: z.string().min(1),
  lessonCode: z.string().min(1),
  assessmentId: z.string().min(1),
  categoryId: z.string().min(1),
  pointsEarned: z.coerce.number().min(0).max(10000),
  pointsPossible: z.coerce.number().min(1).max(10000),
  reason: Reason,
  idempotencyKey: Key,
});

export async function enterGradeAction(
  formData: FormData,
): Promise<ActionResult<{ gradeRecordId: string }>> {
  try {
    const actor = await requireUser();
    const input = Grade.parse({
      enrollmentId: formData.get("enrollmentId"),
      lessonCode: formData.get("lessonCode"),
      assessmentId: formData.get("assessmentId"),
      categoryId: formData.get("categoryId"),
      pointsEarned: formData.get("pointsEarned"),
      pointsPossible: formData.get("pointsPossible"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const record = enterGrade(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Recorded ${record.pointsEarned} of ${record.pointsPossible}. The previous result is retained and still readable.`,
      gradeRecordId: record.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const Observation = z.object({
  studentId: z.string().min(1),
  enrollmentId: z.string().min(1),
  lessonCode: z.string().min(1),
  skill: z.string().min(1),
  standard: z.string().nullable().optional(),
  note: z.string().trim().min(4).max(1000),
  correct: z.enum(["yes", "no", "unscored"]),
  supersedesEvidenceId: z.string().nullable().optional(),
  idempotencyKey: Key,
});

export async function recordObservationAction(
  formData: FormData,
): Promise<ActionResult<{ evidenceId: string }>> {
  try {
    const actor = await requireUser();
    const raw = Observation.parse({
      studentId: formData.get("studentId"),
      enrollmentId: formData.get("enrollmentId"),
      lessonCode: formData.get("lessonCode"),
      skill: formData.get("skill"),
      standard: formData.get("standard") || null,
      note: formData.get("note"),
      correct: formData.get("correct") ?? "unscored",
      supersedesEvidenceId: formData.get("supersedesEvidenceId") || null,
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const row = recordObservation(
      actor,
      {
        studentId: raw.studentId,
        enrollmentId: raw.enrollmentId,
        lessonCode: raw.lessonCode,
        skill: raw.skill,
        standard: raw.standard ?? null,
        note: raw.note,
        correct: raw.correct === "unscored" ? null : raw.correct === "yes",
        supersedesEvidenceId: raw.supersedesEvidenceId ?? null,
      },
      raw.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: raw.supersedesEvidenceId
        ? "Correction appended. The original response is retained and still readable."
        : "Observation appended to the evidence ledger.",
      evidenceId: row.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const Export = z.object({
  purpose: z.string().trim().min(4).max(300),
  scope: z.string().trim().min(1).max(120),
  idempotencyKey: Key,
});

export async function recordExportAction(
  formData: FormData,
): Promise<ActionResult<{ rowCount: number }>> {
  try {
    const actor = await requireUser();
    const input = Export.parse({
      purpose: formData.get("purpose"),
      scope: formData.get("scope"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const { visibleStudentIds } = await import("@/lib/auth/scope");
    const ids = visibleStudentIds(actor);
    const record = recordExport(
      actor,
      { purpose: input.purpose, scope: input.scope, studentIds: ids },
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Export recorded: ${record.rowCount} rows, purpose logged, audit event written.`,
      rowCount: record.rowCount,
    };
  } catch (error) {
    return toFailure(error);
  }
}
