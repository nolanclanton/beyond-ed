/**
 * What a student actually meets: resolving lesson content and items for the
 * course version their enrollment is pinned to (CLAUDE.md §7).
 *
 * Three sources, in this order:
 *
 *   1. **Authored** — content published in the enrollment's own course version.
 *      Real curriculum, written in the studio by someone holding the
 *      curriculum-author authorization.
 *   2. **Demo** — the six hand-written example lessons that exercise the
 *      evidence, mastery, grade, and recommendation paths end to end. Labelled
 *      as demonstration content everywhere it appears (ADR 0005).
 *   3. **Neither** — the lesson's place in the course is real and its teaching
 *      does not exist yet. Surfaces say exactly that rather than showing a
 *      control that cannot complete its action (CLAUDE.md §12).
 *
 * The version is the whole point of the lookup. A section keeps the version it
 * was created with, so publishing 2026.3 cannot change what a class running on
 * 2026.1 is being taught, and cannot alter what prior evidence was collected
 * against.
 */
import type { DemoItem } from "@/lib/db/demo-items";
import {
  itemsFor as demoItemsFor,
  itemById as demoItemById,
  readinessItemsFor as demoReadinessItems,
  transferItemFor as demoTransferItem,
} from "@/lib/db/demo-items";
import type { LessonContent } from "@/lib/db/demo-lesson-content";
import { lessonContent as demoLessonContent } from "@/lib/db/demo-lesson-content";
import { db } from "@/lib/db/store";
import type {
  AuthoredLesson,
  AuthoredQuizItem,
  ItemPurpose,
  LessonVideo,
} from "@/lib/db/types";

export type ContentSource = "authored" | "demo" | "none";

export type ResolvedLesson = {
  source: ContentSource;
  content: LessonContent | null;
  videos: LessonVideo[];
  /** The version the content came from, for the label a student sees. */
  versionLabel: string | null;
};

/** Authored content for a version, but only once that version is published. */
export function publishedAuthoredLesson(
  courseVersionId: string,
  lessonCode: string,
): AuthoredLesson | undefined {
  const d = db();
  const version = d.courseVersions.find((v) => v.id === courseVersionId);
  if (!version || version.status !== "published") return undefined;
  return d.authoredLessons.find(
    (l) => l.courseVersionId === courseVersionId && l.lessonCode === lessonCode,
  );
}

/** The authored script mapped into the shape every lesson surface reads. */
export function asLessonContent(lesson: AuthoredLesson): LessonContent {
  return {
    relevance: lesson.relevance,
    goal: lesson.goal,
    successCriteria: lesson.successCriteria,
    instruction: lesson.blocks,
    vocabulary: lesson.vocabulary,
    workedModel: lesson.workedModel,
    guidedPractice: lesson.guidedPractice,
    independentTask: lesson.independentTask,
    notesOutline: lesson.notesOutline,
  };
}

/** True when there is enough script for a student to have something to read. */
function hasReadableScript(lesson: AuthoredLesson): boolean {
  return lesson.goal.trim().length > 0 || lesson.blocks.length > 0;
}

export function resolveLessonContent(
  courseVersionId: string,
  lessonCode: string,
): ResolvedLesson {
  const authored = publishedAuthoredLesson(courseVersionId, lessonCode);
  if (authored && hasReadableScript(authored)) {
    const version = db().courseVersions.find((v) => v.id === courseVersionId);
    return {
      source: "authored",
      content: asLessonContent(authored),
      videos: authored.videos,
      versionLabel: version ? `${version.courseTitle} ${version.version}` : null,
    };
  }
  const demo = demoLessonContent(lessonCode);
  if (demo) {
    return { source: "demo", content: demo, videos: [], versionLabel: null };
  }
  return { source: "none", content: null, videos: [], versionLabel: null };
}

/** An authored item in the same shape as the demo bank, so scoring is one path. */
export function asBankItem(lessonCode: string, item: AuthoredQuizItem): DemoItem {
  return {
    id: item.id,
    lessonCode,
    standard: item.standard,
    skill: item.skill,
    purpose: item.purpose,
    stem: item.stem,
    choices: item.choices,
    correctChoiceId: item.correctChoiceId,
    rationale: item.rationale,
  };
}

/**
 * The item bank for a lesson.
 *
 * Authored items REPLACE the demo bank rather than joining it: a published
 * lesson is what its author wrote, and quietly mixing example questions into a
 * real Exit Ticket would put a student's advancement decision partly on content
 * nobody adopted.
 */
