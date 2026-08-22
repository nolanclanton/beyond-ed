import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  Empty,
  ScrollX,
  SectionHeading,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { MIN_GROUP_SIZE } from "@/lib/rules/versions";
import { courseAtSite, districtRollup } from "@/lib/views/metrics";
import { MetricTile } from "@/lib/design/primitives";

import { ExportForm } from "./export-form";

export const metadata: Metadata = {
  title: "Organization · Beyond.Ed",
  description: "Cross-site health, outcomes, and governance.",
};

/**
 * Organization administration (blueprint §6).
 *
 * Cross-site comparisons show context and sample-size limits rather than
 * creating a public leaderboard, and any aggregate below the configured minimum
 * group size is SUPPRESSED rather than rounded (CLAUDE.md §3).
 *
 * Completion, official grades, and readiness are reported as distinct measures
 * and are never combined.
 */
export default async function OrgPage() {
  const actor = await requireUser();
  const d = db();

  if (actor.role === "curriculum_author") {
    return (
      <div className="py-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Curriculum authorization
          </h1>
          <p className="mt-2 max-w-2xl text-base text-ink-muted">
            You hold the curriculum-author authorization. It is independent of
            administrative access.
          </p>
        </header>
        <div className="mt-5">
          <Banner title="This authorization does not grant access to student records." tone="info">
            Curriculum editing is a separate authorization from ordinary
            administrative access. You can draft, review, approve, publish, and
            retire course versions; you cannot read enrollment, evidence, mastery,
            or grades.
          </Banner>
        </div>
        <p className="mt-6">
          <Link
            href="/org/curriculum"
            className={`text-base font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
          >
            Go to curriculum governance
          </Link>
        </p>
      </div>
    );
  }

  const plans = d.interventions;
  const returned = plans.filter((p) => p.status === "returned_to_pathway");
  const escalated = plans.filter((p) => p.status === "escalated");
  const transferPassed = plans.filter((p) => p.transferPassed === true);
  const district = districtRollup(actor.orgId);

  // The slice most likely to fall below the reporting threshold: one course at
  // one site. Grade 12 mathematics branches are the clearest case.
  const smallSlices = district.sites.flatMap((site) =>
    ["Precalculus", "Statistics", "Quantitative Reasoning"].map((title) =>
      courseAtSite(site.siteId, title),
    ),
  );

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          {d.organizations.find((o) => o.id === actor.orgId)?.name}
        </h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          Cross-site health, outcomes, curriculum governance, intervention
          configuration, permissions, and audit.
        </p>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          value={`${district.sites.length}`}
          label="Sites"
          caption="Active locations"
        />
        <MetricTile
          value={`${district.students}`}
          label="Students"
          caption={`${district.enrollments} course enrollments`}
        />
        <MetricTile value={`${district.teachers}`} label="Teachers" caption="Active staff" />
        <MetricTile
          value={
            district.performancePercent === null ? "—" : `${district.performancePercent}%`
          }
          label="District performance"
          caption="Current learning period"
          tone="info"
        />
      </div>

      <div className="mt-5">
        <Banner
          title={`Aggregates below ${MIN_GROUP_SIZE} students are suppressed, not rounded.`}
          tone="notice"
        >
          Every site is above the threshold, so the comparison below reports.
          Smaller slices — a single grade-12 mathematics branch at one site —
          fall under it, and those are listed further down showing suppression
          rather than a number. Never expose an individual through a filtered
          aggregate.
        </Banner>
      </div>

      <section aria-labelledby="cross-site" className="mt-8">
        <SectionHeading
          id="cross-site"
          hint="Context and sample-size limits, not a leaderboard. Completion, official grades, and readiness stay distinct."
        >
          Cross-site outcomes
        </SectionHeading>
        <Card>
          <ScrollX>
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Site</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Students</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Teachers</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Completion</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {district.sites.map((row) => (
                  <tr key={row.siteId}>
                    <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                      {row.shortName}
                    </th>
                    <td className="px-5 py-3 text-ink-muted">{row.students}</td>
                    <td className="px-5 py-3 text-ink-muted">{row.teachers}</td>
                    <td className="px-5 py-3 text-ink-muted">
                      {row.suppressed ? (
                        <span className="text-xs">
                          Suppressed — fewer than {MIN_GROUP_SIZE} students
                        </span>
                      ) : row.completionPercent === null ? (
                        "—"
                      ) : (
                        `${row.completionPercent}%`
                      )}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {row.suppressed ? (
                        <span className="text-xs">
                          Suppressed — fewer than {MIN_GROUP_SIZE} students
                        </span>
                      ) : row.performancePercent === null ? (
                        "—"
                      ) : (
                        `${row.performancePercent}%`
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-line-strong font-semibold">
                  <th scope="row" className="px-5 py-3 text-left text-ink">District</th>
                  <td className="px-5 py-3 text-ink">{district.students}</td>
                  <td className="px-5 py-3 text-ink">{district.teachers}</td>
                  <td className="px-5 py-3 text-ink">
                    {district.completionPercent === null ? "—" : `${district.completionPercent}%`}
                  </td>
                  <td className="px-5 py-3 text-ink">
                    {district.performancePercent === null ? "—" : `${district.performancePercent}%`}
                  </td>
                </tr>
              </tbody>
            </table>
          </ScrollX>
          <p className="border-t border-line px-5 py-3 text-xs text-ink-muted">
            Completion and performance are separate columns from separate
            calculations. Completion is how much of the reached work is
            finished; performance is the official gradebook. They are never
            averaged together, and neither is mixed with readiness.
          </p>
        </Card>

        <div className="mt-4">
          <Card>
            <CardHeader
              title="Where suppression bites"
              hint={`One course at one site. Grade-12 mathematics branches split a small cohort three ways, so most of these fall under the ${MIN_GROUP_SIZE}-student threshold.`}
            />
            <ScrollX>
              <table className="w-full min-w-[40rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Site</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Course</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Students</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {smallSlices
                    .filter((slice) => slice.enrollments > 0)
                    .map((slice) => (
                      <tr key={`${slice.siteId}-${slice.courseTitle}`}>
                        <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                          {d.sites.find((s) => s.id === slice.siteId)?.shortName}
                        </th>
                        <td className="px-5 py-2.5 text-xs text-ink-muted">
                          {slice.courseTitle}
                        </td>
                        <td className="px-5 py-2.5 text-ink-muted">{slice.enrollments}</td>
                        <td className="px-5 py-2.5 text-xs">
                          {slice.suppressed ? (
                            <span className="font-medium text-recall">
                              Suppressed — fewer than {MIN_GROUP_SIZE}
                            </span>
                          ) : (
                            <span className="text-ink-muted">
                              {slice.performancePercent}%
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </ScrollX>
          </Card>
        </div>
      </section>

      <section aria-labelledby="intervention-outcomes" className="mt-10">
        <SectionHeading
          id="intervention-outcomes"
          hint="Successful return and transfer, not completion alone."
        >
          Intervention outcomes
        </SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-2xl font-bold text-ink">{plans.length}</p>
            <p className="text-sm text-ink-muted">Plans on record</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-ink">{returned.length}</p>
            <p className="text-sm text-ink-muted">Returned to the pathway</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-ink">{transferPassed.length}</p>
            <p className="text-sm text-ink-muted">Transfer checks passed</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-ink">{escalated.length}</p>
            <p className="text-sm text-ink-muted">Escalated to a person</p>
          </Card>
        </div>
      </section>

      <section aria-labelledby="exports" className="mt-10">
        <SectionHeading
          id="exports"
          hint="Purpose-bound: requester, purpose, scope, row count, and timestamp are recorded, and an audit event is written in the same transaction."
        >
          Exports
        </SectionHeading>
        <Card className="p-5">
          <ExportForm idempotencySalt={`${actor.id}:${d.exports.length}`} />
        </Card>

        {d.exports.length === 0 ? (
          <div className="mt-4">
            <Empty>No exports have been requested.</Empty>
          </div>
        ) : (
          <Card className="mt-4">
            <CardHeader title="Export log" hint={`${d.exports.length} recorded`} />
            <ScrollX>
              <table className="w-full min-w-[40rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Requested by</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Purpose</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Scope</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Rows</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {d.exports.map((e) => {
                    const who = d.users.find((u) => u.id === e.requestedByUserId);
                    return (
                      <tr key={e.id}>
                        <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                          {who?.firstName} {who?.lastName}
                        </th>
                        <td className="px-5 py-2.5 text-xs text-ink-muted">{e.purpose}</td>
                        <td className="px-5 py-2.5 text-xs text-ink-muted">{e.scope}</td>
                        <td className="px-5 py-2.5 text-ink-muted">{e.rowCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollX>
          </Card>
        )}
      </section>
    </div>
  );
}
