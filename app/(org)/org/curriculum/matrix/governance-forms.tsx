"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import {
  addFoundationAction,
  moveLessonAction,
  moveUnitAction,
  resetSequenceAction,
  setFoundationImportanceAction,
  setFoundationRetiredAction,
  setUnitFramingAction,
} from "@/lib/actions/curriculum-structure";
import { ActionForm } from "@/lib/design/action-form";
import { Button } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

/**
 * The governance write controls.
 *
 * Every one takes a recorded reason, because every one is an attributable
 * change to what a class will be taught (CLAUDE.md §6). Every one is behind a
 * disclosure rather than a bare button, so the reason field is visible before
 * the action is, and no control appears at all when the version is not a draft
 * — the page hides them and says why instead of offering something inert
 * (CLAUDE.md §12).
 */

const FIELD = `mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 ${FOCUS_RING}`;
const LABEL = "text-sm font-medium text-ink";
const HINT = "mt-0.5 text-xs text-ink-muted";

function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={LABEL}>
        {label}
      </label>
      {hint ? <p className={HINT}>{hint}</p> : null}
      {children}
    </div>
  );
}

function ReasonField({ id, placeholder }: { id: string; placeholder: string }) {
  return (
    <Field
      label="Reason (recorded on the audit event)"
      htmlFor={id}
      hint="Every curriculum change is attributable. This is what a later reader sees."
    >
      <input
        id={id}
        name="reason"
        required
        minLength={4}
        maxLength={500}
        placeholder={placeholder}
        className={FIELD}
      />
    </Field>
  );
}

/** The five importance levels, worded the way a teacher would say them. */
const LEVELS: { value: number; label: string }[] = [
  { value: 1, label: "1 — Helpful background; a student without it can still start" },
  { value: 2, label: "2 — Supporting; smooths the lesson but does not block it" },
  { value: 3, label: "3 — Substantial; most students need it first" },
  { value: 4, label: "4 — Foundational; this lesson is hard to attempt without it" },
  { value: 5, label: "5 — Required; do not advance into this lesson without it" },
];

