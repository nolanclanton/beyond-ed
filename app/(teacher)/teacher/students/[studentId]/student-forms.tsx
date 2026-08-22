"use client";

import { enterGradeAction, recordObservationAction } from "@/lib/actions/staff";
import { ActionForm } from "@/lib/design/action-form";
import { Button } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

const FIELD = `mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 ${FOCUS_RING}`;

/**
 * Grade entry and grade change.
 *
 * Append-only: submitting writes a NEW record that supersedes the previous one.
 * The reason is required and lands on the audit event with the before and after
 * values (CLAUDE.md §4, §6).
 */
export function GradeEntryForm({
  enrollmentId,
  lessons,
  categories,
  idempotencySalt,
}: {
  enrollmentId: string;
  lessons: { code: string; assessmentId: string; label: string }[];
  categories: { id: string; name: string }[];
  idempotencySalt: string;
}) {
  return (
    <ActionForm
      action={enterGradeAction}
      idempotencyKey={`grade:${idempotencySalt}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="enrollmentId" value={enrollmentId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`g-lesson-${idempotencySalt}`} className="text-sm font-medium text-ink">
                Assessment
              </label>
              <select id={`g-lesson-${idempotencySalt}`} name="lessonCode" className={FIELD}>
                {lessons.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
              <input
                type="hidden"
                name="assessmentId"
                value={lessons[0]?.assessmentId ?? ""}
              />
            </div>
            <div>
              <label htmlFor={`g-cat-${idempotencySalt}`} className="text-sm font-medium text-ink">
                Category
              </label>
              <select id={`g-cat-${idempotencySalt}`} name="categoryId" className={FIELD}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`g-earned-${idempotencySalt}`} className="text-sm font-medium text-ink">
                Points earned
              </label>
              <input
                id={`g-earned-${idempotencySalt}`}
                name="pointsEarned"
                type="number"
                min={0}
                step={0.5}
                defaultValue={3}
                required
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor={`g-possible-${idempotencySalt}`} className="text-sm font-medium text-ink">
                Points possible
              </label>
              <input
                id={`g-possible-${idempotencySalt}`}
                name="pointsPossible"
                type="number"
                min={1}
                step={0.5}
                defaultValue={4}
                required
                className={FIELD}
              />
            </div>
          </div>
          <div>
            <label htmlFor={`g-reason-${idempotencySalt}`} className="text-sm font-medium text-ink">
              Reason (recorded on the audit event)
            </label>
            <input
              id={`g-reason-${idempotencySalt}`}
              name="reason"
              required
              minLength={4}
              maxLength={500}
              placeholder="Regraded after reviewing the written reasoning."
              className={FIELD}
            />
          </div>
          <div>
            <Button emphasis="primary" disabled={pending}>
              {pending ? "Recording…" : "Record this result"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

/**
 * Teacher observation. Appended to the evidence ledger; when it corrects a
 * specific response it links to the original, which stays readable forever.
 */
export function ObservationForm({
  studentId,
  enrollments,
  idempotencySalt,
  correctableEvidence,
}: {
  studentId: string;
  enrollments: { id: string; label: string; lessonCode: string }[];
  idempotencySalt: string;
  correctableEvidence: { id: string; label: string }[];
}) {
  return (
    <ActionForm
      action={recordObservationAction}
      idempotencyKey={`obs:${idempotencySalt}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="studentId" value={studentId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`o-enr-${idempotencySalt}`} className="text-sm font-medium text-ink">
                Course
              </label>
              <select id={`o-enr-${idempotencySalt}`} name="enrollmentId" className={FIELD}>
                {enrollments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
              <input type="hidden" name="lessonCode" value={enrollments[0]?.lessonCode ?? ""} />
            </div>
            <div>
              <label htmlFor={`o-skill-${idempotencySalt}`} className="text-sm font-medium text-ink">
                Skill or standard
              </label>
              <input
                id={`o-skill-${idempotencySalt}`}
                name="skill"
                required
                minLength={1}
                placeholder="6.RP.2"
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor={`o-correct-${idempotencySalt}`} className="text-sm font-medium text-ink">
                Does this count as demonstrating the skill?
              </label>
              <select
                id={`o-correct-${idempotencySalt}`}
                name="correct"
                defaultValue="unscored"
                className={FIELD}
              >
                <option value="unscored">Context only — not scored</option>
                <option value="yes">Yes, demonstrated</option>
                <option value="no">No, not yet</option>
              </select>
            </div>
            <div>
              <label htmlFor={`o-sup-${idempotencySalt}`} className="text-sm font-medium text-ink">
                Correcting an earlier response?
              </label>
              <select
                id={`o-sup-${idempotencySalt}`}
                name="supersedesEvidenceId"
                defaultValue=""
                className={FIELD}
              >
                <option value="">No — this is a new observation</option>
                {correctableEvidence.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor={`o-note-${idempotencySalt}`} className="text-sm font-medium text-ink">
              What you observed
            </label>
            <textarea
              id={`o-note-${idempotencySalt}`}
              name="note"
              required
              minLength={4}
              maxLength={1000}
              rows={3}
              placeholder="Explained the unit rate correctly at the board, including the units."
              className={FIELD}
            />
          </div>
          <div>
            <Button emphasis="primary" disabled={pending}>
              {pending ? "Appending…" : "Append to the evidence ledger"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}
