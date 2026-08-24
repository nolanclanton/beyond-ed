import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { canAuthorCurriculum } from "@/lib/auth/scope";
import { formatDateTime } from "@/lib/clock";
import { COURSES, getCourse } from "@/lib/curriculum/catalog";
import { validateCourseBudget } from "@/lib/curriculum/budget";
import { CURRICULUM_STATUS_PRESENTATION } from "@/lib/curriculum/publication";
import { publicationGate, sectionsOnVersion } from "@/lib/curriculum/authoring";
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
import { CAPACITY_CONTRACT, RULE_VERSIONS } from "@/lib/rules/versions";

import { CurriculumMoveForm } from "./curriculum-forms";

export const metadata: Metadata = {
  title: "Curriculum governance · Beyond.Ed",
  description: "Draft, review, approve, publish, and retire course versions.",
};

/**
 * Curriculum governance (blueprint §6, CLAUDE.md §7).
 *
 * Draft -> In review -> Approved -> Published -> Retired. Only a holder of the
 * `curriculum_author` authorization moves a version forward — an org admin
 * without it sees the same information and no controls.
 *
 * Publication is gated on 135 + 40 = 175. The gate is shown before the control.
 */
export default async function CurriculumGovernancePage() {
  const actor = await requireUser();
  const d = db();
  const canAuthor = canAuthorCurriculum(actor);

  const versions = [...d.courseVersions].sort(
    (a, b) => a.courseTitle.localeCompare(b.courseTitle) || a.version.localeCompare(b.version),
  );
  const interesting = versions.filter((v) => v.status !== "published");
  const published = versions.filter((v) => v.status === "published");

  const invalid = COURSES.map((c) => validateCourseBudget(c)).filter((r) => !r.valid);

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Curriculum governance
        </h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          {versions.length} course versions across {COURSES.length} courses.
        </p>
      </header>

      <div className="mt-5">
        {canAuthor ? (
          <Banner title="You hold the curriculum-author authorization." tone="info">
            Publication is gated on the annual capacity contract:{" "}
            {CAPACITY_CONTRACT.pathwayDays} pathway days +{" "}
            {CAPACITY_CONTRACT.interventionDays} intervention-capacity days ={" "}
            {CAPACITY_CONTRACT.totalDays}. A version that does not validate cannot
            be published, and the reason is shown rather than hidden.
          </Banner>
        ) : (
          <Banner title="You can read curriculum but not change it." tone="notice">
            Curriculum editing is a separate authorization from administrative
            access. Your role does not carry it, so no lifecycle control is shown
            below — the information is still fully readable.
          </Banner>
        )}
      </div>

      <div className="mt-4">
        <Banner title="Lesson content is written in the studio." tone="neutral">
          Scripts, video, and quiz items are built in the{" "}
          <Link
            href="/org/curriculum/build"
            className={`font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
          >
            lesson studio
          </Link>
          , against a draft version. This page is where a version moves through
          review, approval, and publication.
        </Banner>
      </div>

      <div className="mt-4">
        <Banner
          title="Publishing a new version does not change a running section."
          tone="neutral"
        >
          A roster section keeps the course version it was created with. A
          published edit cannot alter prior evidence or the rule version used for a
          historical calculation.
        </Banner>
      </div>

      <section aria-labelledby="budget" className="mt-8">
        <SectionHeading
          id="budget"
          hint={`Rule ${RULE_VERSIONS.dayBudget}. Validated across every course in the catalog.`}
        >
          Day-budget validation
        </SectionHeading>
        {invalid.length === 0 ? (
          <Banner
            title={`All ${COURSES.length} courses validate ${CAPACITY_CONTRACT.pathwayDays} + ${CAPACITY_CONTRACT.interventionDays} = ${CAPACITY_CONTRACT.totalDays}.`}
            tone="positive"
          >
            No course consumes the intervention reserve by expanding lesson counts.
          </Banner>
        ) : (
          <Banner title={`${invalid.length} course(s) do not validate.`} tone="urgent">
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {invalid.map((r) => (
                <li key={r.courseTitle}>
                  {r.courseTitle}: {r.findings.filter((f) => f.severity === "error")[0]?.message}
                </li>
              ))}
            </ul>
          </Banner>
        )}
      </section>

      <section aria-labelledby="lifecycle" className="mt-10">
        <SectionHeading
          id="lifecycle"
          hint="Versions that are not yet published, and the next legal move for each."
        >
          In the pipeline
        </SectionHeading>
        <div className="flex flex-col gap-4">
          {interesting.map((version) => {
            const course = getCourse(version.courseTitle);
            const report = course ? validateCourseBudget(course) : null;
            const gate = publicationGate(version.id);
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
                  action={<StatusChip label={presentation.label} tone={presentation.tone} />}
                />
                <div className="p-5">
                  <FactList
                    columns={3}
                    items={[
                      { label: "Status", value: presentation.meaning },
                      {
                        label: "Pathway days",
                        value: report ? `${report.pathwayDays}` : "—",
                      },
                      {
                        label: "Annual total",
                        value: report ? `${report.totalDays}` : "—",
                      },
                      {
                        label: "Sections on this version",
                        value: `${sectionsOnVersion(version.id)}`,
                      },
                      {
                        label: "Published",
                        value: version.publishedAt ? formatDateTime(version.publishedAt) : "—",
                      },
                      {
                        label: "Next legal move",
                        value: next.replace(/_/g, " "),
                      },
                    ]}
                  />

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
          Published versions ({published.length})
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
                        {v.courseTitle}
                      </th>
                      <td className="px-5 py-2.5 font-mono text-xs text-ink-muted">{v.version}</td>
                      <td className="px-5 py-2.5 text-ink-muted">{sectionsOnVersion(v.id)}</td>
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
