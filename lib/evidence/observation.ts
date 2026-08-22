/**
 * Teacher observations and corrections (CLAUDE.md §5).
 *
 * A teacher observation is APPENDED. It never overwrites the original attempt.
 * When it corrects a specific response, the new row links to the original by
 * `supersedesEvidenceId` and the original stays readable forever.
 */
import { recordAudit, requestIdFor } from "@/lib/audit/log";
import { assertCanReadStudent } from "@/lib/auth/scope";
import { db, transact, withIdempotency } from "@/lib/db/store";
import type { EvidenceRecord, User } from "@/lib/db/types";

import { evidenceById, recordEvidence } from "./ledger";

export class ObservationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObservationError";
  }
}

export function recordObservation(
  actor: User,
  input: {
    studentId: string;
    enrollmentId: string;
    skill: string;
    standard: string | null;
    lessonCode: string;
    note: string;
    correct: boolean | null;
    /** Set when this observation corrects a specific earlier response. */
    supersedesEvidenceId: string | null;
  },
  idempotencyKey: string,
): EvidenceRecord {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        assertCanReadStudent(actor, input.studentId);
        if (actor.role !== "teacher") {
          throw new ObservationError("Only a teacher records an observation.");
        }
        if (input.note.trim().length === 0) {
          throw new ObservationError("An observation needs a note.");
        }
        const enrollment = db().enrollments.find((e) => e.id === input.enrollmentId);
        if (!enrollment) throw new ObservationError("That enrollment does not exist.");

        if (input.supersedesEvidenceId) {
          const original = evidenceById(input.supersedesEvidenceId);
          if (!original) throw new ObservationError("The original evidence row is missing.");
          if (original.studentId !== input.studentId) {
            throw new ObservationError("That evidence belongs to another student.");
          }
        }

        const row = recordEvidence({
          studentId: input.studentId,
          enrollmentId: input.enrollmentId,
          courseVersionId: enrollment.courseVersionId,
          lessonCode: input.lessonCode,
          stage: "Teacher observation",
          standard: input.standard,
          skill: input.skill,
          itemId: `obs:${actor.id}:${idempotencyKey}`,
          correct: input.correct,
          response: input.note.trim(),
          errorCode: null,
          attempt: 1,
          hintsUsed: 0,
          meaningfulMinutes: 0,
          supportUsed: null,
          source: "teacher_observation",
          supersedesEvidenceId: input.supersedesEvidenceId,
          recordedByUserId: actor.id,
        });

        recordAudit({
          actor,
          action: input.supersedesEvidenceId ? "evidence.correct" : "evidence.observe",
          targetEntity: "evidence",
          targetId: row.id,
          before: input.supersedesEvidenceId
            ? { supersededEvidenceId: input.supersedesEvidenceId }
            : null,
          after: { skill: row.skill, correct: row.correct },
          reason: input.note.trim(),
          idempotencyKey,
          requestId: requestIdFor("evidence.observe", idempotencyKey),
        });

        return row;
      },
      (existingId) => {
        const row = evidenceById(existingId);
        if (!row) throw new ObservationError("Duplicate write with no record.");
        return row;
      },
    ),
  );
}
