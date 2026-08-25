import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { canAuthorCurriculum } from "@/lib/auth/scope";
import { formatDateTime } from "@/lib/clock";
import { COURSES, courseSlug, getCourse } from "@/lib/curriculum/catalog";
import { validateCourseBudget } from "@/lib/curriculum/budget";
import { coverageGaps } from "@/lib/curriculum/standards";
import { CURRICULUM_STATUS_PRESENTATION } from "@/lib/curriculum/publication";
import {
  publicationGate,
  sectionsOnVersion,
  versionAdaptationSummary,
} from "@/lib/curriculum/authoring";
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
import { CountStrip } from "@/lib/design/curriculum";
import { FOCUS_RING } from "@/lib/design/tokens";
import { CAPACITY_CONTRACT, RULE_VERSIONS } from "@/lib/rules/versions";

import { CurriculumMoveForm } from "./curriculum-forms";

export const metadata: Metadata = {
  title: "Versions · Beyond.Ed",
  description: "Draft, review, approve, publish, and retire course versions.",
};

/**
 * Curriculum versions (blueprint §6, CLAUDE.md §7).
 *
 * Draft -> In review -> Approved -> Published -> Retired. Only a holder of the
 * `curriculum_author` authorization moves a version forward — an org admin
 * without it sees the same information and no controls.
 *
 * Publication is gated four times: on the day budget, on standards coverage, on
 * structural integrity, and on the foundation map. Every gate is shown as a
 * result rather than described as a rule.
 */
