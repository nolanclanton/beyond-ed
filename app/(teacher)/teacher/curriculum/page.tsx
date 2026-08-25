import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import {
  COURSES,
  SUBJECTS,
  SUBJECT_SHORT,
  courseSlug,
  getCourse,
  getCourseBySlug,
  lessonEvidence,
  lessonStage,
} from "@/lib/curriculum/catalog";
import { PLANNING_CYCLES, validateCourseBudget } from "@/lib/curriculum/budget";
import { nextCourses, priorCourses } from "@/lib/curriculum/pathways";
import { prerequisiteSupports } from "@/lib/curriculum/prerequisites";
import { coverageReport, describeStandard } from "@/lib/curriculum/standards";
import { supportById } from "@/lib/intervention/bank";
import { db } from "@/lib/db/store";
import {
  Card,
  FactList,
  ScrollX,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { CourseIdentity, LessonShape, UnitArc } from "@/lib/design/curriculum";
import { FOCUS_RING } from "@/lib/design/tokens";
import { CAPACITY_CONTRACT } from "@/lib/rules/versions";

export const metadata: Metadata = {
  title: "Curriculum · Beyond.Ed",
  description: "Preview the pathway, units, lessons, standards, and expected evidence.",
};

/**
 * Teacher curriculum preview (blueprint §5).
 *
 * Read-only. A teacher previews the subject pathway, the units, and every
 * lesson's standard, evidence, and linked supports — the supports especially,
 * because those are what an assignment will offer when a student stalls.
 * Editing is a `curriculum_author` authorization and lives in the organization
 * workspace (CLAUDE.md §3).
 *
 * A course is 135 lessons, so the unit is the unit of reading: each opens to
 * its fifteen.
 */
export default async function TeacherCurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; unit?: string }>;
}) {
  const { course: courseParam, unit: unitParam } = await searchParams;
  const teacher = await requireUser();
  const d = db();

  const myCourses = [
    ...new Set(d.sections.filter((s) => s.teacherId === teacher.id).map((s) => s.courseTitle)),
  ];
  const selected =
    (courseParam ? getCourseBySlug(courseParam) : undefined) ??
    (myCourses[0] ? getCourse(myCourses[0]) : undefined) ??
    COURSES[0];

  const report = validateCourseBudget(selected);
  const coverage = coverageReport(selected);
  const version = d.courseVersions.find(
    (v) => v.courseTitle === selected.title && v.status === "published",
  );
  const openUnit = unitParam ?? selected.units[0]?.id;
  const prior = priorCourses(selected.id);
  const next = nextCourses(selected.id);

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Curriculum</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          {COURSES.length} courses, nine units each, fifteen thirty-minute lessons per
          unit. Read-only — editing curriculum is a separate authorization.
        </p>
      </header>

      <nav aria-label="Courses" className="mt-6">
        {SUBJECTS.map((subject) => (
          <div key={subject} className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {SUBJECT_SHORT[subject]}
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {COURSES.filter((c) => c.subject === subject).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/teacher/curriculum?course=${courseSlug(c)}`}
                    aria-current={c.id === selected.id ? "page" : undefined}
                    className={`inline-block rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${FOCUS_RING} ${
                      c.id === selected.id
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
              <div className="mt-1.5">
                <CourseIdentity course={selected} />
              </div>
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
                {
                  label: "Days",
                  value: `${report.pathwayDays} pathway + ${report.interventionDays} support = ${report.totalDays}`,
                },
                { label: "Standards", value: `${coverage.assigned} · all scheduled` },
                {
                  label: "Comes after",
                  value:
                    prior.length > 0
                      ? prior.map((p) => p.course.title).join(", ")
                      : "Entry course",
                },
                {
                  label: "Leads to",
                  value:
                    next.length > 0
                      ? next.map((n) => n.course.title).join(", ")
                      : "End of the pathway",
                },
                { label: "Lesson length", value: "30 minutes, one course day" },
              ]}
            />
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <LessonShape />
          </div>
        </Card>
      </div>

      <section aria-labelledby="arc" className="mt-8">
        <SectionHeading id="arc" hint="Every unit in every course runs it, in this order.">
          The fifteen-lesson unit
        </SectionHeading>
        <Card className="p-5">
          <UnitArc />
        </Card>
      </section>

      <section aria-labelledby="units" className="mt-10">
        <SectionHeading
          id="units"
          hint="Open a unit to see its lessons, what each one claims, and the supports linked to it."
        >
          Units and lessons
        </SectionHeading>
        <div className="flex flex-col gap-3">
          {selected.units.map((unit) => (
            <details
              key={unit.id}
              className="rounded-xl border border-line bg-surface"
              open={unit.id === openUnit}
            >
              <summary
                className={`flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4 ${FOCUS_RING}`}
              >
                <span className="min-w-0">
                  <span className="text-base font-semibold text-ink">
                    {unit.order}. {unit.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-muted">
                    {unit.essentialQuestion}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-ink-muted">
                  days {unit.startDay}&ndash;{unit.endDay}
                </span>
              </summary>

              <ScrollX>
                <table className="w-full min-w-[56rem] border-collapse border-t border-line text-sm">
                  <thead>
                    <tr className="border-b border-line text-left">
                      <th scope="col" className="px-5 py-3 font-semibold text-ink">
                        Day
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold text-ink">
                        Lesson
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold text-ink">
                        Standard
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold text-ink">
                        Evidence
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold text-ink">
                        Supports behind it
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {unit.lessons.map((lesson) => {
                      const standard = describeStandard(lesson.primaryStandard);
                      const supports = prerequisiteSupports(lesson.code)
                        .map((p) => supportById(p.id))
                        .filter((s): s is NonNullable<typeof s> => Boolean(s));
                      return (
                        <tr key={lesson.code}>
                          <th scope="row" className="px-5 py-3 text-left align-top">
                            <span className="text-sm font-semibold text-ink">
                              {lesson.day}
                            </span>
                            <span className="mt-0.5 block text-xs font-normal text-ink-muted">
                              {lessonStage(lesson).type}
                            </span>
                          </th>
                          <td className="px-5 py-3 align-top">
                            <span className="text-sm text-ink">{lesson.title}</span>
                            <span className="mt-0.5 block font-mono text-xs text-ink-muted">
                              {lesson.code}
                            </span>
                          </td>
                          <td className="px-5 py-3 align-top text-xs">
                            <span className="font-mono text-ink">
                              {lesson.primaryStandard}
                            </span>
                            {standard ? (
                              <span className="mt-0.5 block text-ink-muted">
                                {standard.description}
                              </span>
                            ) : null}
                            {lesson.practice.length > 0 ? (
                              <span className="mt-0.5 block text-ink-muted">
                                {lesson.practice.join(" · ")}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-5 py-3 align-top text-xs text-ink-muted">
                            {lessonEvidence(lesson)}
                          </td>
                          <td className="px-5 py-3 align-top text-xs">
                            <ul className="space-y-0.5">
                              {supports.map((support) => (
                                <li key={support.id}>
                                  <span className="font-mono text-ink-muted">
                                    {support.id}
                                  </span>{" "}
                                  <span className="text-ink">{support.skill}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollX>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="cycles" className="mt-10">
        <SectionHeading
          id="cycles"
          hint={`${CAPACITY_CONTRACT.pathwayDays} + ${CAPACITY_CONTRACT.interventionDays} = ${CAPACITY_CONTRACT.totalDays}. Ten cycles, four intervention days each.`}
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
    </div>
  );
}
