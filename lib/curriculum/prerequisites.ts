/**
 * The per-lesson prerequisite map (CLAUDE.md §8 — ranking inputs are explicit
 * and inspectable).
 *
 * Every one of the 5,130 pathway lessons names exactly six pieces of prior
 * learning: earlier lessons in the same course, and reusable supports from the
 * intervention bank. This is what makes a recommendation citable — a missing
 * prerequisite is a stated fact about the curriculum, not an inference drawn at
 * request time.
 *
 * The generated file interns the reason text and stores each link as
 * `[id, reasonIndex]`. A link's kind is recovered from the id rather than
 * stored, so the two can never disagree: an intervention id contains `-INT-`
 * and a lesson id does not.
 */
import rawPrerequisites from "./data/prerequisites.json";
import { pushInto } from "@/lib/collections";

import { locateLesson } from "./catalog";

const data = rawPrerequisites as unknown as {
  reasons: string[];
  byLesson: Record<string, [string, number][]>;
};

export type PrerequisiteKind = "lesson" | "support";

export type Prerequisite = {
  id: string;
  kind: PrerequisiteKind;
  reason: string;
};

export type ResolvedPrerequisite = Prerequisite & {
  /** The lesson or support's own name, when it resolves. */
  title: string | null;
  /** Course day, for a prior lesson in the same course. */
  day: number | null;
  courseTitle: string | null;
};

export function prerequisiteKind(id: string): PrerequisiteKind {
  return id.includes("-INT-") ? "support" : "lesson";
}

/** The six prerequisites a lesson names, in the workbook's order. */
export function prerequisitesFor(lessonCode: string): Prerequisite[] {
  const links = data.byLesson[lessonCode];
  if (!links) return [];
  return links.map(([id, reasonIndex]) => ({
    id,
    kind: prerequisiteKind(id),
    reason: data.reasons[reasonIndex] ?? "",
  }));
}

/** Only the prior COURSE LESSONS a lesson depends on. */
export function prerequisiteLessons(lessonCode: string): Prerequisite[] {
  return prerequisitesFor(lessonCode).filter((p) => p.kind === "lesson");
}

/** Only the reusable SUPPORTS a lesson depends on. */
export function prerequisiteSupports(lessonCode: string): Prerequisite[] {
  return prerequisitesFor(lessonCode).filter((p) => p.kind === "support");
}

/**
 * Prerequisites with their names filled in.
 *
 * `title` stays null for a support: the bank lives in `lib/intervention`, and
 * resolving it here would make the curriculum layer depend on the intervention
 * layer for a label. Callers that need support names join them themselves.
 */
export function resolvePrerequisites(lessonCode: string): ResolvedPrerequisite[] {
  return prerequisitesFor(lessonCode).map((prerequisite) => {
    if (prerequisite.kind === "support") {
      return { ...prerequisite, title: null, day: null, courseTitle: null };
    }
    const at = locateLesson(prerequisite.id);
    return {
      ...prerequisite,
      title: at?.lesson.title ?? null,
      day: at?.lesson.day ?? null,
      courseTitle: at?.course.title ?? null,
    };
  });
}

/**
 * Lessons that name `lessonCode` as a prerequisite — what depends on this one.
 *
 * Built lazily and cached: it is a 30,780-link reverse index, and most requests
 * never need it.
 */
let dependents: Map<string, string[]> | null = null;

export function dependentsOf(lessonCode: string): string[] {
  if (!dependents) {
    dependents = new Map();
    for (const [code, links] of Object.entries(data.byLesson)) {
      for (const [id] of links) {
        pushInto(dependents, id, code);
      }
    }
  }
  return dependents.get(lessonCode) ?? [];
}

/** How many links the map holds. Shown where the structure is summarised. */
export const PREREQUISITE_LINK_COUNT = Object.values(data.byLesson).reduce(
  (n, links) => n + links.length,
  0,
);
