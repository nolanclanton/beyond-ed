import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/clock";
import { getCourse } from "@/lib/curriculum/catalog";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  Empty,
  MetricTile,
  ScrollX,
  SectionHeading,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { DEFAULT_SCALE, courseGrade, gradeHistory } from "@/lib/grades/gradebook";
import { RULE_VERSIONS } from "@/lib/rules/versions";
import { studentMetrics } from "@/lib/views/metrics";
import { coursesFor } from "@/lib/views/student";

export const metadata: Metadata = {
  title: "Grades · Beyond.Ed",
  description: "Official course and category results, and how each was calculated.",
};

const TABS = [
  { id: "summary", label: "Overall summary" },
  { id: "by-unit", label: "Grades by unit" },
  { id: "breakdown", label: "Grading breakdown" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/**
 * Grades (blueprint §4).
 *
 * OFFICIAL results only. No mastery estimate, readiness percentage, or blended
 * score appears anywhere on this page — this file does not import
 * `/lib/mastery` and nothing here joins a grade to a readiness value
 * (CLAUDE.md §4).
 */
export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const student = await requireUser();
  const d = db();
  const courses = coursesFor(student);
  const metrics = studentMetrics(student);
  const tab: Tab = (TABS.map((t) => t.id) as string[]).includes(tabParam ?? "")
    ? (tabParam as Tab)
    : "summary";

  // Category rollups across every course, so the headline tiles name the same
  // categories the gradebook actually uses.
  const categoryTotals = new Map<string, { earned: number; possible: number }>();
  for (const progress of courses) {
    const grade = courseGrade(progress.enrollment.id, progress.enrollment.courseTitle);
    for (const c of grade.categories) {
      const running = categoryTotals.get(c.category.name) ?? { earned: 0, possible: 0 };
      running.earned += c.pointsEarned;
      running.possible += c.pointsPossible;
      categoryTotals.set(c.category.name, running);
    }
  }
  const categoryPercent = (name: string) => {
    const t = categoryTotals.get(name);
    if (!t || t.possible === 0) return null;
    return Math.round((t.earned / t.possible) * 1000) / 10;
  };

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Grades</h1>
        <p className="mt-2 max-w-2xl text-base text-ink-muted">
          Your official results, and exactly how each one was calculated.
        </p>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          value={metrics.performancePercent === null ? "—" : `${metrics.performancePercent}%`}
          label="Overall grade"
          caption="Weighted across your courses"
          tone="info"
        />
        <MetricTile
          value={metrics.completionPercent === null ? "—" : `${metrics.completionPercent}%`}
          label="Work completed"
          caption="Not a grade — how much is finished"
        />
        {[...categoryTotals.keys()].map((name) => (
          <MetricTile
            key={name}
            value={categoryPercent(name) === null ? "—" : `${categoryPercent(name)}%`}
            label={name}
            caption="Across every course"
          />
        ))}
      </div>

      <div className="mt-5">
        <Banner title="These are official grades." tone="info">
          Readiness estimates are a different measure and live on the{" "}
          <Link href="/progress" className={`font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}>
            Progress
          </Link>{" "}
          page. They are never mixed into the numbers above. A support you
          complete does not change a grade on its own — only your teacher can
          change a grade, and every change is recorded.
        </Banner>
      </div>

      <nav aria-label="Grade views" className="mt-6">
        <ul className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <li key={t.id}>
              <Link
                href={`/grades?tab=${t.id}`}
                aria-current={t.id === tab ? "page" : undefined}
                className={`inline-block rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${FOCUS_RING} ${
                  t.id === tab
                    ? "border-primary bg-primary text-white"
                    : "border-line bg-surface text-ink-muted hover:border-primary-line hover:text-primary"
                }`}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {tab === "summary" ? (
        <div className="mt-6 flex flex-col gap-6">
          {courses.map((progress) => {
            const grade = courseGrade(progress.enrollment.id, progress.enrollment.courseTitle);
            const history = gradeHistory(progress.enrollment.id);
            const superseded = new Set(
              history.map((r) => r.supersedesGradeId).filter((x): x is string => x !== null),
            );
            return (
              <Card key={progress.enrollment.id}>
                <CardHeader
                  title={progress.course.title}
                  hint={`Course version ${progress.courseVersion} · calculated with ${grade.ruleVersion}`}
                  action={
                    <div className="text-right">
                      <p className="text-2xl font-bold text-ink">
                        {grade.percent === null ? "—" : `${grade.percent}%`}
                      </p>
                      <p className="text-sm font-medium text-ink-muted">
                        {grade.letter ?? "No graded work yet"}
                      </p>
                    </div>
                  }
                />
                <div className="p-5">
                  <ScrollX>
                    <table className="w-full min-w-[34rem] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-line text-left">
                          <th scope="col" className="py-2 pr-4 font-semibold text-ink">Category</th>
                          <th scope="col" className="py-2 pr-4 font-semibold text-ink">Points</th>
                          <th scope="col" className="py-2 pr-4 font-semibold text-ink">Percent</th>
                          <th scope="col" className="py-2 font-semibold text-ink">Weight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {grade.categories.map((c) => (
                          <tr key={c.category.id}>
                            <th scope="row" className="py-2 pr-4 text-left font-medium text-ink">
                              {c.category.name}
                            </th>
                            <td className="py-2 pr-4 text-ink-muted">
                              {c.pointsPossible === 0
                                ? "No work recorded"
                                : `${c.pointsEarned} of ${c.pointsPossible}`}
                            </td>
                            <td className="py-2 pr-4 text-ink-muted">
                              {c.percent === null ? "—" : `${c.percent}%`}
                            </td>
                            <td className="py-2 text-ink-muted">
                              {Math.round(c.weight * 100)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollX>

                  <details className="mt-5">
                    <summary
                      className={`inline-block cursor-pointer text-sm font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
                    >
                      How this was calculated
                    </summary>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-muted">
                      {grade.explanation.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ol>
                  </details>

                  <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-ink-muted">
                    Contributing work
                  </h3>
                  {history.length === 0 ? (
                    <div className="mt-2">
                      <Empty>No graded work recorded yet.</Empty>
                    </div>
                  ) : (
                    <ScrollX>
                      <table className="mt-2 w-full min-w-[40rem] border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-line text-left">
                            <th scope="col" className="py-2 pr-4 font-semibold text-ink">Assessment</th>
                            <th scope="col" className="py-2 pr-4 font-semibold text-ink">Lesson</th>
                            <th scope="col" className="py-2 pr-4 font-semibold text-ink">Result</th>
                            <th scope="col" className="py-2 pr-4 font-semibold text-ink">Recorded</th>
                            <th scope="col" className="py-2 font-semibold text-ink">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {history.map((record) => {
                            const enteredBy = d.users.find((u) => u.id === record.enteredByUserId);
                            const isSuperseded = superseded.has(record.id);
                            return (
                              <tr key={record.id} className={isSuperseded ? "text-ink-muted" : ""}>
                                <th scope="row" className="py-2 pr-4 text-left font-mono text-xs font-medium">
                                  {record.assessmentId}
                                </th>
                                <td className="py-2 pr-4 font-mono text-xs">{record.lessonCode}</td>
                                <td className="py-2 pr-4">
                                  {record.pointsEarned} of {record.pointsPossible}
                                </td>
                                <td className="py-2 pr-4 text-xs">
                                  {formatDate(record.recordedAt)}
                                  {enteredBy ? ` · ${enteredBy.firstName} ${enteredBy.lastName}` : ""}
                                </td>
                                <td className="py-2 text-xs">
                                  {isSuperseded ? (
                                    <span>Replaced by a later entry — kept for the record</span>
                                  ) : record.supersedesGradeId ? (
                                    <span className="font-medium text-ink">Current (a change)</span>
                                  ) : (
                                    <span className="font-medium text-ink">Current</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </ScrollX>
                  )}
                  <p className="mt-3 text-xs text-ink-muted">
                    A grade change never overwrites the original. The earlier result
                    stays on this list so the history is always readable.
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      {tab === "by-unit" ? (
        <div className="mt-6 flex flex-col gap-6">
          {courses.map((progress) => {
            const course = getCourse(progress.enrollment.courseTitle);
            const records = gradeHistory(progress.enrollment.id);
            const superseded = new Set(
              records.map((r) => r.supersedesGradeId).filter((x): x is string => x !== null),
            );
            const current = records.filter((r) => !superseded.has(r.id));
            if (!course) return null;

            return (
              <Card key={progress.enrollment.id}>
                <CardHeader
                  title={progress.course.title}
                  hint="Results grouped by the unit the work belongs to."
                />
                <ul className="divide-y divide-line">
                  {course.units.map((unit) => {
                    const rows = current.filter((r) =>
                      unit.lessons.some((l) => l.code === r.lessonCode),
                    );
                    const earned = rows.reduce((n, r) => n + r.pointsEarned, 0);
                    const possible = rows.reduce((n, r) => n + r.pointsPossible, 0);
                    return (
                      <li key={unit.id} className="px-5 py-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-ink">
                            Unit {unit.id}. {unit.name}
                          </p>
                          <p className="text-sm font-medium text-ink-muted">
                            {possible === 0
                              ? "No graded work yet"
                              : `${earned} of ${possible} · ${Math.round((earned / possible) * 1000) / 10}%`}
                          </p>
                        </div>
                        {rows.length > 0 ? (
                          <ul className="mt-1.5 space-y-0.5">
                            {rows.map((r) => (
                              <li key={r.id} className="text-xs text-ink-muted">
                                <span className="font-mono">{r.lessonCode}</span> ·{" "}
                                {r.assessmentId} · {r.pointsEarned}/{r.pointsPossible}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>
      ) : null}

      {tab === "breakdown" ? (
        <div className="mt-6 flex flex-col gap-6">
          <Card>
            <CardHeader
              title="How a grade is produced"
              hint={`Grading rule ${RULE_VERSIONS.grading}. Stored with every record so a past result recomputes exactly.`}
            />
            <div className="p-5">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-ink">
                <li>
                  Each piece of graded work records points earned and points
                  possible, in one category.
                </li>
                <li>
                  Each category totals its points and becomes a percentage.
                </li>
                <li>
                  Categories are combined by weight. A category with no recorded
                  work is left out, and the remaining weights are rescaled to
                  total 100% — so an empty category never counts as a zero.
                </li>
                <li>
                  Missing work is shown separately and is not counted as a zero.
                </li>
                <li>
                  A change writes a new record that supersedes the old one. The
                  original stays readable.
                </li>
              </ol>
            </div>
          </Card>

          <Card>
            <CardHeader title="Categories and weights" hint="Per course." />
            <ScrollX>
              <table className="w-full min-w-[34rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Course</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Category</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Weight</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">What counts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {courses.flatMap((progress) =>
                    d.gradeCategories
                      .filter((c) => c.courseTitle === progress.enrollment.courseTitle)
                      .map((c) => (
                        <tr key={c.id}>
                          <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                            {progress.course.title}
                          </th>
                          <td className="px-5 py-2.5 text-ink-muted">{c.name}</td>
                          <td className="px-5 py-2.5 text-ink-muted">
                            {Math.round(c.weight * 100)}%
                          </td>
                          <td className="px-5 py-2.5 text-xs text-ink-muted">
                            {c.name === "Assessments"
                              ? "Common assessments and performance tasks"
                              : "Diagnostic probes, exit tickets, and reasoning checks"}
                          </td>
                        </tr>
                      )),
                  )}
                </tbody>
              </table>
            </ScrollX>
          </Card>

          <Card>
            <CardHeader title="Letter scale" hint="Applied to the weighted total." />
            <ScrollX>
              <table className="w-full min-w-[20rem] border-collapse text-sm">
                <tbody className="divide-y divide-line">
                  {DEFAULT_SCALE.map((s) => (
                    <tr key={s.letter}>
                      <th scope="row" className="px-5 py-2 text-left font-medium text-ink">
                        {s.letter}
                      </th>
                      <td className="px-5 py-2 text-ink-muted">{s.min}% and above</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollX>
          </Card>
        </div>
      ) : null}

      {tab === "summary" ? (
        <section aria-labelledby="missing" className="mt-10">
          <SectionHeading id="missing" hint="Work that is expected and has not been turned in.">
            Missing work
          </SectionHeading>
          <Empty>
            Nothing is marked missing. Missing work is shown separately and is never
            counted as a zero in the calculation above.
          </Empty>
        </section>
      ) : null}
    </div>
  );
}
