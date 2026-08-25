import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import {
  courseSlug,
  getCourse,
  getUnit,
  lessonPosition,
  lessonStage,
} from "@/lib/curriculum/catalog";
import {
  authoredLesson,
  authoringGate,
  lessonReadiness,
} from "@/lib/curriculum/lesson-authoring";
import {
  Banner,
  Card,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { ConceptChain, UnitArc } from "@/lib/design/curriculum";
import { FOCUS_RING } from "@/lib/design/tokens";

export const metadata: Metadata = {
  title: "Build a unit · Beyond.Ed",
  description: "A unit's fifteen lessons and what has been written for each.",
};

/**
 * One unit in the studio.
 *
 * Fifteen lessons, each showing what exists and what is still missing, so an
 * author can see where the work is without opening anything. The plan — day,
 * type, standard, objective — is the course plan's; the studio only fills the
 * lesson in.
 */
export default async function StudioUnitPage({
  params,
}: {
  params: Promise<{ versionId: string; unitId: string }>;
}) {
  const { versionId, unitId } = await params;
  const actor = await requireUser();

  let gate;
  try {
    gate = authoringGate(actor, versionId);
  } catch {
    notFound();
  }
  const version = gate.version;
  const course = getCourse(version.courseTitle);
  if (!course) notFound();
  const unit = getUnit(course, unitId);
  if (!unit) notFound();

  const at = course.units.findIndex((u) => u.id === unit.id);
  const previous = at > 0 ? course.units[at - 1] : null;
  const following = at < course.units.length - 1 ? course.units[at + 1] : null;

  const ready = unit.lessons.filter(
    (l) => lessonReadiness(version.id, l.code).complete,
  ).length;

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
        <span className="text-ink">Unit {unit.order}</span>
      </nav>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Unit {unit.order} &middot; days {unit.startDay}&ndash;{unit.endDay}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{unit.title}</h1>
          <p className="mt-2 max-w-3xl text-lg text-ink-muted">{unit.essentialQuestion}</p>
        </div>
        <StatusChip
          label={`${ready} of ${unit.lessons.length} ready`}
          tone={ready === unit.lessons.length ? "positive" : ready === 0 ? "neutral" : "attention"}
        />
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

      <div className="mt-5">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Concepts
          </p>
          <div className="mt-2">
            <ConceptChain concepts={unit.concepts} />
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <UnitArc />
          </div>
        </Card>
      </div>

      <section aria-labelledby="lessons" className="mt-9">
        <SectionHeading
          id="lessons"
          hint="Day, type, and standard come from the course plan. The studio writes what fills the lesson."
        >
          Lessons
        </SectionHeading>

        <Card>
          <ul className="divide-y divide-line">
            {unit.lessons.map((lesson) => {
              const draft = authoredLesson(version.id, lesson.code);
              const readiness = lessonReadiness(version.id, lesson.code);
              const exitItems = (draft?.items ?? []).filter(
                (i) => i.purpose === "exit_ticket",
              ).length;
              const position = lessonPosition(lesson);
              const stage = lessonStage(lesson);
              const missing = readiness.checks.filter((c) => !c.done).length;

              return (
                <li key={lesson.code} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="flex min-w-0 gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-xs font-bold text-ink-muted"
                      >
                        {position}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">
                          <Link
                            href={`/org/curriculum/build/${version.id}/${lesson.code}`}
                            className={`hover:text-primary ${FOCUS_RING}`}
                          >
                            {lesson.title}
                          </Link>
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-ink-muted">
                          day {lesson.day} &middot; {stage.type} &middot;{" "}
                          {lesson.primaryStandard}
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          {draft
                            ? `${draft.blocks.length} blocks · ${draft.videos.length} videos · ${exitItems} Exit Ticket items`
                            : "Nothing written yet."}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusChip
                        label={
                          !draft
                            ? "Not started"
                            : readiness.complete
                              ? "Ready for students"
                              : `${missing} left`
                        }
                        tone={
                          !draft ? "neutral" : readiness.complete ? "positive" : "attention"
                        }
                      />
                      <Link
                        href={`/org/curriculum/build/${version.id}/${lesson.code}`}
                        className={`text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                      >
                        {gate.editable ? "Build" : "Read"}
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <nav aria-label="Adjacent units" className="mt-9 flex flex-wrap justify-between gap-3">
        {previous ? (
          <Link
            href={`/org/curriculum/build/${version.id}/unit/${previous.id}`}
            className={`text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
          >
            &larr; Unit {previous.order}. {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {following ? (
          <Link
            href={`/org/curriculum/build/${version.id}/unit/${following.id}`}
            className={`text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
          >
            Unit {following.order}. {following.title} &rarr;
          </Link>
        ) : null}
      </nav>

      <p className="mt-6 text-sm text-ink-muted">
        This unit&rsquo;s standards, concept map, and prerequisites are in{" "}
        <Link
          href={`/org/curriculum/courses/${courseSlug(course)}/${unit.id}`}
          className={`font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
        >
          the course catalog
        </Link>
        .
      </p>
    </div>
  );
}
