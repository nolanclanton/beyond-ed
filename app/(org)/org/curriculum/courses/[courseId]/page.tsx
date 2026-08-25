import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { validateCourseBudget } from "@/lib/curriculum/budget";
import { getCourseBySlug, courseSlug } from "@/lib/curriculum/catalog";
import { conceptEdgesForCourse } from "@/lib/curriculum/concepts";
import { nextCourses, priorCourses } from "@/lib/curriculum/pathways";
import {
  coverageReport,
  sourceFor,
  standardGroupsForCourse,
} from "@/lib/curriculum/standards";
import { db } from "@/lib/db/store";
import { CURRICULUM_STATUS_PRESENTATION } from "@/lib/curriculum/publication";
import {
  Banner,
  Card,
  ScrollX,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import {
  CountStrip,
  CourseIdentity,
  LessonShape,
  UnitArc,
  UnitCard,
} from "@/lib/design/curriculum";
import { FOCUS_RING } from "@/lib/design/tokens";

export const metadata: Metadata = {
  title: "Course · Beyond.Ed",
  description: "A course's units, standards coverage, and place in the pathway.",
};

/**
 * One course, whole.
 *
 * The nine units in order, the standards the course is responsible for and
 * where each is first taught, the courses on either side of it in the pathway,
 * and the day budget that gates its publication.
 */
export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireUser();
  const { courseId } = await params;
  const course = getCourseBySlug(courseId);
  if (!course) notFound();

  const budget = validateCourseBudget(course);
  const coverage = coverageReport(course);
  const groups = standardGroupsForCourse(course.id);
  const edges = conceptEdgesForCourse(course.id);
  const prior = priorCourses(course.id);
  const next = nextCourses(course.id);

  const versions = db()
    .courseVersions.filter((v) => v.courseTitle === course.title)
    .sort((a, b) => a.version.localeCompare(b.version));

  const lessonCount = course.units.reduce((n, u) => n + u.lessons.length, 0);

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/org/curriculum/courses" className={`hover:underline ${FOCUS_RING}`}>
          Courses
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{course.title}</span>
      </nav>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">{course.title}</h1>
          <div className="mt-2">
            <CourseIdentity course={course} />
          </div>
        </div>
        <span className="font-mono text-sm text-ink-muted">{course.id}</span>
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <CountStrip
            items={[
              { value: `${course.units.length}`, label: "Units" },
              { value: `${lessonCount}`, label: "Lessons" },
              { value: `${coverage.assigned}`, label: "Standards" },
              { value: `${edges.length}`, label: "Concept links" },
            ]}
          />
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              The thirty minutes
            </p>
            <div className="mt-2">
              <LessonShape />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Pathway
          </p>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            {prior.length > 0 ? (
              prior.map((p) => (
                <p key={p.course.id}>
                  <Link
                    href={`/org/curriculum/courses/${courseSlug(p.course)}`}
                    className={`font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                  >
                    {p.course.title}
                  </Link>
                  <span className="block text-xs text-ink-muted">
                    {p.edge.relationship} &middot; enters at {p.edge.toEntryLessonCode}
                  </span>
                </p>
              ))
            ) : (
              <p className="text-sm text-ink-muted">Entry course for this subject.</p>
            )}
            <p className="rounded-lg bg-surface-sunken px-3 py-2 text-sm font-semibold text-ink">
              {course.title}
            </p>
            {next.length > 0 ? (
              next.map((n) => (
                <p key={n.course.id}>
                  <span aria-hidden="true" className="text-ink-muted">
                    &rarr;{" "}
                  </span>
                  <Link
                    href={`/org/curriculum/courses/${courseSlug(n.course)}`}
                    className={`font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                  >
                    {n.course.title}
                  </Link>
                  <span className="block pl-4 text-xs text-ink-muted">
                    {n.edge.relationship}
                  </span>
                </p>
              ))
            ) : (
              <p className="text-sm text-ink-muted">End of the pathway.</p>
            )}
          </div>
        </Card>
      </div>

      {budget.valid && coverage.valid ? null : (
        <div className="mt-4 flex flex-col gap-3">
          {budget.valid ? null : (
            <Banner title="Day budget does not validate." tone="urgent">
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {budget.findings
                  .filter((f) => f.severity === "error")
                  .map((f) => (
                    <li key={f.message}>{f.message}</li>
                  ))}
              </ul>
            </Banner>
          )}
          {coverage.valid ? null : (
            <Banner title="Standards coverage has a gap." tone="urgent">
              {coverage.gaps.length > 0 ? (
                <p>No lesson claims {coverage.gaps.join(", ")}.</p>
              ) : null}
              {coverage.orphanLessons.length > 0 ? (
                <p className="mt-1">
                  {coverage.orphanLessons.length} lessons claim a standard this course
                  is not responsible for.
                </p>
              ) : null}
            </Banner>
          )}
        </div>
      )}

      <section aria-labelledby="arc" className="mt-9">
        <SectionHeading id="arc" hint="Every unit in this course runs it, in this order.">
          The fifteen-lesson unit
        </SectionHeading>
        <Card className="p-5">
          <UnitArc />
        </Card>
      </section>

      <section aria-labelledby="units" className="mt-9">
        <SectionHeading
          id="units"
          hint="Nine units, fifteen lessons each. Open one to see its lessons and concept map."
        >
          Units
        </SectionHeading>
        <div className="flex flex-col gap-3">
          {course.units.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              href={`/org/curriculum/courses/${courseSlug(course)}/${unit.id}`}
              trailing={
                <span className="text-xs text-ink-muted">
                  {unit.lessons.length} lessons
                </span>
              }
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="standards" className="mt-10">
        <SectionHeading
          id="standards"
          hint={`${coverage.assigned} standards, every one scheduled. Coverage is recomputed from the lessons, not read from a stored count.`}
        >
          Standards coverage
        </SectionHeading>

        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <Card key={group.group}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
                <h3 className="text-sm font-semibold text-ink">{group.group}</h3>
                <span className="text-xs text-ink-muted">
                  {group.standards.length} standards
                  {group.standards[0]
                    ? ` · ${sourceFor(group.standards[0].sourceId)?.title ?? group.standards[0].sourceId}`
                    : ""}
                </span>
              </div>
              <ScrollX>
                <table className="w-full min-w-[40rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-left">
                      <th scope="col" className="px-5 py-2.5 font-semibold text-ink">
                        Standard
                      </th>
                      <th scope="col" className="px-5 py-2.5 font-semibold text-ink">
                        First taught
                      </th>
                      <th scope="col" className="px-5 py-2.5 font-semibold text-ink">
                        Lessons
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {group.standards.map((standard) => (
                      <tr key={standard.code}>
                        <th
                          scope="row"
                          className="px-5 py-2 text-left font-mono text-xs font-medium text-ink"
                        >
                          {standard.code}
                        </th>
                        <td className="px-5 py-2 font-mono text-xs text-ink-muted">
                          {standard.firstLessonCode}
                        </td>
                        <td className="px-5 py-2 text-xs text-ink-muted">
                          {standard.coverageCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollX>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="versions" className="mt-10">
        <SectionHeading
          id="versions"
          hint="A roster section keeps the version it was created with."
        >
          Versions of this course
        </SectionHeading>
        <Card>
          <ul className="divide-y divide-line">
            {versions.length === 0 ? (
              <li className="px-5 py-4 text-sm text-ink-muted">
                No version of this course has been opened yet.
              </li>
            ) : (
              versions.map((version) => {
                const presentation = CURRICULUM_STATUS_PRESENTATION[version.status];
                return (
                  <li
                    key={version.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">{version.version}</p>
                      <p className="text-xs text-ink-muted">{presentation.meaning}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusChip label={presentation.label} tone={presentation.tone} />
                      <Link
                        href={`/org/curriculum/build/${version.id}`}
                        className={`text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                      >
                        Open in the studio
                      </Link>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </Card>
      </section>
    </div>
  );
}
