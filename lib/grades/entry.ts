/**
 * Teacher grade entry and grade changes (CLAUDE.md §4, §6).
 *
 * `grade_records` is append-only: a change writes a NEW row that supersedes the
 * previous one, so the original result stays readable forever. Every change is
 * audited in the same transaction with the before and after values and the
 * teacher's reason.
 *
 * The system never changes a grade on its own. An intervention outcome cannot
 * reach this module — nothing in `/lib/intervention` calls it.
 *
 * This file lives in `/lib/grades` and does not import `/lib/mastery`.
 */
import { recordAudit, requestIdFor } from "@/lib/audit/log";
import { assertCanEnterGrade } from "@/lib/auth/scope";
import { nextTimestamp } from "@/lib/clock";
import { appendGradeRecord, db, nextId, transact, withIdempotency } from "@/lib/db/store";
import type { GradeRecord, User } from "@/lib/db/types";
import { RULE_VERSIONS } from "@/lib/rules/versions";

export class GradeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GradeError";
  }
}

/** Enters or changes one official grade. Idempotent, transactional, audited. */
export function enterGrade(
  actor: User,
  input: {
    enrollmentId: string;
    lessonCode: string;
    assessmentId: string;
    categoryId: string;
    pointsEarned: number;
    pointsPossible: number;
    reason: string;
  },
  idempotencyKey: string,
): GradeRecord {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const d = db();
        const enrollment = d.enrollments.find((e) => e.id === input.enrollmentId);
        if (!enrollment) throw new GradeError("That enrollment does not exist.");
        assertCanEnterGrade(actor, enrollment.studentId);

        if (input.reason.trim().length === 0) {
          throw new GradeError("A grade entry or change requires a recorded reason.");
        }
        if (input.pointsPossible <= 0) {
          throw new GradeError("Points possible must be greater than zero.");
        }
        if (input.pointsEarned < 0 || input.pointsEarned > input.pointsPossible) {
          throw new GradeError(
            `Points earned must be between 0 and ${input.pointsPossible}.`,
          );
        }

        const priorRows = d.gradeRecords.filter(
          (r) => r.enrollmentId === input.enrollmentId && r.lessonCode === input.lessonCode,
        );
        const superseded = new Set(
          priorRows.map((r) => r.supersedesGradeId).filter((x): x is string => x !== null),
        );
        const prior = priorRows.filter((r) => !superseded.has(r.id)).slice(-1)[0];

        const record = appendGradeRecord({
          id: nextId("gr"),
          studentId: enrollment.studentId,
          enrollmentId: input.enrollmentId,
          categoryId: input.categoryId,
          assessmentId: input.assessmentId,
          lessonCode: input.lessonCode,
          pointsEarned: input.pointsEarned,
          pointsPossible: input.pointsPossible,
          ruleVersion: RULE_VERSIONS.grading,
          supersedesGradeId: prior?.id ?? null,
          enteredByUserId: actor.id,
          reason: input.reason.trim(),
          recordedAt: nextTimestamp(),
        });

        recordAudit({
          actor,
          action: prior ? "grade.change" : "grade.enter",
          targetEntity: "grade_record",
          targetId: record.id,
          before: prior
            ? {
                gradeRecordId: prior.id,
                pointsEarned: prior.pointsEarned,
                pointsPossible: prior.pointsPossible,
              }
            : null,
          after: {
            pointsEarned: record.pointsEarned,
            pointsPossible: record.pointsPossible,
            ruleVersion: record.ruleVersion,
          },
          reason: input.reason.trim(),
          idempotencyKey,
          requestId: requestIdFor("grade.enter", idempotencyKey),
        });

        return record;
      },
      (existingId) => {
        const row = db().gradeRecords.find((r) => r.id === existingId);
        if (!row) throw new GradeError("Duplicate write with no record.");
        return row;
      },
    ),
  );
}
