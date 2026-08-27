"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import {
  advanceNarrativeAction,
  checkpointNarrativeAction,
  createNarrativeAction,
  duplicateNarrativeAction,
  moveChapterAction,
  removeArcMomentAction,
  removeBeatAction,
  removeChapterAction,
  removeCharacterAction,
  removeLocationAction,
  removePlotThreadAction,
  resolvePlotThreadAction,
  saveArcMomentAction,
  saveBeatAction,
  saveCentralProblemAction,
  saveChapterAction,
  saveCharacterAction,
  saveContentBoundariesAction,
  saveLocationAction,
  saveNarrativeIdentityAction,
  saveNarrativeStateAction,
  saveNarrativeWorldAction,
  savePlotThreadAction,
  saveVisualBibleAction,
  setOfficialTemplateAction,
  shareNarrativeAction,
} from "@/lib/actions/narrative";
import {
  ASSET_ASPECT_RATIOS,
  PLOT_THREAD_KINDS,
  STORY_ARC_STAGES,
  type Narrative,
  type NarrativeChapter,
  type NarrativeCharacter,
  type NarrativeLocation,
  type NarrativeStatus,
  type PlotThread,
  type StoryArcMoment,
} from "@/lib/db/types";
import { ActionForm } from "@/lib/design/action-form";
import { Button } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

/**
 * The Narrative Studio's editing controls.
 *
 * Client components because they are interaction — a disclosure, a picker, a
 * confirmation. Everything they submit is re-validated and re-authorized on the
 * server; the browser is never trusted with what is legal (CLAUDE.md §1).
 */

const FIELD = `mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 ${FOCUS_RING}`;
const LABEL = "text-sm font-medium text-ink";
const HINT = "mt-0.5 text-xs text-ink-muted";

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: ReactNode;
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
      label="Reason"
      hint="Recorded on the change, so a later reader knows why the canon moved."
      htmlFor={id}
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

/** One entry per line. Used everywhere a list is edited. */
function LinesField({
  label,
  hint,
  id,
  name,
  value,
  rows = 4,
}: {
  label: string;
  hint?: string;
  id: string;
  name: string;
  value: readonly string[];
  rows?: number;
}) {
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={value.join("\n")}
        className={FIELD}
      />
    </Field>
  );
}

/**
 * A form that only appears when asked for.
 *
 * The studio has a great many editable parts and showing them all at once
 * would bury the story under its own scaffolding. The trigger states what it
 * opens, so nothing here is a control whose effect is a surprise.
 */
