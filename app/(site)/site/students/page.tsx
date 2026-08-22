import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/store";
import {
  Card,
  CardHeader,
  Empty,
  MetricTile,
  ScrollX,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { ENROLLMENT_STATUS_PRESENTATION } from "@/lib/enrollment/status";
import { studentMetrics } from "@/lib/views/metrics";
import { minutesBand, performanceBand, positionBand } from "@/lib/views/caseload";

export const metadata: Metadata = {
  title: "Students · Beyond.Ed",
  description: "Every student assigned to this site.",
};

const PAGE_SIZE = 40;

/**
 * Site-level student list (blueprint §6).
 *
 * Operational, not instructional: placement, pace, performance, and support
 * load. Entering a grade is a teacher action and is deliberately not offered
 * here — a site administrator does not silently change an official grade
 * (CLAUDE.md §3).
 */
export default async function SiteStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string; page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const admin = await requireUser();
  const d = db();

  const site = d.sites.find((s) => s.id === admin.siteId);
  const all = d.users
    .filter((u) => u.role === "student" && u.siteId === admin.siteId)
    .sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName),
    );

  const query = (params.q ?? "").trim().toLowerCase();
  const gradeFilter = params.grade ? Number(params.grade) : null;
  const filtered = all.filter((u) => {
    if (gradeFilter && u.gradeLevel !== gradeFilter) return false;
    if (query && !`${u.firstName} ${u.lastName}`.toLowerCase().includes(query)) return false;
    return true;
  });

  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const grades = [...new Set(all.map((u) => u.gradeLevel))]
    .filter((g): g is number => g !== null)
    .sort((a, b) => a - b);

  const unplaced = all.filter(
    (u) => !d.enrollments.some((e) => e.studentId === u.id),
  ).length;

  const queryString = (overrides: Record<string, string>) => {
    const next = new URLSearchParams();
    if (params.q) next.set("q", params.q);
    if (params.grade) next.set("grade", params.grade);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const s = next.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Students</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          Every student assigned to {site?.shortName}. Placement is set by
          authorized staff and is never inferred from age.
        </p>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MetricTile value={`${all.length}`} label="Students" caption="At this site" />
        <MetricTile
          value={`${grades.length}`}
          label="Grade levels"
          caption={grades.length ? `Grades ${grades[0]}–${grades[grades.length - 1]}` : "—"}
        />
        <MetricTile
          value={`${unplaced}`}
          label="Without a placement"
          caption="Needs a course assignment"
          tone={unplaced > 0 ? "attention" : "positive"}
        />
      </div>

      <section aria-labelledby="filter" className="mt-8">
        <SectionHeading id="filter">Find a student</SectionHeading>
        <Card className="p-5">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-[14rem] flex-1">
              <label htmlFor="q" className="text-sm font-medium text-ink">
                Name
              </label>
              <input
                id="q"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search this site"
                className={`mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ${FOCUS_RING}`}
              />
            </div>
            <div>
              <label htmlFor="grade" className="text-sm font-medium text-ink">
                Grade
              </label>
              <select
                id="grade"
                name="grade"
                defaultValue={params.grade ?? ""}
                className={`mt-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ${FOCUS_RING}`}
              >
                <option value="">All grades</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className={`rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-strong ${FOCUS_RING}`}
            >
              Apply
            </button>
            <p className="text-sm text-ink-muted" aria-live="polite">
              {filtered.length} of {all.length} students
            </p>
          </form>
        </Card>
      </section>

      <section aria-labelledby="roster" className="mt-8">
        <SectionHeading id="roster">
          Roster {pages > 1 ? `· page ${page} of ${pages}` : ""}
        </SectionHeading>
        {rows.length === 0 ? (
          <Empty>No student matches.</Empty>
        ) : (
          <Card>
            <CardHeader
              title={`${rows.length} shown`}
              hint="Pace, performance, and support load. Grade entry is a teacher action and is not offered here."
            />
            <ScrollX>
              <table className="w-full min-w-[52rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Student</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Grade</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Courses</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Position</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Performance</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Active minutes</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Enrollment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((student) => {
                    const metrics = studentMetrics(student);
                    const position = positionBand(metrics.positionOffset);
                    const performance = performanceBand(metrics.performancePercent);
                    const minutes = minutesBand(metrics.activeMinutes);
                    const status =
                      d.enrollments.find((e) => e.studentId === student.id)?.status ??
                      "pending";
                    return (
                      <tr key={student.id}>
                        <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                          {student.firstName} {student.lastName}
                        </th>
                        <td className="px-5 py-3 text-ink-muted">{student.gradeLevel}</td>
                        <td className="px-5 py-3 text-ink-muted">
                          {metrics.courses.length}
                        </td>
                        <td className="px-5 py-3">
                          <StatusChip label={position.label} tone={position.tone} />
                        </td>
                        <td className="px-5 py-3">
                          {performance ? (
                            <>
                              <StatusChip label={performance.label} tone={performance.tone} />
                              <span className="mt-0.5 block text-xs text-ink-muted">
                                {metrics.performancePercent}%
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-ink-muted">No graded work</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <StatusChip label={minutes.label} tone={minutes.tone} />
                        </td>
                        <td className="px-5 py-3">
                          <StatusChip
                            label={ENROLLMENT_STATUS_PRESENTATION[status].label}
                            tone={ENROLLMENT_STATUS_PRESENTATION[status].tone}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollX>
            {pages > 1 ? (
              <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
                {page > 1 ? (
                  <a
                    href={`/site/students${queryString({ page: String(page - 1) })}`}
                    className={`font-medium text-primary underline underline-offset-4 ${FOCUS_RING}`}
                  >
                    Previous
                  </a>
                ) : (
                  <span className="text-ink-muted">Previous</span>
                )}
                <span className="text-ink-muted">
                  Page {page} of {pages}
                </span>
                {page < pages ? (
                  <a
                    href={`/site/students${queryString({ page: String(page + 1) })}`}
                    className={`font-medium text-primary underline underline-offset-4 ${FOCUS_RING}`}
                  >
                    Next
                  </a>
                ) : (
                  <span className="text-ink-muted">Next</span>
                )}
              </div>
            ) : null}
          </Card>
        )}
      </section>
    </div>
  );
}
