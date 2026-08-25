import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { courseSlug, getCourse } from "@/lib/curriculum/catalog";
import { effectiveCourse } from "@/lib/curriculum/structure";
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
  Meter,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { CountStrip, CourseIdentity } from "@/lib/design/curriculum";
import { FOCUS_RING } from "@/lib/design/tokens";

export const metadata: Metadata = {
  title: "Build lessons · Beyond.Ed",
  description: "Every unit in a course version, and how much of it is written.",
};

/**
 * One version's units.
 *
 * A course is 135 lessons, which is too many to hold in one list, so the studio
 * enters through the unit — the same nine-unit structure the course plan uses.
 * What the studio adds is how much of each unit has been written.
 */
export default async function VersionUnitsPage({
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
  // The order THIS version runs in, not the workbook's — an author builds the
  // course their students will meet (`lib/curriculum/structure.ts`).
  if (!getCourse(version.courseTitle)) notFound();
  const course = effectiveCourse(version);

  const presentation = CURRICULUM_STATUS_PRESENTATION[version.status];
  const summary = versionAuthoringSummary(version.id);
  const readyPercent =
    summary.lessonsInCourse === 0
      ? 0
      : Math.round((summary.lessonsComplete / summary.lessonsInCourse) * 100);

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
            {version.courseTitle}{" "}
            <span className="font-mono text-2xl text-ink-muted">{version.version}</span>
          </h1>
          <div className="mt-2">
            <CourseIdentity course={course} />
          </div>
          {version.notes ? (
            <p className="mt-2 max-w-3xl text-sm text-ink-muted">{version.notes}</p>
          ) : null}
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
        <Card className="p-5">
          <CountStrip
            items={[
              { value: `${summary.lessonsInCourse}`, label: "Lessons in the course" },
              { value: `${summary.lessonsStarted}`, label: "Started" },
              { value: `${summary.lessonsComplete}`, label: "Ready for students" },
              { value: `${summary.blocks}`, label: "Canvas blocks" },
              { value: `${summary.videos}`, label: "Videos" },
              { value: `${summary.materials}`, label: "Materials" },
              { value: `${summary.items}`, label: "Quiz items" },
            ]}
          />
          <div className="mt-4 border-t border-line pt-4">
            <Meter
              percent={readyPercent}
              tone={readyPercent === 100 ? "positive" : "info"}
              label={`${summary.lessonsComplete} of ${summary.lessonsInCourse} lessons ready`}
            />
          </div>
        </Card>
      </div>

      <section aria-labelledby="units" className="mt-9">
        <SectionHeading
          id="units"
          hint="The course plan's own units. Open one to build its fifteen lessons."
        >
          Units
        </SectionHeading>

        <div className="flex flex-col gap-3">
          {course.units.map((unit) => {
            const started = unit.lessons.filter((l) =>
              authoredLesson(version.id, l.code),
            ).length;
            const ready = unit.lessons.filter(
              (l) => lessonReadiness(version.id, l.code).complete,
            ).length;
            return (
              <Card key={unit.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Unit {unit.order} &middot; days {unit.startDay}&ndash;{unit.endDay}
                    </p>
                    <h3 className="mt-0.5 text-base font-semibold text-ink">
                      <Link
                        href={`/org/curriculum/build/${version.id}/unit/${unit.id}`}
                        className={`hover:text-primary ${FOCUS_RING}`}
                      >
                        {unit.title}
                      </Link>
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-ink-muted">
                      {unit.essentialQuestion}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusChip
                      label={
                        ready === unit.lessons.length
                          ? "Unit ready"
                          : started === 0
                            ? "Not started"
                            : `${ready} of ${unit.lessons.length} ready`
                      }
                      tone={
                        ready === unit.lessons.length
                          ? "positive"
                          : started === 0
                            ? "neutral"
                            : "attention"
                      }
                    />
                    <Link
                      href={`/org/curriculum/build/${version.id}/unit/${unit.id}`}
                      className={`text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                    >
                      {gate.editable ? "Build" : "Read"} &rarr;
                    </Link>
                  </div>
                </div>
                <div className="mt-3">
                  <Meter
                    percent={Math.round((ready / unit.lessons.length) * 100)}
                    tone={ready === unit.lessons.length ? "positive" : "info"}
                    label={`${started} of ${unit.lessons.length} started`}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <p className="mt-9 text-sm text-ink-muted">
        The plan behind this version —&nbsp;standards, concept map, prerequisites —&nbsp;is in{" "}
        <Link
          href={`/org/curriculum/courses/${courseSlug(course)}`}
          className={`font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
        >
          the course catalog
        </Link>
        . The order this version runs in, and which learning it treats as
        foundational, are governed in{" "}
        <Link
          href={`/org/curriculum/matrix/${courseSlug(course)}?version=${version.id}`}
          className={`font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
        >
          the curriculum matrix
        </Link>
        .
      </p>
    </div>
  );
}
