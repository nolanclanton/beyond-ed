"use client";

import { useState } from "react";

import {
  addLessonVideoAction,
  createDraftVersionAction,
  removeLessonVideoAction,
  removeQuizItemAction,
  saveLessonScriptAction,
  saveQuizItemAction,
} from "@/lib/actions/lesson-authoring";
import type { AuthoredLesson, AuthoredQuizItem, ItemPurpose } from "@/lib/db/types";
import { ActionForm } from "@/lib/design/action-form";
import { Button } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

/**
 * The studio's editing controls.
 *
 * Client components because they are interaction: disclosure, adding a choice
 * row, marking the correct answer. Everything they submit is re-validated and
 * re-authorized on the server — the browser is never trusted with what is legal
 * (CLAUDE.md §1).
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
  children: React.ReactNode;
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

// ---------------------------------------------------------------------------
// The lesson script
// ---------------------------------------------------------------------------

/**
 * One form for the whole script, saved in a single transaction.
 *
 * Repeating fields are one entry per line, and the two-part fields use `::` as
 * the separator. That keeps the whole lesson in one atomic save — a script
 * half-written to the store is a worse outcome than a plain text convention.
 */
export function ScriptForm({
  versionId,
  lessonCode,
  draft,
}: {
  versionId: string;
  lessonCode: string;
  draft: AuthoredLesson | undefined;
}) {
  const id = (name: string) => `script-${lessonCode}-${name}`;
  return (
    <ActionForm
      action={saveLessonScriptAction}
      idempotencyKey={`lesson-script:${versionId}:${lessonCode}:${draft?.updatedAt ?? "new"}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="versionId" value={versionId} />
          <input type="hidden" name="lessonCode" value={lessonCode} />

          <Field
            label="Relevance — stage 3"
            htmlFor={id("relevance")}
            hint="Why this lesson exists, for the person reading it."
          >
            <textarea
              id={id("relevance")}
              name="relevance"
              rows={3}
              maxLength={4000}
              defaultValue={draft?.relevance ?? ""}
              className={FIELD}
            />
          </Field>

          <Field
            label="Goal — stage 4"
            htmlFor={id("goal")}
            hint="One sentence, in the student's language."
          >
            <input
              id={id("goal")}
              name="goal"
              maxLength={1000}
              defaultValue={draft?.goal ?? ""}
              className={FIELD}
            />
          </Field>

          <Field
            label="Success criteria"
            htmlFor={id("criteria")}
            hint="One per line. How a student knows they met the goal."
          >
            <textarea
              id={id("criteria")}
              name="successCriteria"
              rows={4}
              defaultValue={(draft?.successCriteria ?? []).join("\n")}
              className={FIELD}
            />
          </Field>

          <Field
            label="Instruction — stage 5"
            htmlFor={id("instruction")}
            hint="The script itself. One paragraph per line."
          >
            <textarea
              id={id("instruction")}
              name="instruction"
              rows={6}
              defaultValue={(draft?.instruction ?? []).join("\n")}
              className={FIELD}
            />
          </Field>

          <Field
            label="Vocabulary"
            htmlFor={id("vocabulary")}
            hint="One per line, as: term :: what it means"
          >
            <textarea
              id={id("vocabulary")}
              name="vocabulary"
              rows={3}
              placeholder="Unit rate :: A rate stated per one unit of the second quantity."
              defaultValue={(draft?.vocabulary ?? [])
                .map((v) => `${v.term} :: ${v.meaning}`)
                .join("\n")}
              className={FIELD}
            />
          </Field>

          <Field
            label="Worked model — stage 6"
            htmlFor={id("worked")}
            hint="One per line, as: step :: the reasoning behind it. Reasoning, not just the answer."
          >
            <textarea
              id={id("worked")}
              name="workedModel"
              rows={4}
              placeholder="Divide 150 by 5. :: 'Per gallon' means per ONE gallon, so divide by the gallons."
              defaultValue={(draft?.workedModel ?? [])
                .map((w) => `${w.step} :: ${w.reasoning}`)
                .join("\n")}
              className={FIELD}
            />
          </Field>

          <Field
            label="Guided practice — stage 7"
            htmlFor={id("guided")}
            hint="One per line, as: prompt :: hint :: answer. Support that fades."
          >
            <textarea
              id={id("guided")}
              name="guidedPractice"
              rows={4}
              placeholder="A printer prints 24 pages in 3 minutes. Pages per minute? :: 'Per minute' — divide by the minutes. :: 24 ÷ 3 = 8 pages per minute."
              defaultValue={(draft?.guidedPractice ?? [])
                .map((g) => `${g.prompt} :: ${g.hint} :: ${g.answer}`)
                .join("\n")}
              className={FIELD}
            />
          </Field>

          <Field
            label="Independent task — stage 8"
            htmlFor={id("task")}
            hint="What the student does on their own."
          >
            <textarea
              id={id("task")}
              name="independentTask"
              rows={3}
              maxLength={4000}
              defaultValue={draft?.independentTask ?? ""}
              className={FIELD}
            />
          </Field>

          <Field
            label="Notes outline — stage 1"
            htmlFor={id("notes")}
            hint="One per line. The record the student keeps."
          >
            <textarea
              id={id("notes")}
              name="notesOutline"
              rows={4}
              defaultValue={(draft?.notesOutline ?? []).join("\n")}
              className={FIELD}
            />
          </Field>

          <ReasonField
            id={id("reason")}
            placeholder="Rewrote the worked model to show the division choice."
          />

          <div>
            <Button emphasis="primary" disabled={pending}>
              {pending ? "Saving…" : "Save script"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------

export function AddVideoForm({
  versionId,
  lessonCode,
  count,
}: {
  versionId: string;
  lessonCode: string;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const id = (name: string) => `video-${lessonCode}-${name}`;

  return (
    <div>
      <Button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "Close" : "Attach a video"}
      </Button>
      {open ? (
        <ActionForm
          className="mt-3"
          action={addLessonVideoAction}
          idempotencyKey={`lesson-video:${versionId}:${lessonCode}:${count}`}
        >
          {(pending) => (
            <>
              <input type="hidden" name="versionId" value={versionId} />
              <input type="hidden" name="lessonCode" value={lessonCode} />

              <Field label="Title" htmlFor={id("title")}>
                <input
                  id={id("title")}
                  name="title"
                  required
                  maxLength={200}
                  placeholder="Finding a unit rate"
                  className={FIELD}
                />
              </Field>

              <Field
                label="Video address"
                htmlFor={id("url")}
                hint="The https address of the file or stream. This build stores the reference, not the file."
              >
                <input
                  id={id("url")}
                  name="url"
                  type="url"
                  required
                  maxLength={2000}
                  placeholder="https://media.example.org/unit-rate.mp4"
                  className={FIELD}
                />
              </Field>

              <Field label="Length in minutes (optional)" htmlFor={id("minutes")}>
                <input
                  id={id("minutes")}
                  name="minutes"
                  type="number"
                  min={0}
                  max={600}
                  className={FIELD}
                />
              </Field>

              <Field
                label="Transcript"
                htmlFor={id("transcript")}
                hint="Required. A video without a transcript is a lesson some students cannot take."
              >
                <textarea
                  id={id("transcript")}
                  name="transcript"
                  rows={6}
                  required
                  className={FIELD}
                />
              </Field>

              <Field
                label="Captions file (optional)"
                htmlFor={id("captions")}
                hint="A WebVTT address, if you have one. The transcript is required either way."
              >
                <input
                  id={id("captions")}
                  name="captionsUrl"
                  type="url"
                  maxLength={2000}
                  placeholder="https://media.example.org/unit-rate.vtt"
                  className={FIELD}
                />
              </Field>

              <ReasonField
                id={id("reason")}
                placeholder="Recorded walkthrough for the worked model."
              />

              <div>
                <Button emphasis="primary" disabled={pending}>
                  {pending ? "Attaching…" : "Attach video"}
                </Button>
              </div>
            </>
          )}
        </ActionForm>
      ) : null}
    </div>
  );
}

export function RemoveVideoForm({
  versionId,
  lessonCode,
  videoId,
  title,
}: {
  versionId: string;
  lessonCode: string;
  videoId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button
        type="button"
        emphasis="caution"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Keep it" : "Remove"}
      </Button>
      {open ? (
        <ActionForm
          className="mt-2"
          action={removeLessonVideoAction}
          idempotencyKey={`lesson-video-remove:${versionId}:${lessonCode}:${videoId}`}
        >
          {(pending) => (
            <>
              <input type="hidden" name="versionId" value={versionId} />
              <input type="hidden" name="lessonCode" value={lessonCode} />
              <input type="hidden" name="videoId" value={videoId} />
              <Field
                label={`Reason for removing “${title}”`}
                htmlFor={`rm-video-${videoId}`}
              >
                <input
                  id={`rm-video-${videoId}`}
                  name="reason"
                  required
                  minLength={4}
                  maxLength={500}
                  className={FIELD}
                />
              </Field>
              <div>
                <Button emphasis="caution" disabled={pending}>
                  {pending ? "Removing…" : "Confirm: remove video"}
                </Button>
              </div>
            </>
          )}
        </ActionForm>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quiz items
// ---------------------------------------------------------------------------

const MAX_CHOICES = 6;

/**
 * The quiz builder.
 *
 * Two rules are enforced in the markup as well as on the server, because they
 * are what makes an item useful rather than decorative: exactly one choice is
 * correct, and every other choice names the error it reveals. A wrong answer
 * with no error family behind it is a mark, not a diagnosis — and the whole
 * recommendation engine reads error families.
 */
export function QuizItemForm({
  versionId,
  lessonCode,
  standards,
  purposes,
  item,
  errorCodeSuggestions,
  seq,
}: {
  versionId: string;
  lessonCode: string;
  standards: string[];
  purposes: readonly { value: ItemPurpose; label: string; meaning: string }[];
  item?: AuthoredQuizItem;
  errorCodeSuggestions: string[];
  seq: number;
}) {
  const editing = Boolean(item);
  const [open, setOpen] = useState(false);
  const initialRows = Math.max(item?.choices.length ?? 0, 4);
  const [rows, setRows] = useState(Math.min(initialRows, MAX_CHOICES));
  const uid = item ? `edit-${item.id}` : `new-${seq}`;
  const id = (name: string) => `item-${uid}-${name}`;
  const listId = `errors-${uid}`;

  const correctIndex = item
    ? item.choices.findIndex((c) => c.id === item.correctChoiceId)
    : 0;

  return (
    <div>
      <Button
        type="button"
        emphasis={editing ? "secondary" : "primary"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Close" : editing ? "Edit item" : "Write an item"}
      </Button>

      {open ? (
        <ActionForm
          className="mt-3"
          action={saveQuizItemAction}
          idempotencyKey={`quiz-item:${versionId}:${lessonCode}:${uid}:${item?.addedAt ?? seq}`}
        >
          {(pending) => (
            <>
              <input type="hidden" name="versionId" value={versionId} />
              <input type="hidden" name="lessonCode" value={lessonCode} />
              {item ? <input type="hidden" name="itemId" value={item.id} /> : null}

              <Field
                label="What this item is for"
                htmlFor={id("purpose")}
                hint={
                  purposes.find((p) => p.value === (item?.purpose ?? "exit_ticket"))
                    ?.meaning
                }
              >
                <select
                  id={id("purpose")}
                  name="purpose"
                  defaultValue={item?.purpose ?? "exit_ticket"}
                  className={FIELD}
                >
                  {purposes.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Standard it measures"
                htmlFor={id("standard")}
                hint="Only the standards this lesson claims as primary coverage. That is what keeps evidence aligned to what was taught."
              >
                <select
                  id={id("standard")}
                  name="standard"
                  defaultValue={item?.standard ?? standards[0]}
                  className={FIELD}
                >
                  {standards.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Question" htmlFor={id("stem")}>
                <textarea
                  id={id("stem")}
                  name="stem"
                  rows={3}
                  required
                  minLength={8}
                  maxLength={4000}
                  defaultValue={item?.stem ?? ""}
                  className={FIELD}
                />
              </Field>

              <fieldset>
                <legend className={LABEL}>Choices</legend>
                <p className={HINT}>
                  Mark the one correct answer. Every other choice needs the error
                  family it reveals, in your own error model&apos;s words.
                </p>
                <datalist id={listId}>
                  {errorCodeSuggestions.map((code) => (
                    <option key={code} value={code} />
                  ))}
                </datalist>

                <div className="mt-2 flex flex-col gap-2">
                  {Array.from({ length: rows }, (_, index) => {
                    const existing = item?.choices[index];
                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-line bg-canvas p-3"
                      >
                        <div className="flex items-start gap-3">
                          <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-ink">
                            <input
                              type="radio"
                              name="correctIndex"
                              value={index}
                              defaultChecked={index === correctIndex}
                              className={FOCUS_RING}
                            />
                            Correct
                          </label>
                          <div className="flex-1">
                            <label
                              htmlFor={id(`choice${index}`)}
                              className="sr-only"
                            >
                              Choice {index + 1}
                            </label>
                            <input
                              id={id(`choice${index}`)}
                              name={`choiceText${index}`}
                              maxLength={1000}
                              placeholder={`Choice ${index + 1}`}
                              defaultValue={existing?.text ?? ""}
                              className={FIELD}
                            />
                            <label
                              htmlFor={id(`error${index}`)}
                              className="sr-only"
                            >
                              Error revealed by choice {index + 1}
                            </label>
                            <input
                              id={id(`error${index}`)}
                              name={`choiceError${index}`}
                              list={listId}
                              maxLength={120}
                              placeholder="Error this reveals, e.g. inverted-division"
                              defaultValue={existing?.errorCode ?? ""}
                              className={FIELD}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {rows < MAX_CHOICES ? (
                  <div className="mt-2">
                    <Button type="button" onClick={() => setRows(rows + 1)}>
                      Add a choice
                    </Button>
                  </div>
                ) : null}
              </fieldset>

              <Field
                label="Explanation"
                htmlFor={id("rationale")}
                hint="Shown after the student answers, never during."
              >
                <textarea
                  id={id("rationale")}
                  name="rationale"
                  rows={3}
                  required
                  maxLength={4000}
                  defaultValue={item?.rationale ?? ""}
                  className={FIELD}
                />
              </Field>

              <ReasonField
                id={id("reason")}
                placeholder="Added an item covering the inverted-division error."
              />

              <div>
                <Button emphasis="primary" disabled={pending}>
                  {pending ? "Saving…" : editing ? "Save changes" : "Save item"}
                </Button>
              </div>
            </>
          )}
        </ActionForm>
      ) : null}
    </div>
  );
}

export function RemoveItemForm({
  versionId,
  lessonCode,
  itemId,
}: {
  versionId: string;
  lessonCode: string;
  itemId: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button
        type="button"
        emphasis="caution"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Keep it" : "Remove"}
      </Button>
      {open ? (
        <ActionForm
          className="mt-2"
          action={removeQuizItemAction}
          idempotencyKey={`quiz-item-remove:${versionId}:${lessonCode}:${itemId}`}
        >
          {(pending) => (
            <>
              <input type="hidden" name="versionId" value={versionId} />
              <input type="hidden" name="lessonCode" value={lessonCode} />
              <input type="hidden" name="itemId" value={itemId} />
              <Field label="Reason for removing this item" htmlFor={`rm-item-${itemId}`}>
                <input
                  id={`rm-item-${itemId}`}
                  name="reason"
                  required
                  minLength={4}
                  maxLength={500}
                  className={FIELD}
                />
              </Field>
              <div>
                <Button emphasis="caution" disabled={pending}>
                  {pending ? "Removing…" : "Confirm: remove item"}
                </Button>
              </div>
            </>
          )}
        </ActionForm>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Opening a draft version
// ---------------------------------------------------------------------------

export function NewDraftVersionForm({
  courses,
  suggested,
}: {
  courses: string[];
  suggested: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [course, setCourse] = useState(courses[0] ?? "");

  return (
    <div>
      <Button
        type="button"
        emphasis="primary"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Close" : "Open a new draft version"}
      </Button>
      {open ? (
        <ActionForm
          className="mt-3"
          action={createDraftVersionAction}
          idempotencyKey={`new-version:${course}:${suggested[course] ?? ""}`}
        >
          {(pending) => (
            <>
              <Field label="Course" htmlFor="nv-course">
                <select
                  id="nv-course"
                  name="courseTitle"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className={FIELD}
                >
                  {courses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Version label"
                htmlFor="nv-version"
                hint="The school year, then the revision — 2026.3. Labels are stable once used."
              >
                <input
                  id="nv-version"
                  name="version"
                  required
                  defaultValue={suggested[course] ?? ""}
                  key={course}
                  maxLength={20}
                  className={FIELD}
                />
              </Field>

              <Field
                label="What is changing in this version"
                htmlFor="nv-notes"
                hint="Read by every reviewer who sees it later."
              >
                <textarea id="nv-notes" name="notes" rows={3} maxLength={1000} className={FIELD} />
              </Field>

              <ReasonField
                id="nv-reason"
                placeholder="Opening the 2027 revision to author Unit 1."
              />

              <div>
                <Button emphasis="primary" disabled={pending}>
                  {pending ? "Opening…" : "Open draft version"}
                </Button>
              </div>
            </>
          )}
        </ActionForm>
      ) : null}
    </div>
  );
}
