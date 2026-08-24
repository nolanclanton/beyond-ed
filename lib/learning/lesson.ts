/**
 * Running a lesson (blueprint §4).
 *
 * Server-authoritative. The browser reports which choice was selected; the
 * server decides whether it was right, what the Exit Ticket band is, what
 * status the lesson moves to, and what evidence and grade records exist. The
 * client cannot infer or assert any of it (CLAUDE.md §1).
 *
 * Every write here is idempotent, transactional, and audited in the same
 * transaction as the change.
 */
import {
  assessmentId,
  findLesson,
  getCourse,
  subjectForLesson,
} from "@/lib/curriculum/catalog";
import { transitionLesson } from "@/lib/curriculum/transitions";
import type { LessonStatus } from "@/lib/curriculum/lesson-status";
import { recordAudit, requestIdFor } from "@/lib/audit/log";
import { nextTimestamp } from "@/lib/clock";
import {
  appendGradeRecord,
  db,
  nextId,
  transact,
  withIdempotency,
} from "@/lib/db/store";
import { ALL_ITEMS } from "@/lib/db/demo-items";
import {
  bankItemById,
  itemsForLesson,
  spiralCandidatePool,
} from "@/lib/curriculum/lesson-bank";
import type { EvidenceRecord, LessonState, User } from "@/lib/db/types";
import { recordEvidence } from "@/lib/evidence/ledger";
import { bandFor, RULE_VERSIONS, type ExitBand } from "@/lib/rules/versions";
import { selectSpiralReview, type SpiralResult } from "@/lib/recommend/spiral";
import { skillProfile } from "@/lib/mastery/profile";
import { currentEvidence } from "@/lib/evidence/ledger";
import { upcomingStandardsFor } from "@/lib/intervention/queue";

export class LessonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LessonError";
  }
}

export function lessonState(
  enrollmentId: string,
  lessonCode: string,
): LessonState | undefined {
  return db().lessonStates.find(
    (s) => s.enrollmentId === enrollmentId && s.lessonCode === lessonCode,
  );
}

function assertOwnEnrollment(actor: User, enrollmentId: string) {
  const enrollment = db().enrollments.find((e) => e.id === enrollmentId);
  if (!enrollment) throw new LessonError("That enrollment does not exist.");
  if (enrollment.studentId !== actor.id) {
    throw new LessonError("You can only work on your own lessons.");
  }
  return enrollment;
}

/** Available -> In progress. The one action Today's primary button performs. */
export function startLesson(
  actor: User,
  enrollmentId: string,
  lessonCode: string,
  idempotencyKey: string,
): { id: string; status: LessonStatus } {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const enrollment = assertOwnEnrollment(actor, enrollmentId);
        const state = lessonState(enrollmentId, lessonCode);
        if (!state) throw new LessonError("That lesson is not on your pathway.");
        if (state.status === "in_progress") return { id: state.id, status: state.status };

        const before = state.status;
        state.status = transitionLesson(state.status, "in_progress");
        state.stage = Math.max(state.stage, 1);
        state.updatedAt = nextTimestamp();

        recordAudit({
          actor,
          action: "lesson.start",
          targetEntity: "lesson_state",
          targetId: state.id,
          before: { status: before },
          after: { status: state.status },
          reason: `Started ${lessonCode} in ${enrollment.courseTitle}.`,
          idempotencyKey,
          requestId: requestIdFor("lesson.start", idempotencyKey),
        });

        return { id: state.id, status: state.status };
      },
      (existingId) => {
        const state = db().lessonStates.find((s) => s.id === existingId);
        return { id: existingId, status: state?.status ?? "in_progress" };
      },
    ),
  );
}

/** Stage navigation inside a lesson. Not a status change. */
export function setStage(
  actor: User,
  enrollmentId: string,
  lessonCode: string,
  stage: number,
): void {
  assertOwnEnrollment(actor, enrollmentId);
  const state = lessonState(enrollmentId, lessonCode);
  if (!state) throw new LessonError("That lesson is not on your pathway.");
  state.stage = Math.min(10, Math.max(1, stage));
  state.updatedAt = nextTimestamp();
}

