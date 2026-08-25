/**
 * The reusable intervention bank.
 *
 * Forty basic-skill supports per subject, 160 in all. Each is a 30-minute
 * lesson with its own diagnostic trigger, structure, and exit criterion, and
 * each names the courses it can return a student into.
 *
 * Reusable is the important word. A support is not consumed by one course or
 * one lesson: the same "place value and magnitude" support serves every
 * mathematics course in the catalog, which is why the 40-day intervention
 * reserve is capacity rather than content, and why a course cannot spend it
 * (CLAUDE.md §7).
 *
 * Generated from the workbook. Nothing here authors a support.
 */
import rawInterventions from "@/lib/curriculum/data/interventions.json";
import type { StructurePhase, Subject } from "@/lib/curriculum/catalog";

export type BankSupport = {
  /** e.g. `M-INT-001`. Stable across course versions. */
  id: string;
  subject: Subject;
  /** e.g. `Number sense`, `Comprehension`, `Civics`. */
  category: string;
  /** The basic skill it rebuilds, e.g. `Place value and magnitude`. */
  skill: string;
  gradeSpan: string;
  trigger: string;
  objective: string;
  components: string;
  exitCriteria: string;
  /** Practice or literacy codes the support leans on. */
  standardsSupport: string[];
  tags: string[];
  /** Courses this support can return a student into. */
  returnCourseIds: string[];
};

const data = rawInterventions as unknown as {
  structure: StructurePhase[];
  interventions: BankSupport[];
};

export const SUPPORTS: readonly BankSupport[] = data.interventions;

/** The 30-minute support shape. Same five phases for every support in the bank. */
export const SUPPORT_STRUCTURE: readonly StructurePhase[] = data.structure;

/** Total minutes in a support. Read from the structure, not estimated. */
export const SUPPORT_MINUTES = SUPPORT_STRUCTURE.reduce((n, p) => n + p.minutes, 0);

const byId = new Map(SUPPORTS.map((s) => [s.id, s]));

export function supportById(id: string): BankSupport | undefined {
  return byId.get(id);
}

export function supportsForSubject(subject: Subject): BankSupport[] {
  return SUPPORTS.filter((s) => s.subject === subject);
}

/** True when a support is authorised to return a student into a course. */
export function returnsInto(support: BankSupport, courseId: string): boolean {
  return support.returnCourseIds.includes(courseId);
}

export type SupportCategory = {
  subject: Subject;
  category: string;
  supports: BankSupport[];
};

/** The bank grouped by subject and category, in the workbook's own order. */
export function supportCategories(): SupportCategory[] {
  const groups: SupportCategory[] = [];
  for (const support of SUPPORTS) {
    const existing = groups.find(
      (g) => g.subject === support.subject && g.category === support.category,
    );
    if (existing) existing.supports.push(support);
    else groups.push({ subject: support.subject, category: support.category, supports: [support] });
  }
  return groups;
}

export function supportCountBySubject(): { subject: Subject; supports: number }[] {
  const counts = new Map<Subject, number>();
  for (const support of SUPPORTS) {
    counts.set(support.subject, (counts.get(support.subject) ?? 0) + 1);
  }
  return [...counts.entries()].map(([subject, supports]) => ({ subject, supports }));
}

/** Free-text search across the bank. Matches id, skill, category, and tags. */
export function searchSupports(query: string, limit = 40): BankSupport[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  const out: BankSupport[] = [];
  for (const support of SUPPORTS) {
    const haystack =
      `${support.id} ${support.skill} ${support.category} ${support.subject} ${support.tags.join(" ")}`.toLowerCase();
    if (haystack.includes(q)) {
      out.push(support);
      if (out.length >= limit) break;
    }
  }
  return out;
}