export default async function CurriculumVersionsPage() {
  const actor = await requireUser();
  const d = db();
  const canAuthor = canAuthorCurriculum(actor);

  const versions = [...d.courseVersions].sort(
    (a, b) =>
      a.courseTitle.localeCompare(b.courseTitle) || a.version.localeCompare(b.version),
  );
  const inPipeline = versions.filter((v) => v.status !== "published");
  const published = versions.filter((v) => v.status === "published");

  const budgetFailures = COURSES.map((c) => validateCourseBudget(c)).filter(
    (r) => !r.valid,
  );
  const coverageFailures = coverageGaps();
  const gatesHold = budgetFailures.length === 0 && coverageFailures.length === 0;

  return (
    <div className="py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Versions</h1>
          <p className="mt-2 max-w-3xl text-base text-ink-muted">
            A roster section keeps the version it was created with, so publishing a
            revision never changes what a running class is being taught.
          </p>
        </div>
        {canAuthor ? null : (
          <StatusChip label="Read-only for your role" tone="neutral" />
        )}
      </header>

      <div className="mt-5">
        <Card className="p-5">
          <CountStrip
            items={[
              { value: `${COURSES.length}`, label: "Courses" },
              { value: `${versions.length}`, label: "Versions" },
              { value: `${published.length}`, label: "Published" },
              { value: `${inPipeline.length}`, label: "In the pipeline" },
            ]}
          />
        </Card>
      </div>

      <section aria-labelledby="gates" className="mt-8">
        <SectionHeading
          id="gates"
          hint={`Rule ${RULE_VERSIONS.dayBudget}. Recomputed across every course in the catalog.`}
        >
          Publication gates
        </SectionHeading>

        {gatesHold ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-5">
              <StatusChip label="Day budget" tone="positive" />
              <p className="mt-2 text-sm text-ink">
                All {COURSES.length} courses validate {CAPACITY_CONTRACT.pathwayDays} +{" "}
                {CAPACITY_CONTRACT.interventionDays} = {CAPACITY_CONTRACT.totalDays}.
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                No course consumes the intervention reserve by expanding lesson
                counts.
              </p>
            </Card>
            <Card className="p-5">
              <StatusChip label="Standards coverage" tone="positive" />
              <p className="mt-2 text-sm text-ink">
                Every assigned standard is scheduled by at least one lesson.
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Recomputed from the lessons, not read from a stored count.
              </p>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {budgetFailures.length > 0 ? (
              <Banner
                title={`${budgetFailures.length} course(s) fail the day budget.`}
                tone="urgent"
              >
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {budgetFailures.map((r) => (
                    <li key={r.courseTitle}>
                      {r.courseTitle}:{" "}
                      {r.findings.filter((f) => f.severity === "error")[0]?.message}
                    </li>
                  ))}
                </ul>
              </Banner>
            ) : null}
            {coverageFailures.length > 0 ? (
              <Banner
                title={`${coverageFailures.length} course(s) have a standards gap.`}
                tone="urgent"
              >
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {coverageFailures.map((r) => (
                    <li key={r.courseId}>
                      {r.courseTitle}: {r.gaps.length} unscheduled,{" "}
                      {r.orphanLessons.length} lessons out of scope.
                    </li>
                  ))}
                </ul>
              </Banner>
            ) : null}
          </div>
        )}
      </section>

      <section aria-labelledby="pipeline" className="mt-10">
        <SectionHeading
          id="pipeline"
          hint="Versions that are not yet published, and the next legal move for each."
        >
          In the pipeline ({inPipeline.length})
        </SectionHeading>
        <div className="flex flex-col gap-4">
          {inPipeline.map((version) => {
            const course = getCourse(version.courseTitle);
            const report = course ? validateCourseBudget(course) : null;
            const gate = publicationGate(version.id);
            const adapted = versionAdaptationSummary(version.id);
            const next =
              version.status === "draft"
                ? ("in_review" as const)
                : version.status === "in_review"
                  ? ("approved" as const)
                  : version.status === "approved"
                    ? ("published" as const)
                    : ("retired" as const);
            const presentation = CURRICULUM_STATUS_PRESENTATION[version.status];
            return (
              <Card key={version.id}>
                <CardHeader
                  title={`${version.courseTitle} ${version.version}`}
                  hint={version.notes}
                  action={
                    <StatusChip label={presentation.label} tone={presentation.tone} />
                  }
                />
                <div className="p-5">
                  <FactList
                    columns={3}
                    items={[
                      { label: "Status", value: presentation.meaning },
                      {
                        label: "Day budget",
                        value: report
                          ? `${report.pathwayDays} + ${report.interventionDays} = ${report.totalDays}`
                          : "—",
                      },
                      {
                        label: "Standards coverage",
                        value: `${gate.coverage.covered} of ${gate.coverage.assigned} scheduled`,
                      },
                      {
                        label: "Sections on this version",
                        value: `${sectionsOnVersion(version.id)}`,
                      },
                      {
                        label: "Published",
                        value: version.publishedAt
                          ? formatDateTime(version.publishedAt)
                          : "—",
                      },
                      { label: "Next legal move", value: next.replace(/_/g, " ") },
                      {
                        label: "Adapted from the workbook",
                        value:
                          adapted.structure.length === 0
                            ? "Runs the workbook sequence"
                            : `${adapted.structure.length} sequencing or framing change${adapted.structure.length === 1 ? "" : "s"}`,
                      },
                      {
                        label: "Foundations governed",
                        value:
                          adapted.governance.weighted === 0
                            ? "None weighted yet"
                            : `${adapted.governance.weighted} weighted · ${adapted.governance.foundational} foundational${adapted.governance.retired > 0 ? ` · ${adapted.governance.retired} retired` : ""}`,
                      },
                    ]}
                  />

                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <Link
                      href={`/org/curriculum/build/${version.id}`}
                      className={`font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                    >
                      Open in the studio
                    </Link>
                    {course ? (
                      <Link
                        href={`/org/curriculum/matrix/${courseSlug(course)}?version=${version.id}`}
                        className={`font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                      >
                        Govern the sequence and foundations
                      </Link>
                    ) : null}
                    {course ? (
                      <Link
                        href={`/org/curriculum/courses/${courseSlug(course)}`}
                        className={`font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                      >
                        See the course plan
                      </Link>
                    ) : null}
                  </div>

                  {canAuthor ? (
                    <div className="mt-5">
                      <CurriculumMoveForm
                        versionId={version.id}
                        to={next}
                        idempotencySalt={`${version.id}:${version.status}`}
                        blocked={next === "published" && !gate.eligible}
                        blockers={gate.blockers}
                      />
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="published" className="mt-10">
        <SectionHeading
          id="published"
          hint="Every published version, with the number of roster sections pinned to it."
        >
          Published ({published.length})
        </SectionHeading>
        <Card>
          <ScrollX>
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Course</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Version</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Sections</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Budget</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Published</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {published.map((v) => {
                  const course = getCourse(v.courseTitle);
                  const report = course ? validateCourseBudget(course) : null;
                  return (
                    <tr key={v.id}>
                      <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                        {course ? (
                          <Link
                            href={`/org/curriculum/courses/${courseSlug(course)}`}
                            className={`text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                          >
                            {v.courseTitle}
                          </Link>
                        ) : (
                          v.courseTitle
                        )}
                      </th>
                      <td className="px-5 py-2.5 font-mono text-xs text-ink-muted">
                        {v.version}
                      </td>
                      <td className="px-5 py-2.5 text-ink-muted">
                        {sectionsOnVersion(v.id)}
                      </td>
                      <td className="px-5 py-2.5 text-xs">
                        {report?.valid ? (
                          <span className="text-positive">
                            {report.pathwayDays} + {report.interventionDays} ={" "}
                            {report.totalDays}
                          </span>
                        ) : (
                          <span className="text-urgent">Does not validate</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-ink-muted">
                        {v.publishedAt ? formatDateTime(v.publishedAt) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollX>
        </Card>
      </section>
    </div>
  );
}
