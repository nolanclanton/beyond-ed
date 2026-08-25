/**
 * Typed access to the curriculum catalog.
 *
 * `data/catalog.json` is GENERATED from the curriculum architecture workbook at
 * `docs/curriculum/curriculum-architecture.xlsx` by `scripts/build-catalog.mjs`.
 * Every course, unit, lesson, title, objective, and standard code in it is read
 * out of a cell. Nothing in this file authors curriculum (CLAUDE.md §14 — never
 * fabricate curriculum data). To change the catalog, change the workbook and
 * regenerate.
 *
 * The shape the workbook defines, and that everything here relies on:
 *
 *   38 courses × 9 units × 15 lessons = 5,130 pathway lessons
 *   135 pathway days + 40 intervention-capacity days = 175 per course
 *
 * Every unit runs the same fifteen-lesson arc — launch, vocabulary, explicit
 * instruction, concept development, and on to the performance task — so a
 * lesson's TYPE and the EVIDENCE it produces are a function of its position in
 * its unit rather than facts stored on the lesson. `lessonStage` resolves them.
 */
import rawCatalog from "./data/catalog.json";

export type Subject =
  | "Mathematics"
  | "English Language Arts"
  | "Science"
  | "History-Social Science";

/** One phase of the 30-minute lesson shape, e.g. 12 minutes of guided work. */
export type StructurePhase = { minutes: number; label: string };

/** One position in the fifteen-lesson unit arc. */
export type LessonStage = {
  position: number;
  /** e.g. `Formative checkpoint`. */
  type: string;
  /** What the student produces, e.g. `standards-aligned mini-check`. */
  evidence: string;
};

export type CatalogLesson = {
  /** Stable lesson identifier from the workbook, e.g. `MATH-06-L001`. */
  code: string;
  /** Course day, 1-135. Unique within a course. */
  day: number;
  title: string;
  objective: string;
  /** The coverage-control record: one standard per lesson. */
  primaryStandard: string;
  supportingStandards: string[];
  /** Practice or discipline-literacy codes, e.g. `MP.2`, `RH.6-8.1`. */
  practice: string[];
};

export type CatalogUnit = {
  id: string;
  order: number;
  title: string;
  essentialQuestion: string;
  concepts: string[];
  pathwayDays: number;
  startDay: number;
  endDay: number;
  standards: string[];
  lessons: CatalogLesson[];
};

export type CatalogCourse = {
  /** Stable course identifier, e.g. `MATH-06`. Never derived from the title. */
  id: string;
  title: string;
  subject: Subject;
  /** e.g. `6`, `9-10`, `11-12`. */
  gradeBand: string;
  order: number;
  /** The standards model the course is built against. */
  standardsModel: string;
  pathwayDays: number;
  interventionCapacity: number;
  units: CatalogUnit[];
};

const catalog = rawCatalog as unknown as {
  builtAt: string;
  source: string;
  contract: {
    pathwayDays: number;
    interventionCapacity: number;
    annualTotal: number;
    unitsPerCourse: number;
    lessonsPerUnit: number;
  };
  lessonStructure: StructurePhase[];
  lessonArc: LessonStage[];
  subjects: Subject[];
  courses: CatalogCourse[];
};

export const COURSES: readonly CatalogCourse[] = catalog.courses;
export const SUBJECTS: readonly Subject[] = catalog.subjects;

/** The 30-minute lesson shape every pathway lesson runs. */
export const LESSON_STRUCTURE: readonly StructurePhase[] = catalog.lessonStructure;

/** The fifteen-lesson unit arc, in order. */
export const LESSON_ARC: readonly LessonStage[] = catalog.lessonArc;

export const CATALOG_SOURCE = { path: catalog.source, builtAt: catalog.builtAt };

/** Short subject labels for dense surfaces. The long names are the standards'. */
export const SUBJECT_SHORT: Record<Subject, string> = {
  Mathematics: "Math",
  "English Language Arts": "English",
  Science: "Science",
  "History-Social Science": "Social science",
};

// ---------------------------------------------------------------------------
// Indexes, built once
// ---------------------------------------------------------------------------

type LessonLocation = {
  course: CatalogCourse;
  unit: CatalogUnit;
  lesson: CatalogLesson;
  /** Index of the lesson within the whole course, 0-134. */
  index: number;
};

const byLessonCode = new Map<string, LessonLocation>();
const byCourseId = new Map<string, CatalogCourse>();
const byTitle = new Map<string, CatalogCourse>();
const bySlug = new Map<string, CatalogCourse>();
const byUnitId = new Map<string, { course: CatalogCourse; unit: CatalogUnit }>();

/** A course's stable slug. Derived from its id, which never changes. */
export function courseSlug(course: CatalogCourse): string {
  return course.id.toLowerCase();
}

