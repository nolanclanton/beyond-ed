import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import {
  COURSES,
  SUBJECTS,
  assessmentDescription,
  assessmentId,
  courseSlug,
  getCourseBySlug,
  interventionId,
  interventionTarget,
  primaryStandards,
  standardCode,
  standardTag,
  STANDARD_TAG_MEANING,
} from "@/lib/curriculum/catalog";
import { PLANNING_CYCLES, validateCourseBudget } from "@/lib/curriculum/budget";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  FactList,
  ScrollX,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { CAPACITY_CONTRACT } from "@/lib/rules/versions";

export const metadata: Metadata = {
  title: "Curriculum · Beyond.Ed",
  description: "Preview the pathway, units, lessons, standards, and expected evidence.",
};

/**
 * Teacher curriculum preview (blueprint §5).
 *
 * Read-only. Teachers preview the subject pathway, course version, unit,
 * instructional section, student lesson, standards, prerequisites, assessments,
 * resources, and expected evidence. Editing is a `curriculum_author`
 * authorization and lives in the organization workspace (CLAUDE.md §3).
 */
export default async function TeacherCurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course: courseParam } = await searchParams;
  const teacher = await requireUser();
  const d = db();

  const myCourses = [
    ...new Set(d.sections.filter((s) => s.teacherId === teacher.id).map((s) => s.courseTitle)),
  ];
  const selected =
    (courseParam ? getCourseBySlug(courseParam) : undefined) ??
    (myCourses[0] ? COURSES.find((c) => c.title === myCourses[0]) : undefined) ??
    COURSES[0];

  const report = validateCourseBudget(selected);
  const version = d.courseVersions.find(
    (v) => v.courseTitle === selected.title && v.status === "published",
  );

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Curriculum</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          The full grades 6&ndash;12 catalog: {COURSES.length} courses,{" "}
          {COURSES.reduce((n, c) => n + c.units.length, 0)} units, and{" "}
          {COURSES.reduce((n, c) => n + c.units.reduce((m, u) => m + u.lessons.length, 0), 0)}{" "}
          identified lessons, each with its primary standards assignment.
        </p>
      </header>

      <div className="mt-5">
        <Banner title="Preview only." tone="info">
          Editing curriculum is a separate authorization (<code>curriculum_author</code>),
          not part of teaching access. You can read every version here; you cannot
          change one.
        </Banner>
      </div>

      <nav aria-label="Courses" className="mt-6">
        {SUBJECTS.map((subject) => (
          <div key={subject} className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {subject}
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {COURSES.filter((c) => c.subject === subject).map((c) => (
                <li key={c.title}>
                  <Link
                    href={`/teacher/curriculum?course=${courseSlug(c.title)}`}
                    aria-current={c.title === selected.title ? "page" : undefined}
                    className={`inline-block rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${FOCUS_RING} ${
                      c.title === selected.title
                        ? "border-primary bg-primary text-white"
                        : "border-line bg-surface text-ink-muted hover:border-primary-line hover:text-primary"
                    }`}
                  >
                    {c.title}
                    {myCourses.includes(c.title) ? (
                      <span className="ml-1.5 opacity-70">· yours</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-4">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                {selected.title}
              </h2>
              <p className="mt-0.5 text-sm text-ink-muted">{selected.subject}</p>
            </div>
            <StatusChip
              label={report.valid ? "Budget validates" : "Budget does not validate"}
              tone={report.valid ? "positive" : "attention"}
            />
          </div>
          <div className="mt-4">
            <FactList
              columns={3}
              items={[
                { label: "Published version", value: version?.version ?? "none" },
                { label: "Pathway days", value: `${report.pathwayDays}` },
                { label: "Intervention capacity", value: `${report.interventionDays}` },
                { label: "Annual total", value: `${report.totalDays}` },
                { label: "Units", value: `${selected.units.length}` },
                {
                  label: "Identified lessons",
                  value: `${selected.units.reduce((n, u) => n + u.lessons.length, 0)}`,
                },
              ]}
            />
          </div>
          {selected.headline ? (
            <p className="mt-4 text-xs text-ink-muted">{selected.headline}</p>
          ) : null}
        </Card>
      </div>

      <section aria-labelledby="cycles" className="mt-8">
        <SectionHeading
          id="cycles"
          hint={`${CAPACITY_CONTRACT.pathwayDays} + ${CAPACITY_CONTRACT.interventionDays} = ${CAPACITY_CONTRACT.totalDays}. Ten flexible cycles, four intervention days each.`}
        >
          Annual capacity contract
        </SectionHeading>
        <Card>
          <ScrollX>
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Cycle</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Pathway</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Intervention</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Total</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Primary planning use</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {PLANNING_CYCLES.map((c) => (
                  <tr key={c.cycle}>
                    <th scope="row" className="px-5 py-2 text-left font-medium text-ink">{c.cycle}</th>
                    <td className="px-5 py-2 text-ink-muted">{c.pathwayDays}</td>
                    <td className="px-5 py-2 text-ink-muted">{c.interventionDays}</td>
                    <td className="px-5 py-2 text-ink-muted">{c.total}</td>
                    <td className="px-5 py-2 text-xs text-ink-muted">{c.use}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-line-strong font-semibold">
                  <th scope="row" className="px-5 py-2 text-left text-ink">Total</th>
                  <td className="px-5 py-2 text-ink">{CAPACITY_CONTRACT.pathwayDays}</td>
                  <td className="px-5 py-2 text-ink">{CAPACITY_CONTRACT.interventionDays}</td>
                  <td className="px-5 py-2 text-ink">{CAPACITY_CONTRACT.totalDays}</td>
                  <td className="px-5 py-2 text-xs text-ink-muted">Validated annual capacity</td>
                </tr>
              </tbody>
            </table>
          </ScrollX>
        </Card>
      </section>

      <section aria-labelledby="units" className="mt-10">
        <SectionHeading
          id="units"
          hint="Each lesson names its primary standards, the evidence it requires, and the support linked to it."
        >
          Units and lessons
        </SectionHeading>
        <div className="flex flex-col gap-4">
          {selected.units.map((unit) => {
            const lessonDays = unit.lessons.reduce((n, l) => n + l.days, 0);
            return (
              <Card key={unit.id}>
                <CardHeader
                  title={`Unit ${unit.id}. ${unit.name}`}
                  hint={`${unit.pathwayDays} pathway days · ${unit.lessons.length} lessons covering ${lessonDays} days`}
                />
                <ScrollX>
                  <table className="w-full min-w-[52rem] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-line text-left">
                        <th scope="col" className="px-5 py-3 font-semibold text-ink">Lesson</th>
                        <th scope="col" className="px-5 py-3 font-semibold text-ink">Sequence</th>
                        <th scope="col" className="px-5 py-3 font-semibold text-ink">Primary standards</th>
                        <th scope="col" className="px-5 py-3 font-semibold text-ink">Required evidence</th>
                        <th scope="col" className="px-5 py-3 font-semibold text-ink">Linked support</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {unit.lessons.map((lesson) => (
                        <tr key={lesson.code}>
                          <th scope="row" className="px-5 py-3 text-left align-top">
                            <span className="font-mono text-xs text-ink">{lesson.code}</span>
                            <span className="mt-0.5 block text-xs font-normal text-ink-muted">
                              Days {lesson.dayRange} ({lesson.days})
                            </span>
                          </th>
                          <td className="px-5 py-3 align-top text-xs text-ink">{lesson.sequence}</td>
                          <td className="px-5 py-3 align-top text-xs">
                            {primaryStandards(lesson).length === 0 ? (
                              <span className="text-ink-muted">
                                Readiness evidence — no new primary standard
                              </span>
                            ) : (
                              <ul className="space-y-0.5">
                                {primaryStandards(lesson).map((s) => {
                                  const tag = standardTag(s);
                                  return (
                                    <li key={s} className="font-mono text-ink">
                                      {standardCode(s)}
                                      {tag ? (
                                        <span
                                          className="ml-1 font-sans text-ink-muted"
                                          title={STANDARD_TAG_MEANING[tag] ?? tag}
                                        >
                                          [{tag}]
                                        </span>
                                      ) : null}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </td>
                          <td className="px-5 py-3 align-top text-xs">
                            <span className="font-mono text-ink">{assessmentId(lesson)}</span>
                            <span className="mt-0.5 block text-ink-muted">
                              {assessmentDescription(lesson)}
                            </span>
                          </td>
                          <td className="px-5 py-3 align-top text-xs">
                            <span className="font-mono text-ink">{interventionId(lesson)}</span>
                            <span className="mt-0.5 block text-ink-muted">
                              {interventionTarget(lesson)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollX>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
