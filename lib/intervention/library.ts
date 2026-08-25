/**
 * Finding the right support for a standard.
 *
 * The workbook links supports to instruction in one place — the prerequisite
 * map, where every pathway lesson names the six pieces of prior learning it
 * depends on. Some of those six are earlier lessons; the rest are supports from
 * the bank. So "which support rebuilds the skill behind 6.RP.2 in Mathematics
 * 6" is answered by reading the map, not by matching text.
 *
 * That is what makes a recommendation citable: the support a teacher is offered
 * is the one the curriculum itself names as the prerequisite for the lesson the
 * student is stuck on (CLAUDE.md §8).
 */
import {
  COURSES,
  courseLessons,
  getCourse,
  standardCode,
  type CatalogCourse,
} from "@/lib/curriculum/catalog";
import { prerequisiteSupports } from "@/lib/curriculum/prerequisites";
import { pushInto } from "@/lib/collections";

import { SUPPORT_MINUTES, supportById, type BankSupport } from "./bank";

/** Every support runs the same 30-minute shape, read from the bank. */
export const TYPICAL_MINUTES = SUPPORT_MINUTES;
export const MINUTES_LABEL = `${SUPPORT_MINUTES} minutes`;

export type LibraryEntry = {
  id: string;
  /** The basic skill the support rebuilds. */
  target: string;
  category: string;
  subject: string;
  /** A pathway lesson that names this support as a prerequisite. */
  linkedLessonCode: string;
  courseTitle: string;
  courseId: string;
  /** Standards, in that course, whose lessons depend on this support. */
  standards: string[];
  estimatedMinutes: number;
  trigger: string;
  exitCriteria: string;
  /** Why the curriculum links it here, from the prerequisite map. */
  reason: string;
};

type Index = {
  /** `courseId::standard` -> supports the curriculum links to it. */
  byStandard: Map<string, LibraryEntry[]>;
  byId: Map<string, LibraryEntry[]>;
};

function buildIndex(): Index {
  const byStandard = new Map<string, LibraryEntry[]>();
  const byId = new Map<string, LibraryEntry[]>();

  for (const course of COURSES) {
    /** One entry per (support, standard) pair inside this course. */
    const seen = new Map<string, LibraryEntry>();

    for (const lesson of courseLessons(course)) {
      const standard = standardCode(lesson.primaryStandard);
      if (!standard) continue;

      for (const prerequisite of prerequisiteSupports(lesson.code)) {
        const support = supportById(prerequisite.id);
        if (!support) continue;
        // A support may only be offered where the bank says it can return.
        if (!support.returnCourseIds.includes(course.id)) continue;

        const key = `${support.id}::${standard}`;
        if (seen.has(key)) continue;

        const entry: LibraryEntry = {
          id: support.id,
          target: support.skill,
          category: support.category,
          subject: support.subject,
          linkedLessonCode: lesson.code,
          courseTitle: course.title,
          courseId: course.id,
          standards: [standard],
          estimatedMinutes: SUPPORT_MINUTES,
          trigger: support.trigger,
          exitCriteria: support.exitCriteria,
          reason: prerequisite.reason,
        };
        seen.set(key, entry);

        const standardKey = `${course.id}::${standard}`;
        pushInto(byStandard, standardKey, entry);
        pushInto(byId, support.id, entry);
      }
    }
  }

  return { byStandard, byId };
}

let cached: Index | null = null;
function index(): Index {
  if (!cached) cached = buildIndex();
  return cached;
}

/**
 * Supports the curriculum links to a standard.
 *
 * With a course title, the answer is scoped to that course — the same standard
 * is taught in more than one course, and a support that cannot return into the
 * student's course is not an option for them.
 */
export function supportsForStandard(
  standard: string,
  courseTitle?: string,
): LibraryEntry[] {
  const code = standardCode(standard);
  if (courseTitle) {
    const course = getCourse(courseTitle);
    if (!course) return [];
    return [...(index().byStandard.get(`${course.id}::${code}`) ?? [])].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
  }
  const out: LibraryEntry[] = [];
  const seen = new Set<string>();
  for (const [key, entries] of index().byStandard) {
    if (!key.endsWith(`::${code}`)) continue;
    for (const entry of entries) {
      if (seen.has(`${entry.id}::${entry.courseId}`)) continue;
      seen.add(`${entry.id}::${entry.courseId}`);
      out.push(entry);
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/** The single best-matched support for a standard within a course. */
export function bestSupportFor(
  standard: string,
  courseTitle: string,
): LibraryEntry | undefined {
  return supportsForStandard(standard, courseTitle)[0];
}

/** Free-text search across the library, for teacher "Find Support". */
export function searchLibrary(query: string, limit = 40): LibraryEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  const seen = new Set<string>();
  const out: LibraryEntry[] = [];
  for (const entries of index().byId.values()) {
    for (const entry of entries) {
      if (seen.has(entry.id)) continue;
      const haystack =
        `${entry.id} ${entry.target} ${entry.category} ${entry.courseTitle} ${entry.standards.join(" ")}`.toLowerCase();
      if (haystack.includes(q)) {
        seen.add(entry.id);
        out.push(entry);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

/**
 * A support by id, as a library entry.
 *
 * Falls back to the bank record itself when the support is not linked into any
 * course lesson, so an assigned plan always renders what it is about.
 */
export function entryById(id: string): LibraryEntry | undefined {
  const linked = index().byId.get(id);
  if (linked && linked.length > 0) return linked[0];
  const support = supportById(id);
  if (!support) return undefined;
  return {
    id: support.id,
    target: support.skill,
    category: support.category,
    subject: support.subject,
    linkedLessonCode: "",
    courseTitle: "",
    courseId: "",
    standards: support.standardsSupport,
    estimatedMinutes: SUPPORT_MINUTES,
    trigger: support.trigger,
    exitCriteria: support.exitCriteria,
    reason: "",
  };
}

/** The bank record behind a library entry, when a surface needs the full text. */
export function supportRecord(id: string): BankSupport | undefined {
  return supportById(id);
}

export type { CatalogCourse };
