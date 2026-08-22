import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  Empty,
  MetricTile,
  ScrollX,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { periodLabel } from "@/lib/calendar/periods";
import {
  MINUTES_BANDS,
  PERFORMANCE_BANDS,
  POSITION_BANDS,
  caseload,
} from "@/lib/views/caseload";

export const metadata: Metadata = {
  title: "Caseload · Beyond.Ed",
  description: "Every student you teach: position, performance, and active minutes.",
};

const SORTS = [
  { id: "name", label: "Name" },
  { id: "position", label: "Furthest behind first" },
  { id: "performance", label: "Lowest performance first" },
  { id: "minutes", label: "Fewest active minutes first" },
] as const;

/**
 * Teacher caseload (blueprint §5 — saved views and filters help teachers act by
 * subject, grade band, roster section, course, pace, active minutes, grade, and
 * intervention status).
 *
 * Three readings per student, side by side and never combined: where they sit
 * against the plan, what their official results are, and how much meaningful
 * work they have done. Each is a written band, not a colour alone.
 */
export default async function CaseloadPage({
  searchParams,
}: {
  searchParams: Promise<{
    position?: string;
    performance?: string;
    minutes?: string;
    sort?: string;
    section?: string;
  }>;
}) {
  const params = await searchParams;
  const teacher = await requireUser();
  const d = db();

  const sections = d.sections.filter((s) => s.teacherId === teacher.id);
  const rows = caseload(teacher, {
    position: params.position,
    performance: params.performance,
    minutes: params.minutes,
    sort: (params.sort as "name" | undefined) ?? "name",
    section: params.section,
  });
  const all = caseload(teacher, { section: params.section });

  const filtered =
    Boolean(params.position) || Boolean(params.performance) || Boolean(params.minutes);
  const behind = all.filter((r) => r.metrics.positionOffset <= -3).length;
  const lowPerformance = all.filter(
    (r) => r.metrics.performancePercent !== null && r.metrics.performancePercent < 60,
  ).length;
  const lowMinutes = all.filter((r) => r.metrics.activeMinutes <= 60).length;

  const section = params.section
    ? sections.find((s) => s.id === params.section)
    : sections[0];

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Caseload</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          Every student across your {sections.length} roster section
          {sections.length === 1 ? "" : "s"}. Select a student to open their
          progress record and gradebook.
        </p>
        {section ? (
          <p className="mt-1.5 text-sm text-ink-muted">
            {periodLabel(section.cycle, section.dayInCycle)}
          </p>
        ) : null}
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile value={`${all.length}`} label="Students" caption="In your sections" />
        <MetricTile
          value={`${behind}`}
          label="3 or more behind"
          caption="Against the section plan"
          tone={behind > 0 ? "attention" : "neutral"}
        />
        <MetricTile
          value={`${lowPerformance}`}
          label="Under 60%"
          caption="Official results"
          tone={lowPerformance > 0 ? "attention" : "neutral"}
        />
        <MetricTile
          value={`${lowMinutes}`}
          label="60 or fewer minutes"
          caption="Meaningful activity"
          tone={lowMinutes > 0 ? "attention" : "neutral"}
        />
      </div>

      <div className="mt-5">
        <Banner title="Three readings, kept separate." tone="info">
          Position is pace against the plan. Performance is the official
          gradebook. Active minutes is meaningful work, not time with a page
          open. A student can be behind and doing well, or on pace and
          struggling — combining these into one number would hide exactly the
          case worth your attention.
        </Banner>
      </div>

      <section aria-labelledby="filters" className="mt-8">
        <SectionHeading id="filters" hint="Filters apply together. Clearing one keeps the rest.">
          Filter and sort
        </SectionHeading>
        <Card className="p-5">
          <form method="get" className="flex flex-col gap-4">
            {sections.length > 1 ? (
              <div>
                <label htmlFor="section" className="text-sm font-medium text-ink">
                  Roster section
                </label>
                <select
                  id="section"
                  name="section"
                  defaultValue={params.section ?? ""}
                  className={`mt-1 w-full max-w-md rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ${FOCUS_RING}`}
                >
                  <option value="">All of my sections</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.courseTitle} · {s.period}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="position" className="text-sm font-medium text-ink">
                  Current position
                </label>
                <select
                  id="position"
                  name="position"
                  defaultValue={params.position ?? ""}
                  className={`mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ${FOCUS_RING}`}
                >
                  <option value="">Any</option>
                  {POSITION_BANDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="performance" className="text-sm font-medium text-ink">
                  Performance
                </label>
                <select
                  id="performance"
                  name="performance"
                  defaultValue={params.performance ?? ""}
                  className={`mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ${FOCUS_RING}`}
                >
                  <option value="">Any</option>
                  {PERFORMANCE_BANDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="minutes" className="text-sm font-medium text-ink">
                  Active minutes
                </label>
                <select
                  id="minutes"
                  name="minutes"
                  defaultValue={params.minutes ?? ""}
                  className={`mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ${FOCUS_RING}`}
                >
                  <option value="">Any</option>
                  {MINUTES_BANDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sort" className="text-sm font-medium text-ink">
                  Sort by
                </label>
                <select
                  id="sort"
                  name="sort"
                  defaultValue={params.sort ?? "name"}
                  className={`mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ${FOCUS_RING}`}
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className={`rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-strong ${FOCUS_RING}`}
              >
                Apply
              </button>
              {filtered ? (
                <Link
                  href="/teacher/caseload"
                  className={`text-sm font-medium text-primary underline underline-offset-4 ${FOCUS_RING}`}
                >
                  Clear filters
                </Link>
              ) : null}
              <p className="text-sm text-ink-muted" aria-live="polite">
                Showing {rows.length} of {all.length} students
              </p>
            </div>
          </form>
        </Card>
      </section>

      <section aria-labelledby="roster" className="mt-8">
        <SectionHeading id="roster">Student roster</SectionHeading>
        {rows.length === 0 ? (
          <Empty>No student matches those filters.</Empty>
        ) : (
          <Card>
            <CardHeader
              title={`${rows.length} student${rows.length === 1 ? "" : "s"}`}
              hint="Every band is written out, not signalled by colour alone."
            />
            <ScrollX>
              <table className="w-full min-w-[52rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Student</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Position</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Performance</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Active minutes</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Open support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((row) => (
                    <tr key={row.student.id}>
                      <th scope="row" className="px-5 py-3 text-left">
                        <Link
                          href={`/teacher/students/${row.student.id}`}
                          className={`font-medium text-primary underline underline-offset-4 ${FOCUS_RING}`}
                        >
                          {row.student.firstName} {row.student.lastName}
                        </Link>
                        <span className="mt-0.5 block text-xs font-normal text-ink-muted">
                          Grade {row.student.gradeLevel}
                        </span>
                      </th>
                      <td className="px-5 py-3">
                        <StatusChip label={row.position.label} tone={row.position.tone} />
                        <span className="mt-0.5 block text-xs text-ink-muted">
                          {row.metrics.positionOffset === 0
                            ? "On the section plan"
                            : `${Math.abs(row.metrics.positionOffset)} lesson${
                                Math.abs(row.metrics.positionOffset) === 1 ? "" : "s"
                              } ${row.metrics.positionOffset < 0 ? "behind" : "ahead"}`}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {row.performance ? (
                          <>
                            <StatusChip
                              label={row.performance.label}
                              tone={row.performance.tone}
                            />
                            <span className="mt-0.5 block text-xs text-ink-muted">
                              {row.metrics.performancePercent}% official
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-ink-muted">No graded work yet</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusChip label={row.minutes.label} tone={row.minutes.tone} />
                        <span className="mt-0.5 block text-xs text-ink-muted">
                          {row.metrics.activeMinutes} minutes recorded
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-muted">
                        {row.openPlans === 0 ? "—" : row.openPlans}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollX>
          </Card>
        )}
      </section>
    </div>
  );
}