function Disclosure({
  label,
  children,
  emphasis = "secondary",
}: {
  label: string;
  children: ReactNode;
  emphasis?: "secondary" | "quiet";
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button
        type="button"
        emphasis={emphasis}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "Cancel" : label}
      </Button>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export function IdentityForm({
  narrative,
  courses,
  seq,
}: {
  narrative: Narrative | null;
  courses: { id: string; title: string }[];
  seq: number;
}) {
  const id = (n: string): string => `identity-${seq}-${n}`;
  const creating = narrative === null;

  return (
    <ActionForm
      action={creating ? createNarrativeAction : saveNarrativeIdentityAction}
      idempotencyKey={`narrative-identity-${narrative?.id ?? "new"}-${seq}`}
    >
      {(pending) => (
        <>
          {narrative ? (
            <input type="hidden" name="narrativeId" value={narrative.id} />
          ) : null}

          <Field
            label="Title"
            hint="What a colleague would call this story."
            htmlFor={id("title")}
          >
            <input
              id={id("title")}
              name="title"
              required
              maxLength={200}
              defaultValue={narrative?.title ?? ""}
              className={FIELD}
            />
          </Field>

          <Field
            label="Premise"
            hint="One sentence. If it takes three, the story is not clear yet."
            htmlFor={id("premise")}
          >
            <textarea
              id={id("premise")}
              name="premise"
              rows={2}
              maxLength={1000}
              defaultValue={narrative?.premise ?? ""}
              className={FIELD}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Subject" htmlFor={id("subject")}>
              <input
                id={id("subject")}
                name="subject"
                maxLength={120}
                defaultValue={narrative?.subject ?? ""}
                className={FIELD}
              />
            </Field>
            <Field
              label="Course"
              hint="The course it was written for. A reused narrative may leave this unset."
              htmlFor={id("courseId")}
            >
              <select
                id={id("courseId")}
                name="courseId"
                defaultValue={narrative?.courseId ?? ""}
                className={FIELD}
              >
                <option value="">Not tied to one course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Genre" htmlFor={id("genre")}>
              <input
                id={id("genre")}
                name="genre"
                maxLength={80}
                placeholder="Investigation, survival, historical mystery…"
                defaultValue={narrative?.genre ?? ""}
                className={FIELD}
              />
            </Field>
            <Field label="Tone" htmlFor={id("tone")}>
              <input
                id={id("tone")}
                name="tone"
                maxLength={120}
                placeholder="Urgent but not frightening"
                defaultValue={narrative?.tone ?? ""}
                className={FIELD}
              />
            </Field>
            <Field label="Grade band" htmlFor={id("gradeBand")}>
              <input
                id={id("gradeBand")}
                name="gradeBand"
                maxLength={40}
                placeholder="6, or 9-10"
                defaultValue={narrative?.gradeBand ?? ""}
                className={FIELD}
              />
            </Field>
            <Field
              label="Audience"
              hint="Who this is written for, in their own terms."
              htmlFor={id("audience")}
            >
              <input
                id={id("audience")}
                name="audience"
                maxLength={200}
                defaultValue={narrative?.audience ?? ""}
                className={FIELD}
              />
            </Field>
          </div>

          <Field
            label="Keywords"
            hint="Comma separated. These are what the Narrative Bank searches."
            htmlFor={id("keywords")}
          >
            <input
              id={id("keywords")}
              name="keywords"
              maxLength={600}
              defaultValue={(narrative?.keywords ?? []).join(", ")}
              className={FIELD}
            />
          </Field>

          <LinesField
            label="Units it runs alongside"
            hint="One catalog unit id per line. Optional."
            id={id("unitIds")}
            name="unitIds"
            value={narrative?.unitIds ?? []}
            rows={2}
          />

          <ReasonField
            id={id("reason")}
            placeholder={creating ? "Starting a new unit narrative." : "Tightened the premise."}
          />
          <div>
            <Button type="submit" emphasis="primary" disabled={pending}>
              {pending ? "Saving…" : creating ? "Create narrative" : "Save identity"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

// ---------------------------------------------------------------------------
// World and central problem
// ---------------------------------------------------------------------------

export function WorldForm({ narrative, seq }: { narrative: Narrative; seq: number }) {
  const id = (n: string): string => `world-${seq}-${n}`;
  return (
    <ActionForm
      action={saveNarrativeWorldAction}
      idempotencyKey={`narrative-world-${narrative.id}-${seq}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="narrativeId" value={narrative.id} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Place" htmlFor={id("place")}>
              <input
                id={id("place")}
                name="place"
                maxLength={300}
                defaultValue={narrative.world.place}
                className={FIELD}
              />
            </Field>
            <Field label="Time period" htmlFor={id("period")}>
              <input
                id={id("period")}
                name="period"
                maxLength={300}
                defaultValue={narrative.world.period}
                className={FIELD}
              />
            </Field>
            <Field label="Technology level" htmlFor={id("tech")}>
              <input
                id={id("tech")}
                name="technologyLevel"
                maxLength={300}
                defaultValue={narrative.world.technologyLevel}
                className={FIELD}
              />
            </Field>
          </div>
          <LinesField
            label="Rules of this world"
            hint="One per line. A story that breaks its own rules stops teaching."
            id={id("rules")}
            name="worldRules"
            value={narrative.world.worldRules}
          />
          <LinesField
            label="Constraints"
            hint="Historical or fictional limits you will not violate."
            id={id("constraints")}
            name="constraints"
            value={narrative.world.constraints}
          />
          <ReasonField id={id("reason")} placeholder="Set the world's rules." />
          <div>
            <Button type="submit" emphasis="primary" disabled={pending}>
              {pending ? "Saving…" : "Save world"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function CentralProblemForm({
  narrative,
  seq,
}: {
  narrative: Narrative;
  seq: number;
}) {
  const id = (n: string): string => `problem-${seq}-${n}`;
  const p = narrative.centralProblem;
  return (
    <ActionForm
      action={saveCentralProblemAction}
      idempotencyKey={`narrative-problem-${narrative.id}-${seq}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="narrativeId" value={narrative.id} />
          <Field
            label="The challenge"
            hint="What the unit is actually about, in the story."
            htmlFor={id("challenge")}
          >
            <textarea
              id={id("challenge")}
              name="challenge"
              rows={2}
              defaultValue={p.challenge}
              className={FIELD}
            />
          </Field>
          <Field label="Stakes" htmlFor={id("stakes")}>
            <textarea
              id={id("stakes")}
              name="stakes"
              rows={2}
              defaultValue={p.stakes}
              className={FIELD}
            />
          </Field>
          <Field label="Objective" htmlFor={id("objective")}>
            <textarea
              id={id("objective")}
              name="objective"
              rows={2}
              defaultValue={p.objective}
              className={FIELD}
            />
          </Field>
          <Field
            label="Why the student is in it"
            hint="Their part in the story, not their part in the lesson."
            htmlFor={id("role")}
          >
            <textarea
              id={id("role")}
              name="studentRole"
              rows={2}
              defaultValue={p.studentRole}
              className={FIELD}
            />
          </Field>
          <ReasonField id={id("reason")} placeholder="Set the central problem." />
          <div>
            <Button type="submit" emphasis="primary" disabled={pending}>
              {pending ? "Saving…" : "Save central problem"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

export function CharacterForm({
  narrativeId,
  character,
  seq,
}: {
  narrativeId: string;
  character: NarrativeCharacter | null;
  seq: number;
}) {
  const id = (n: string): string => `char-${seq}-${n}`;
  return (
    <ActionForm
      action={saveCharacterAction}
      idempotencyKey={`narrative-char-${narrativeId}-${character?.id ?? "new"}-${seq}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="narrativeId" value={narrativeId} />
          {character ? (
            <input type="hidden" name="characterId" value={character.id} />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" htmlFor={id("name")}>
              <input
                id={id("name")}
                name="name"
                required
                maxLength={120}
                defaultValue={character?.name ?? ""}
                className={FIELD}
              />
            </Field>
            <Field label="Role in the story" htmlFor={id("role")}>
              <input
                id={id("role")}
                name="role"
                maxLength={200}
                defaultValue={character?.role ?? ""}
                className={FIELD}
              />
            </Field>
          </div>
          <Field label="Personality" htmlFor={id("personality")}>
            <textarea
              id={id("personality")}
              name="personality"
              rows={2}
              defaultValue={character?.personality ?? ""}
              className={FIELD}
            />
          </Field>
          <Field label="What they want" htmlFor={id("motivation")}>
            <textarea
              id={id("motivation")}
              name="motivation"
              rows={2}
              defaultValue={character?.motivation ?? ""}
              className={FIELD}
            />
          </Field>
          <Field label="Relationships" htmlFor={id("relationships")}>
            <textarea
              id={id("relationships")}
              name="relationships"
              rows={2}
              defaultValue={character?.relationships ?? ""}
              className={FIELD}
            />
          </Field>
          <Field
            label="Appearance"
            hint="Enough for an illustrator to draw them the same way twice."
            htmlFor={id("appearance")}
          >
            <textarea
              id={id("appearance")}
              name="appearance"
              rows={2}
              defaultValue={character?.appearance ?? ""}
              className={FIELD}
            />
          </Field>
          <Field
            label="What they know right now"
            hint="A character who has not been told something cannot mention it. This is the field that keeps continuity honest."
            htmlFor={id("knows")}
          >
            <textarea
              id={id("knows")}
              name="knows"
              rows={2}
              defaultValue={character?.knows ?? ""}
              className={FIELD}
            />
          </Field>
          <Field label="Arc" htmlFor={id("arc")}>
            <textarea
              id={id("arc")}
              name="arc"
              rows={2}
              defaultValue={character?.arc ?? ""}
              className={FIELD}
            />
          </Field>
          <ReasonField
            id={id("reason")}
            placeholder={character ? "Updated what they know." : "Added to the canon."}
          />
          <div>
            <Button type="submit" emphasis="primary" disabled={pending}>
              {pending ? "Saving…" : character ? "Save character" : "Add character"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function AddCharacterPanel({
  narrativeId,
  seq,
}: {
  narrativeId: string;
  seq: number;
}) {
  return (
    <Disclosure label="Add a character">
      <CharacterForm narrativeId={narrativeId} character={null} seq={seq} />
    </Disclosure>
  );
}

export function EditCharacterPanel({
  narrativeId,
  character,
  seq,
}: {
  narrativeId: string;
  character: NarrativeCharacter;
  seq: number;
}) {
  return (
    <Disclosure label="Edit" emphasis="quiet">
      <CharacterForm narrativeId={narrativeId} character={character} seq={seq} />
    </Disclosure>
  );
}

/** Removal always asks, because a character other beats mention is not scenery. */
export function RemoveCharacterForm({
  narrativeId,
  character,
  seq,
}: {
  narrativeId: string;
  character: NarrativeCharacter;
  seq: number;
}) {
  return (
    <Disclosure label="Remove" emphasis="quiet">
      <ActionForm
        action={removeCharacterAction}
        idempotencyKey={`narrative-char-rm-${narrativeId}-${character.id}-${seq}`}
        successTone="notice"
      >
        {(pending) => (
          <>
            <input type="hidden" name="narrativeId" value={narrativeId} />
            <input type="hidden" name="characterId" value={character.id} />
            <p className="text-sm text-ink-muted">
              Removing {character.name} does not change any beat that already
              mentions them. Check the chapter map afterwards.
            </p>
            <ReasonField
              id={`char-rm-${seq}-reason`}
              placeholder="Merged into another character."
            />
            <div>
              <Button type="submit" emphasis="caution" disabled={pending}>
                {pending ? "Removing…" : `Remove ${character.name}`}
              </Button>
            </div>
          </>
        )}
      </ActionForm>
    </Disclosure>
  );
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

export function LocationForm({
  narrativeId,
  location,
  seq,
}: {
  narrativeId: string;
  location: NarrativeLocation | null;
  seq: number;
}) {
  const id = (n: string): string => `loc-${seq}-${n}`;
  return (
    <ActionForm
      action={saveLocationAction}
      idempotencyKey={`narrative-loc-${narrativeId}-${location?.id ?? "new"}-${seq}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="narrativeId" value={narrativeId} />
          {location ? (
            <input type="hidden" name="locationId" value={location.id} />
          ) : null}
          <Field label="Name" htmlFor={id("name")}>
            <input
              id={id("name")}
              name="name"
              required
              maxLength={120}
              defaultValue={location?.name ?? ""}
              className={FIELD}
            />
          </Field>
          <Field label="Description" htmlFor={id("description")}>
            <textarea
              id={id("description")}
              name="description"
              rows={2}
              defaultValue={location?.description ?? ""}
              className={FIELD}
            />
          </Field>
          <Field label="Why the story returns here" htmlFor={id("significance")}>
            <textarea
              id={id("significance")}
              name="significance"
              rows={2}
              defaultValue={location?.significance ?? ""}
              className={FIELD}
            />
          </Field>
          <Field
            label="Visual reference"
            hint="Light, materials, scale, mood — what an image of it must get right."
            htmlFor={id("visual")}
          >
            <textarea
              id={id("visual")}
              name="visualReference"
              rows={2}
              defaultValue={location?.visualReference ?? ""}
              className={FIELD}
            />
          </Field>
          <ReasonField id={id("reason")} placeholder="Added a recurring setting." />
          <div>
            <Button type="submit" emphasis="primary" disabled={pending}>
              {pending ? "Saving…" : location ? "Save location" : "Add location"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function AddLocationPanel({ narrativeId, seq }: { narrativeId: string; seq: number }) {
  return (
    <Disclosure label="Add a location">
      <LocationForm narrativeId={narrativeId} location={null} seq={seq} />
    </Disclosure>
  );
}

export function EditLocationPanel({
  narrativeId,
  location,
  seq,
}: {
  narrativeId: string;
  location: NarrativeLocation;
  seq: number;
}) {
  return (
    <Disclosure label="Edit" emphasis="quiet">
      <LocationForm narrativeId={narrativeId} location={location} seq={seq} />
    </Disclosure>
  );
}

export function RemoveLocationForm({
  narrativeId,
  location,
  seq,
}: {
  narrativeId: string;
  location: NarrativeLocation;
  seq: number;
}) {
  return (
    <Disclosure label="Remove" emphasis="quiet">
      <ActionForm
        action={removeLocationAction}
        idempotencyKey={`narrative-loc-rm-${narrativeId}-${location.id}-${seq}`}
        successTone="notice"
      >
        {(pending) => (
          <>
            <input type="hidden" name="narrativeId" value={narrativeId} />
            <input type="hidden" name="locationId" value={location.id} />
            <ReasonField
              id={`loc-rm-${seq}-reason`}
              placeholder="No longer used by the story."
            />
            <div>
              <Button type="submit" emphasis="caution" disabled={pending}>
                {pending ? "Removing…" : `Remove ${location.name}`}
              </Button>
            </div>
          </>
        )}
      </ActionForm>
    </Disclosure>
  );
}

// ---------------------------------------------------------------------------
// Story arc
// ---------------------------------------------------------------------------

const ARC_LABEL: Record<(typeof STORY_ARC_STAGES)[number], string> = {
  opening: "Opening",
  rising_action: "Rising action",
  turning_point: "Turning point",
  complication: "Complication",
  climax: "Climax",
  resolution: "Resolution",
};

export function ArcMomentForm({
  narrativeId,
  moment,
  seq,
}: {
  narrativeId: string;
  moment: StoryArcMoment | null;
  seq: number;
}) {
  const id = (n: string): string => `arc-${seq}-${n}`;
  return (
    <ActionForm
      action={saveArcMomentAction}
      idempotencyKey={`narrative-arc-${narrativeId}-${moment?.id ?? "new"}-${seq}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="narrativeId" value={narrativeId} />
          {moment ? <input type="hidden" name="momentId" value={moment.id} /> : null}
          <Field label="Where in the arc" htmlFor={id("stage")}>
            <select
              id={id("stage")}
              name="stage"
              defaultValue={moment?.stage ?? "opening"}
              className={FIELD}
            >
              {STORY_ARC_STAGES.map((s) => (
                <option key={s} value={s}>
                  {ARC_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="What happens" htmlFor={id("summary")}>
            <textarea
              id={id("summary")}
              name="summary"
              rows={2}
              required
              defaultValue={moment?.summary ?? ""}
              className={FIELD}
            />
          </Field>
          <ReasonField id={id("reason")} placeholder="Mapped the shape of the story." />
          <div>
            <Button type="submit" emphasis="primary" disabled={pending}>
              {pending ? "Saving…" : moment ? "Save moment" : "Add moment"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function AddArcMomentPanel({ narrativeId, seq }: { narrativeId: string; seq: number }) {
  return (
    <Disclosure label="Add a story moment">
      <ArcMomentForm narrativeId={narrativeId} moment={null} seq={seq} />
    </Disclosure>
  );
}

export function RemoveArcMomentForm({
  narrativeId,
  moment,
  seq,
}: {
  narrativeId: string;
  moment: StoryArcMoment;
  seq: number;
}) {
  return (
    <Disclosure label="Remove" emphasis="quiet">
      <ActionForm
        action={removeArcMomentAction}
        idempotencyKey={`narrative-arc-rm-${narrativeId}-${moment.id}-${seq}`}
        successTone="notice"
      >
        {(pending) => (
          <>
            <input type="hidden" name="narrativeId" value={narrativeId} />
            <input type="hidden" name="momentId" value={moment.id} />
            <ReasonField id={`arc-rm-${seq}-reason`} placeholder="Replaced by a later moment." />
            <div>
              <Button type="submit" emphasis="caution" disabled={pending}>
                {pending ? "Removing…" : "Remove this moment"}
              </Button>
            </div>
          </>
        )}
      </ActionForm>
    </Disclosure>
  );
}

// ---------------------------------------------------------------------------
// Chapters and beats
// ---------------------------------------------------------------------------

export function ChapterForm({
  narrativeId,
  chapter,
  units,
  seq,
}: {
  narrativeId: string;
  chapter: NarrativeChapter | null;
  units: { id: string; title: string }[];
  seq: number;
}) {
  const id = (n: string): string => `chapter-${seq}-${n}`;
  return (
    <ActionForm
      action={saveChapterAction}
      idempotencyKey={`narrative-chapter-${narrativeId}-${chapter?.id ?? "new"}-${seq}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="narrativeId" value={narrativeId} />
          {chapter ? <input type="hidden" name="chapterId" value={chapter.id} /> : null}
          <Field label="Title" htmlFor={id("title")}>
            <input
              id={id("title")}
              name="title"
              required
              maxLength={200}
              defaultValue={chapter?.title ?? ""}
              className={FIELD}
            />
          </Field>
          <Field label="Summary" htmlFor={id("summary")}>
            <textarea
              id={id("summary")}
              name="summary"
              rows={2}
              defaultValue={chapter?.summary ?? ""}
              className={FIELD}
            />
          </Field>
          <Field
            label="Unit it runs alongside"
            hint="Optional. A narrative reused in another course leaves this unset."
            htmlFor={id("unitId")}
          >
            <select
              id={id("unitId")}
              name="unitId"
              defaultValue={chapter?.unitId ?? ""}
              className={FIELD}
            >
              <option value="">Not tied to a unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title}
                </option>
              ))}
            </select>
          </Field>
          <ReasonField id={id("reason")} placeholder="Added a chapter to the map." />
          <div>
            <Button type="submit" emphasis="primary" disabled={pending}>
              {pending ? "Saving…" : chapter ? "Save chapter" : "Add chapter"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function AddChapterPanel({
  narrativeId,
  units,
  seq,
}: {
  narrativeId: string;
  units: { id: string; title: string }[];
  seq: number;
}) {
  return (
    <Disclosure label="Add a chapter">
      <ChapterForm narrativeId={narrativeId} chapter={null} units={units} seq={seq} />
    </Disclosure>
  );
}

export function EditChapterPanel({
  narrativeId,
  chapter,
  units,
  seq,
}: {
  narrativeId: string;
  chapter: NarrativeChapter;
  units: { id: string; title: string }[];
  seq: number;
}) {
  return (
    <Disclosure label="Edit chapter" emphasis="quiet">
      <ChapterForm narrativeId={narrativeId} chapter={chapter} units={units} seq={seq} />
    </Disclosure>
  );
}

/** One place earlier or later. The key carries where it sat, so a double click moves it once. */
export function MoveChapterForm({
  narrativeId,
  chapter,
  index,
  direction,
  disabled,
  seq,
}: {
  narrativeId: string;
  chapter: NarrativeChapter;
  index: number;
  direction: "up" | "down";
  disabled: boolean;
  seq: number;
}) {
  return (
    <ActionForm
      action={moveChapterAction}
      idempotencyKey={`narrative-chapter-move-${narrativeId}-${chapter.id}-${index}-${direction}-${seq}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="narrativeId" value={narrativeId} />
          <input type="hidden" name="chapterId" value={chapter.id} />
          <input type="hidden" name="fromIndex" value={index} />
          <input type="hidden" name="direction" value={direction} />
          <input type="hidden" name="reason" value="Re-ordered the chapter map." />
          <Button type="submit" emphasis="quiet" disabled={disabled || pending}>
            {direction === "up" ? "↑ Earlier" : "↓ Later"}
          </Button>
        </>
      )}
    </ActionForm>
  );
}

export function RemoveChapterForm({
  narrativeId,
  chapter,
  seq,
}: {
  narrativeId: string;
  chapter: NarrativeChapter;
  seq: number;
}) {
  return (
    <Disclosure label="Remove chapter" emphasis="quiet">
      <ActionForm
        action={removeChapterAction}
        idempotencyKey={`narrative-chapter-rm-${narrativeId}-${chapter.id}-${seq}`}
        successTone="notice"
      >
        {(pending) => (
          <>
            <input type="hidden" name="narrativeId" value={narrativeId} />
            <input type="hidden" name="chapterId" value={chapter.id} />
            <p className="text-sm text-ink-muted">
              This removes its {chapter.beats.length}{" "}
              {chapter.beats.length === 1 ? "beat" : "beats"} as well. Any thread
              that opened or resolved here becomes open again.
            </p>
            <ReasonField
              id={`chapter-rm-${seq}-reason`}
              placeholder="Merged into the previous chapter."
            />
            <div>
              <Button type="submit" emphasis="caution" disabled={pending}>
                {pending ? "Removing…" : `Remove "${chapter.title}"`}
              </Button>
            </div>
          </>
        )}
      </ActionForm>
    </Disclosure>
  );
}

export function BeatForm({
  narrativeId,
  chapterId,
  beat,
  lessons,
  seq,
}: {
  narrativeId: string;
  chapterId: string;
  beat: { id: string; lessonCode: string | null; academicObjective: string; narrativeEvent: string; learningUnlock: string } | null;
  lessons: { code: string; title: string }[];
  seq: number;
}) {
  const id = (n: string): string => `beat-${seq}-${n}`;
  return (
    <ActionForm
      action={saveBeatAction}
      idempotencyKey={`narrative-beat-${narrativeId}-${beat?.id ?? "new"}-${seq}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="narrativeId" value={narrativeId} />
          <input type="hidden" name="chapterId" value={chapterId} />
          {beat ? <input type="hidden" name="beatId" value={beat.id} /> : null}
          <Field
            label="Lesson"
            hint="Which lesson this beat runs in. One lesson sits at one point in the story."
            htmlFor={id("lessonCode")}
          >
            <select
              id={id("lessonCode")}
              name="lessonCode"
              defaultValue={beat?.lessonCode ?? ""}
              className={FIELD}
            >
              <option value="">Not placed yet</option>
              {lessons.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.code} — {l.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Academic objective" htmlFor={id("objective")}>
            <textarea
              id={id("objective")}
              name="academicObjective"
              rows={2}
              defaultValue={beat?.academicObjective ?? ""}
              className={FIELD}
            />
          </Field>
          <Field label="What happens in the story" htmlFor={id("event")}>
            <textarea
              id={id("event")}
              name="narrativeEvent"
              rows={3}
              required
              defaultValue={beat?.narrativeEvent ?? ""}
              className={FIELD}
            />
          </Field>
          <Field
            label="What the learning lets the student do"
            hint="The sentence that joins the two. A beat without it is decoration."
            htmlFor={id("unlock")}
          >
            <textarea
              id={id("unlock")}
              name="learningUnlock"
              rows={2}
              defaultValue={beat?.learningUnlock ?? ""}
              className={FIELD}
            />
          </Field>
          <ReasonField id={id("reason")} placeholder="Joined the lesson to the story." />
          <div>
            <Button type="submit" emphasis="primary" disabled={pending}>
              {pending ? "Saving…" : beat ? "Save beat" : "Add beat"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function AddBeatPanel({
  narrativeId,
  chapterId,
  lessons,
  seq,
}: {
  narrativeId: string;
  chapterId: string;
  lessons: { code: string; title: string }[];
  seq: number;
}) {
  return (
    <Disclosure label="Add a beat" emphasis="quiet">
      <BeatForm
        narrativeId={narrativeId}
        chapterId={chapterId}
        beat={null}
        lessons={lessons}
        seq={seq}
      />
    </Disclosure>
  );
}

export function EditBeatPanel({
  narrativeId,
  chapterId,
  beat,
  lessons,
  seq,
}: {
  narrativeId: string;
  chapterId: string;
  beat: { id: string; lessonCode: string | null; academicObjective: string; narrativeEvent: string; learningUnlock: string };
  lessons: { code: string; title: string }[];
  seq: number;
}) {
  return (
    <Disclosure label="Edit" emphasis="quiet">
      <BeatForm
        narrativeId={narrativeId}
        chapterId={chapterId}
        beat={beat}
        lessons={lessons}
        seq={seq}
      />
    </Disclosure>
  );
}

export function RemoveBeatForm({
  narrativeId,
  chapterId,
  beatId,
  seq,
}: {
  narrativeId: string;
  chapterId: string;
  beatId: string;
  seq: number;
}) {
  return (
    <Disclosure label="Remove" emphasis="quiet">
      <ActionForm
        action={removeBeatAction}
        idempotencyKey={`narrative-beat-rm-${narrativeId}-${beatId}-${seq}`}
        successTone="notice"
      >
        {(pending) => (
          <>
            <input type="hidden" name="narrativeId" value={narrativeId} />
            <input type="hidden" name="chapterId" value={chapterId} />
            <input type="hidden" name="beatId" value={beatId} />
            <ReasonField id={`beat-rm-${seq}-reason`} placeholder="Folded into the next beat." />
            <div>
              <Button type="submit" emphasis="caution" disabled={pending}>
                {pending ? "Removing…" : "Remove this beat"}
              </Button>
            </div>
          </>
        )}
      </ActionForm>
    </Disclosure>
  );
}

// ---------------------------------------------------------------------------
// Narrative state and plot threads
// ---------------------------------------------------------------------------

export function NarrativeStateForm({
  narrative,
  seq,
}: {
  narrative: Narrative;
  seq: number;
}) {
  const id = (n: string): string => `state-${seq}-${n}`;
  const s = narrative.state;
  return (
    <ActionForm
      action={saveNarrativeStateAction}
      idempotencyKey={`narrative-state-${narrative.id}-${seq}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="narrativeId" value={narrative.id} />
          <LinesField
            label="What has happened"
            hint="One per line, in order."
            id={id("happened")}
            name="happened"
            value={s.happened}
          />
          <LinesField
            label="What students know"
            id={id("know")}
            name="studentsKnow"
            value={s.studentsKnow}
          />
          <LinesField
            label="Clues revealed"
            id={id("clues")}
            name="cluesRevealed"
            value={s.cluesRevealed}
          />
          <Field label="Current objective" htmlFor={id("objective")}>
            <input
              id={id("objective")}
              name="currentObjective"
              maxLength={1000}
              defaultValue={s.currentObjective}
              className={FIELD}
            />
          </Field>
          <LinesField
            label="Planned for later"
            hint="Reveals that must NOT appear yet. The assistant is told to hold these back."
            id={id("future")}
            name="futureReveals"
            value={s.futureReveals}
          />
          <ReasonField id={id("reason")} placeholder="Moved the story on after chapter two." />
          <div>
            <Button type="submit" emphasis="primary" disabled={pending}>
              {pending ? "Saving…" : "Save narrative state"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

const THREAD_LABEL: Record<(typeof PLOT_THREAD_KINDS)[number], string> = {
  question: "Open question",
  clue: "Clue",
  objective: "Objective",
  conflict: "Conflict",
  reveal: "Planned reveal",
};

export function PlotThreadForm({
  narrativeId,
  thread,
  chapters,
  seq,
}: {
  narrativeId: string;
  thread: PlotThread | null;
  chapters: { id: string; title: string }[];
  seq: number;
}) {
  const id = (n: string): string => `thread-${seq}-${n}`;
  return (
    <ActionForm
      action={savePlotThreadAction}
      idempotencyKey={`narrative-thread-${narrativeId}-${thread?.id ?? "new"}-${seq}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="narrativeId" value={narrativeId} />
          {thread ? <input type="hidden" name="threadId" value={thread.id} /> : null}
          <Field label="Kind" htmlFor={id("kind")}>
            <select
              id={id("kind")}
              name="kind"
              defaultValue={thread?.kind ?? "question"}
              className={FIELD}
            >
              {PLOT_THREAD_KINDS.map((k) => (
                <option key={k} value={k}>
                  {THREAD_LABEL[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="What it is" htmlFor={id("summary")}>
            <textarea
              id={id("summary")}
              name="summary"
              rows={2}
              required
              defaultValue={thread?.summary ?? ""}
              className={FIELD}
            />
          </Field>
          <Field label="Opened in" htmlFor={id("opened")}>
            <select
              id={id("opened")}
              name="openedInChapterId"
              defaultValue={thread?.openedInChapterId ?? ""}
              className={FIELD}
            >
              <option value="">Not tied to a chapter</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Note" htmlFor={id("note")}>
            <input
              id={id("note")}
              name="note"
              maxLength={1000}
              defaultValue={thread?.note ?? ""}
              className={FIELD}
            />
          </Field>
          <ReasonField id={id("reason")} placeholder="Tracking an unresolved question." />
          <div>
            <Button type="submit" emphasis="primary" disabled={pending}>
              {pending ? "Saving…" : thread ? "Save thread" : "Add thread"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function AddPlotThreadPanel({
  narrativeId,
  chapters,
  seq,
}: {
  narrativeId: string;
  chapters: { id: string; title: string }[];
  seq: number;
}) {
  return (
    <Disclosure label="Track a thread">
      <PlotThreadForm narrativeId={narrativeId} thread={null} chapters={chapters} seq={seq} />
    </Disclosure>
  );
}

export function ResolveThreadForm({
  narrativeId,
  thread,
  chapters,
  seq,
}: {
  narrativeId: string;
  thread: PlotThread;
  chapters: { id: string; title: string }[];
  seq: number;
}) {
  const id = (n: string): string => `resolve-${seq}-${n}`;
  if (thread.resolved) {
    return (
      <ActionForm
        action={resolvePlotThreadAction}
        idempotencyKey={`narrative-thread-reopen-${narrativeId}-${thread.id}-${seq}`}
        successTone="notice"
      >
        {(pending) => (
          <>
            <input type="hidden" name="narrativeId" value={narrativeId} />
            <input type="hidden" name="threadId" value={thread.id} />
            <input type="hidden" name="resolved" value="false" />
            <input type="hidden" name="reason" value="Reopened the thread." />
            <Button type="submit" emphasis="quiet" disabled={pending}>
              Reopen
            </Button>
          </>
        )}
      </ActionForm>
    );
  }

  return (
    <Disclosure label="Close it" emphasis="quiet">
      <ActionForm
        action={resolvePlotThreadAction}
        idempotencyKey={`narrative-thread-resolve-${narrativeId}-${thread.id}-${seq}`}
      >
        {(pending) => (
          <>
            <input type="hidden" name="narrativeId" value={narrativeId} />
            <input type="hidden" name="threadId" value={thread.id} />
            <input type="hidden" name="resolved" value="true" />
            <Field
              label="Resolved in which chapter"
              hint="A thread resolved nowhere is still open."
              htmlFor={id("chapter")}
            >
              <select
                id={id("chapter")}
                name="resolvedInChapterId"
                required
                className={FIELD}
                defaultValue=""
              >
                <option value="" disabled>
                  Choose a chapter
                </option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </Field>
            <ReasonField id={id("reason")} placeholder="Answered in the climax." />
            <div>
              <Button type="submit" emphasis="primary" disabled={pending}>
                {pending ? "Closing…" : "Close this thread"}
              </Button>
            </div>
          </>
        )}
      </ActionForm>
    </Disclosure>
  );
}

export function RemoveThreadForm({
  narrativeId,
  threadId,
  seq,
}: {
  narrativeId: string;
  threadId: string;
  seq: number;
}) {
  return (
    <Disclosure label="Remove" emphasis="quiet">
      <ActionForm
        action={removePlotThreadAction}
        idempotencyKey={`narrative-thread-rm-${narrativeId}-${threadId}-${seq}`}
        successTone="notice"
      >
        {(pending) => (
          <>
            <input type="hidden" name="narrativeId" value={narrativeId} />
            <input type="hidden" name="threadId" value={threadId} />
            <ReasonField id={`thread-rm-${seq}-reason`} placeholder="Never went anywhere." />
            <div>
              <Button type="submit" emphasis="caution" disabled={pending}>
                {pending ? "Removing…" : "Remove this thread"}
              </Button>
            </div>
          </>
        )}
      </ActionForm>
    </Disclosure>
  );
}

// ---------------------------------------------------------------------------
// Visual bible and boundaries
// ---------------------------------------------------------------------------

export function VisualBibleForm({ narrative, seq }: { narrative: Narrative; seq: number }) {
  const id = (n: string): string => `visual-${seq}-${n}`;
  const v = narrative.visualBible;
  return (
    <ActionForm
      action={saveVisualBibleAction}
      idempotencyKey={`narrative-visual-${narrative.id}-${seq}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="narrativeId" value={narrative.id} />
          <Field
            label="Art direction"
            hint="The rule every generated image follows. Without it, every image looks like a different unit."
            htmlFor={id("art")}
          >
            <textarea
              id={id("art")}
              name="artDirection"
              rows={3}
              defaultValue={v.artDirection}
              className={FIELD}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Visual tone" htmlFor={id("tone")}>
              <input
                id={id("tone")}
                name="visualTone"
                maxLength={1000}
                defaultValue={v.visualTone}
                className={FIELD}
              />
            </Field>
            <Field label="Palette" htmlFor={id("palette")}>
              <input
                id={id("palette")}
                name="palette"
                maxLength={1000}
                defaultValue={v.palette}
                className={FIELD}
              />
            </Field>
            <Field label="Interface treatment" htmlFor={id("interface")}>
              <input
                id={id("interface")}
                name="interfaceTreatment"
                maxLength={1000}
                defaultValue={v.interfaceTreatment}
                className={FIELD}
              />
            </Field>
            <Field label="Default aspect ratio" htmlFor={id("ratio")}>
              <select
                id={id("ratio")}
                name="defaultAspectRatio"
                defaultValue={v.defaultAspectRatio}
                className={FIELD}
              >
                {ASSET_ASPECT_RATIOS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <LinesField
            label="Recurring props"
            id={id("props")}
            name="recurringProps"
            value={v.recurringProps}
            rows={3}
          />
          <LinesField label="Motifs" id={id("motifs")} name="motifs" value={v.motifs} rows={3} />
          <LinesField
            label="Symbols and logos"
            id={id("symbols")}
            name="symbols"
            value={v.symbols}
            rows={2}
          />
          <Field
            label="Rules for text inside images"
            hint="Text in a picture is text a screen reader cannot read."
            htmlFor={id("text")}
          >
            <textarea
              id={id("text")}
              name="textInImages"
              rows={2}
              defaultValue={v.textInImages}
              className={FIELD}
            />
          </Field>
          <LinesField
            label="Accessibility rules"
            id={id("a11y")}
            name="accessibilityRules"
            value={v.accessibilityRules}
            rows={3}
          />
          <Field label="Age-appropriateness" htmlFor={id("age")}>
            <textarea
              id={id("age")}
              name="ageAppropriateness"
              rows={2}
              defaultValue={v.ageAppropriateness}
              className={FIELD}
            />
          </Field>
          <ReasonField id={id("reason")} placeholder="Set the unit's visual rules." />
          <div>
            <Button type="submit" emphasis="primary" disabled={pending}>
              {pending ? "Saving…" : "Save visual bible"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function BoundariesForm({ narrative, seq }: { narrative: Narrative; seq: number }) {
  const id = (n: string): string => `bounds-${seq}-${n}`;
  const b = narrative.boundaries;
  return (
    <ActionForm
      action={saveContentBoundariesAction}
      idempotencyKey={`narrative-bounds-${narrative.id}-${seq}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="narrativeId" value={narrative.id} />
          <LinesField
            label="Must stay consistent"
            hint="Sent with every assisted request, so a proposal that breaks one is surfaced as a conflict."
            id={id("consistent")}
            name="mustStayConsistent"
            value={b.mustStayConsistent}
          />
          <LinesField
            label="Avoid entirely"
            id={id("avoid")}
            name="avoid"
            value={b.avoid}
          />
          <LinesField
            label="Required framing"
            id={id("framing")}
            name="requiredFraming"
            value={b.requiredFraming}
          />
          <ReasonField id={id("reason")} placeholder="Set what must not drift." />
          <div>
            <Button type="submit" emphasis="primary" disabled={pending}>
              {pending ? "Saving…" : "Save boundaries"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

// ---------------------------------------------------------------------------
// Duplication, sharing, versions, lifecycle
// ---------------------------------------------------------------------------

const DUPLICATION_PARTS: { name: string; label: string; hint: string }[] = [
  { name: "characters", label: "Characters", hint: "Names, motivations, and what each one knows." },
  { name: "locations", label: "Locations", hint: "Recurring settings and their visual references." },
  { name: "visualBible", label: "Visual bible", hint: "Art direction, palette, motifs, image rules." },
  { name: "storyArc", label: "Story arc", hint: "Opening through resolution." },
  { name: "chapters", label: "Chapter structure", hint: "The chapters, without their unit placements." },
  { name: "lessonBeats", label: "Lesson beats", hint: "The beats inside each chapter. Needs chapters." },
  { name: "plotThreads", label: "Plot threads", hint: "Open questions, clues, and planned reveals." },
  { name: "narrativeState", label: "Narrative state", hint: "How far a class has been taken. Usually left behind." },
];

/**
 * Duplicate-and-edit (vision §17).
 *
 * A database operation. Nothing generative is involved: the point of a
 * duplicate is an exact copy, and a model asked to duplicate a story would
 * paraphrase it.
 */
export function DuplicateForm({
  narrative,
  seq,
}: {
  narrative: Narrative;
  seq: number;
}) {
  return (
    <Disclosure label="Duplicate">
      <ActionForm
        action={duplicateNarrativeAction}
        idempotencyKey={`narrative-dup-${narrative.id}-${seq}`}
      >
        {(pending) => (
          <>
            <input type="hidden" name="sourceNarrativeId" value={narrative.id} />
            <Field
              label="Title for your copy"
              hint="A separate narrative from this moment on. Editing it never changes the original."
              htmlFor={`dup-${seq}-title`}
            >
              <input
                id={`dup-${seq}-title`}
                name="title"
                required
                maxLength={200}
                defaultValue={`${narrative.title} (adapted)`}
                className={FIELD}
              />
            </Field>
            <fieldset className="rounded-lg border border-line p-3">
              <legend className="px-1 text-sm font-medium text-ink">What to copy</legend>
              <div className="mt-1 flex flex-col gap-2">
                {DUPLICATION_PARTS.map((part) => (
                  <label key={part.name} className="flex items-start gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      name={part.name}
                      defaultChecked={part.name !== "narrativeState"}
                      className={`mt-0.5 h-4 w-4 rounded border-line-strong ${FOCUS_RING}`}
                    />
                    <span>
                      {part.label}
                      <span className="block text-xs text-ink-muted">{part.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                The bible itself — identity, world, central problem — always comes
                with the copy. Lesson placements never do: a beat&rsquo;s lesson
                belongs to the course this was written for, and your copy places
                its own.
              </p>
            </fieldset>
            <ReasonField
              id={`dup-${seq}-reason`}
              placeholder="Adapting this structure for my own course."
            />
            <div>
              <Button type="submit" emphasis="primary" disabled={pending}>
                {pending ? "Copying…" : "Create my copy"}
              </Button>
            </div>
          </>
        )}
      </ActionForm>
    </Disclosure>
  );
}

export function ShareForm({
  narrative,
  colleagues,
  seq,
}: {
  narrative: Narrative;
  colleagues: { id: string; name: string }[];
  seq: number;
}) {
  return (
    <Disclosure label="Change who can edit">
      <ActionForm
        action={shareNarrativeAction}
        idempotencyKey={`narrative-share-${narrative.id}-${seq}`}
      >
        {(pending) => (
          <>
            <input type="hidden" name="narrativeId" value={narrative.id} />
            {colleagues.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Nobody else in your organization holds curriculum authoring, so
                there is nobody to share with yet.
              </p>
            ) : (
              <fieldset className="rounded-lg border border-line p-3">
                <legend className="px-1 text-sm font-medium text-ink">
                  Colleagues who may edit
                </legend>
                <div className="mt-1 flex flex-col gap-2">
                  {colleagues.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        name="userIds"
                        value={c.id}
                        defaultChecked={narrative.sharedWithUserIds.includes(c.id)}
                        className={`h-4 w-4 rounded border-line-strong ${FOCUS_RING}`}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  Sharing grants edit access, not ownership. Only you can change
                  this list.
                </p>
              </fieldset>
            )}
            <ReasonField
              id={`share-${seq}-reason`}
              placeholder="Building this with the sixth-grade team."
            />
            <div>
              <Button type="submit" emphasis="primary" disabled={pending}>
                {pending ? "Saving…" : "Save sharing"}
              </Button>
            </div>
          </>
        )}
      </ActionForm>
    </Disclosure>
  );
}

export function CheckpointForm({
  narrative,
  aiAssisted,
  seq,
}: {
  narrative: Narrative;
  /** True when a proposal was accepted into this narrative since the last one. */
  aiAssisted: boolean;
  seq: number;
}) {
  return (
    <Disclosure label="Save a version">
      <ActionForm
        action={checkpointNarrativeAction}
        idempotencyKey={`narrative-checkpoint-${narrative.id}-${seq}`}
      >
        {(pending) => (
          <>
            <input type="hidden" name="narrativeId" value={narrative.id} />
            <input type="hidden" name="aiAssisted" value={aiAssisted ? "true" : "false"} />
            <Field
              label="Label"
              hint="A deliberate checkpoint, not an autosave. Name it so you can find it again."
              htmlFor={`cp-${seq}-label`}
            >
              <input
                id={`cp-${seq}-label`}
                name="label"
                required
                maxLength={80}
                placeholder="Before the rewrite of chapter three"
                className={FIELD}
              />
            </Field>
            <Field label="Note" htmlFor={`cp-${seq}-note`}>
              <textarea
                id={`cp-${seq}-note`}
                name="note"
                rows={2}
                maxLength={1000}
                className={FIELD}
              />
            </Field>
            {aiAssisted ? (
              <p className="text-sm text-ink-muted">
                This version will be marked as AI-assisted, because a proposal was
                accepted into this narrative.
              </p>
            ) : null}
            <ReasonField id={`cp-${seq}-reason`} placeholder="Keeping a point to come back to." />
            <div>
              <Button type="submit" emphasis="primary" disabled={pending}>
                {pending ? "Saving…" : "Save this version"}
              </Button>
            </div>
          </>
        )}
      </ActionForm>
    </Disclosure>
  );
}

export function AdvanceForm({
  narrative,
  to,
  label,
  note,
  seq,
}: {
  narrative: Narrative;
  to: NarrativeStatus;
  label: string;
  note: string;
  seq: number;
}) {
  return (
    <Disclosure label={label} emphasis="secondary">
      <ActionForm
        action={advanceNarrativeAction}
        idempotencyKey={`narrative-advance-${narrative.id}-${to}-${seq}`}
      >
        {(pending) => (
          <>
            <input type="hidden" name="narrativeId" value={narrative.id} />
            <input type="hidden" name="to" value={to} />
            <p className="text-sm text-ink-muted">{note}</p>
            <ReasonField id={`adv-${seq}-${to}-reason`} placeholder="Ready for a second reader." />
            <div>
              <Button type="submit" emphasis="primary" disabled={pending}>
                {pending ? "Recording…" : label}
              </Button>
            </div>
          </>
        )}
      </ActionForm>
    </Disclosure>
  );
}

export function OfficialTemplateForm({
  narrative,
  seq,
}: {
  narrative: Narrative;
  seq: number;
}) {
  return (
    <Disclosure
      label={narrative.official ? "Remove official status" : "Mark as an official template"}
      emphasis="quiet"
    >
      <ActionForm
        action={setOfficialTemplateAction}
        idempotencyKey={`narrative-official-${narrative.id}-${narrative.official}-${seq}`}
      >
        {(pending) => (
          <>
            <input type="hidden" name="narrativeId" value={narrative.id} />
            <input type="hidden" name="official" value={narrative.official ? "false" : "true"} />
            <p className="text-sm text-ink-muted">
              An official template is what your organization stands behind as a
              starting point. It appears as one in the Narrative Bank.
            </p>
            <ReasonField
              id={`official-${seq}-reason`}
              placeholder="Approved as a starting point for the sixth-grade team."
            />
            <div>
              <Button type="submit" emphasis="primary" disabled={pending}>
                {pending
                  ? "Recording…"
                  : narrative.official
                    ? "Remove official status"
                    : "Mark as official"}
              </Button>
            </div>
          </>
        )}
      </ActionForm>
    </Disclosure>
  );
}