for (const course of COURSES) {
  byCourseId.set(course.id, course);
  byTitle.set(course.title, course);
  bySlug.set(courseSlug(course), course);
  let index = 0;
  for (const unit of course.units) {
    byUnitId.set(unit.id, { course, unit });
    for (const lesson of unit.lessons) {
      byLessonCode.set(lesson.code, { course, unit, lesson, index });
      index += 1;
    }
  }
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function getCourse(title: string): CatalogCourse | undefined {
  return byTitle.get(title);
}

export function getCourseById(id: string): CatalogCourse | undefined {
  return byCourseId.get(id);
}

export function getCourseBySlug(slug: string): CatalogCourse | undefined {
  return bySlug.get(slug.toLowerCase());
}

export function coursesForSubject(subject: Subject): CatalogCourse[] {
  return COURSES.filter((c) => c.subject === subject).sort((a, b) => a.order - b.order);
}

export function getUnit(course: CatalogCourse, unitId: string): CatalogUnit | undefined {
  return course.units.find((u) => u.id === unitId);
}

/** The course, unit, and unit a lesson belongs to — one lookup, no scanning. */
export function locateLesson(lessonCode: string): LessonLocation | undefined {
  return byLessonCode.get(lessonCode);
}

export function unitById(unitId: string): { course: CatalogCourse; unit: CatalogUnit } | undefined {
  return byUnitId.get(unitId);
}

export function courseForLesson(lessonCode: string): CatalogCourse | undefined {
  return byLessonCode.get(lessonCode)?.course;
}

/** The subject a lesson belongs to. Never inferred from the code's prefix. */
export function subjectForLesson(lessonCode: string): Subject | undefined {
  return byLessonCode.get(lessonCode)?.course.subject;
}

export function unitForLesson(lessonCode: string): CatalogUnit | undefined {
  return byLessonCode.get(lessonCode)?.unit;
}

/**
 * Every lesson in a course, in pathway order.
 *
 * Cached per course OBJECT, not per course id. The flattened array is 135
 * entries and this is called once per student per course on roster pages —
 * rebuilding it each time was tens of thousands of allocations for a list that
 * never changes. Keying on the object matters: a course version may run its
 * units and lessons in a re-sequenced order (`lib/curriculum/structure.ts`),
 * and that course carries the SAME stable id as the workbook's. Caching by id
 * would hand a re-sequenced course the baseline order and never say so.
 *
 * The array is shared: treat it as read-only, and copy before sorting.
 */
const lessonsByCourse = new WeakMap<CatalogCourse, readonly CatalogLesson[]>();

export function courseLessons(course: CatalogCourse): readonly CatalogLesson[] {
  const cached = lessonsByCourse.get(course);
  if (cached) return cached;
  const lessons = course.units.flatMap((u) => u.lessons);
  lessonsByCourse.set(course, lessons);
  return lessons;
}

export function findLesson(
  course: CatalogCourse,
  code: string,
): { unit: CatalogUnit; lesson: CatalogLesson } | undefined {
  const at = byLessonCode.get(code);
  if (!at || at.course.id !== course.id) return undefined;
  return { unit: at.unit, lesson: at.lesson };
}

/** The lesson that follows `code` in the pathway, or undefined at the end. */
export function nextLesson(
  course: CatalogCourse,
  code: string,
): { unit: CatalogUnit; lesson: CatalogLesson } | undefined {
  const at = byLessonCode.get(code);
  if (!at || at.course.id !== course.id) return undefined;
  const ordered = courseLessons(course);
  const following = ordered[at.index + 1];
  if (!following) return undefined;
  const location = byLessonCode.get(following.code);
  return location ? { unit: location.unit, lesson: location.lesson } : undefined;
}

// ---------------------------------------------------------------------------
// Lesson facts derived from the unit arc
// ---------------------------------------------------------------------------

/** A lesson's position in its unit, 1-15. */
export function lessonPosition(lesson: CatalogLesson): number {
  return ((lesson.day - 1) % catalog.contract.lessonsPerUnit) + 1;
}

/** The arc entry for a lesson: what kind of lesson it is and what it produces. */
export function lessonStage(lesson: CatalogLesson): LessonStage {
  return LESSON_ARC[lessonPosition(lesson) - 1];
}

/** e.g. `Formative checkpoint`. */
export function lessonType(lesson: CatalogLesson): string {
  return lessonStage(lesson).type;
}

/** What the student produces, e.g. `standards-aligned mini-check`. */
export function lessonEvidence(lesson: CatalogLesson): string {
  return lessonStage(lesson).evidence;
}

/**
 * The standard codes a lesson claims as primary coverage.
 *
 * The workbook assigns exactly one primary standard per lesson; this returns a
 * list because coverage control is a set operation everywhere it is read.
 */
export function primaryStandards(lesson: CatalogLesson): string[] {
  return lesson.primaryStandard ? [lesson.primaryStandard] : [];
}

/**
 * The bare standard code. The workbook publishes codes without alignment tags,
 * so this only trims — it stays because every caller passes user- or
 * record-sourced text through it.
 */
export function standardCode(standard: string): string {
  return standard.trim();
}

/**
 * The assessment record id for a lesson, e.g. `A-MATH-06-L001`.
 *
 * A system record identifier derived from the lesson id, not a curriculum fact:
 * the workbook names what evidence a lesson produces, not what to call the row
 * that stores the result.
 */
export function assessmentId(lesson: CatalogLesson): string {
  return `A-${lesson.code}`;
}

/** The plain-language description of the evidence a lesson produces. */
export function assessmentDescription(lesson: CatalogLesson): string {
  return lessonEvidence(lesson);
}

/** Total minutes in the lesson shape. 30, by construction. */
export const LESSON_MINUTES = LESSON_STRUCTURE.reduce((n, p) => n + p.minutes, 0);
