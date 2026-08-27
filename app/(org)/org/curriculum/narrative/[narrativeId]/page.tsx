import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { assistantUnavailableReason } from "@/lib/ai/config";
import { capabilityCatalog } from "@/lib/ai/gateway";
import { generationsForTarget } from "@/lib/ai/generations";
import { canAdministerCurriculum, canAuthorCurriculum } from "@/lib/auth/scope";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/clock";
import { COURSES, getCourseById } from "@/lib/curriculum/catalog";
import { db } from "@/lib/db/store";
import {
  Banner,
  ButtonLink,
  Card,
  CardHeader,
  Empty,
  FactList,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { assetsForNarrative } from "@/lib/narrative/assets";
import {
  allBeats,
  arcByStage,
  canEditNarrative,
  narrativeById,
  narrativeReadiness,
  openThreads,
  STORY_ARC_STAGE_LABEL,
  submissionBlockers,
  versionsOfNarrative,
} from "@/lib/narrative/bible";
import {
  isNarrativeEditable,
  NARRATIVE_STATUS_PRESENTATION,
  nextNarrativeStatuses,
} from "@/lib/narrative/status";

import { AssistancePanel, type CapabilityOption } from "../../assistance";
import {
  AddArcMomentPanel,
  AddBeatPanel,
  AddChapterPanel,
  AddCharacterPanel,
  AddLocationPanel,
  AddPlotThreadPanel,
  AdvanceForm,
  BoundariesForm,
  CentralProblemForm,
  CheckpointForm,
  DuplicateForm,
  EditBeatPanel,
  EditChapterPanel,
  EditCharacterPanel,
  EditLocationPanel,
  IdentityForm,
  MoveChapterForm,
  NarrativeStateForm,
  OfficialTemplateForm,
  RemoveArcMomentForm,
  RemoveBeatForm,
  RemoveChapterForm,
  RemoveCharacterForm,
  RemoveLocationForm,
  RemoveThreadForm,
  ResolveThreadForm,
  ShareForm,
  VisualBibleForm,
  WorldForm,
} from "../narrative-forms";

export const metadata: Metadata = {
  title: "Narrative Studio · Beyond.Ed",
  description: "Build the story world a unit is taught inside.",
};

/**
 * The Narrative Studio (vision §4).
 *
 * One narrative, one part at a time. The part is in the URL — `?part=` — for the
 * reasons ADR 0015 gives for the lesson canvas: it makes the studio keyboard
 * reachable without a focus-management layer, and a reload, a back button, or a
 * link sent to a colleague all land on the same place. An unknown part falls
 * back to the bible rather than 404-ing.
 */

const PARTS = [
  { value: "bible", label: "Bible", hint: "Identity, world, and the central problem." },
  { value: "characters", label: "Characters", hint: "Who is in this, and what each of them knows." },
  { value: "locations", label: "Locations", hint: "Settings the story returns to." },
  { value: "arc", label: "Story arc", hint: "Opening through resolution." },
  { value: "chapters", label: "Chapter map", hint: "Where each lesson sits in the story." },
  { value: "state", label: "State", hint: "What has happened and what students know." },
  { value: "threads", label: "Plot threads", hint: "What is still open." },
  { value: "visual", label: "Visual bible", hint: "The rules every generated image follows." },
  { value: "preview", label: "Read it through", hint: "The whole story, in order." },
  { value: "governance", label: "Review and versions", hint: "Sharing, checkpoints, and status." },
] as const;

type PartValue = (typeof PARTS)[number]["value"];

function isPart(value: string | undefined): value is PartValue {
  return PARTS.some((p) => p.value === value);
}

export default async function NarrativeStudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ narrativeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireUser();
  const { narrativeId } = await params;
  const query = await searchParams;

  const narrative = narrativeById(narrativeId);
  if (!narrative || narrative.orgId !== actor.orgId) notFound();

  // A draft belonging to someone else is working state, not library material.
  const readable =
    narrative.status !== "draft" ||
    narrative.ownerUserId === actor.id ||
    narrative.sharedWithUserIds.includes(actor.id);
  if (!readable) notFound();

  const rawPart = typeof query.part === "string" ? query.part : undefined;
  const part: PartValue = isPart(rawPart) ? rawPart : "bible";

  const canAuthor = canAuthorCurriculum(actor);
  const editable = canAuthor && canEditNarrative(actor, narrative) && isNarrativeEditable(narrative.status);
  const presentation = NARRATIVE_STATUS_PRESENTATION[narrative.status];

  const course = narrative.courseId ? getCourseById(narrative.courseId) : undefined;
  const units = (course?.units ?? []).map((u) => ({ id: u.id, title: `Unit ${u.order}: ${u.title}` }));
  const lessons = (course?.units ?? []).flatMap((u) =>
    u.lessons.map((l) => ({ code: l.code, title: l.title })),
  );

  const beats = allBeats(narrative);
  const readiness = narrativeReadiness(narrative);
  const blockers = submissionBlockers(narrative);
  const generations = generationsForTarget("narrative", narrative.id);
  const aiAccepted = generations.some(
    (g) => g.status === "accepted" || g.status === "accepted_edited",
  );

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb">
        <ButtonLink href="/org/curriculum/narrative" emphasis="quiet">
          &larr; Narrative Bank
        </ButtonLink>
      </nav>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">{narrative.title}</h1>
          <p className="mt-2 max-w-3xl text-base text-ink-muted">
            {narrative.premise || "No premise written yet."}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusChip label={presentation.label} tone={presentation.tone} />
          {narrative.official ? (
            <StatusChip label="Official template" tone="positive" />
          ) : null}
          {editable ? null : (
            <span className="text-xs text-ink-muted">
              {canAuthor
                ? isNarrativeEditable(narrative.status)
                  ? "Not shared with you for editing"
                  : "Frozen — return it to draft to edit"
                : "Read-only for your role"}
            </span>
          )}
        </div>
      </header>

      {narrative.basedOnNarrativeId ? (
        <div className="mt-4">
          <BasedOnNote narrativeId={narrative.basedOnNarrativeId} />
        </div>
      ) : null}

      <nav aria-label="Narrative parts" className="mt-6 border-b border-line">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {PARTS.map((p) => {
            const active = p.value === part;
            return (
              <li key={p.value}>
                <Link
                  href={`/org/curriculum/narrative/${narrative.id}?part=${p.value}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-block whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-ink-muted hover:border-primary-line hover:text-primary"
                  } ${FOCUS_RING}`}
                >
                  {p.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="mt-3 text-sm text-ink-muted">
        {PARTS.find((p) => p.value === part)?.hint}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          {part === "bible" ? (
            <BiblePart narrative={narrative} editable={editable} />
          ) : null}
          {part === "characters" ? (
            <CharactersPart narrative={narrative} editable={editable} />
          ) : null}
          {part === "locations" ? (
            <LocationsPart narrative={narrative} editable={editable} />
          ) : null}
          {part === "arc" ? <ArcPart narrative={narrative} editable={editable} /> : null}
          {part === "chapters" ? (
            <ChaptersPart
              narrative={narrative}
              editable={editable}
              units={units}
              lessons={lessons}
            />
          ) : null}
          {part === "state" ? <StatePart narrative={narrative} editable={editable} /> : null}
          {part === "threads" ? (
            <ThreadsPart narrative={narrative} editable={editable} />
          ) : null}
          {part === "visual" ? (
            <VisualPart narrative={narrative} editable={editable} />
          ) : null}
          {part === "preview" ? <PreviewPart narrative={narrative} /> : null}
          {part === "governance" ? (
            <GovernancePart
              narrative={narrative}
              actorId={actor.id}
              canAdminister={canAdministerCurriculum(actor)}
              canAuthor={canAuthor}
              blockers={blockers}
              aiAccepted={aiAccepted}
            />
          ) : null}
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Where this stands"
              hint="Results, not rules. An unfinished narrative is a normal state."
            />
            <ul className="divide-y divide-line">
              {readiness.map((check) => (
                <li key={check.label} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{check.label}</p>
                    <StatusChip
                      label={check.done ? "Done" : "Not yet"}
                      tone={check.done ? "positive" : "neutral"}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">{check.detail}</p>
                </li>
              ))}
            </ul>
          </Card>

          {editable ? (
            <AssistancePanel
              heading="Design assistance"
              hint="Bounded requests about this narrative. Nothing is written until you accept it."
              capabilities={narrativeCapabilities(actor.orgId)}
              target={{
                narrativeId: narrative.id,
                chapterId: narrative.chapters[0]?.id ?? null,
              }}
              unavailableReason={assistantUnavailableReason()}
              seq={1}
            />
          ) : null}

          <Card>
            <CardHeader title="At a glance" />
            <div className="p-5">
              <FactList
                columns={1}
                items={[
                  { label: "Chapters", value: `${narrative.chapters.length}` },
                  { label: "Lesson beats", value: `${beats.length}` },
                  { label: "Characters", value: `${narrative.characters.length}` },
                  { label: "Locations", value: `${narrative.world.locations.length}` },
                  { label: "Open threads", value: `${openThreads(narrative).length}` },
                  {
                    label: "Assets",
                    value: `${assetsForNarrative(narrative.id, "accepted").length} accepted`,
                  },
                  {
                    label: "Copies made from this",
                    value: narrative.reuseCount === 0 ? "None yet" : `${narrative.reuseCount}`,
                  },
                  { label: "Last changed", value: formatDateTime(narrative.updatedAt) },
                ]}
              />
            </div>
          </Card>

          {generations.length > 0 ? (
            <Card>
              <CardHeader
                title="Assistance history"
                hint="Every bounded request made about this narrative, and what became of it."
              />
              <ul className="divide-y divide-line">
                {generations.slice(0, 8).map((g) => (
                  <li key={g.id} className="px-5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-ink">
                        {g.capability.replace(/_/g, " ")}
                      </p>
                      <StatusChip
                        label={g.status.replace(/_/g, " ")}
                        tone={
                          g.status === "accepted" || g.status === "accepted_edited"
                            ? "positive"
                            : g.status === "failed"
                              ? "attention"
                              : "neutral"
                        }
                      />
                    </div>
                    {g.instructions ? (
                      <p className="mt-0.5 text-xs text-ink-muted">
                        Asked for: {g.instructions}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {formatDateTime(g.requestedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

/** The capabilities that make sense with a narrative selected. */
function narrativeCapabilities(orgId: string): CapabilityOption[] {
  const advisory = new Set(["summarize_narrative_state", "create_character_variations"]);
  return capabilityCatalog(orgId)
    .filter((c) =>
      [
        "brainstorm_narrative_hooks",
        "continue_narrative",
        "summarize_narrative_state",
        "create_character_variations",
      ].includes(c.name),
    )
    .filter((c) => c.enabled)
    .map((c) => ({
      name: c.name,
      label: c.label,
      summary: c.summary,
      advisory: advisory.has(c.name),
    }));
}

function BasedOnNote({ narrativeId }: { narrativeId: string }) {
  const source = db().narratives.find((n) => n.id === narrativeId);
  return (
    <Banner title="Adapted from another narrative" tone="neutral">
      <p>
        {source ? (
          <>
            Based on{" "}
            <Link
              href={`/org/curriculum/narrative/${source.id}`}
              className={`text-primary underline underline-offset-4 ${FOCUS_RING}`}
            >
              {source.title}
            </Link>
            .
          </>
        ) : (
          <>Based on a narrative that is no longer readable.</>
        )}{" "}
        The two have been separate since the copy was made: editing this one never
        changes that one, and editing that one never changes this.
      </p>
    </Banner>
  );
}

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------

type PartProps = { narrative: NonNullable<ReturnType<typeof narrativeById>>; editable: boolean };

function ReadOnlyNote() {
  return (
    <p className="text-sm text-ink-muted">
      Read-only. A narrative is editable only while it is a draft you own or one
      that has been shared with you.
    </p>
  );
}

function BiblePart({ narrative, editable }: PartProps) {
  const courses = COURSES.map((c) => ({ id: c.id, title: c.title }));
  return (
    <>
      <Card>
        <CardHeader title="Identity" hint="What this story is, in a form the bank can search." />
        <div className="p-5">
          {editable ? (
            <IdentityForm narrative={narrative} courses={courses} seq={2} />
          ) : (
            <>
              <FactList
                items={[
                  { label: "Subject", value: narrative.subject || "—" },
                  { label: "Course", value: narrative.courseId ?? "Not tied to one" },
                  { label: "Genre", value: narrative.genre || "—" },
                  { label: "Tone", value: narrative.tone || "—" },
                  { label: "Grade band", value: narrative.gradeBand || "—" },
                  { label: "Audience", value: narrative.audience || "—" },
                ]}
              />
              <div className="mt-4">
                <ReadOnlyNote />
              </div>
            </>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="World"
          hint="Where and when, and the rules the story will not break."
        />
        <div className="p-5">
          {editable ? (
            <WorldForm narrative={narrative} seq={3} />
          ) : (
            <FactList
              columns={1}
              items={[
                { label: "Place", value: narrative.world.place || "—" },
                { label: "Period", value: narrative.world.period || "—" },
                { label: "Technology", value: narrative.world.technologyLevel || "—" },
                {
                  label: "Rules",
                  value:
                    narrative.world.worldRules.length > 0 ? (
                      <ul className="list-inside list-disc">
                        {narrative.world.worldRules.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    ),
                },
              ]}
            />
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Central problem"
          hint="The challenge that carries the unit, and why the student is in it."
        />
        <div className="p-5">
          {editable ? (
            <CentralProblemForm narrative={narrative} seq={4} />
          ) : (
            <FactList
              columns={1}
              items={[
                { label: "Challenge", value: narrative.centralProblem.challenge || "—" },
                { label: "Stakes", value: narrative.centralProblem.stakes || "—" },
                { label: "Objective", value: narrative.centralProblem.objective || "—" },
                { label: "The student's part", value: narrative.centralProblem.studentRole || "—" },
              ]}
            />
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Content boundaries"
          hint="What must hold, and what must not appear. Sent with every assisted request."
        />
        <div className="p-5">
          {editable ? (
            <BoundariesForm narrative={narrative} seq={5} />
          ) : (
            <FactList
              columns={1}
              items={[
                {
                  label: "Must stay consistent",
                  value: narrative.boundaries.mustStayConsistent.join("; ") || "—",
                },
                { label: "Avoid", value: narrative.boundaries.avoid.join("; ") || "—" },
              ]}
            />
          )}
        </div>
      </Card>
    </>
  );
}

function CharactersPart({ narrative, editable }: PartProps) {
  return (
    <Card>
      <CardHeader
        title="Characters"
        hint="What each of them knows is the field that keeps continuity honest."
        action={editable ? <AddCharacterPanel narrativeId={narrative.id} seq={10} /> : null}
      />
      {narrative.characters.length === 0 ? (
        <div className="p-5">
          <Empty>Nobody is in this story yet.</Empty>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {narrative.characters.map((c, index) => (
            <li key={c.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-ink">{c.name}</p>
                  <p className="text-sm text-ink-muted">{c.role || "Role not stated"}</p>
                </div>
                {editable ? (
                  <div className="flex gap-2">
                    <EditCharacterPanel
                      narrativeId={narrative.id}
                      character={c}
                      seq={20 + index}
                    />
                    <RemoveCharacterForm
                      narrativeId={narrative.id}
                      character={c}
                      seq={20 + index}
                    />
                  </div>
                ) : null}
              </div>
              <div className="mt-3">
                <FactList
                  items={[
                    { label: "Wants", value: c.motivation || "—" },
                    { label: "Personality", value: c.personality || "—" },
                    { label: "Relationships", value: c.relationships || "—" },
                    { label: "Appearance", value: c.appearance || "—" },
                    { label: "Knows right now", value: c.knows || "—" },
                    { label: "Arc", value: c.arc || "—" },
                  ]}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function LocationsPart({ narrative, editable }: PartProps) {
  return (
    <Card>
      <CardHeader
        title="Locations"
        hint="Saved once, so every scene set here looks like itself."
        action={editable ? <AddLocationPanel narrativeId={narrative.id} seq={30} /> : null}
      />
      {narrative.world.locations.length === 0 ? (
        <div className="p-5">
          <Empty>No recurring settings saved yet.</Empty>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {narrative.world.locations.map((l, index) => (
            <li key={l.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="text-base font-semibold text-ink">{l.name}</p>
                {editable ? (
                  <div className="flex gap-2">
                    <EditLocationPanel
                      narrativeId={narrative.id}
                      location={l}
                      seq={40 + index}
                    />
                    <RemoveLocationForm
                      narrativeId={narrative.id}
                      location={l}
                      seq={40 + index}
                    />
                  </div>
                ) : null}
              </div>
              <div className="mt-3">
                <FactList
                  columns={1}
                  items={[
                    { label: "Description", value: l.description || "—" },
                    { label: "Why the story returns", value: l.significance || "—" },
                    { label: "Visual reference", value: l.visualReference || "—" },
                  ]}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ArcPart({ narrative, editable }: PartProps) {
  const stages = arcByStage(narrative);
  return (
    <Card>
      <CardHeader
        title="Story arc"
        hint="The shape of the unit, from opening to resolution."
        action={editable ? <AddArcMomentPanel narrativeId={narrative.id} seq={50} /> : null}
      />
      {narrative.storyArc.length === 0 ? (
        <div className="p-5">
          <Empty>The shape of the story is not mapped yet.</Empty>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {stages
            .filter((s) => s.moments.length > 0)
            .map((stage) => (
              <li key={stage.stage} className="px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {STORY_ARC_STAGE_LABEL[stage.stage]}
                </p>
                <ul className="mt-2 flex flex-col gap-2">
                  {stage.moments.map((m, index) => (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line px-3 py-2"
                    >
                      <p className="text-sm text-ink">{m.summary}</p>
                      {editable ? (
                        <RemoveArcMomentForm
                          narrativeId={narrative.id}
                          moment={m}
                          seq={60 + index}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
        </ul>
      )}
    </Card>
  );
}

function ChaptersPart({
  narrative,
  editable,
  units,
  lessons,
}: PartProps & {
  units: { id: string; title: string }[];
  lessons: { code: string; title: string }[];
}) {
  return (
    <>
      <Card>
        <CardHeader
          title="Chapter map"
          hint="Each beat pairs one lesson's objective with one thing that happens in the story."
          action={
            editable ? (
              <AddChapterPanel narrativeId={narrative.id} units={units} seq={70} />
            ) : null
          }
        />
        {narrative.chapters.length === 0 ? (
          <div className="p-5">
            <Empty>
              No chapters yet, so no lesson has a place in the story.
            </Empty>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {narrative.chapters.map((chapter, index) => (
              <li key={chapter.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-ink">
                      {index + 1}. {chapter.title}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {chapter.summary || "No summary."}
                    </p>
                    {chapter.unitId ? (
                      <p className="mt-0.5 text-xs text-ink-muted">
                        Runs alongside {chapter.unitId}
                      </p>
                    ) : null}
                  </div>
                  {editable ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <MoveChapterForm
                        narrativeId={narrative.id}
                        chapter={chapter}
                        index={index}
                        direction="up"
                        disabled={index === 0}
                        seq={80 + index}
                      />
                      <MoveChapterForm
                        narrativeId={narrative.id}
                        chapter={chapter}
                        index={index}
                        direction="down"
                        disabled={index === narrative.chapters.length - 1}
                        seq={80 + index}
                      />
                      <EditChapterPanel
                        narrativeId={narrative.id}
                        chapter={chapter}
                        units={units}
                        seq={80 + index}
                      />
                      <RemoveChapterForm
                        narrativeId={narrative.id}
                        chapter={chapter}
                        seq={80 + index}
                      />
                    </div>
                  ) : null}
                </div>

                {chapter.beats.length === 0 ? (
                  <p className="mt-3 text-sm text-ink-muted">No beats in this chapter.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {chapter.beats.map((beat, beatIndex) => (
                      <li
                        key={beat.id}
                        className="rounded-lg border border-line bg-surface-sunken px-3 py-2"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <StatusChip
                            label={beat.lessonCode ?? "Unplaced"}
                            tone={beat.lessonCode ? "info" : "neutral"}
                          />
                          {editable ? (
                            <div className="flex gap-2">
                              <EditBeatPanel
                                narrativeId={narrative.id}
                                chapterId={chapter.id}
                                beat={beat}
                                lessons={lessons}
                                seq={200 + index * 20 + beatIndex}
                              />
                              <RemoveBeatForm
                                narrativeId={narrative.id}
                                chapterId={chapter.id}
                                beatId={beat.id}
                                seq={200 + index * 20 + beatIndex}
                              />
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                              Academic objective
                            </p>
                            <p className="text-sm text-ink">
                              {beat.academicObjective || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                              What happens
                            </p>
                            <p className="text-sm text-ink">{beat.narrativeEvent}</p>
                          </div>
                        </div>
                        <p
                          className={`mt-2 text-sm ${
                            beat.learningUnlock ? "text-ink" : "text-recall"
                          }`}
                        >
                          {beat.learningUnlock
                            ? `The learning lets the student ${beat.learningUnlock}`
                            : "Nothing says what the learning lets the student do — this beat decorates the lesson rather than needing it."}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}

                {editable ? (
                  <div className="mt-3">
                    <AddBeatPanel
                      narrativeId={narrative.id}
                      chapterId={chapter.id}
                      lessons={lessons}
                      seq={300 + index}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {narrative.courseId ? null : (
        <Banner title="This narrative is not tied to a course" tone="neutral">
          Beats can still be written, but there is no lesson list to place them
          on. Set a course in the bible if you want to pair beats with lessons.
        </Banner>
      )}
    </>
  );
}

function StatePart({ narrative, editable }: PartProps) {
  return (
    <>
      <Card>
        <CardHeader
          title="Narrative state"
          hint="Canon. It is sent with every narrative-aware request, and nothing generated may change it."
        />
        <div className="p-5">
          {editable ? (
            <NarrativeStateForm narrative={narrative} seq={90} />
          ) : (
            <FactList
              columns={1}
              items={[
                { label: "Has happened", value: narrative.state.happened.join("; ") || "—" },
                {
                  label: "Students know",
                  value: narrative.state.studentsKnow.join("; ") || "—",
                },
                {
                  label: "Current objective",
                  value: narrative.state.currentObjective || "—",
                },
              ]}
            />
          )}
        </div>
      </Card>
      <Banner title="Accepting a proposal never moves the state" tone="info">
        Saving a proposed scene as a beat writes the beat and nothing else. If the
        scene moves the story on, updating the state here is your own, separate
        edit — which is what keeps the canon a person&rsquo;s decision.
      </Banner>
    </>
  );
}

function ThreadsPart({ narrative, editable }: PartProps) {
  const chapters = narrative.chapters.map((c) => ({ id: c.id, title: c.title }));
  const open = narrative.plotThreads.filter((t) => !t.resolved);
  const closed = narrative.plotThreads.filter((t) => t.resolved);

  return (
    <>
      <Card>
        <CardHeader
          title="Open threads"
          hint="Questions, clues, objectives, and conflicts the story has not answered."
          action={
            editable ? (
              <AddPlotThreadPanel
                narrativeId={narrative.id}
                chapters={chapters}
                seq={100}
              />
            ) : null
          }
        />
        {open.length === 0 ? (
          <div className="p-5">
            <Empty>Nothing is open.</Empty>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {open.map((thread, index) => (
              <li key={thread.id} className="px-5 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StatusChip label={thread.kind} tone="attention" />
                    <p className="mt-1 text-sm text-ink">{thread.summary}</p>
                    {thread.note ? (
                      <p className="mt-0.5 text-xs text-ink-muted">{thread.note}</p>
                    ) : null}
                  </div>
                  {editable ? (
                    <div className="flex gap-2">
                      <ResolveThreadForm
                        narrativeId={narrative.id}
                        thread={thread}
                        chapters={chapters}
                        seq={110 + index}
                      />
                      <RemoveThreadForm
                        narrativeId={narrative.id}
                        threadId={thread.id}
                        seq={110 + index}
                      />
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {closed.length > 0 ? (
        <Card>
          <CardHeader title="Closed threads" hint="Kept, so the history of the story stays readable." />
          <ul className="divide-y divide-line">
            {closed.map((thread, index) => (
              <li key={thread.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <StatusChip label="Resolved" tone="positive" />
                  <p className="mt-1 text-sm text-ink">{thread.summary}</p>
                </div>
                {editable ? (
                  <ResolveThreadForm
                    narrativeId={narrative.id}
                    thread={thread}
                    chapters={chapters}
                    seq={150 + index}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}

function VisualPart({ narrative, editable }: PartProps) {
  const accepted = assetsForNarrative(narrative.id, "accepted");
  return (
    <>
      <Card>
        <CardHeader
          title="Visual bible"
          hint="The constraints an image must satisfy to belong to this unit."
        />
        <div className="p-5">
          {editable ? (
            <VisualBibleForm narrative={narrative} seq={120} />
          ) : (
            <FactList
              columns={1}
              items={[
                { label: "Art direction", value: narrative.visualBible.artDirection || "—" },
                { label: "Palette", value: narrative.visualBible.palette || "—" },
                { label: "Motifs", value: narrative.visualBible.motifs.join(", ") || "—" },
              ]}
            />
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Accepted artwork"
          hint="Only accepted assets exist as far as a lesson is concerned."
          action={
            <ButtonLink href="/org/curriculum/assets" emphasis="quiet">
              Asset library &rarr;
            </ButtonLink>
          }
        />
        {accepted.length === 0 ? (
          <div className="p-5">
            <Empty>No artwork accepted for this narrative yet.</Empty>
          </div>
        ) : (
          <ul className="grid gap-3 p-5 sm:grid-cols-2">
            {accepted.map((asset) => (
              <li key={asset.id} className="rounded-lg border border-line p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt={asset.alt}
                  className="h-32 w-full rounded object-cover"
                />
                <p className="mt-2 text-sm font-medium text-ink">{asset.title}</p>
                <p className="text-xs text-ink-muted">
                  {asset.kind.replace(/_/g, " ")} · {asset.aspectRatio}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

/**
 * The unit as a continuous story.
 *
 * The check this page exists for is whether the transitions hold: read straight
 * through, does chapter three follow from chapter two, and does each beat still
 * need its lesson?
 */
function PreviewPart({ narrative }: { narrative: PartProps["narrative"] }) {
  const beats = allBeats(narrative);
  return (
    <Card>
      <CardHeader
        title="Read it through"
        hint="Every beat in order. This is where a transition that does not hold shows itself."
      />
      {beats.length === 0 ? (
        <div className="p-5">
          <Empty>Nothing to read yet.</Empty>
        </div>
      ) : (
        <div className="flex flex-col gap-6 p-5">
          {narrative.chapters.map((chapter, index) => (
            <section key={chapter.id}>
              <h3 className="text-lg font-semibold text-ink">
                {index + 1}. {chapter.title}
              </h3>
              {chapter.summary ? (
                <p className="mt-1 text-sm text-ink-muted">{chapter.summary}</p>
              ) : null}
              {chapter.beats.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">
                  Nothing happens in this chapter yet.
                </p>
              ) : (
                <ol className="mt-3 flex flex-col gap-3">
                  {chapter.beats.map((beat) => (
                    <li key={beat.id} className="border-l-2 border-primary-line pl-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {beat.lessonCode ?? "Unplaced beat"}
                      </p>
                      <p className="mt-1 text-sm text-ink">{beat.narrativeEvent}</p>
                      {beat.learningUnlock ? (
                        <p className="mt-1 text-sm text-positive">
                          The learning lets the student {beat.learningUnlock}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>
      )}
    </Card>
  );
}

function GovernancePart({
  narrative,
  actorId,
  canAdminister,
  canAuthor,
  blockers,
  aiAccepted,
}: {
  narrative: PartProps["narrative"];
  actorId: string;
  canAdminister: boolean;
  canAuthor: boolean;
  blockers: string[];
  aiAccepted: boolean;
}) {
  const owns = narrative.ownerUserId === actorId;
  const colleagues = db()
    .users.filter(
      (u) =>
        u.orgId === narrative.orgId && u.curriculumAuthor && u.id !== narrative.ownerUserId,
    )
    .map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }));
  const versions = versionsOfNarrative(narrative.id);
  const next = nextNarrativeStatuses(narrative.status);

  return (
    <>
      <Card>
        <CardHeader
          title="Status"
          hint={NARRATIVE_STATUS_PRESENTATION[narrative.status].meaning}
        />
        <div className="flex flex-col gap-3 p-5">
          {narrative.status === "draft" && blockers.length > 0 ? (
            <Banner title="Not ready to submit for review" tone="notice">
              <ul className="list-inside list-disc">
                {blockers.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </Banner>
          ) : null}

          {!canAuthor ? (
            <ReadOnlyNote />
          ) : (
            <div className="flex flex-wrap gap-3">
              {next.includes("in_review") && owns ? (
                <AdvanceForm
                  narrative={narrative}
                  to="in_review"
                  label="Submit for review"
                  note="Submitting freezes it, so a reviewer reads exactly what you sent. You can take it back to draft."
                  seq={130}
                />
              ) : null}
              {next.includes("approved_template") ? (
                <AdvanceForm
                  narrative={narrative}
                  to="approved_template"
                  label="Approve as a template"
                  note="Cleared for other designers to duplicate and build on. A reviewer other than the author does this."
                  seq={131}
                />
              ) : null}
              {next.includes("published") ? (
                <AdvanceForm
                  narrative={narrative}
                  to="published"
                  label="Publish"
                  note="In use by the unit it was written for. A reviewer other than the author does this."
                  seq={132}
                />
              ) : null}
              {next.includes("draft") ? (
                <AdvanceForm
                  narrative={narrative}
                  to="draft"
                  label="Return to draft"
                  note="Back to working state, where it can be edited again."
                  seq={133}
                />
              ) : null}
              {next.includes("archived") ? (
                <AdvanceForm
                  narrative={narrative}
                  to="archived"
                  label="Archive"
                  note="Out of active authoring. Nothing is deleted: its history and every copy made from it are unaffected."
                  seq={134}
                />
              ) : null}
            </div>
          )}

          {canAdminister ? (
            <div className="border-t border-line pt-3">
              <OfficialTemplateForm narrative={narrative} seq={135} />
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Reuse and sharing"
          hint="A duplicate is a separate narrative. Sharing grants edit access on this one."
        />
        <div className="flex flex-wrap gap-3 p-5">
          {canAuthor ? <DuplicateForm narrative={narrative} seq={140} /> : null}
          {owns ? (
            <ShareForm narrative={narrative} colleagues={colleagues} seq={141} />
          ) : null}
          {canAuthor && (owns || narrative.sharedWithUserIds.includes(actorId)) ? (
            <CheckpointForm narrative={narrative} aiAssisted={aiAccepted} seq={142} />
          ) : null}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Saved versions"
          hint="Deliberate checkpoints, not autosaves. Each records whether the assistant was involved."
        />
        {versions.length === 0 ? (
          <div className="p-5">
            <Empty>No versions saved yet.</Empty>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {versions.map((v) => (
              <li key={v.id} className="px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{v.label}</p>
                  {v.aiAssisted ? (
                    <StatusChip label="AI-assisted" tone="info" />
                  ) : (
                    <StatusChip label="Written by hand" tone="neutral" />
                  )}
                </div>
                {v.note ? <p className="mt-0.5 text-sm text-ink-muted">{v.note}</p> : null}
                <p className="mt-0.5 text-xs text-ink-muted">
                  {formatDateTime(v.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