// ---------------------------------------------------------------------------
// Spiral Review
// ---------------------------------------------------------------------------

/**
 * Builds this student's Spiral Review for a lesson. Deterministic.
 *
 * Two rules govern the candidate pool.
 *
 * **Same subject, always.** Retrieval practice inside a mathematics lesson is
 * mathematics. Drawing a history item into a mathematics lesson is not spaced
 * review, it is an interruption — it breaks the thread the student is holding
 * and it measures a skill the lesson has no bearing on. The subject comes from
 * the catalog, not from the lesson code's prefix.
 *
 * **Seen OR upcoming.** The blueprint's pool is weak skills, upcoming
 * prerequisites, and cumulative skills (§4). Restricting candidates to skills
 * the student has already been assessed on would make the upcoming-prerequisite
 * pool unreachable, because an upcoming standard is by definition one they have
 * not met yet.
 *
 * The pool is also restricted to items that exist in the bank, so the SERVER can
 * score every response. The client reports which choice was picked, never
 * whether it was right.
 */
export function spiralReviewFor(
  studentId: string,
  enrollmentId: string,
  lessonCode: string,
): SpiralResult {
  const enrollment = db().enrollments.find((e) => e.id === enrollmentId);
  if (!enrollment) throw new LessonError("That enrollment does not exist.");

  const subject = getCourse(enrollment.courseTitle)?.subject;
  const upcoming = upcomingStandardsFor(enrollment, lessonCode);
  const upcomingSet = new Set(upcoming);
  const seenSkills = new Set(
    currentEvidence({ studentId }).map((e) => e.skill),
  );

  // The pool is the demo bank plus whatever this enrollment's own course
  // version has published, so a Spiral Review can retrieve authored work.
  const pool = spiralCandidatePool(enrollment.courseVersionId, ALL_ITEMS);

  const candidates = pool.filter((item) => {
    if (item.lessonCode === lessonCode) return false;
    if (subjectForLesson(item.lessonCode) !== subject) return false;
    return seenSkills.has(item.skill) || upcomingSet.has(item.skill);
  }).map((i) => ({ itemId: i.id, standard: i.standard, skill: i.skill }));

  return selectSpiralReview(skillProfile(studentId), upcoming, candidates);
}

