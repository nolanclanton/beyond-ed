/**
 * The cross-subject intervention library (blueprint §13, Appendix E).
 *
 * Two document-sourced inventories feed this:
 *
 *  1. The per-lesson intervention link in the alignment matrix — every pathway
 *     lesson names the intervention lesson connected to it, e.g.
 *     `I-M6-U1-L1 (1-2 flex days): representation and prerequisite reset`.
 *  2. The Appendix E starter inventory — named lessons with a target, a typical
 *     trigger, and the transfer evidence required.
 *
 * The blueprint states that each intervention carries estimated minutes, but it
 * does not publish per-lesson values. `TYPICAL_MINUTES` below is the midpoint of
 * the blueprint's stated 10-25 minute range and is labelled as such everywhere
 * it is shown. It is not authored curriculum metadata.
 */
import {
  COURSES,
  INTERVENTION_FAMILIES,
  STARTER_INTERVENTIONS,
  courseLessons,
  interventionId,
  interventionTarget,
  primaryStandards,
  standardCode,
  type CatalogCourse,
} from "@/lib/curriculum/catalog";

/**
 * Midpoint of the blueprint's stated 10-25 minute intervention range.
 * Per-lesson estimates have not been authored; every surface says so.
 */
export const TYPICAL_MINUTES = 20;
export const MINUTES_RANGE_LABEL = "10-25 minutes (blueprint range)";
export const MINUTES_CAVEAT =
  "Per-lesson time estimates have not been authored. This is the midpoint of the blueprint's 10-25 minute range.";

export type LibraryEntry = {
  id: string;
  target: string;
  /** Pathway lesson this support is linked to. */
  linkedLessonCode: string;
  courseTitle: string;
  standards: string[];
  estimatedMinutes: number;
};

function buildIndex(): Map<string, LibraryEntry[]> {
  const index = new Map<string, LibraryEntry[]>();
  for (const course of COURSES) {
    for (const lesson of courseLessons(course)) {
      const standards = primaryStandards(lesson).map(standardCode);
      if (standards.length === 0) continue;
      const entry: LibraryEntry = {
        id: interventionId(lesson),
        target: interventionTarget(lesson),
        linkedLessonCode: lesson.code,
        courseTitle: course.title,
        standards,
        estimatedMinutes: TYPICAL_MINUTES,
      };
      for (const s of standards) {
        index.set(s, [...(index.get(s) ?? []), entry]);
      }
    }
  }
  return index;
}

let cached: Map<string, LibraryEntry[]> | null = null;

function index(): Map<string, LibraryEntry[]> {
  if (!cached) cached = buildIndex();
  return cached;
}

/** Supports linked to a standard, nearest course first. */
export function supportsForStandard(
  standard: string,
  courseTitle?: string,
): LibraryEntry[] {
  const all = index().get(standardCode(standard)) ?? [];
  if (!courseTitle) return all;
  return [...all].sort((a, b) => {
    const aScore = a.courseTitle === courseTitle ? 0 : 1;
    const bScore = b.courseTitle === courseTitle ? 0 : 1;
    return aScore - bScore || a.id.localeCompare(b.id);
  });
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
  for (const entries of index().values()) {
    for (const e of entries) {
      if (seen.has(e.id)) continue;
      const haystack = `${e.id} ${e.target} ${e.courseTitle} ${e.standards.join(" ")}`.toLowerCase();
      if (haystack.includes(q)) {
        seen.add(e.id);
        out.push(e);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

export function entryById(id: string): LibraryEntry | undefined {
  for (const entries of index().values()) {
    const found = entries.find((e) => e.id === id);
    if (found) return found;
  }
  return undefined;
}

/** Appendix E starter lessons, with the subject their heading names. */
export function starterLessons() {
  return STARTER_INTERVENTIONS.map((s) => ({
    ...s,
    subject: s.subjectHeading.replace(/ starter lessons$/i, ""),
  }));
}

export function families() {
  return INTERVENTION_FAMILIES;
}

export function familyTotals() {
  const bySubject = new Map<string, number>();
  for (const f of INTERVENTION_FAMILIES) {
    bySubject.set(f.subject, (bySubject.get(f.subject) ?? 0) + f.lessons);
  }
  return {
    bySubject: [...bySubject.entries()].map(([subject, lessons]) => ({ subject, lessons })),
    total: INTERVENTION_FAMILIES.reduce((n, f) => n + f.lessons, 0),
  };
}

export type { CatalogCourse };
