"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { nextTimestamp } from "@/lib/clock";
import { db, nextId } from "@/lib/db/store";
import { itemsForLesson } from "@/lib/curriculum/lesson-bank";
import {
  completeLesson,
  setStage,
  spiralReviewFor,
  startLesson,
  submitExitTicket,
  submitSpiralReview,
} from "@/lib/learning/lesson";
import {
  startIntervention,
  submitReadinessCheck,
  submitTransferCheck,
} from "@/lib/intervention/lifecycle";
import { entryById } from "@/lib/intervention/library";
import { bankItemById as itemById } from "@/lib/curriculum/lesson-bank";
import { toFailure, type ActionResult } from "./result";

/**
 * Every server action validates its input with Zod before touching the store
 * (CLAUDE.md §1). Idempotency keys are required, not optional: a retry must
 * never produce a second submission or a second grade.
 */
const Key = z.string().min(8).max(200);

const StartLesson = z.object({
  enrollmentId: z.string().min(1),
  lessonCode: z.string().min(1),
  idempotencyKey: Key,
});

export async function startLessonAction(
  formData: FormData,
): Promise<ActionResult<{ status: string }>> {
  try {
    const actor = await requireUser();
    const input = StartLesson.parse({
      enrollmentId: formData.get("enrollmentId"),
      lessonCode: formData.get("lessonCode"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const result = startLesson(actor, input.enrollmentId, input.lessonCode, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `${input.lessonCode} is open. Your place is saved as you go.`,
      status: result.status,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const SetStage = z.object({
  enrollmentId: z.string().min(1),
  lessonCode: z.string().min(1),
  stage: z.coerce.number().int().min(1).max(10),
});

export async function setStageAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireUser();
    const input = SetStage.parse({
      enrollmentId: formData.get("enrollmentId"),
      lessonCode: formData.get("lessonCode"),
      stage: formData.get("stage"),
    });
    setStage(actor, input.enrollmentId, input.lessonCode, input.stage);
    revalidatePath("/", "layout");
    return { ok: true, message: `Stage ${input.stage}.` };
  } catch (error) {
    return toFailure(error);
  }
}

const SpiralSubmit = z.object({
  enrollmentId: z.string().min(1),
  lessonCode: z.string().min(1),
  idempotencyKey: Key,
  answers: z.array(z.object({ itemId: z.string(), choiceId: z.string() })),
});

export async function submitSpiralReviewAction(
  formData: FormData,
): Promise<ActionResult<{ correct: number; total: number }>> {
  try {
    const actor = await requireUser();
    const raw = {
      enrollmentId: formData.get("enrollmentId"),
      lessonCode: formData.get("lessonCode"),
      idempotencyKey: formData.get("idempotencyKey"),
      answers: JSON.parse(String(formData.get("answers") ?? "[]")),
    };
    const input = SpiralSubmit.parse(raw);

    // The SERVER scores every response. The client reports which choice was
    // picked; it never asserts whether the choice was right.
    const selection = spiralReviewFor(actor.id, input.enrollmentId, input.lessonCode);
    const results = input.answers.map((a) => {
      const picked = selection.items.find((s) => s.itemId === a.itemId);
      const bankItem = itemById(a.itemId);
      return {
        itemId: a.itemId,
        skill: picked?.skill ?? bankItem?.skill ?? "unknown",
        standard: picked?.standard ?? bankItem?.standard ?? "unknown",
        correct: Boolean(bankItem && a.choiceId === bankItem.correctChoiceId),
      };
    });

    submitSpiralReview(
      actor,
      input.enrollmentId,
      input.lessonCode,
      results,
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: "Spiral Review recorded. Explanations are below.",
      correct: results.filter((r) => r.correct).length,
      total: results.length,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const ExitTicket = z.object({
  enrollmentId: z.string().min(1),
  lessonCode: z.string().min(1),
  idempotencyKey: Key,
  minutes: z.coerce.number().min(0).max(600),
  answers: z.array(z.object({ itemId: z.string(), choiceId: z.string() })),
});

export async function submitExitTicketAction(
  formData: FormData,
): Promise<
  ActionResult<{
    percent: number;
    bandLabel: string;
    outcome: string;
    studentMeaning: string;
    correctCount: number;
    itemCount: number;
    lessonStatus: string;
  }>
> {
  try {
    const actor = await requireUser();
    const input = ExitTicket.parse({
      enrollmentId: formData.get("enrollmentId"),
      lessonCode: formData.get("lessonCode"),
      idempotencyKey: formData.get("idempotencyKey"),
      minutes: formData.get("minutes") ?? 0,
      answers: JSON.parse(String(formData.get("answers") ?? "[]")),
    });

    // The same bank the server will score against, resolved for this
    // enrollment's course version.
    const enrollment = db().enrollments.find((e) => e.id === input.enrollmentId);
    const bank = itemsForLesson(
      input.lessonCode,
      "exit_ticket",
      enrollment?.courseVersionId ?? null,
    );
    for (const a of input.answers) {
      const bankItem = bank.find((i) => i.id === a.itemId);
      if (!bankItem || !bankItem.choices.some((c) => c.id === a.choiceId)) {
        return toFailure(
          Object.assign(new Error("That answer does not match this Exit Ticket."), {
            name: "LessonError",
          }),
        );
      }
    }

    const result = submitExitTicket(
      actor,
      input.enrollmentId,
      input.lessonCode,
      input.answers,
      input.minutes,
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Recorded: ${result.correctCount} of ${result.itemCount}.`,
      percent: result.percent,
      bandLabel: result.band.label,
      outcome: result.band.outcome,
      studentMeaning: result.band.studentMeaning,
      correctCount: result.correctCount,
      itemCount: result.itemCount,
      lessonStatus: result.lessonStatus,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const CompleteLesson = z.object({
  enrollmentId: z.string().min(1),
  lessonCode: z.string().min(1),
  idempotencyKey: Key,
});

export async function completeLessonAction(
  formData: FormData,
): Promise<ActionResult<{ status: string }>> {
  try {
    const actor = await requireUser();
    const input = CompleteLesson.parse({
      enrollmentId: formData.get("enrollmentId"),
      lessonCode: formData.get("lessonCode"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const result = completeLesson(
      actor,
      input.enrollmentId,
      input.lessonCode,
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return { ok: true, message: `${input.lessonCode} is complete.`, status: result.status };
  } catch (error) {
    return toFailure(error);
  }
}

const StartSupport = z.object({
  interventionId: z.string().min(1),
  idempotencyKey: Key,
});

export async function startInterventionAction(
  formData: FormData,
): Promise<ActionResult<{ status: string }>> {
  try {
    const actor = await requireUser();
    const input = StartSupport.parse({
      interventionId: formData.get("interventionId"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const plan = startIntervention(actor, input.interventionId, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Started. You return to ${plan.returnLessonCode} when the return rule is met.`,
      status: plan.status,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const ReadinessSubmit = z.object({
  interventionId: z.string().min(1),
  idempotencyKey: Key,
  answers: z.array(z.object({ itemId: z.string(), choiceId: z.string() })),
});

export async function submitReadinessCheckAction(
  formData: FormData,
): Promise<ActionResult<{ percent: number; meetsBar: boolean }>> {
  try {
    const actor = await requireUser();
    const input = ReadinessSubmit.parse({
      interventionId: formData.get("interventionId"),
      idempotencyKey: formData.get("idempotencyKey"),
      answers: JSON.parse(String(formData.get("answers") ?? "[]")),
    });

    const results = input.answers.map((a) => {
      const bankItem = itemById(a.itemId);
      const choice = bankItem?.choices.find((c) => c.id === a.choiceId);
      const correct = Boolean(bankItem && choice && choice.id === bankItem.correctChoiceId);
      return {
        itemId: a.itemId,
        correct,
        response: choice?.text ?? "No response",
        errorCode: choice?.errorCode ?? null,
      };
    });

    const result = submitReadinessCheck(
      actor,
      input.interventionId,
      results,
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Readiness check recorded: ${result.percent}%.`,
      percent: result.percent,
      meetsBar: result.meetsBar,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const TransferSubmit = z.object({
  interventionId: z.string().min(1),
  idempotencyKey: Key,
  itemId: z.string().min(1),
  choiceId: z.string().min(1),
});

export async function submitTransferCheckAction(
  formData: FormData,
): Promise<ActionResult<{ passed: boolean; status: string; detail: string }>> {
  try {
    const actor = await requireUser();
    const input = TransferSubmit.parse({
      interventionId: formData.get("interventionId"),
      idempotencyKey: formData.get("idempotencyKey"),
      itemId: formData.get("itemId"),
      choiceId: formData.get("choiceId"),
    });

    const bankItem = itemById(input.itemId);
    const choice = bankItem?.choices.find((c) => c.id === input.choiceId);
    const outcome = submitTransferCheck(
      actor,
      input.interventionId,
      {
        itemId: input.itemId,
        correct: Boolean(bankItem && choice && choice.id === bankItem.correctChoiceId),
        response: choice?.text ?? "No response",
        errorCode: choice?.errorCode ?? null,
      },
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: outcome.message,
      passed: outcome.passed,
      status: outcome.status,
      detail: outcome.returnTo
        ? `Back to ${outcome.returnTo.lessonCode}, stage ${outcome.returnTo.stage}.`
        : "",
    };
  } catch (error) {
    return toFailure(error);
  }
}

const HelpRequest = z.object({
  subject: z.string().min(3).max(120),
  body: z.string().min(3).max(2000),
});

/** Help is human: this reaches the assigned teacher, not a generated reply. */
export async function requestHelpAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireUser();
    const input = HelpRequest.parse({
      subject: formData.get("subject"),
      body: formData.get("body"),
    });
    db().messages.push({
      id: nextId("msg"),
      fromUserId: actor.id,
      toStudentId: actor.id,
      subject: input.subject,
      body: input.body,
      sentAt: nextTimestamp(),
      isHelpRequest: true,
      resolvedAt: null,
    });
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: "Sent to your teacher. A person will answer this — not the system.",
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function supportEntry(id: string) {
  return entryById(id) ?? null;
}
