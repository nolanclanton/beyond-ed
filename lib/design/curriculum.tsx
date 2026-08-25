import Link from "next/link";
import type { ReactNode } from "react";

import {
  LESSON_ARC,
  LESSON_MINUTES,
  LESSON_STRUCTURE,
  SUBJECT_SHORT,
  lessonPosition,
  type CatalogCourse,
  type CatalogLesson,
  type CatalogUnit,
  type StructurePhase,
  type Subject,
} from "@/lib/curriculum/catalog";

import { Card, ScrollX } from "./primitives";
import { FOCUS_RING } from "./tokens";

/**
 * Shared curriculum surfaces.
 *
 * The structure the workbook defines is repetitive by design — the same
 * fifteen-lesson arc and the same thirty-minute shape in every unit of every
 * course — so it is drawn once here and reused. Showing the shape is better
 * than describing it: a reader can see where a lesson sits without being told
 * what the arc is (CLAUDE.md §13).
 */

const SUBJECT_TINT: Record<Subject, { dot: string; text: string; chip: string }> = {
  Mathematics: {
    dot: "bg-[#1F5FA0]",
    text: "text-[#1F5FA0]",
    chip: "border-primary-line bg-primary-surface text-primary",
  },
  "English Language Arts": {
    dot: "bg-[#1E5F4A]",
    text: "text-[#1E5F4A]",
    chip: "border-positive-line bg-positive-surface text-positive",
  },
  Science: {
    dot: "bg-[#0F6E78]",
    text: "text-[#0F6E78]",
    chip: "border-[#0F6E78]/25 bg-[#0F6E78]/8 text-[#0F6E78]",
  },
  "History-Social Science": {
    dot: "bg-[#163F6B]",
    text: "text-[#163F6B]",
    chip: "border-[#163F6B]/25 bg-[#163F6B]/8 text-[#163F6B]",
  },
};

export function subjectTint(subject: Subject) {
  return SUBJECT_TINT[subject];
}

export function SubjectChip({ subject }: { subject: Subject }) {
  const tint = SUBJECT_TINT[subject];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tint.chip}`}
    >
      {SUBJECT_SHORT[subject]}
    </span>
  );
}

/**
 * The thirty-minute lesson shape, drawn to scale.
 *
 * Each phase's width is its share of the half hour, and each is labelled, so
 * the proportions and the names carry the same information.
 */
export function LessonShape({
  phases = LESSON_STRUCTURE,
  total = LESSON_MINUTES,
}: {
  phases?: readonly StructurePhase[];
  total?: number;
}) {
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full" aria-hidden="true">
        {phases.map((phase, i) => (
          <div
            key={phase.label}
            className={i % 2 === 0 ? "bg-primary" : "bg-positive"}
            style={{ width: `${(phase.minutes / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {phases.map((phase) => (
          <li key={phase.label} className="text-xs text-ink-muted">
            <span className="font-semibold text-ink">{phase.minutes} min</span>{" "}
            {phase.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The fifteen-lesson unit arc, with one position optionally marked.
 *
 * Drawn as a numbered strip: every unit in the catalog runs it, so a lesson's
 * number is also a statement about what kind of lesson it is.
 */
export function UnitArc({
  active,
  hrefFor,
}: {
  active?: number;
  hrefFor?: (position: number) => string;
}) {
  return (
    <ScrollX>
      <ol className="flex min-w-max gap-1.5">
        {LESSON_ARC.map((stage) => {
          const isActive = stage.position === active;
          const body = (
            <span
              className={`flex h-full w-[6.5rem] flex-col rounded-lg border px-2 py-1.5 ${
                isActive
                  ? "border-primary bg-primary-surface"
                  : "border-line bg-surface hover:border-primary-line"
              }`}
            >
              <span
                className={`text-[10px] font-bold ${isActive ? "text-primary" : "text-ink-muted"}`}
              >
                {stage.position}
              </span>
              <span
                className={`mt-0.5 text-[11px] leading-tight ${
                  isActive ? "font-semibold text-ink" : "text-ink-muted"
                }`}
              >
                {stage.type}
              </span>
            </span>
          );
          return (
            <li key={stage.position} className="flex">
              {hrefFor ? (
                <Link href={hrefFor(stage.position)} className={`flex ${FOCUS_RING}`}>
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ol>
    </ScrollX>
  );
}

/** The concepts a unit teaches, as the chain the graph puts them in. */
export function ConceptChain({ concepts }: { concepts: readonly string[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
      {concepts.map((concept, i) => (
        <li key={concept} className="flex items-center gap-1.5">
          <span className="rounded-md border border-line bg-surface-sunken px-2 py-0.5 text-xs font-medium text-ink">
            {concept}
          </span>
          {i < concepts.length - 1 ? (
            <span aria-hidden="true" className="text-xs text-ink-muted">
              &rarr;
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/** A course's identity line: grade band, subject, and the standards model. */
export function CourseIdentity({ course }: { course: CatalogCourse }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <SubjectChip subject={course.subject} />
      <span className="text-sm text-ink-muted">Grade {course.gradeBand}</span>
      <span aria-hidden="true" className="text-line-strong">
        |
      </span>
      <span className="text-sm text-ink-muted">{course.standardsModel}</span>
    </div>
  );
}

/**
 * One lesson, as a row. The same row on every surface that lists lessons, so a
 * lesson is recognisable whether an author, a teacher, or a student is reading.
 */
export function LessonRow({
  lesson,
  href,
  trailing,
  detail,
}: {
  lesson: CatalogLesson;
  href?: string;
  trailing?: ReactNode;
  detail?: ReactNode;
}) {
  const position = lessonPosition(lesson);
  const stage = LESSON_ARC[position - 1];
  const body = (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-xs font-bold text-ink-muted"
        >
          {position}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{lesson.title}</p>
          <p className="mt-0.5 text-xs text-ink-muted">
            Day {lesson.day} &middot; {stage.type} &middot; {lesson.primaryStandard}
          </p>
          {detail}
        </div>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
  return (
    <li className="px-5 py-3.5">
      {href ? (
        <Link href={href} className={`block rounded ${FOCUS_RING}`}>
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}

/** A unit summary card: its question, its concepts, and where it sits. */
export function UnitCard({
  unit,
  href,
  trailing,
}: {
  unit: CatalogUnit;
  href?: string;
  trailing?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Unit {unit.order} &middot; days {unit.startDay}&ndash;{unit.endDay}
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-ink">
            {href ? (
              <Link href={href} className={`hover:text-primary ${FOCUS_RING}`}>
                {unit.title}
              </Link>
            ) : (
              unit.title
            )}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{unit.essentialQuestion}</p>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
      <div className="mt-3">
        <ConceptChain concepts={unit.concepts} />
      </div>
    </Card>
  );
}

/** A compact count with its unit, for the strip at the top of a catalog page. */
export function CountStrip({
  items,
}: {
  items: { value: string; label: string }[];
}) {
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {item.label}
          </dt>
          <dd className="mt-0.5 text-xl font-bold text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
