"use client";

import { useState } from "react";

import {
  addLessonMaterialAction,
  addLessonVideoAction,
  createDraftVersionAction,
  moveLessonBlockAction,
  removeLessonBlockAction,
  removeLessonMaterialAction,
  removeLessonVideoAction,
  removeQuizItemAction,
  saveLessonBlockAction,
  saveLessonScriptAction,
  saveQuizItemAction,
} from "@/lib/actions/lesson-authoring";
import { MATERIAL_KINDS } from "@/lib/curriculum/lesson-authoring";
import type {
  AuthoredLesson,
  AuthoredQuizItem,
  ItemPurpose,
  LessonBlock,
  LessonMaterial,
  LessonVideo,
} from "@/lib/db/types";
import { ActionForm } from "@/lib/design/action-form";
import { MATERIAL_LABELS } from "@/lib/design/lesson-blocks";
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
// The lesson canvas
// ---------------------------------------------------------------------------

const KINDS: { value: LessonBlock["kind"]; label: string; hint: string }[] = [
  { value: "text", label: "Paragraph", hint: "The explanation itself." },
  { value: "heading", label: "Heading", hint: "Breaks a long stage into parts." },
  { value: "callout", label: "Callout", hint: "A boxed aside." },
  { value: "list", label: "List", hint: "Steps, criteria, or examples." },
  { value: "definition", label: "Key term", hint: "A term and its meaning." },
  { value: "table", label: "Table", hint: "A comparison a paragraph would hide." },
  { value: "image", label: "Image", hint: "A diagram or photograph." },
  { value: "video", label: "Video", hint: "A video already attached to this lesson." },
  {
    value: "material",
    label: "Material",
    hint: "A reading, worksheet, data set, or reference sheet already attached to this lesson.",
  },
];

const TONES: { value: string; label: string; hint: string }[] = [
  { value: "note", label: "Note", hint: "Quiet aside." },
  { value: "important", label: "Important", hint: "Do not miss this." },
  { value: "example", label: "Example", hint: "A worked instance." },
  {
    value: "memory",
    label: "Remember",
    hint: "Amber. Only for something that comes back in review later.",
  },
];

/**
 * Places or replaces one block on the lesson canvas.
 *
 * The kind selector switches which fields are asked for, so an author is never
 * looking at a form field that does not apply to what they are making. Every
 * field is still submitted and the SERVER decides what the block is, so a
 * hand-made request cannot produce a block the renderer cannot draw.
 */
