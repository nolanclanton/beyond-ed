import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { getCourse, lessonTopic, primaryStandards } from "@/lib/curriculum/catalog";
import { CURRICULUM_STATUS_PRESENTATION } from "@/lib/curriculum/publication";
import {
  authoredLesson,
  authoringGate,
  lessonReadiness,
  versionAuthoringSummary,
} from "@/lib/curriculum/lesson-authoring";
import {
  Banner,
  Card,
  FactList,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

export const metadata: Metadata = {
  title: "Build lessons · Beyond.Ed",
  description: "Every lesson in a course version, and what has been written for it.",
};

/**
 * One version's lessons, unit by unit.
 *
 * The list is the course plan — every lesson code, day range, and standard comes
 * from the catalog. What the studio adds is whether a script, a video, and a
 * quiz exist yet, so an author can see at a glance where the work is.
 */
export default async function VersionLessonsPage({
  params,
}: {
  params: Promise<{ versionId: string }>;
}) {
  const { versionId } = await params;
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

  const presentation = CURRICULUM_STATUS_PRESENTATION[version.status];
  const summary = versionAuthoringSummary(version.id);

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/org/curriculum/build" className={`hover:underline ${FOCUS_RING}`}>
          Lesson studio
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">
          {version.courseTitle} {version.version}
        </span>
      </nav>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {version.courseTitle} {version.version}
          </h1>
          <p className="mt-2 max-w-3xl text-base text-ink-muted">
            {version.notes || "No version notes were recorded."}
          </p>
        </div>
        <StatusChip label={presentation.label} tone={presentation.tone} />
      </header>

      {!gate.editable ? (
        <div className="mt-5">
          <Banner title="This version is read-only." tone="notice">
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {gate.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </Banner>
        </div>
      ) : null}

      <div className="mt-5">
        <Card>
          <div className="p-5">
            <FactList
              columns={3}
              items={[
                { label: "Subject", value: course.subject },
                { label: "Units", value: `${course.units.length}` },
                { label: "Lessons", value: `${summary.lessonsInCourse}` },
                { label: "Lessons started", value: `${summary.lessonsStarted}` },
                {
                  label: "Ready for students",
                  value: `${summary.lessonsComplete}`,
                },
                { label: "Videos · items", value: `${summary.videos} · ${summary.items}` },
              ]}
            />
          </div>
        </Card>
      </div>

      <section aria-labelledby="units" className="mt-9">
        <SectionHeading
          id="units"
          hint="Open a unit to see its lessons. Day ranges and standards are the course plan's, not the studio's."
        >
          Units
        </SectionHeading>

        <div className="flex flex-col gap-3">
          {course.units.map((unit) => {
            const started = unit.lessons.filter((l) =>
              authoredLesson(version.id, l.code),
            ).length;
            return (
              <details
                key={unit.id}
                className="rounded-xl border border-line bg-surface"
                open={started > 0}
              >
                <summary
                  className={`flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4 ${FOCUS_RING}`}
                >
                  <span>
                    <span className="text-base font-semibold text-ink">
                      {unit.order}. {unit.name}
                    </span>
                    <span className="ml-2 text-sm text-ink-muted">
                      {unit.lessons.length} lessons · {unit.pathwayDays} pathway days
                    </span>
                  </span>
                  <span className="text-sm text-ink-muted">
                    {started} of {unit.lessons.length} started
                  </span>
                </summary>

                <ul className="divide-y divide-line border-t border-line">
                  {unit.lessons.map((lesson) => {
                    const draft = authoredLesson(version.id, lesson.code);
                    const readiness = lessonReadiness(version.id, lesson.code);
                    const standards = primaryStandards(lesson);
                    const exitItems = (draft?.items ?? []).filter(
                      (i) => i.purpose === "exit_ticket",
                    ).length;
                    return (
                      <li key={lesson.code} className="px-5 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink">
                              {lessonTopic(lesson)}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-ink-muted">
                              {lesson.code} · day {lesson.dayRange} ·{" "}
                              {standards.length > 0
                                ? standards.join(", ")
                                : "no new primary standard"}
                            </p>
                            <p className="mt-1.5 text-sm text-ink-muted">
                              {draft
                                ? `${draft.instruction.length} instruction paragraphs · ${draft.videos.length} videos · ${exitItems} Exit Ticket items`
                                : "Nothing written yet."}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            {draft ? (
                              <StatusChip
                                label={
                                  readiness.complete ? "Ready for students" : "In progress"
                                }
                                tone={readiness.complete ? "positive" : "attention"}
                              />
                            ) : (
                              <StatusChip label="Not started" tone="neutral" />
                            )}
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
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