export function itemsForLesson(
  lessonCode: string,
  purpose: ItemPurpose | undefined,
  courseVersionId: string | null,
): DemoItem[] {
  const authored = courseVersionId
    ? publishedAuthoredLesson(courseVersionId, lessonCode)
    : undefined;
  if (authored && authored.items.length > 0) {
    const items = authored.items.map((i) => asBankItem(lessonCode, i));
    return purpose ? items.filter((i) => i.purpose === purpose) : items;
  }
  return demoItemsFor(lessonCode, purpose);
}

/**
 * One item by id, from whichever bank holds it.
 *
 * Ids are unique across both banks, so this needs no version: an item id
 * recorded on an evidence row always resolves back to the item that produced
 * it, however old the row is.
 */
export function bankItemById(id: string): DemoItem | undefined {
  const demo = demoItemById(id);
  if (demo) return demo;
  for (const lesson of db().authoredLessons) {
    const item = lesson.items.find((i) => i.id === id);
    if (item) return asBankItem(lesson.lessonCode, item);
  }
  return undefined;
}

/**
 * Every item a Spiral Review may draw on for one enrollment: the demo bank plus
 * anything published in that enrollment's own course version. The selection
 * rules then filter by subject and skill — see `lib/recommend/spiral.ts`.
 */
export function spiralCandidatePool(
  courseVersionId: string | null,
  demoPool: readonly DemoItem[],
): DemoItem[] {
  if (!courseVersionId) return [...demoPool];
  const d = db();
  const version = d.courseVersions.find((v) => v.id === courseVersionId);
  if (!version || version.status !== "published") return [...demoPool];

  const authored = d.authoredLessons
    .filter((l) => l.courseVersionId === courseVersionId)
    .flatMap((l) => l.items.map((i) => asBankItem(l.lessonCode, i)));
  if (authored.length === 0) return [...demoPool];

  // An authored lesson's items replace the demo bank for that same lesson, for
  // the reason in `itemsForLesson`.
  const replaced = new Set(authored.map((i) => i.lessonCode));
  return [...demoPool.filter((i) => !replaced.has(i.lessonCode)), ...authored];
}

/** True only when this enrollment's lesson has a scoreable Exit Ticket. */
export function hasExitTicketFor(
  lessonCode: string,
  courseVersionId: string | null,
): boolean {
  return itemsForLesson(lessonCode, "exit_ticket", courseVersionId).length > 0;
}

/**
 * Support-plan items for a standard, for one enrollment's course version.
 *
 * Same rule as the lesson bank: what the author published for this version
 * wins; where they have published nothing for the standard, the demo bank
 * stands in, labelled as demonstration content wherever it is shown.
 *
 * Retrieval items count as readiness items — both measure the intervention
 * skill independently, which is what the return rule asks for.
 */
export function readinessItemsForStandard(
  standard: string,
  courseVersionId: string | null,
): DemoItem[] {
  const authored = authoredItemsForVersion(courseVersionId).filter(
    (i) =>
      i.standard === standard &&
      (i.purpose === "readiness_check" || i.purpose === "spiral_review"),
  );
  return authored.length > 0 ? authored : demoReadinessItems(standard);
}

/** The grade-level transfer item connected to the blocked standard. */
export function transferItemForStandard(
  standard: string,
  courseVersionId: string | null,
): DemoItem | undefined {
  const authored = authoredItemsForVersion(courseVersionId).find(
    (i) => i.standard === standard && i.purpose === "transfer_check",
  );
  return authored ?? demoTransferItem(standard);
}

/**
 * True only when a support plan on this standard can actually be run and
 * scored: two independent readiness items and one transfer item. Read this
 * before offering to start one (CLAUDE.md §12 — no dead controls).
 */
export function supportIsRunnableFor(
  standard: string,
  courseVersionId: string | null,
): boolean {
  return (
    readinessItemsForStandard(standard, courseVersionId).length >= 2 &&
    transferItemForStandard(standard, courseVersionId) !== undefined
  );
}

/** Every published authored item in one course version, in bank shape. */
function authoredItemsForVersion(courseVersionId: string | null): DemoItem[] {
  if (!courseVersionId) return [];
  const d = db();
  const version = d.courseVersions.find((v) => v.id === courseVersionId);
  if (!version || version.status !== "published") return [];
  return d.authoredLessons
    .filter((l) => l.courseVersionId === courseVersionId)
    .flatMap((l) => l.items.map((i) => asBankItem(l.lessonCode, i)));
}
