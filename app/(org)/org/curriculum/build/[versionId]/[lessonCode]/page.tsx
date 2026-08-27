import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { assistantUnavailableReason } from "@/lib/ai/config";
import { capabilityCatalog } from "@/lib/ai/gateway";
import { generationsForLesson } from "@/lib/ai/generations";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/clock";
import {
  courseSlug,
  getCourse,
  lessonEvidence,
  lessonPosition,
  lessonStage,
  subjectForLesson,
} from "@/lib/curriculum/catalog";
import { resolvePrerequisites } from "@/lib/curriculum/prerequisites";
import { effectiveCourse, locateInCourse } from "@/lib/curriculum/structure";
import { describeStandard } from "@/lib/curriculum/standards";
import {
  alignableStandards,
  authoredLesson,
  authoringGate,
  ITEM_PURPOSES,
  lessonReadiness,
} from "@/lib/curriculum/lesson-authoring";
import {
  LESSON_SECTION_PARTS,
  sectionCounts,
} from "@/lib/curriculum/lesson-sections";
import { supportById } from "@/lib/intervention/bank";
import { ALL_ITEMS } from "@/lib/db/demo-items";
import { db } from "@/lib/db/store";
import type { AuthoredQuizItem } from "@/lib/db/types";
import {
  Banner,
  ButtonLink,
  Card,
  CardHeader,
  Empty,
  FactList,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { UnitArc } from "@/lib/design/curriculum";
import {
  LessonBlocks,
  LessonMaterialCard,
  LessonVideoPlayer,
} from "@/lib/design/lesson-blocks";
import { FOCUS_RING } from "@/lib/design/tokens";
import { beatForLesson, narrativesForLesson } from "@/lib/narrative/bible";

import { AssistancePanel, type CapabilityOption } from "../../../assistance";
import { StudentPreview } from "./student-preview";

import {
  AddMaterialForm,
  AddVideoForm,
  QuizItemForm,
  RemoveItemForm,
  RemoveMaterialForm,
  RemoveVideoForm,
  ScriptForm,
} from "../../studio-forms";

export const metadata: Metadata = {
  title: "Build a lesson · Beyond.Ed",
  description: "Design the lesson a student reads, attach media, and build the quiz.",
};

/**
 * One lesson's workbench.
 *
 * What the course plan already fixed, where the lesson's elements are laid out,
 * the media it carries, the script the studio composes around, and the items
 * that produce evidence. Laying the elements out is a job of its own and has
 * its own page — the design studio at `./design` — so this page summarises the
 * layout and hands off rather than trying to be both.
 *
 * When the version is not a draft, or the reader does not hold the authoring
 * authorization, everything renders read-only with the reason stated. No
 * control is shown that cannot complete its action (CLAUDE.md §12).
 */
export default async function LessonEditorPage({
  params,
}: {
  params: Promise<{ versionId: string; lessonCode: string }>;
}) {
  const { versionId, lessonCode } = await params;
  const actor = await requireUser();

  let gate;
  try {
    gate = authoringGate(actor, versionId);
  } catch {
    notFound();
  }
  const version = gate.version;
  if (!getCourse(version.courseTitle)) notFound();
  // The order THIS version runs in, so the day and the arc position shown here
  // are the ones a student will meet (`lib/curriculum/structure.ts`).
  const course = effectiveCourse(version);
  const found = locateInCourse(course, lessonCode);
  if (!found) notFound();

  const lesson = found.lesson;
  const unit = found.unit;
  const draft = authoredLesson(version.id, lessonCode);
  const readiness = lessonReadiness(version.id, lessonCode);
  const standards = alignableStandards(version, lessonCode);
  const subject = subjectForLesson(lessonCode);
  const stage = lessonStage(lesson);
  const position = lessonPosition(lesson);
  const standard = describeStandard(lesson.primaryStandard);
  const prerequisites = resolvePrerequisites(lesson.code);
  const blocks = draft?.blocks ?? [];
  const videos = draft?.videos ?? [];
  const materials = draft?.materials ?? [];

  // The story this lesson sits in, if a narrative has placed a beat on it.
  // A soft join by lesson code: re-sequencing a course moves the lesson without
  // breaking the story, and a narrative reused elsewhere simply matches nothing.
  const narratives = narrativesForLesson(actor, lessonCode);
  const narrative = narratives[0] ?? null;
  const placement = narrative ? beatForLesson(narrative, lessonCode) : undefined;
  const generations = generationsForLesson(version.id, lessonCode);
  const assistedAccepted = generations.filter(
    (g) => g.status === "accepted" || g.status === "accepted_edited",
  );

  const at = unit.lessons.findIndex((l) => l.code === lesson.code);
  const previous = at > 0 ? unit.lessons[at - 1] : null;
  const following = at < unit.lessons.length - 1 ? unit.lessons[at + 1] : null;

  /**
   * Error families already in use — the ones from this subject's existing items,
   * plus anything this version has authored. Offered as suggestions so an error
   * model stays consistent; the author can always type their own.
   */
  const errorCodeSuggestions = Array.from(
    new Set([
      ...ALL_ITEMS.filter((i) => subjectForLesson(i.lessonCode) === subject)
        .flatMap((i) => i.choices.map((c) => c.errorCode))
        .filter((c): c is string => Boolean(c)),
      ...db()
        .authoredLessons.filter((l) => l.courseVersionId === version.id)
        .flatMap((l) => l.items)
        .flatMap((i) => i.choices.map((c) => c.errorCode))
        .filter((c): c is string => Boolean(c)),
    ]),
  ).sort();

  const byPurpose = ITEM_PURPOSES.map((purpose) => ({
    ...purpose,
    items: (draft?.items ?? []).filter((i) => i.purpose === purpose.value),
  }));

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/org/curriculum/build" className={`hover:underline ${FOCUS_RING}`}>
          Lesson studio
        </Link>
        <span aria-hidden="true"> / </span>
        <Link
          href={`/org/curriculum/build/${version.id}`}
          className={`hover:underline ${FOCUS_RING}`}
        >
          {version.courseTitle} {version.version}
        </Link>
        <span aria-hidden="true"> / </span>
        <Link
          href={`/org/curriculum/build/${version.id}/unit/${unit.id}`}
          className={`hover:underline ${FOCUS_RING}`}
        >
          Unit {unit.order}
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="font-mono text-ink">{lessonCode}</span>
      </nav>

      <header className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip label={stage.type} tone="info" />
          <span className="text-sm text-ink-muted">
            Lesson {position} of {unit.lessons.length} &middot; course day {lesson.day}
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{lesson.title}</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">{lesson.objective}</p>
      </header>

      {!gate.editable ? (
        <div className="mt-5">
          <Banner title="Read-only." tone="notice">
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {gate.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </Banner>
        </div>
      ) : null}

      <section aria-labelledby="plan" className="mt-6">
        <SectionHeading
          id="plan"
          hint="Fixed by the course plan. The studio fills the lesson in; it never moves the plan."
        >
          The plan
        </SectionHeading>
        <Card>
          <div className="p-5">
            <FactList
              columns={3}
              items={[
                { label: "Lesson code", value: <span className="font-mono">{lesson.code}</span> },
                {
                  label: "Unit",
                  value: (
                    <Link
                      href={`/org/curriculum/courses/${courseSlug(course)}/${unit.id}`}
                      className={`text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                    >
                      {unit.order}. {unit.title}
                    </Link>
                  ),
                },
                { label: "Essential question", value: unit.essentialQuestion },
                {
                  label: "Primary standard",
                  value: (
                    <>
                      <span className="font-mono">{lesson.primaryStandard}</span>
                      {standard ? (
                        <span className="block text-xs text-ink-muted">
                          {standard.description}
                        </span>
                      ) : null}
                    </>
                  ),
                },
                {
                  label: "Supporting",
                  value:
                    lesson.supportingStandards.length > 0
                      ? lesson.supportingStandards.join(", ")
                      : "None",
                },
                {
                  label: "Practice / literacy",
                  value: lesson.practice.length > 0 ? lesson.practice.join(", ") : "None",
                },
                { label: "Evidence produced", value: lessonEvidence(lesson) },
                { label: "Length", value: "30 minutes, one course day" },
                {
                  label: "Reaches students",
                  value: "When this version is published",
                },
              ]}
            />

            <details className="mt-5">
              <summary
                className={`cursor-pointer text-sm font-semibold text-primary ${FOCUS_RING}`}
              >
                What this lesson rests on ({prerequisites.length})
              </summary>
              <ul className="mt-2 flex flex-col gap-1.5">
                {prerequisites.map((prerequisite) => {
                  const support =
                    prerequisite.kind === "support" ? supportById(prerequisite.id) : undefined;
                  return (
                    <li key={prerequisite.id} className="text-sm">
                      <span className="font-mono text-xs text-ink-muted">
                        {prerequisite.id}
                      </span>{" "}
                      <span className="text-ink">
                        {support ? support.skill : (prerequisite.title ?? "")}
                      </span>
                      <span className="block text-xs text-ink-muted">
                        {prerequisite.reason}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>

            <div className="mt-5 border-t border-line pt-4">
              <UnitArc
                active={position}
                hrefFor={(p) =>
                  `/org/curriculum/build/${version.id}/${unit.lessons[p - 1].code}`
                }
              />
            </div>
          </div>
        </Card>
      </section>

      <section aria-labelledby="readiness" className="mt-8">
        <SectionHeading
          id="readiness"
          hint="Advisory, not a gate. What a student would meet if this version were published today."
        >
          Before a student sees this
        </SectionHeading>
        <Card>
          <div className="p-5">
            <div className="mb-4">
              <StatusChip
                label={readiness.complete ? "Ready for students" : "Not finished"}
                tone={readiness.complete ? "positive" : "attention"}
              />
            </div>
            <ul className="flex flex-col gap-2.5">
              {readiness.checks.map((check) => (
                <li key={check.label} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                      check.done
                        ? "border-positive-line bg-positive-surface text-positive"
                        : "border-line-strong bg-surface-sunken text-ink-muted"
                    }`}
                  >
                    {check.done ? "✓" : "·"}
                  </span>
                  <span>
                    <span className="text-sm font-semibold text-ink">
                      {check.label}
                      <span className="ml-2 font-normal text-ink-muted">
                        {check.done ? "done" : "still to do"}
                      </span>
                    </span>
                    <span className="block text-sm text-ink-muted">{check.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </section>

      <section aria-labelledby="narrative" className="mt-10">
        <SectionHeading
          id="narrative"
          hint="Where this lesson sits in the unit's story, and what the learning lets a student do in it."
        >
          Narrative transition
        </SectionHeading>
        <Card>
          {narrative && placement ? (
            <>
              <CardHeader
                title={`${narrative.title} — ${placement.chapter.title}`}
                hint={narrative.premise || "No premise written."}
                action={
                  <ButtonLink
                    href={`/org/curriculum/narrative/${narrative.id}?part=chapters`}
                    emphasis="quiet"
                  >
                    Open the studio &rarr;
                  </ButtonLink>
                }
              />
              <div className="p-5">
                <FactList
                  columns={1}
                  items={[
                    {
                      label: "Where the story is when this lesson starts",
                      value:
                        narrative.state.currentObjective ||
                        "The narrative state does not say yet.",
                    },
                    {
                      label: "What happens in this lesson",
                      value: placement.beat.narrativeEvent,
                    },
                    {
                      label: "The narrative problem driving the learning",
                      value: placement.beat.learningUnlock ? (
                        <>The learning lets the student {placement.beat.learningUnlock}</>
                      ) : (
                        <span className="text-recall">
                          Nothing says what the learning lets the student do, so the
                          story decorates this lesson rather than needing it.
                        </span>
                      ),
                    },
                  ]}
                />
              </div>
            </>
          ) : (
            <>
              <CardHeader
                title="No narrative placed on this lesson"
                hint="A lesson does not need one. Where there is one, it travels with every assisted request about this lesson."
                action={
                  <ButtonLink href="/org/curriculum/narrative" emphasis="quiet">
                    Narrative Bank &rarr;
                  </ButtonLink>
                }
              />
              <div className="p-5">
                <Empty>
                  Place a beat on {lessonCode} in a narrative&rsquo;s chapter map and
                  it appears here.
                </Empty>
              </div>
            </>
          )}
        </Card>
      </section>

      {gate.editable ? (
        <section aria-labelledby="assist" className="mt-10">
          <SectionHeading
            id="assist"
            hint="Bounded requests about this lesson. Every one returns a proposal, and nothing is written until you accept it."
          >
            Design assistance
          </SectionHeading>
          <AssistancePanel
            heading="Gemini Design Assistant"
            hint="One click, one request. The lesson, its standards, and its prerequisites are sent for you."
            capabilities={lessonCapabilities(actor.orgId)}
            target={{
              courseVersionId: version.id,
              lessonCode,
              narrativeId: narrative?.id ?? null,
              chapterId: placement?.chapter.id ?? null,
              standard: lesson.primaryStandard,
            }}
            unavailableReason={assistantUnavailableReason()}
            seq={1}
          />
        </section>
      ) : null}

      {generations.length > 0 ? (
        <section aria-labelledby="assist-history" className="mt-8">
          <SectionHeading
            id="assist-history"
            hint="What was asked for, and what a person decided about it."
          >
            Assistance history
          </SectionHeading>
          <Card>
            <CardHeader
              title={
                assistedAccepted.length === 0
                  ? "No assisted content in this lesson"
                  : `${assistedAccepted.length} assisted ${assistedAccepted.length === 1 ? "contribution" : "contributions"} accepted`
              }
              hint="Accepted material is ordinary draft curriculum and is reviewed and published like any other."
              action={
                assistedAccepted.length > 0 ? (
                  <StatusChip label="AI-assisted" tone="info" />
                ) : (
                  <StatusChip label="Written by hand" tone="neutral" />
                )
              }
            />
            <ul className="divide-y divide-line">
              {generations.slice(0, 10).map((g) => (
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
                    <p className="mt-0.5 text-sm text-ink-muted">
                      Asked for: {g.instructions}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatDateTime(g.requestedAt)} · {g.model}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}

      <section aria-labelledby="student-preview" className="mt-10">
        <SectionHeading
          id="student-preview"
          hint="The same components the lesson player uses, at the width a student meets them."
        >
          Student preview
        </SectionHeading>
        <Card>
          <div className="p-5">
            {blocks.length === 0 ? (
              <Empty>
                Nothing is laid out yet, so there is nothing for a student to read.
              </Empty>
            ) : (
              <StudentPreview>
                <LessonBlocks blocks={blocks} videos={videos} materials={materials} />
              </StudentPreview>
            )}
          </div>
        </Card>
      </section>

      <section aria-labelledby="layout" className="mt-10">
        <SectionHeading
          id="layout"
          hint="Text, callouts, lists, key terms, tables, images, video, and materials, laid out into the parts of the lesson a student walks through."
        >
          Layout ({blocks.length} element{blocks.length === 1 ? "" : "s"})
        </SectionHeading>

        <Card>
          <CardHeader
            title="What is laid out where"
            hint={
              gate.editable
                ? "Open the design studio to add elements and change their order."
                : "Read-only. This is what a student meets."
            }
            action={
              <ButtonLink
                href={`/org/curriculum/build/${version.id}/${lessonCode}/design`}
                emphasis="primary"
              >
                {gate.editable ? "Open the design studio" : "Open the layout"} &rarr;
              </ButtonLink>
            }
          />
          <div className="p-5">
            <ul className="grid gap-2 sm:grid-cols-2">
              {LESSON_SECTION_PARTS.map((part) => {
                const count = sectionCounts(blocks)[part.value];
                return (
                  <li key={part.value}>
                    <Link
                      href={`/org/curriculum/build/${version.id}/${lessonCode}/design?part=${part.value}`}
                      className={`flex items-baseline justify-between gap-3 rounded-lg border border-line px-3 py-2.5 hover:border-primary-line ${FOCUS_RING}`}
                    >
                      <span className="min-w-0">
                        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          Stage {part.stage}
                        </span>
                        <span className="block text-sm font-semibold text-ink">
                          {part.label}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm text-ink-muted">
                        {count === 0 ? "empty" : `${count} element${count === 1 ? "" : "s"}`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-sm text-ink-muted">
              Spiral Review, the Exit Ticket, and the next-step decision are not laid
              out: they are produced by rule from stored evidence and the items
              below.
            </p>
          </div>
        </Card>
      </section>

      <section aria-labelledby="video" className="mt-10">
        <SectionHeading
          id="video"
          hint="Attach a video here, then place it in the design studio where it belongs. A transcript is required."
        >
          Media ({videos.length})
        </SectionHeading>

        <Card>
          <div className="p-5">
            {videos.length === 0 ? (
              <Empty>
                No video attached. Beyond.Ed stores the address and the transcript,
                not the file.
              </Empty>
            ) : (
              <ul className="flex flex-col gap-4">
                {videos.map((video) => {
                  const placed = blocks.some(
                    (b) => b.kind === "video" && b.videoId === video.id,
                  );
                  return (
                    <li key={video.id} className="rounded-lg border border-line p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink">{video.title}</p>
                          <p className="mt-0.5 break-all font-mono text-xs text-ink-muted">
                            {video.url}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <StatusChip
                            label={placed ? "Placed in the lesson" : "Not placed yet"}
                            tone={placed ? "positive" : "neutral"}
                          />
                          {gate.editable ? (
                            <RemoveVideoForm
                              versionId={version.id}
                              lessonCode={lessonCode}
                              videoId={video.id}
                              title={video.title}
                            />
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-3">
                        <LessonVideoPlayer video={video} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {gate.editable ? (
              <div className="mt-5">
                <AddVideoForm
                  versionId={version.id}
                  lessonCode={lessonCode}
                  count={videos.length}
                />
              </div>
            ) : null}
          </div>
        </Card>
      </section>

      <section aria-labelledby="materials" className="mt-10">
        <SectionHeading
          id="materials"
          hint="Readings, worksheets, data sets, and reference sheets. Attach one here, then place it in the design studio where the student needs it."
        >
          Materials ({materials.length})
        </SectionHeading>

        <Card>
          <div className="p-5">
            {materials.length === 0 ? (
              <Empty>
                No material attached. Beyond.Ed stores the address, what the
                student does with it, and how else to get it — not the file.
              </Empty>
            ) : (
              <ul className="flex flex-col gap-4">
                {materials.map((material) => {
                  const placed = blocks.some(
                    (b) => b.kind === "material" && b.materialId === material.id,
                  );
                  return (
                    <li key={material.id} className="rounded-lg border border-line p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink">
                            {material.title}
                          </p>
                          <p className="mt-0.5 break-all font-mono text-xs text-ink-muted">
                            {material.url}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <StatusChip
                            label={placed ? "Placed in the lesson" : "Not placed yet"}
                            tone={placed ? "positive" : "neutral"}
                          />
                          {gate.editable ? (
                            <RemoveMaterialForm
                              versionId={version.id}
                              lessonCode={lessonCode}
                              materialId={material.id}
                              title={material.title}
                            />
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-3">
                        <LessonMaterialCard material={material} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {gate.editable ? (
              <div className="mt-5">
                <AddMaterialForm
                  versionId={version.id}
                  lessonCode={lessonCode}
                  count={materials.length}
                />
              </div>
            ) : null}
          </div>
        </Card>
      </section>

      <section aria-labelledby="script" className="mt-10">
        <SectionHeading
          id="script"
          hint="The written spine of the lesson: why it exists, the goal, the worked model, guided practice, and what the student keeps. Elements are laid out around it in the design studio."
        >
          The rest of the lesson
        </SectionHeading>
        <Card>
          <div className="p-5">
            {gate.editable ? (
              <ScriptForm versionId={version.id} lessonCode={lessonCode} draft={draft} />
            ) : draft ? (
              <ReadOnlyScript draft={draft} />
            ) : (
              <Empty>Nothing has been written for this lesson.</Empty>
            )}
          </div>
        </Card>
      </section>

      <section aria-labelledby="quiz" className="mt-10">
        <SectionHeading
          id="quiz"
          hint="Scored on the server against the four Exit Ticket bands. The browser reports a choice; it never decides a result."
        >
          Quiz ({draft?.items.length ?? 0}{" "}
          {(draft?.items.length ?? 0) === 1 ? "item" : "items"})
        </SectionHeading>

        {standards.length === 0 ? (
          <Banner title="This lesson has no standard to align an item to." tone="notice">
            Items belong on the lessons that carry the coverage, so evidence can point
            at something.
          </Banner>
        ) : (
          <div className="flex flex-col gap-4">
            {byPurpose.map((group) => (
              <Card key={group.value}>
                <CardHeader
                  title={`${group.label} (${group.items.length})`}
                  hint={group.meaning}
                />
                <div className="p-5">
                  {group.items.length === 0 ? (
                    <Empty>No {group.label.toLowerCase()} items yet.</Empty>
                  ) : (
                    <ul className="flex flex-col gap-4">
                      {group.items.map((item) => (
                        <li key={item.id} className="rounded-lg border border-line p-4">
                          <QuizItemView item={item} />
                          {gate.editable ? (
                            <div className="mt-3 flex flex-wrap gap-3">
                              <QuizItemForm
                                versionId={version.id}
                                lessonCode={lessonCode}
                                standards={standards}
                                purposes={ITEM_PURPOSES}
                                item={item}
                                errorCodeSuggestions={errorCodeSuggestions}
                                seq={0}
                              />
                              <RemoveItemForm
                                versionId={version.id}
                                lessonCode={lessonCode}
                                itemId={item.id}
                              />
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            ))}

            {gate.editable ? (
              <Card>
                <CardHeader
                  title="Write a new item"
                  hint="One correct choice, and an error family behind every wrong one."
                />
                <div className="p-5">
                  <QuizItemForm
                    versionId={version.id}
                    lessonCode={lessonCode}
                    standards={standards}
                    purposes={ITEM_PURPOSES}
                    errorCodeSuggestions={errorCodeSuggestions}
                    seq={draft?.items.length ?? 0}
                  />
                </div>
              </Card>
            ) : null}
          </div>
        )}
      </section>

      <nav aria-label="Adjacent lessons" className="mt-10 flex flex-wrap justify-between gap-3">
        {previous ? (
          <Link
            href={`/org/curriculum/build/${version.id}/${previous.code}`}
            className={`text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
          >
            &larr; {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {following ? (
          <Link
            href={`/org/curriculum/build/${version.id}/${following.code}`}
            className={`text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
          >
            {following.title} &rarr;
          </Link>
        ) : null}
      </nav>
    </div>
  );
}

/**
 * The capabilities that make sense with a whole lesson in view.
 *
 * A review and a misconception list are advisory: they produce findings, not
 * content, and there is nothing to save. The panel says so rather than offering
 * an Accept that would write nothing (CLAUDE.md §12).
 */
function lessonCapabilities(orgId: string): CapabilityOption[] {
  const wanted = [
    "generate_worked_example",
    "generate_guided_practice",
    "draft_exit_ticket",
    "check_lesson_alignment",
    "identify_misconceptions",
    "brainstorm_narrative_hooks",
    "continue_narrative",
  ];
  const advisory = new Set(["check_lesson_alignment", "identify_misconceptions"]);
  return capabilityCatalog(orgId)
    .filter((c) => wanted.includes(c.name) && c.enabled)
    .map((c) => ({
      name: c.name,
      label: c.label,
      summary: c.summary,
      advisory: advisory.has(c.name),
    }));
}

function QuizItemView({ item }: { item: AuthoredQuizItem }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip label={item.standard} tone="info" />
        <span className="text-xs text-ink-muted">measures {item.skill}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-ink">{item.stem}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {item.choices.map((choice) => {
          const correct = choice.id === item.correctChoiceId;
          return (
            <li key={choice.id} className="text-sm">
              <span className={correct ? "font-semibold text-positive" : "text-ink"}>
                {choice.text}
              </span>
              <span className="ml-2 text-xs text-ink-muted">
                {correct ? "correct" : `reveals: ${choice.errorCode}`}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-sm text-ink-muted">
        <span className="font-semibold text-ink">Explanation: </span>
        {item.rationale}
      </p>
    </div>
  );
}

function ReadOnlyScript({
  draft,
}: {
  draft: NonNullable<ReturnType<typeof authoredLesson>>;
}) {
  return (
    <div className="flex flex-col gap-5 text-sm">
      <Part title="Relevance">{draft.relevance || "—"}</Part>
      <Part title="Goal">{draft.goal || "—"}</Part>
      <Part title="Success criteria">
        <ul className="list-disc space-y-1 pl-5">
          {draft.successCriteria.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Part>
      <Part title="Vocabulary">
        <dl className="space-y-1">
          {draft.vocabulary.map((v) => (
            <div key={v.term}>
              <dt className="inline font-semibold text-ink">{v.term}: </dt>
              <dd className="inline text-ink-muted">{v.meaning}</dd>
            </div>
          ))}
        </dl>
      </Part>
      <Part title="Worked model">
        <ol className="list-decimal space-y-1 pl-5">
          {draft.workedModel.map((w) => (
            <li key={w.step}>
              <span className="text-ink">{w.step}</span>{" "}
              <span className="text-ink-muted">— {w.reasoning}</span>
            </li>
          ))}
        </ol>
      </Part>
      <Part title="Guided practice">
        <ol className="list-decimal space-y-1 pl-5">
          {draft.guidedPractice.map((g) => (
            <li key={g.prompt}>
              <span className="text-ink">{g.prompt}</span>{" "}
              <span className="text-ink-muted">— {g.answer}</span>
            </li>
          ))}
        </ol>
      </Part>
      <Part title="Independent task">{draft.independentTask || "—"}</Part>
      <Part title="Notes outline">
        <ul className="list-disc space-y-1 pl-5">
          {draft.notesOutline.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </Part>
    </div>
  );
}

function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </h3>
      <div className="mt-1 text-ink">{children}</div>
    </div>
  );
}
