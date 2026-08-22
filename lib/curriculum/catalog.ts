/**
 * Typed access to the curriculum catalog.
 *
 * `data/catalog.json` is GENERATED from `docs/blueprint.md` by
 * `scripts/build-catalog.mjs`. Every course title, unit name, day budget,
 * lesson code, standard code, assessment id, and intervention id in it is read
 * out of the blueprint appendices. Nothing in this file authors curriculum
 * (CLAUDE.md §14 — never fabricate curriculum data). To change the catalog,
 * change the blueprint and regenerate.
 */
import rawCatalog from "./data/catalog.json";

export type Subject = "Mathematics" | "English" | "Science" | "Social science";

export type CatalogLesson = {
  /** Stable lesson identifier from the alignment matrix, e.g. `M6-U1-L1`. */
  code: string;
  /** Course-day range the lesson spans, e.g. `4-8`. */
  dayRange: string;
  days: number;
  sequence: string;
  /** Primary standards assignment — the coverage-control record. */
  standards: string;
  assessment: string;
  /** The intervention lesson linked to this pathway lesson. */
  intervention: string;
};

export type CatalogUnit = {
  id: string;
  order: number;
  name: string;
  pathwayDays: number;
  lessons: CatalogLesson[];
};

export type CatalogCourse = {
  title: string;
  subject: Subject;
  order: number;
  headline: string | null;
  pathwayDays: number;
  units: CatalogUnit[];
};

export type StarterIntervention = {
  lessonId: string;
  target: string;
  trigger: string;
  transfer: string;
  subjectHeading: string;
};

export type InterventionFamily = {
  subject: string;
  family: string;
  lessons: number;
  targets: string;
};

const catalog = rawCatalog as unknown as {
  courses: CatalogCourse[];
  starterInterventions: StarterIntervention[];
  interventionFamilies: InterventionFamily[];
};

export const COURSES: readonly CatalogCourse[] = catalog.courses;
export const STARTER_INTERVENTIONS: readonly StarterIntervention[] =
  catalog.starterInterventions;
export const INTERVENTION_FAMILIES: readonly InterventionFamily[] =
  catalog.interventionFamilies;

export const SUBJECTS: readonly Subject[] = [
  "Mathematics",
  "English",
  "Science",
  "Social science",
];

/** A course's stable slug. Derived from its title, which is stable. */
export function courseSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const bySlug = new Map(COURSES.map((c) => [courseSlug(c.title), c]));
const byTitle = new Map(COURSES.map((c) => [c.title, c]));

export function getCourseBySlug(slug: string): CatalogCourse | undefined {
  return bySlug.get(slug);
}

export function getCourse(title: string): CatalogCourse | undefined {
  return byTitle.get(title);
}

export function coursesForSubject(subject: Subject): CatalogCourse[] {
  return COURSES.filter((c) => c.subject === subject).sort(
    (a, b) => a.order - b.order,
  );
}

export function getUnit(
  course: CatalogCourse,
  unitId: string,
): CatalogUnit | undefined {
  return course.units.find((u) => u.id === unitId);
}

/** Every lesson in a course, in pathway order. */
export function courseLessons(course: CatalogCourse): CatalogLesson[] {
  return course.units.flatMap((u) => u.lessons);
}

export function findLesson(
  course: CatalogCourse,
  code: string,
): { unit: CatalogUnit; lesson: CatalogLesson } | undefined {
  for (const unit of course.units) {
    const lesson = unit.lessons.find((l) => l.code === code);
    if (lesson) return { unit, lesson };
  }
  return undefined;
}

/** The lesson that follows `code` in the pathway, or undefined at the end. */
export function nextLesson(
  course: CatalogCourse,
  code: string,
): { unit: CatalogUnit; lesson: CatalogLesson } | undefined {
  const ordered = course.units.flatMap((u) =>
    u.lessons.map((lesson) => ({ unit: u, lesson })),
  );
  const at = ordered.findIndex((x) => x.lesson.code === code);
  if (at < 0 || at + 1 >= ordered.length) return undefined;
  return ordered[at + 1];
}

/**
 * The standard codes a lesson claims as primary coverage, tags included.
 * Lessons with no new standard (launch/diagnostic) return an empty list.
 */
export function primaryStandards(lesson: CatalogLesson): string[] {
  const text = lesson.standards;
  if (/no new primary standard/i.test(text)) return [];
  return text
    .split(",")
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter((s) => s.length > 0 && !/^readiness/i.test(s));
}

/**
 * The bare standard code, without its alignment tag.
 * `A-SSE.1.a [*]` -> `A-SSE.1.a`.
 */
export function standardCode(standard: string): string {
  return standard.replace(/\s*\[[^\]]*\]\s*$/, "").trim();
}

/**
 * The alignment tag on a standard, if any. From the appendix legend:
 * `CA` marks a California addition, `*` a starred modeling standard or
 * engineering-integrated performance expectation, `+` advanced mathematics,
 * `LOCAL` a locally authorized extension.
 */
export function standardTag(standard: string): string | null {
  const m = /\[([^\]]*)\]\s*$/.exec(standard);
  return m ? m[1] : null;
}

export const STANDARD_TAG_MEANING: Record<string, string> = {
  CA: "California addition",
  "*": "Starred modeling standard or engineering-integrated performance expectation",
  "+": "Advanced mathematics",
  LOCAL: "Locally authorized extension",
};

/** The intervention lesson id linked to a pathway lesson, e.g. `I-M6-U1-L1`. */
export function interventionId(lesson: CatalogLesson): string {
  const m = /^([A-Za-z0-9-]+)/.exec(lesson.intervention);
  return m ? m[1] : lesson.intervention;
}

/** The plain-language target of a linked intervention lesson. */
export function interventionTarget(lesson: CatalogLesson): string {
  const m = /:\s*(.+)$/.exec(lesson.intervention);
  return m ? m[1].trim() : lesson.intervention;
}

/** The assessment record id for a lesson, e.g. `A-M6-U1-L1`. */
export function assessmentId(lesson: CatalogLesson): string {
  const m = /^([A-Za-z0-9-]+):/.exec(lesson.assessment);
  return m ? m[1] : lesson.assessment;
}

export function assessmentDescription(lesson: CatalogLesson): string {
  const m = /:\s*(.+)$/.exec(lesson.assessment);
  return m ? m[1].trim() : lesson.assessment;
}

/**
 * The instructional section a lesson sits in (blueprint §3, §8).
 * The alignment matrix encodes it in the lesson sequence text after the colon.
 */
export function instructionalSection(lesson: CatalogLesson): string {
  const m = /:\s*(.+?)\.?$/.exec(lesson.sequence);
  const tail = m ? m[1] : lesson.sequence;
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}

/** The unit narrative a lesson belongs to, without the section suffix. */
export function lessonTopic(lesson: CatalogLesson): string {
  const m = /^(.+?):/.exec(lesson.sequence);
  return m ? m[1].trim() : lesson.sequence;
}