/** Records the Spiral Review result. Retrieval practice, not a grade. */
export function submitSpiralReview(
  actor: User,
  enrollmentId: string,
  lessonCode: string,
  results: { itemId: string; skill: string; standard: string; correct: boolean }[],
  idempotencyKey: string,
): { id: string; evidenceIds: string[] } {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const enrollment = assertOwnEnrollment(actor, enrollmentId);
        const evidenceIds: string[] = [];
        for (const r of results) {
          const row = recordEvidence({
            studentId: actor.id,
            enrollmentId,
            courseVersionId: enrollment.courseVersionId,
            lessonCode,
            stage: "Spiral Review",
            standard: r.standard,
            skill: r.skill,
            itemId: r.itemId,
            correct: r.correct,
            response: r.correct ? "Correct" : "Incorrect",
            errorCode: null,
            attempt: 1,
            hintsUsed: 0,
            meaningfulMinutes: 1,
            supportUsed: null,
            source: "spiral_review",
            supersedesEvidenceId: null,
            recordedByUserId: actor.id,
          });
          evidenceIds.push(row.id);
        }
        const state = lessonState(enrollmentId, lessonCode);
        if (state) state.stage = Math.max(state.stage, 3);
        return { id: evidenceIds[0] ?? nextId("ev"), evidenceIds };
      },
      (existingId) => ({ id: existingId, evidenceIds: [existingId] }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Exit Ticket
// ---------------------------------------------------------------------------

export type ExitTicketResult = {
  id: string;
  percent: number;
  band: ExitBand;
  correctCount: number;
  itemCount: number;
  evidenceIds: string[];
  gradeRecordId: string | null;
  lessonStatus: LessonStatus;
  attempt: number;
  /** True when the anti-loop rule has already used up the supported retry. */
  retryExhausted: boolean;
};

/**
 * Scores an Exit Ticket, writes evidence and one official grade record, and
 * moves the lesson through its guarded transition.
 *
 * The grade record and the evidence rows are SEPARATE writes to SEPARATE
 * tables and are never combined (CLAUDE.md §4). Mastery is not written here at
 * all — it is derived from evidence on read.
 */
export function submitExitTicket(
  actor: User,
  enrollmentId: string,
  lessonCode: string,
  answers: { itemId: string; choiceId: string }[],
  minutes: number,
  idempotencyKey: string,
): ExitTicketResult {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const enrollment = assertOwnEnrollment(actor, enrollmentId);
        const course = getCourse(enrollment.courseTitle);
        if (!course) throw new LessonError("That course is not in the catalog.");
        const found = findLesson(course, lessonCode);
        if (!found) throw new LessonError("That lesson is not in this course.");

        const bank = itemsForLesson(
          lessonCode,
          "exit_ticket",
          enrollment.courseVersionId,
        );
        if (bank.length === 0) {
          throw new LessonError(
            "Exit Ticket items for this lesson have not been authored, so it cannot be scored.",
          );
        }

        const state = lessonState(enrollmentId, lessonCode);
        if (!state) throw new LessonError("That lesson is not on your pathway.");
        if (state.status !== "in_progress") {
          throw new LessonError(
            `This lesson is ${state.status.replace(/_/g, " ")}, so its Exit Ticket cannot be submitted.`,
          );
        }

        const attempt = state.attempts + 1;

        const evidenceIds: string[] = [];
        let correctCount = 0;
        const perItemMinutes = Math.max(
          0,
          Math.round((minutes / Math.max(1, bank.length)) * 10) / 10,
        );

        for (const bankItem of bank) {
          const answer = answers.find((a) => a.itemId === bankItem.id);
          const choice = answer
            ? bankItem.choices.find((c) => c.id === answer.choiceId)
            : undefined;
          const correct = choice ? choice.id === bankItem.correctChoiceId : false;
          if (correct) correctCount += 1;

          const row: EvidenceRecord = recordEvidence({
            studentId: actor.id,
            enrollmentId,
            courseVersionId: enrollment.courseVersionId,
            lessonCode,
            stage: "Exit Ticket",
            standard: bankItem.standard,
            skill: bankItem.skill,
            itemId: bankItem.id,
            correct,
            response: choice ? choice.text : "No response",
            errorCode: correct ? null : (choice?.errorCode ?? "no-response"),
            attempt,
            hintsUsed: 0,
            meaningfulMinutes: perItemMinutes,
            supportUsed: attempt > 1 ? "Supported retry" : null,
            source: "exit_ticket",
            supersedesEvidenceId: null,
            recordedByUserId: actor.id,
          });
          evidenceIds.push(row.id);
        }

        const percent = Math.round((correctCount / bank.length) * 1000) / 10;
        const band = bandFor(percent);

        // --- Official grade record. Separate table, separate calculation. ---
        // L3 lessons carry the assessment; everything else is a knowledge check.
        const categoryId = `gc_${enrollment.courseTitle.replace(/[^A-Za-z0-9]+/g, "_")}_${
          /-(L3)$/.test(lessonCode) ? "AS" : "KC"
        }`;
        const priorForLesson = db().gradeRecords.filter(
          (r) => r.enrollmentId === enrollmentId && r.lessonCode === lessonCode,
        );
        const supersedes =
          priorForLesson.length > 0
            ? priorForLesson[priorForLesson.length - 1].id
            : null;

        const grade = appendGradeRecord({
          id: nextId("gr"),
          studentId: actor.id,
          enrollmentId,
          categoryId,
          assessmentId: assessmentId(found.lesson),
          lessonCode,
          pointsEarned: correctCount,
          pointsPossible: bank.length,
          ruleVersion: RULE_VERSIONS.grading,
          supersedesGradeId: supersedes,
          enteredByUserId: actor.id,
          reason: `Scored by ${RULE_VERSIONS.grading} from the student's own submission, attempt ${attempt}.`,
          recordedAt: nextTimestamp(),
        });

        // --- Guarded status transition -------------------------------------
        const before = state.status;
        state.attempts = attempt;
        if (band.outcome === "do_not_advance") {
          state.status = transitionLesson(state.status, "submitted");
          // One supported retry, then the case goes to teacher review rather
          // than a third cycle (anti-loop rule).
          state.status = transitionLesson(state.status, "in_progress");
          state.stage = 9;
        } else {
          state.status = transitionLesson(state.status, "submitted");
          state.status = transitionLesson(state.status, "passed");
          state.status = transitionLesson(state.status, "review_scheduled");
          state.stage = 10;
        }
        state.updatedAt = nextTimestamp();

        recordAudit({
          actor,
          action: "assessment.submit",
          targetEntity: "grade_record",
          targetId: grade.id,
          before: { lessonStatus: before, attempt: attempt - 1 },
          after: {
            lessonStatus: state.status,
            attempt,
            percent,
            band: band.id,
            ruleVersion: RULE_VERSIONS.exitBands,
          },
          reason: `Exit Ticket submitted for ${lessonCode}: ${correctCount} of ${bank.length}.`,
          idempotencyKey,
          requestId: requestIdFor("assessment.submit", idempotencyKey),
        });

        return {
          id: grade.id,
          percent,
          band,
          correctCount,
          itemCount: bank.length,
          evidenceIds,
          gradeRecordId: grade.id,
          lessonStatus: state.status,
          attempt,
          retryExhausted: attempt >= 2 && band.outcome === "do_not_advance",
        };
      },
      (existingId) => {
        const grade = db().gradeRecords.find((r) => r.id === existingId);
        const percent = grade
          ? Math.round((grade.pointsEarned / grade.pointsPossible) * 1000) / 10
          : 0;
        const state = grade ? lessonState(grade.enrollmentId, grade.lessonCode) : undefined;
        return {
          id: existingId,
          percent,
          band: bandFor(percent),
          correctCount: grade?.pointsEarned ?? 0,
          itemCount: grade?.pointsPossible ?? 0,
          evidenceIds: [],
          gradeRecordId: existingId,
          lessonStatus: state?.status ?? "review_scheduled",
          attempt: state?.attempts ?? 1,
          retryExhausted: false,
        };
      },
    ),
  );
}

