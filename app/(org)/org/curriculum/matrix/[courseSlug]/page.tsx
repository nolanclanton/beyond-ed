import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import {
  courseSlug,
  getCourseBySlug,
  type CatalogCourse,
} from "@/lib/curriculum/catalog";
import { validateCourseBudget } from "@/lib/curriculum/budget";
import { CURRICULUM_STATUS_PRESENTATION } from "@/lib/curriculum/publication";
import {
  courseFoundationMatrix,
  foundationConflicts,
  governanceSummary,
  supportLoad,
} from "@/lib/curriculum/foundations";
import {
  effectiveCourse,
  structureChanges,
  structureGate,
  versionsForCourseId,
} from "@/lib/curriculum/structure";
import { supportById } from "@/lib/intervention/bank";
import {
  Banner,
  Card,
  Empty,
  ScrollX,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { CountStrip, CourseIdentity } from "@/lib/design/curriculum";
import { MatrixCell, MatrixLegend } from "@/lib/design/matrix";
import { FOCUS_RING } from "@/lib/design/tokens";

import {
  MoveUnitForm,
  ResetSequenceForm,
  UnitFramingForm,
} from "../governance-forms";

export const metadata: Metadata = {
  title: "Course matrix · Beyond.Ed",
  description:
    "One course as a unit-by-lesson grid, with what each lesson rests on and what rests on it.",
};

/**
 * One course, as a matrix.
 *
 * A list of 135 lessons hides the thing a governor needs to see: where the
 * dependency load sits. The grid puts every lesson of every unit on one screen
 * with two numbers — what it rests on, and what rests on it — so the lessons
 * that are expensive to move are visible before anyone moves one.
 *
 * The whole surface is scoped to a VERSION. Without one it reads the workbook
 * and offers nothing; with a draft selected it governs that draft, and the
 * controls disappear rather than going inert on anything else (CLAUDE.md §12).
 */
export default async function CourseMatrixPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseSlug: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { courseSlug: slug } = await params;
  const { version: requestedVersion } = await searchParams;
  const actor = await requireUser();

  const baseline = getCourseBySlug(slug);
  if (!baseline) notFound();

  const versions = versionsForCourseId(baseline.id);
  const selected =
    versions.find((v) => v.id === requestedVersion) ??
    versions.find((v) => v.status === "draft") ??
    versions.find((v) => v.status === "published") ??
    versions[0];

  const course: CatalogCourse = selected ? effectiveCourse(selected) : baseline;
  const versionId = selected?.id ?? null;
  const gate = selected ? structureGate(actor, selected.id) : null;
  const editable = Boolean(gate?.editable);

  const matrix = courseFoundationMatrix(versionId, course);
  const changes = selected ? structureChanges(selected) : [];
  const conflicts = selected ? foundationConflicts(selected) : [];
  const governance = selected
    ? governanceSummary(selected.id)
    : { weighted: 0, foundational: 0, added: 0, retired: 0 };
  const budget = validateCourseBudget(course);

  const load = [...supportLoad(versionId, course).entries()]
    .map(([id, lessons]) => ({ support: supportById(id), id, lessons }))
    .sort((a, b) => b.lessons.length - a.lessons.length);

  const totalLinks = [...matrix.values()].reduce((n, m) => n + m.foundations, 0);
  const arcPositions = Array.from(
    { length: course.units[0]?.lessons.length ?? 15 },
    (_, i) => i + 1,
  );

  const href = (extra: Record<string, string> = {}) => {
    const query = new URLSearchParams({
      ...(versionId ? { version: versionId } : {}),
      ...extra,
    });
    const suffix = query.toString();
    return suffix ? `?${suffix}` : "";
  };

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/org/curriculum/matrix" className={`hover:underline ${FOCUS_RING}`}>
          Curriculum matrix
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{baseline.title}</span>
      </nav>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {baseline.title}
          </h1>
          <div className="mt-2">
            <CourseIdentity course={baseline} />
          </div>
        </div>
        {selected ? (
          <StatusChip
            label={`${selected.version} · ${CURRICULUM_STATUS_PRESENTATION[selected.status].label}`}
            tone={CURRICULUM_STATUS_PRESENTATION[selected.status].tone}
          />
        ) : (
          <StatusChip label="No version yet" tone="neutral" />
        )}
      </header>

      <section aria-labelledby="version" className="mt-5">
        <Card className="p-5">
          <h2 id="version" className="text-sm font-semibold text-ink">
            Which version are you looking at?
          </h2>
          {versions.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">
              This course has no version yet, so the grid below reads the
              workbook itself. Open a draft in the lesson studio to govern it.
            </p>
          ) : (
            <form method="get" className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="version-select" className="text-sm font-medium text-ink">
                  Course version
                </label>
                <select
                  id="version-select"
                  name="version"
                  defaultValue={versionId ?? ""}
                  className={`mt-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ${FOCUS_RING}`}
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.version} — {CURRICULUM_STATUS_PRESENTATION[v.status].label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className={`rounded-lg border border-primary-line bg-surface px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary-surface ${FOCUS_RING}`}
              >
                Show this version
              </button>
            </form>
          )}
          {gate && !gate.editable ? (
            <div className="mt-4">
              <Banner title="Governing controls are not available here." tone="notice">
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {gate.blockers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </Banner>
            </div>
          ) : null}
        </Card>
      </section>

      <div className="mt-5">
        <Card className="p-5">
          <CountStrip
            items={[
              { value: `${course.units.length}`, label: "Units" },
              {
                value: `${course.units.reduce((n, u) => n + u.lessons.length, 0)}`,
                label: "Lessons",
              },
              { value: `${totalLinks}`, label: "Foundation links" },
              { value: `${governance.weighted}`, label: "Governed" },
              { value: `${governance.foundational}`, label: "Marked foundational" },
              { value: `${conflicts.length}`, label: "Links that do not hold" },
            ]}
          />
          <div className="mt-4 border-t border-line pt-4 text-sm">
            {budget.valid ? (
              <p className="text-ink-muted">
                Day budget holds: {budget.pathwayDays} pathway +{" "}
                {budget.interventionDays} intervention = {budget.totalDays}.
                Re-sequencing moves lessons inside their unit, so the budget
                cannot drift.
              </p>
            ) : (
              <p className="text-urgent">
                {budget.findings.filter((f) => f.severity === "error")[0]?.message}
              </p>
            )}
          </div>
        </Card>
      </div>

      {conflicts.length > 0 ? (
        <div className="mt-5">
          <Banner
            title={`${conflicts.length} foundation ${conflicts.length === 1 ? "link does" : "links do"} not hold in this sequence.`}
            tone="urgent"
          >
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {conflicts.slice(0, 8).map((c) => (
                <li key={c.message}>{c.message}</li>
              ))}
            </ul>
            {conflicts.length > 8 ? (
              <p className="mt-1">…and {conflicts.length - 8} more.</p>
            ) : null}
            <p className="mt-1">
              This version cannot be published until each one is fixed — either
              move the lesson back, or retire the link on the lesson that names
              it.
            </p>
          </Banner>
        </div>
      ) : null}

      {changes.length > 0 && selected ? (
        <section aria-labelledby="adapted" className="mt-8">
          <SectionHeading
            id="adapted"
            hint="What this version does differently from the workbook. The workbook itself is unchanged, and every other version still reads it."
          >
            Adapted for this version ({changes.length})
          </SectionHeading>
          <Card>
            <ul className="divide-y divide-line">
              {changes.map((change) => (
                <li key={change.summary} className="px-5 py-3 text-sm text-ink">
                  {change.summary}
                </li>
              ))}
            </ul>
            {editable ? (
              <div className="border-t border-line p-5">
                <ResetSequenceForm
                  versionId={selected.id}
                  changeCount={changes.length}
                />
              </div>
            ) : null}
          </Card>
        </section>
      ) : null}

      <section aria-labelledby="grid" className="mt-10">
        <SectionHeading
          id="grid"
          hint="A row is a unit, a column is a position in the fifteen-lesson arc. Open a cell to govern what that lesson rests on."
        >
          The lesson matrix
        </SectionHeading>

        <Card>
          <div className="p-5">
            <MatrixLegend />
          </div>
          <ScrollX>
            <div className="min-w-[62rem] px-5 pb-5">
              <div className="flex gap-2 pl-[14rem]">
                {arcPositions.map((n) => (
                  <div
                    key={n}
                    className="w-14 shrink-0 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted"
                  >
                    {n}
                  </div>
                ))}
              </div>
              <ul className="mt-2 flex flex-col gap-2">
                {course.units.map((unit) => (
                  <li key={unit.id} className="flex items-center gap-2">
                    <div className="w-[13rem] shrink-0 pr-2">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
                        Unit {unit.order} · days {unit.startDay}–{unit.endDay}
                      </p>
                      <p className="truncate text-sm font-semibold text-ink" title={unit.title}>
                        {unit.title}
                      </p>
                    </div>
                    {unit.lessons.map((lesson) => {
                      const summary = matrix.get(lesson.code);
                      return (
                        <MatrixCell
                          key={lesson.code}
                          href={`/org/curriculum/matrix/${courseSlug(baseline)}/${lesson.code}${href()}`}
                          cell={{
                            lessonCode: lesson.code,
                            day: lesson.day,
                            title: lesson.title,
                            foundations: summary?.foundations ?? 0,
                            foundational: summary?.foundational ?? 0,
                            dependents: summary?.dependents ?? 0,
                            conflicts: summary?.conflicts ?? 0,
                          }}
                        />
                      );
                    })}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollX>
        </Card>
      </section>

      <section aria-labelledby="sequence" className="mt-10">
        <SectionHeading
          id="sequence"
          hint="The order the course runs in, and the framing students read. Both belong to this version alone."
        >
          Unit sequence
        </SectionHeading>

        <div className="flex flex-col gap-3">
          {course.units.map((unit, index) => (
            <Card key={unit.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Unit {unit.order} · days {unit.startDay}–{unit.endDay} ·{" "}
                    {unit.lessons.length} lessons
                  </p>
                  <h3 className="mt-0.5 text-base font-semibold text-ink">
                    {unit.title}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-ink-muted">
                    {unit.essentialQuestion}
                  </p>
                </div>
                {editable && selected ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <MoveUnitForm
                      versionId={selected.id}
                      unitId={unit.id}
                      unitTitle={unit.title}
                      position={index + 1}
                      direction="up"
                      disabled={index === 0}
                    />
                    <MoveUnitForm
                      versionId={selected.id}
                      unitId={unit.id}
                      unitTitle={unit.title}
                      position={index + 1}
                      direction="down"
                      disabled={index === course.units.length - 1}
                    />
                  </div>
                ) : null}
              </div>
              {editable && selected ? (
                <div className="mt-4 border-t border-line pt-4">
                  <UnitFramingForm
                    versionId={selected.id}
                    unitId={unit.id}
                    title={unit.title}
                    essentialQuestion={unit.essentialQuestion}
                  />
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="supports" className="mt-10">
        <SectionHeading
          id="supports"
          hint="Supports this course's lessons actually name as prior learning, heaviest first. A support here is a skill this course keeps depending on."
        >
          Intervention supports this course rests on ({load.length})
        </SectionHeading>

        {load.length === 0 ? (
          <Empty>
            No lesson in this course names a support as prior learning.
          </Empty>
        ) : (
          <Card>
            <ScrollX>
              <table className="w-full min-w-[46rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">
                      Support
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">
                      Skill it rebuilds
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">
                      Category
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">
                      Lessons that name it
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">
                      First one
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {load.map((entry) => (
                    <tr key={entry.id}>
                      <th
                        scope="row"
                        className="px-5 py-2.5 text-left font-mono text-xs text-ink"
                      >
                        {entry.id}
                      </th>
                      <td className="px-5 py-2.5 text-ink">
                        {entry.support?.skill ?? "Not in the bank"}
                      </td>
                      <td className="px-5 py-2.5 text-ink-muted">
                        {entry.support?.category ?? "—"}
                      </td>
                      <td className="px-5 py-2.5 text-ink">{entry.lessons.length}</td>
                      <td className="px-5 py-2.5">
                        <Link
                          href={`/org/curriculum/matrix/${courseSlug(baseline)}/${entry.lessons[0]}${href()}`}
                          className={`font-mono text-xs text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                        >
                          {entry.lessons[0]}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollX>
          </Card>
        )}
      </section>

      <p className="mt-9 text-sm text-ink-muted">
        Writing what a student reads — the script, the canvas, the materials, and
        the questions — happens in{" "}
        <Link
          href={selected ? `/org/curriculum/build/${selected.id}` : "/org/curriculum/build"}
          className={`font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
        >
          the lesson studio
        </Link>
        .
      </p>
    </div>
  );
}