export function BlockForm({
  versionId,
  lessonCode,
  videos,
  materials,
  block,
  seq,
  onDone,
}: {
  versionId: string;
  lessonCode: string;
  videos: readonly LessonVideo[];
  materials: readonly LessonMaterial[];
  block?: LessonBlock;
  seq: number;
  onDone?: () => void;
}) {
  const [kind, setKind] = useState<LessonBlock["kind"]>(block?.kind ?? "text");
  const id = (name: string) => `block-${lessonCode}-${block?.id ?? `new${seq}`}-${name}`;
  const editing = Boolean(block);

  return (
    <ActionForm
      action={saveLessonBlockAction}
      idempotencyKey={`lesson-block:${versionId}:${lessonCode}:${block?.id ?? `new:${seq}`}`}
      onSuccessNote={() => (onDone ? <span>Reopen the canvas to keep building.</span> : null)}
    >
      {(pending) => (
        <>
          <input type="hidden" name="versionId" value={versionId} />
          <input type="hidden" name="lessonCode" value={lessonCode} />
          <input type="hidden" name="blockId" value={block?.id ?? ""} />
          <input type="hidden" name="kind" value={kind} />

          <fieldset>
            <legend className={LABEL}>What are you adding?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {KINDS.map((option) => {
                const active = option.value === kind;
                const disabled =
                  (option.value === "video" && videos.length === 0) ||
                  (option.value === "material" && materials.length === 0);
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={disabled}
                    aria-pressed={active}
                    onClick={() => setKind(option.value)}
                    title={
                      disabled
                        ? `Attach a ${option.value} to this lesson first.`
                        : option.hint
                    }
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING} ${
                      active
                        ? "border-primary bg-primary text-white"
                        : "border-line bg-surface text-ink-muted hover:border-primary-line hover:text-primary"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className={HINT}>{KINDS.find((k) => k.value === kind)?.hint}</p>
          </fieldset>

          {kind === "heading" || kind === "text" ? (
            <Field
              label={kind === "heading" ? "Heading" : "Paragraph"}
              htmlFor={id("text")}
            >
              <textarea
                id={id("text")}
                name="text"
                rows={kind === "heading" ? 1 : 4}
                maxLength={8000}
                defaultValue={
                  block && (block.kind === "heading" || block.kind === "text")
                    ? block.text
                    : ""
                }
                className={FIELD}
              />
            </Field>
          ) : null}

          {kind === "callout" ? (
            <>
              <fieldset>
                <legend className={LABEL}>Tone</legend>
                <div className="mt-1.5 flex flex-wrap gap-4">
                  {TONES.map((tone) => (
                    <label key={tone.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="tone"
                        value={tone.value}
                        defaultChecked={
                          block?.kind === "callout"
                            ? block.tone === tone.value
                            : tone.value === "note"
                        }
                        className={FOCUS_RING}
                      />
                      <span>
                        <span className="font-medium text-ink">{tone.label}</span>
                        <span className="block text-xs text-ink-muted">{tone.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="Title (optional)" htmlFor={id("title")}>
                <input
                  id={id("title")}
                  name="title"
                  maxLength={200}
                  defaultValue={block?.kind === "callout" ? block.title : ""}
                  className={FIELD}
                />
              </Field>
              <Field label="Text" htmlFor={id("ctext")}>
                <textarea
                  id={id("ctext")}
                  name="text"
                  rows={3}
                  maxLength={8000}
                  defaultValue={block?.kind === "callout" ? block.text : ""}
                  className={FIELD}
                />
              </Field>
            </>
          ) : null}

          {kind === "list" ? (
            <>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  name="ordered"
                  defaultChecked={block?.kind === "list" ? block.ordered : false}
                  className={FOCUS_RING}
                />
                Numbered — use this when order matters
              </label>
              <Field label="Items" htmlFor={id("items")} hint="One per line.">
                <textarea
                  id={id("items")}
                  name="items"
                  rows={5}
                  defaultValue={block?.kind === "list" ? block.items.join("\n") : ""}
                  className={FIELD}
                />
              </Field>
            </>
          ) : null}

          {kind === "definition" ? (
            <>
              <Field label="Term" htmlFor={id("term")}>
                <input
                  id={id("term")}
                  name="term"
                  maxLength={200}
                  defaultValue={block?.kind === "definition" ? block.term : ""}
                  className={FIELD}
                />
              </Field>
              <Field label="What it means" htmlFor={id("meaning")}>
                <textarea
                  id={id("meaning")}
                  name="meaning"
                  rows={2}
                  maxLength={1000}
                  defaultValue={block?.kind === "definition" ? block.meaning : ""}
                  className={FIELD}
                />
              </Field>
            </>
          ) : null}

          {kind === "table" ? (
            <>
              <Field label="Caption (optional)" htmlFor={id("caption")}>
                <input
                  id={id("caption")}
                  name="caption"
                  maxLength={400}
                  defaultValue={block?.kind === "table" ? block.caption : ""}
                  className={FIELD}
                />
              </Field>
              <Field
                label="Column headings"
                htmlFor={id("headers")}
                hint="Separated by a vertical bar, e.g. Design | Hours | Cost"
              >
                <input
                  id={id("headers")}
                  name="headers"
                  maxLength={1200}
                  defaultValue={block?.kind === "table" ? block.headers.join(" | ") : ""}
                  className={FIELD}
                />
              </Field>
              <Field
                label="Rows"
                htmlFor={id("rows")}
                hint="One row per line, cells separated by a vertical bar."
              >
                <textarea
                  id={id("rows")}
                  name="rows"
                  rows={5}
                  defaultValue={
                    block?.kind === "table"
                      ? block.rows.map((row) => row.join(" | ")).join("\n")
                      : ""
                  }
                  className={FIELD}
                />
              </Field>
            </>
          ) : null}

          {kind === "image" ? (
            <>
              <Field
                label="Image address"
                htmlFor={id("url")}
                hint="Where the file is hosted. Beyond.Ed stores the address, not the file."
              >
                <input
                  id={id("url")}
                  name="url"
                  type="url"
                  maxLength={2000}
                  placeholder="https://…"
                  defaultValue={block?.kind === "image" ? block.url : ""}
                  className={FIELD}
                />
              </Field>
              <Field
                label="Alternative text"
                htmlFor={id("alt")}
                hint="Required. What the image shows, for a student who cannot see it."
              >
                <textarea
                  id={id("alt")}
                  name="alt"
                  rows={2}
                  maxLength={600}
                  defaultValue={block?.kind === "image" ? block.alt : ""}
                  className={FIELD}
                />
              </Field>
              <Field label="Caption (optional)" htmlFor={id("icaption")}>
                <input
                  id={id("icaption")}
                  name="caption"
                  maxLength={400}
                  defaultValue={block?.kind === "image" ? block.caption : ""}
                  className={FIELD}
                />
              </Field>
            </>
          ) : null}

          {kind === "video" ? (
            <Field
              label="Which video"
              htmlFor={id("videoId")}
              hint="Its transcript travels with it."
            >
              <select
                id={id("videoId")}
                name="videoId"
                defaultValue={block?.kind === "video" ? block.videoId : ""}
                className={FIELD}
              >
                {videos.map((video) => (
                  <option key={video.id} value={video.id}>
                    {video.title}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          {kind === "material" ? (
            <Field
              label="Which material"
              htmlFor={id("materialId")}
              hint="What it is for and how else to get it travel with it."
            >
              <select
                id={id("materialId")}
                name="materialId"
                defaultValue={block?.kind === "material" ? block.materialId : ""}
                className={FIELD}
              >
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {MATERIAL_LABELS[material.kind]} — {material.title}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <ReasonField
            id={id("reason")}
            placeholder={
              editing
                ? "Rewrote the comparison table after the pilot."
                : "Added the worked comparison students kept asking for."
            }
          />

          <div>
            <Button emphasis="primary" disabled={pending}>
              {pending
                ? "Saving…"
                : editing
                  ? "Save this block"
                  : "Add to the canvas"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

/** Opens the add-a-block form. Collapsed by default so the canvas reads first. */
export function AddBlockPanel({
  versionId,
  lessonCode,
  videos,
  materials,
  seq,
}: {
  versionId: string;
  lessonCode: string;
  videos: readonly LessonVideo[];
  materials: readonly LessonMaterial[];
  seq: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button
        type="button"
        emphasis={open ? "secondary" : "primary"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Close" : "Add a block"}
      </Button>
      {open ? (
        <div className="mt-4 rounded-xl border border-line bg-surface-sunken p-4">
          <BlockForm
            versionId={versionId}
            lessonCode={lessonCode}
            videos={videos}
            materials={materials}
            seq={seq}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Edit-in-place for one existing block. */
export function EditBlockPanel({
  versionId,
  lessonCode,
  videos,
  materials,
  block,
}: {
  versionId: string;
  lessonCode: string;
  videos: readonly LessonVideo[];
  materials: readonly LessonMaterial[];
  block: LessonBlock;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`text-xs font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
      >
        {open ? "Cancel" : "Edit"}
      </button>
      {open ? (
        <div className="mt-3 rounded-xl border border-line bg-surface-sunken p-4 text-left">
          <BlockForm
            versionId={versionId}
            lessonCode={lessonCode}
            videos={videos}
            materials={materials}
            block={block}
            seq={0}
          />
        </div>
      ) : null}
    </div>
  );
}

export function MoveBlockForm({
  versionId,
  lessonCode,
  blockId,
  position,
  direction,
  disabled,
}: {
  versionId: string;
  lessonCode: string;
  blockId: string;
  /** Where the block sits now. Part of the key, so a double click moves once. */
  position: number;
  direction: "up" | "down";
  disabled: boolean;
}) {
  if (disabled) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line text-sm text-line-strong"
      >
        {direction === "up" ? "\u2191" : "\u2193"}
      </span>
    );
  }
  return (
    <ActionForm
      action={moveLessonBlockAction}
      idempotencyKey={`block-move:${versionId}:${lessonCode}:${blockId}:${position}:${direction}`}
    >
      <input type="hidden" name="versionId" value={versionId} />
      <input type="hidden" name="lessonCode" value={lessonCode} />
      <input type="hidden" name="blockId" value={blockId} />
      <input type="hidden" name="direction" value={direction} />
      <input
        type="hidden"
        name="reason"
        value={`Reordered the lesson canvas: moved a block ${direction}.`}
      />
      <button
        type="submit"
        aria-label={`Move ${direction}`}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-sm text-ink-muted hover:border-primary-line hover:text-primary ${FOCUS_RING}`}
      >
        {direction === "up" ? "\u2191" : "\u2193"}
      </button>
    </ActionForm>
  );
}

export function RemoveBlockForm({
  versionId,
  lessonCode,
  blockId,
}: {
  versionId: string;
  lessonCode: string;
  blockId: string;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`text-xs font-semibold text-urgent underline-offset-4 hover:underline ${FOCUS_RING}`}
      >
        Remove
      </button>
    );
  }
  return (
    <ActionForm
      action={removeLessonBlockAction}
      idempotencyKey={`block-remove:${versionId}:${lessonCode}:${blockId}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="versionId" value={versionId} />
          <input type="hidden" name="lessonCode" value={lessonCode} />
          <input type="hidden" name="blockId" value={blockId} />
          <Field
            label="Reason"
            htmlFor={`remove-block-${blockId}`}
            hint="Recorded on the audit event."
          >
            <input
              id={`remove-block-${blockId}`}
              name="reason"
              required
              minLength={4}
              maxLength={500}
              className={FIELD}
            />
          </Field>
          <div className="flex gap-3">
            <Button emphasis="caution" disabled={pending}>
              {pending ? "Removing…" : "Remove block"}
            </Button>
            <Button type="button" emphasis="quiet" onClick={() => setConfirming(false)}>
              Keep it
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

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

/**
 * Attaches a reading, worksheet, data set, or reference sheet.
 *
 * Two required fields carry the weight. `purpose` is what the student does with
 * it — a link with no task attached is noise on a page someone is trying to
 * work through. `accessNote` is the format and the way in for a student who
 * cannot open it, which is the same rule that makes alternative text required
 * on an image (CLAUDE.md §12).
 */
export function AddMaterialForm({
  versionId,
  lessonCode,
  count,
}: {
  versionId: string;
  lessonCode: string;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const id = (name: string) => `material-${lessonCode}-${name}`;

  return (
    <div>
      <Button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "Close" : "Attach a material"}
      </Button>
      {open ? (
        <ActionForm
          className="mt-3"
          action={addLessonMaterialAction}
          idempotencyKey={`lesson-material:${versionId}:${lessonCode}:${count}`}
        >
          {(pending) => (
            <>
              <input type="hidden" name="versionId" value={versionId} />
              <input type="hidden" name="lessonCode" value={lessonCode} />

              <Field
                label="What kind of material?"
                htmlFor={id("kind")}
                hint="Students see this word, so they know what they are opening before they open it."
              >
                <select id={id("kind")} name="kind" required defaultValue="reading" className={FIELD}>
                  {MATERIAL_KINDS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} — {option.meaning}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Title" htmlFor={id("title")}>
                <input
                  id={id("title")}
                  name="title"
                  required
                  maxLength={200}
                  placeholder="Grocery unit-price comparison sheet"
                  className={FIELD}
                />
              </Field>

              <Field
                label="Material address"
                htmlFor={id("url")}
                hint="The https address of the file. This build stores the reference, not the file."
              >
                <input
                  id={id("url")}
                  name="url"
                  type="url"
                  required
                  maxLength={2000}
                  placeholder="https://materials.example.org/unit-price.pdf"
                  className={FIELD}
                />
              </Field>

              <Field
                label="What does the student do with it?"
                htmlFor={id("purpose")}
                hint="Required. One sentence, addressed to the student."
              >
                <textarea
                  id={id("purpose")}
                  name="purpose"
                  rows={2}
                  required
                  maxLength={600}
                  placeholder="Fill in the price per ounce for each package, then decide which is the better buy."
                  className={FIELD}
                />
              </Field>

              <Field
                label="How else can a student get it?"
                htmlFor={id("access")}
                hint="Required. The format, and the way in for a student who cannot open that format."
              >
                <textarea
                  id={id("access")}
                  name="accessNote"
                  rows={2}
                  required
                  maxLength={600}
                  placeholder="Tagged PDF, readable by a screen reader. A large-print copy is in the classroom folder."
                  className={FIELD}
                />
              </Field>

              <Field label="Minutes it takes (optional)" htmlFor={id("minutes")}>
                <input
                  id={id("minutes")}
                  name="minutes"
                  type="number"
                  min={0}
                  max={600}
                  className={FIELD}
                />
              </Field>

              <ReasonField
                id={id("reason")}
                placeholder="Added the comparison sheet the pilot classes asked for."
              />

              <div>
                <Button emphasis="primary" disabled={pending}>
                  {pending ? "Attaching…" : "Attach material"}
                </Button>
              </div>
            </>
          )}
        </ActionForm>
      ) : null}
    </div>
  );
}

export function RemoveMaterialForm({
  versionId,
  lessonCode,
  materialId,
  title,
}: {
  versionId: string;
  lessonCode: string;
  materialId: string;
  title: string;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`text-xs font-semibold text-urgent underline-offset-4 hover:underline ${FOCUS_RING}`}
      >
        Remove
      </button>
    );
  }
  return (
    <ActionForm
      action={removeLessonMaterialAction}
      idempotencyKey={`lesson-material-remove:${versionId}:${lessonCode}:${materialId}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="versionId" value={versionId} />
          <input type="hidden" name="lessonCode" value={lessonCode} />
          <input type="hidden" name="materialId" value={materialId} />
          <Field
            label={`Reason for removing “${title}”`}
            htmlFor={`rm-material-${materialId}`}
            hint="Recorded on the audit event."
          >
            <input
              id={`rm-material-${materialId}`}
              name="reason"
              required
              minLength={4}
              maxLength={500}
              className={FIELD}
            />
          </Field>
          <div className="flex gap-3">
            <Button emphasis="caution" disabled={pending}>
              {pending ? "Removing…" : "Remove material"}
            </Button>
            <Button type="button" emphasis="quiet" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
          </div>
        </>
      )}
    </ActionForm>
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