/** Marks a review-scheduled lesson complete once its review has happened. */
export function completeLesson(
  actor: User,
  enrollmentId: string,
  lessonCode: string,
  idempotencyKey: string,
): { id: string; status: LessonStatus } {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        assertOwnEnrollment(actor, enrollmentId);
        const state = lessonState(enrollmentId, lessonCode);
        if (!state) throw new LessonError("That lesson is not on your pathway.");
        const before = state.status;
        state.status = transitionLesson(state.status, "completed");
        state.updatedAt = nextTimestamp();

        // Unlock the next lesson in the pathway.
        const enrollment = db().enrollments.find((e) => e.id === enrollmentId);
        const course = enrollment ? getCourse(enrollment.courseTitle) : undefined;
        if (course) {
          const order = course.units.flatMap((u) => u.lessons.map((l) => l.code));
          const at = order.indexOf(lessonCode);
          const nextCode = at >= 0 ? order[at + 1] : undefined;
          const nextState = nextCode ? lessonState(enrollmentId, nextCode) : undefined;
          if (nextState && nextState.status === "locked") {
            nextState.status = transitionLesson(nextState.status, "available");
            nextState.updatedAt = nextTimestamp();
          }
        }

        recordAudit({
          actor,
          action: "lesson.complete",
          targetEntity: "lesson_state",
          targetId: state.id,
          before: { status: before },
          after: { status: state.status },
          reason: `Completed ${lessonCode}.`,
          idempotencyKey,
          requestId: requestIdFor("lesson.complete", idempotencyKey),
        });

        return { id: state.id, status: state.status };
      },
      (existingId) => {
        const state = db().lessonStates.find((s) => s.id === existingId);
        return { id: existingId, status: state?.status ?? "completed" };
      },
    ),
  );
}

/**
 * Item lookup for every scoring path: the demo bank first, then anything an
 * author published. Re-exported here so callers have one import for it.
 */
export { bankItemById as itemById };