function ImportanceField({
  id,
  defaultValue,
}: {
  id: string;
  defaultValue: number | null;
}) {
  return (
    <Field
      label="How hard does it bind?"
      htmlFor={id}
      hint="4 and above is what the product means by foundational. The workbook records that the link exists, not its strength — this is where that judgement is stored."
    >
      <select
        id={id}
        name="importance"
        required
        defaultValue={defaultValue === null ? "" : String(defaultValue)}
        className={FIELD}
      >
        <option value="" disabled>
          Choose a level
        </option>
        {LEVELS.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

// ---------------------------------------------------------------------------
// Sequence
// ---------------------------------------------------------------------------

export function MoveUnitForm({
  versionId,
  unitId,
  unitTitle,
  position,
  direction,
  disabled,
}: {
  versionId: string;
  unitId: string;
  unitTitle: string;
  /** Where the unit sits now. Part of the key, so a double click moves once. */
  position: number;
  direction: "up" | "down";
  disabled: boolean;
}) {
  if (disabled) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-sm text-line-strong"
      >
        {direction === "up" ? "↑" : "↓"}
      </span>
    );
  }
  return (
    <ActionForm
      action={moveUnitAction}
      idempotencyKey={`unit-move:${versionId}:${unitId}:${position}:${direction}`}
    >
      <input type="hidden" name="versionId" value={versionId} />
      <input type="hidden" name="unitId" value={unitId} />
      <input type="hidden" name="direction" value={direction} />
      <input
        type="hidden"
        name="reason"
        value={`Re-sequenced the course: moved ${unitTitle} ${direction === "up" ? "earlier" : "later"} in the year.`}
      />
      <button
        type="submit"
        aria-label={`Move ${unitTitle} ${direction === "up" ? "earlier" : "later"}`}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-sm text-ink-muted hover:border-primary-line hover:text-primary ${FOCUS_RING}`}
      >
        {direction === "up" ? "↑" : "↓"}
      </button>
    </ActionForm>
  );
}

export function MoveLessonForm({
  versionId,
  lessonCode,
  currentPosition,
  unitTitle,
  lessonCount,
}: {
  versionId: string;
  lessonCode: string;
  currentPosition: number;
  unitTitle: string;
  lessonCount: number;
}) {
  const [open, setOpen] = useState(false);
  const id = (name: string) => `move-${lessonCode}-${name}`;

  return (
    <div>
      <Button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "Close" : "Move this lesson"}
      </Button>
      {open ? (
        <ActionForm
          className="mt-3"
          action={moveLessonAction}
          idempotencyKey={`lesson-move:${versionId}:${lessonCode}:${currentPosition}`}
        >
          {(pending) => (
            <>
              <input type="hidden" name="versionId" value={versionId} />
              <input type="hidden" name="lessonCode" value={lessonCode} />
              <Field
                label={`Position in ${unitTitle}`}
                htmlFor={id("position")}
                hint={`1 to ${lessonCount}. A lesson moves inside its own unit: moving it to another unit would change two unit day budgets at once, which is a blueprint decision rather than an authoring one.`}
              >
                <select
                  id={id("position")}
                  name="toPosition"
                  required
                  defaultValue={String(currentPosition)}
                  className={FIELD}
                >
                  {Array.from({ length: lessonCount }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                      {n === currentPosition ? " (where it is now)" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <ReasonField
                id={id("reason")}
                placeholder="Students need the ratio-table lesson before the unit-rate one."
              />
              <div>
                <Button emphasis="primary" disabled={pending}>
                  {pending ? "Moving…" : "Move the lesson"}
                </Button>
              </div>
            </>
          )}
        </ActionForm>
      ) : null}
    </div>
  );
}

export function UnitFramingForm({
  versionId,
  unitId,
  title,
  essentialQuestion,
}: {
  versionId: string;
  unitId: string;
  title: string;
  essentialQuestion: string;
}) {
  const [open, setOpen] = useState(false);
  const id = (name: string) => `framing-${unitId}-${name}`;

  return (
    <div>
      <Button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "Close" : "Re-frame this unit"}
      </Button>
      {open ? (
        <ActionForm
          className="mt-3"
          action={setUnitFramingAction}
          idempotencyKey={`unit-framing:${versionId}:${unitId}:${title}`}
        >
          {(pending) => (
            <>
              <input type="hidden" name="versionId" value={versionId} />
              <input type="hidden" name="unitId" value={unitId} />
              <Field
                label="Unit title"
                htmlFor={id("title")}
                hint="What this version calls the unit. The workbook's own title is unchanged and every other version still reads it."
              >
                <input
                  id={id("title")}
                  name="title"
                  required
                  minLength={3}
                  maxLength={160}
                  defaultValue={title}
                  className={FIELD}
                />
              </Field>
              <Field
                label="Essential question"
                htmlFor={id("question")}
                hint="What the unit is asking. Students see it."
              >
                <textarea
                  id={id("question")}
                  name="essentialQuestion"
                  required
                  minLength={8}
                  maxLength={400}
                  rows={2}
                  defaultValue={essentialQuestion}
                  className={FIELD}
                />
              </Field>
              <ReasonField
                id={id("reason")}
                placeholder="Adapted the framing for the ninth-grade cohort's civics focus."
              />
              <div>
                <Button emphasis="primary" disabled={pending}>
                  {pending ? "Saving…" : "Save the framing"}
                </Button>
              </div>
            </>
          )}
        </ActionForm>
      ) : null}
    </div>
  );
}

export function ResetSequenceForm({
  versionId,
  changeCount,
}: {
  versionId: string;
  changeCount: number;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button type="button" emphasis="caution" onClick={() => setConfirming(true)}>
        Return to the workbook sequence
      </Button>
    );
  }
  return (
    <ActionForm
      action={resetSequenceAction}
      idempotencyKey={`sequence-reset:${versionId}:${changeCount}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="versionId" value={versionId} />
          <p className="text-sm text-ink">
            This drops {changeCount} sequencing and framing change
            {changeCount === 1 ? "" : "s"} and runs the course exactly as the
            workbook plans it. Foundation strengths are left as they are.
          </p>
          <ReasonField
            id={`reset-${versionId}`}
            placeholder="Re-sequencing was applied to the wrong version."
          />
          <div className="flex gap-3">
            <Button emphasis="caution" disabled={pending}>
              {pending ? "Resetting…" : "Reset the sequence"}
            </Button>
            <Button type="button" emphasis="quiet" onClick={() => setConfirming(false)}>
              Keep the changes
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

// ---------------------------------------------------------------------------
// Foundations
// ---------------------------------------------------------------------------

export function FoundationImportanceForm({
  versionId,
  lessonCode,
  targetId,
  importance,
  note,
}: {
  versionId: string;
  lessonCode: string;
  targetId: string;
  importance: number | null;
  note: string;
}) {
  const [open, setOpen] = useState(false);
  const id = (name: string) => `weight-${lessonCode}-${targetId}-${name}`;

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
      >
        {open ? "Close" : importance === null ? "Set how hard it binds" : "Change how hard it binds"}
      </button>
      {open ? (
        <ActionForm
          className="mt-3"
          action={setFoundationImportanceAction}
          idempotencyKey={`foundation-weight:${versionId}:${lessonCode}:${targetId}:${importance ?? "none"}`}
        >
          {(pending) => (
            <>
              <input type="hidden" name="versionId" value={versionId} />
              <input type="hidden" name="lessonCode" value={lessonCode} />
              <input type="hidden" name="targetId" value={targetId} />
              <ImportanceField id={id("importance")} defaultValue={importance} />
              <Field
                label="Note (optional)"
                htmlFor={id("note")}
                hint="What a later author should know about this link."
              >
                <input
                  id={id("note")}
                  name="note"
                  maxLength={500}
                  defaultValue={note}
                  className={FIELD}
                />
              </Field>
              <ReasonField
                id={id("reason")}
                placeholder="Two years of Exit Ticket evidence show students who miss this stall here."
              />
              <div>
                <Button emphasis="primary" disabled={pending}>
                  {pending ? "Saving…" : "Save"}
                </Button>
              </div>
            </>
          )}
        </ActionForm>
      ) : null}
    </div>
  );
}

export function AddFoundationForm({
  versionId,
  lessonCode,
  candidateLessons,
  candidateSupports,
}: {
  versionId: string;
  lessonCode: string;
  candidateLessons: { id: string; label: string }[];
  candidateSupports: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const id = (name: string) => `add-foundation-${lessonCode}-${name}`;

  return (
    <div>
      <Button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "Close" : "Name another foundation"}
      </Button>
      {open ? (
        <ActionForm
          className="mt-3"
          action={addFoundationAction}
          idempotencyKey={`foundation-add:${versionId}:${lessonCode}:${candidateLessons.length}`}
        >
          {(pending) => (
            <>
              <input type="hidden" name="versionId" value={versionId} />
              <input type="hidden" name="lessonCode" value={lessonCode} />
              <Field
                label="What does this lesson rest on?"
                htmlFor={id("target")}
                hint="An earlier lesson in this course, or a support from the intervention bank. Only lessons this version runs BEFORE this one are listed — a foundation has to come first."
              >
                <select
                  id={id("target")}
                  name="targetId"
                  required
                  defaultValue=""
                  className={FIELD}
                >
                  <option value="" disabled>
                    Choose a lesson or a support
                  </option>
                  {candidateLessons.length > 0 ? (
                    <optgroup label="Earlier lessons in this course">
                      {candidateLessons.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  {candidateSupports.length > 0 ? (
                    <optgroup label="Intervention bank">
                      {candidateSupports.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </select>
              </Field>
              <ImportanceField id={id("importance")} defaultValue={null} />
              <Field
                label="Note (optional)"
                htmlFor={id("note")}
                hint="Why this course treats it as prior learning."
              >
                <input id={id("note")} name="note" maxLength={500} className={FIELD} />
              </Field>
              <ReasonField
                id={id("reason")}
                placeholder="Students arriving from the accelerated pathway have not met integer operations."
              />
              <div>
                <Button emphasis="primary" disabled={pending}>
                  {pending ? "Adding…" : "Add the foundation"}
                </Button>
              </div>
            </>
          )}
        </ActionForm>
      ) : null}
    </div>
  );
}

export function RetireFoundationForm({
  versionId,
  lessonCode,
  targetId,
  retired,
}: {
  versionId: string;
  lessonCode: string;
  targetId: string;
  retired: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`text-sm font-semibold underline-offset-4 hover:underline ${retired ? "text-primary" : "text-urgent"} ${FOCUS_RING}`}
      >
        {retired ? "Treat it as prior learning again" : "Retire this link"}
      </button>
    );
  }
  return (
    <ActionForm
      action={setFoundationRetiredAction}
      idempotencyKey={`foundation-retire:${versionId}:${lessonCode}:${targetId}:${retired ? "restore" : "retire"}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="versionId" value={versionId} />
          <input type="hidden" name="lessonCode" value={lessonCode} />
          <input type="hidden" name="targetId" value={targetId} />
          <input type="hidden" name="retired" value={retired ? "false" : "true"} />
          {retired ? null : (
            <p className="text-sm text-ink">
              Nothing is deleted. The workbook link stays readable; this version
              stops treating it as prior learning, and the reason is on the audit
              event.
            </p>
          )}
          <ReasonField
            id={`retire-${lessonCode}-${targetId}`}
            placeholder={
              retired
                ? "Restoring the link after the sequence change was reverted."
                : "This course now teaches the skill directly in unit 1."
            }
          />
          <div className="flex gap-3">
            <Button emphasis={retired ? "primary" : "caution"} disabled={pending}>
              {pending
                ? "Saving…"
                : retired
                  ? "Restore the link"
                  : "Retire the link"}
            </Button>
            <Button type="button" emphasis="quiet" onClick={() => setConfirming(false)}>
              Leave it as it is
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}
