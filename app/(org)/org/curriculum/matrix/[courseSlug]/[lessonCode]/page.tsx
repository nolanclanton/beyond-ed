import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import {
  courseSlug,
  getCourseBySlug,
  lessonPosition,
  lessonStage,
  locateLesson,
  type CatalogCourse,
} from "@/lib/curriculum/catalog";
import { describeStandard } from "@/lib/curriculum/standards";
import { CURRICULUM_STATUS_PRESENTATION } from "@/lib/curriculum/publication";
import {
  dependentsIn,
  foundationBlocker,
  governedFoundations,
  importanceMeaning,
  isFoundational,
  MAX_FOUNDATIONS,
} from "@/lib/curriculum/foundations";
import {
  effectiveCourse,
  locateInCourse,
  structureGate,
  versionsForCourseId,
} from "@/lib/curriculum/structure";
import { SUPPORTS, supportById } from "@/lib/intervention/bank";
import {
  Banner,
  Card,
  Empty,
  FactList,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { FoundationRow, ImportanceChip } from "@/lib/design/matrix";
import { FOCUS_RING } from "@/lib/design/tokens";

import {
  AddFoundationForm,
  FoundationImportanceForm,
  MoveLessonForm,
  RetireFoundationForm,
} from "../../governance-forms";

export const metadata: Metadata = {
  title: "Lesson foundations · Beyond.Ed",
  description:
    "What one lesson rests on, what rests on it, and where it runs in its unit.",
};

/**
 * One lesson's foundations.
 *
 * Two questions, answered on one screen: what has to come before this lesson,
 * and what breaks if it moves. The first is what a governor edits; the second
 * is the cost of editing it, which is why both are here rather than in two
 * places.
 *
 * Every control on this page needs a DRAFT version and the curriculum authoring
 * authorization. Without both, the page reads — it does not offer a control it
 * cannot honour (CLAUDE.md §12).
 */
export default async function LessonFoundationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseSlug: string; lessonCode: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { courseSlug: slug, lessonCode } = await params;
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
  const at = locateInCourse(course, lessonCode);
  if (!at) notFound();

  const gate = selected ? structureGate(actor, selected.id) : null;
  const editable = Boolean(gate?.editable);

  const { lesson, unit } = at;
  const stage = lessonStage(lesson);
  const position = lessonPosition(lesson);
  const standard = describeStandard(lesson.primaryStandard);
  const workbook = locateLesson(lesson.code);
  const moved = workbook ? workbook.lesson.day !== lesson.day : false;

  const foundations = governedFoundations(versionId, lesson.code);
  const active = foundations.filter((f) => !f.retired);
  const retired = foundations.filter((f) => f.retired);
  const dependents = dependentsIn(versionId, course, lesson.code);

  const named = new Set(active.map((f) => f.targetId));
  const candidateLessons = course.units
    .flatMap((u) => u.lessons)
    .filter(
      (l) =>
        !named.has(l.code) &&
        foundationBlocker(course, lesson.code, l.code) === null,
    )
    .map((l) => ({ id: l.code, label: `Day ${l.day} — ${l.title}` }));
  // Every support in the bank, narrowed by the same rule the write enforces:
  // it must be able to return a student into this course. Filtering by subject
  // instead would silently drop a legal cross-subject support the moment the
  // workbook records one.
  const candidateSupports = SUPPORTS.filter(
    (s) => !named.has(s.id) && foundationBlocker(course, lesson.code, s.id) === null,
  ).map((s) => ({ id: s.id, label: `${s.id} — ${s.skill} (${s.category})` }));

  const query = versionId ? `?version=${versionId}` : "";
  const targetName = (targetId: string, kind: "lesson" | "support") => {
    if (kind === "support") {
      const support = supportById(targetId);
      return support ? `${support.skill} — ${support.category}` : "Not in the bank";
    }
    const there = locateInCourse(course, targetId);
    return there ? `Day ${there.lesson.day} — ${there.lesson.title}` : "Not in this course";
  };

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/org/curriculum/matrix" className={`hover:underline ${FOCUS_RING}`}>
          Curriculum matrix
        </Link>
        <span aria-hidden="true"> / </span>
        <Link
          href={`/org/curriculum/matrix/${courseSlug(baseline)}${query}`}
          className={`hover:underline ${FOCUS_RING}`}
        >
          {baseline.title}
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{lesson.code}</span>
      </nav>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-ink-muted">{lesson.code}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
            {lesson.title}
          </h1>
          <p className="mt-2 max-w-3xl text-base text-ink-muted">{lesson.objective}</p>
        </div>
        {selected ? (
          <StatusChip
            label={`${selected.version} · ${CURRICULUM_STATUS_PRESENTATION[selected.status].label}`}
            tone={CURRICULUM_STATUS_PRESENTATION[selected.status].tone}
          />
        ) : (
          <StatusChip label="Workbook baseline" tone="neutral" />
        )}
      </header>

      <div className="mt-5">
        <Card className="p-5">
          <FactList
            columns={3}
            items={[
              { label: "Unit", value: `${unit.order}. ${unit.title}` },
              { label: "Course day", value: `${lesson.day} of 135` },
              { label: "Position in the unit", value: `${position} of ${unit.lessons.length}` },
              { label: "Lesson type", value: stage.type },
              { label: "Evidence it produces", value: stage.evidence },
              {
                label: "Primary standard",
                value: standard
                  ? `${standard.code} — ${standard.description.slice(0, 90)}${standard.description.length > 90 ? "…" : ""}`
                  : lesson.primaryStandard || "—",
              },
            ]}
          />
        </Card>
      </div>

      {moved && workbook ? (
        <div className="mt-5">
          <Banner title="This version runs the lesson somewhere else." tone="notice">
            <p>
              The workbook places it on day {workbook.lesson.day}; this version
              runs it on day {lesson.day}. Its type follows its position in the
              unit arc, so it is now a {stage.type.toLowerCase()} rather than
              whatever the workbook position made it. The lesson code has not
              changed and nothing that refers to it has moved.
            </p>
          </Banner>
        </div>
      ) : null}

      {gate && !gate.editable ? (
        <div className="mt-5">
          <Banner title="Reading only." tone="notice">
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {gate.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </Banner>
        </div>
      ) : null}

      <section aria-labelledby="foundations" className="mt-9">
        <SectionHeading
          id="foundations"
          hint="What a student needs before this lesson. The workbook records that each link exists and what role it plays; how hard it binds is governed here."
        >
          What this lesson rests on ({active.length})
        </SectionHeading>

        {active.length === 0 ? (
          <Empty>This lesson names no prior learning.</Empty>
        ) : (
          <Card>
            <ul className="divide-y divide-line">
              {active.map((foundation) => (
                <FoundationRow
                  key={foundation.targetId}
                  foundation={foundation}
                  targetName={targetName(foundation.targetId, foundation.kind)}
                  targetHref={
                    foundation.kind === "lesson"
                      ? `/org/curriculum/matrix/${courseSlug(baseline)}/${foundation.targetId}${query}`
                      : undefined
                  }
                  action={
                    editable && selected ? (
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <FoundationImportanceForm
                          versionId={selected.id}
                          lessonCode={lesson.code}
                          targetId={foundation.targetId}
                          importance={foundation.importance}
                          note={foundation.note}
                        />
                        <RetireFoundationForm
                          versionId={selected.id}
                          lessonCode={lesson.code}
                          targetId={foundation.targetId}
                          retired={false}
                        />
                      </div>
                    ) : null
                  }
                />
              ))}
            </ul>
          </Card>
        )}

        {editable && selected ? (
          <div className="mt-4">
            <Card className="p-5">
              <p className="text-sm text-ink-muted">
                {active.length} of {MAX_FOUNDATIONS} foundations named. Only
                lessons this version runs before day {lesson.day}, and supports
                that can return a student into {baseline.title}, can be added —
                anything else would send a student somewhere they cannot come
                back from.
              </p>
              <div className="mt-3">
                <AddFoundationForm
                  versionId={selected.id}
                  lessonCode={lesson.code}
                  candidateLessons={candidateLessons}
                  candidateSupports={candidateSupports}
                />
              </div>
            </Card>
          </div>
        ) : null}
      </section>

      {retired.length > 0 ? (
        <section aria-labelledby="retired" className="mt-10">
          <SectionHeading
            id="retired"
            hint="Links the workbook records that this version no longer treats as prior learning. Nothing was deleted — the record stays readable."
          >
            Retired in this version ({retired.length})
          </SectionHeading>
          <Card>
            <ul className="divide-y divide-line">
              {retired.map((foundation) => (
                <FoundationRow
                  key={foundation.targetId}
                  foundation={foundation}
                  targetName={targetName(foundation.targetId, foundation.kind)}
                  action={
                    editable && selected ? (
                      <RetireFoundationForm
                        versionId={selected.id}
                        lessonCode={lesson.code}
                        targetId={foundation.targetId}
                        retired
                      />
                    ) : null
                  }
                />
              ))}
            </ul>
          </Card>
        </section>
      ) : null}

      <section aria-labelledby="dependents" className="mt-10">
        <SectionHeading
          id="dependents"
          hint="Later lessons that name this one as prior learning. This is the cost of moving it."
        >
          What rests on this lesson ({dependents.length})
        </SectionHeading>

        {dependents.length === 0 ? (
          <Empty>
            No later lesson in this course names this one as prior learning.
          </Empty>
        ) : (
          <Card>
            <ul className="divide-y divide-line">
              {dependents.map((dependent) => {
                const there = locateInCourse(course, dependent.lessonCode);
                return (
                  <li
                    key={dependent.lessonCode}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/org/curriculum/matrix/${courseSlug(baseline)}/${dependent.lessonCode}${query}`}
                        className={`text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                      >
                        {there ? `Day ${there.lesson.day} — ${there.lesson.title}` : dependent.lessonCode}
                      </Link>
                      <p className="mt-0.5 text-sm text-ink-muted">
                        {dependent.role} ·{" "}
                        {importanceMeaning(dependent.importance).toLowerCase()}
                      </p>
                    </div>
                    <ImportanceChip importance={dependent.importance} />
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
        {dependents.some((d) => isFoundational(d.importance)) ? (
          <p className="mt-3 text-sm text-ink-muted">
            {dependents.filter((d) => isFoundational(d.importance)).length} of
            these treat this lesson as foundational. Moving it later than any of
            them will block publication until the conflict is resolved.
          </p>
        ) : null}
      </section>

      {editable && selected ? (
        <section aria-labelledby="position" className="mt-10">
          <SectionHeading
            id="position"
            hint="Within the unit. The unit keeps its lesson count, so the 135 + 40 = 175 day budget cannot drift."
          >
            Where this lesson runs
          </SectionHeading>
          <Card className="p-5">
            <MoveLessonForm
              versionId={selected.id}
              lessonCode={lesson.code}
              currentPosition={position}
              unitTitle={unit.title}
              lessonCount={unit.lessons.length}
            />
          </Card>
        </section>
      ) : null}

      <section aria-labelledby="content" className="mt-10">
        <SectionHeading
          id="content"
          hint="Foundations say what has to come first. What a student actually reads is written in the studio."
        >
          The lesson itself
        </SectionHeading>
        <Card className="p-5">
          {selected ? (
            <Link
              href={`/org/curriculum/build/${selected.id}/${lesson.code}`}
              className={`inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-strong ${FOCUS_RING}`}
            >
              {editable ? "Build this lesson" : "Read this lesson"} &rarr;
            </Link>
          ) : (
            <p className="text-sm text-ink-muted">
              This course has no version yet, so there is nothing to write into.
              Open a draft in the lesson studio first.
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}
