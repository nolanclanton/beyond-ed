/**
 * Building a lesson: script, video, and quiz (CLAUDE.md §7).
 *
 * This is the write side of the curriculum studio. What it authors is CONTENT
 * for a lesson the catalog already plans — the script a student reads, the
 * video that carries it, and the items that produce evidence.
 *
 * Four rules shape every function here.
 *
 * **Content belongs to a course version, and only a draft is editable.** That
 * is what makes §7 hold without inventing a second lifecycle: a roster section
 * keeps the version it was created with, so publishing authored content cannot
 * change what a running section is teaching and cannot alter prior evidence. To
 * change published content you create the next version — which is exactly what
 * versioning is for.
 *
 * **Lesson identifiers are the catalog's, never ours.** Authoring attaches
 * content to an existing lesson code, so the day budget cannot move: the 135 +
 * 40 = 175 contract is validated over the catalog, and nothing here writes to
 * it. Creating a NEW lesson would change a course's day allocation, which is a
 * blueprint decision, not an authoring one (CLAUDE.md §14).
 *
 * **An item must align to a standard the lesson actually claims.** Coverage
 * control is the point of the alignment matrix; an item that measures something
 * the lesson does not teach produces evidence nobody can act on.
 *
 * **Every write is transactional, idempotent, and audited in the same
 * transaction.** Editing a draft is ordinary working state, not a record of
 * something a student did — but who changed a lesson, and when, is still an
 * attributable human action, so it produces an audit event like any other
 * (CLAUDE.md §6). Evidence and audit themselves remain append-only; nothing
 * here touches either.
 */
import { recordAudit, requestIdFor } from "@/lib/audit/log";
import { assertCanAuthorCurriculum } from "@/lib/auth/scope";
import { nextTimestamp } from "@/lib/clock";
import { db, nextId, transact, withIdempotency } from "@/lib/db/store";
import type {
  AuthoredChoice,
  AuthoredLesson,
  AuthoredQuizItem,
  CourseVersion,
  ItemPurpose,
  LessonBlock,
  LessonMaterial,
  LessonMaterialKind,
  LessonSection,
  LessonVideo,
  User,
} from "@/lib/db/types";

import {
  findLesson,
  getCourse,
  primaryStandards,
  standardCode,
  type CatalogLesson,
} from "./catalog";
import { LESSON_SECTION_PART } from "./lesson-sections";

export class LessonAuthoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LessonAuthoringError";
  }
}

/** Purposes an author can write, with what each one is for. */
export const ITEM_PURPOSES: readonly {
  value: ItemPurpose;
  label: string;
  meaning: string;
}[] = [
  {
    value: "exit_ticket",
    label: "Exit Ticket",
    meaning:
      "Scored at the end of the lesson against the four decision bands. This is the item set that decides whether the student advances.",
  },
  {
    value: "spiral_review",
    label: "Spiral Review",
    meaning:
      "Retrieval practice offered in later lessons of the same subject. Never graded.",
  },
  {
    value: "readiness_check",
    label: "Readiness check",
    meaning:
      "Used by a support plan to decide whether the student returns to the pathway. A plan needs at least two.",
  },
  {
    value: "transfer_check",
    label: "Transfer item",
    meaning:
      "The grade-level item connected to the blocked standard. One is required before a return.",
  },
];

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Versions content can be authored into: drafts, and only drafts. */
export function editableVersions(): CourseVersion[] {
  return db()
    .courseVersions.filter((v) => v.status === "draft")
    .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
}

export function versionForAuthoring(versionId: string): CourseVersion {
  const version = db().courseVersions.find((v) => v.id === versionId);
  if (!version) throw new LessonAuthoringError("That course version does not exist.");
  return version;
}

export function authoredLesson(
  versionId: string,
  lessonCode: string,
): AuthoredLesson | undefined {
  return db().authoredLessons.find(
    (l) => l.courseVersionId === versionId && l.lessonCode === lessonCode,
  );
}

export function authoredLessonsForVersion(versionId: string): AuthoredLesson[] {
  return db().authoredLessons.filter((l) => l.courseVersionId === versionId);
}

/** The catalog record a lesson code resolves to inside a version's course. */
export function catalogLessonFor(
  version: CourseVersion,
  lessonCode: string,
): CatalogLesson {
  const course = getCourse(version.courseTitle);
  if (!course) throw new LessonAuthoringError("That course is not in the catalog.");
  const found = findLesson(course, lessonCode);
  if (!found) {
    throw new LessonAuthoringError(
      `${lessonCode} is not a lesson in ${version.courseTitle}.`,
    );
  }
  return found.lesson;
}

/** The standards an item in this lesson may claim. Empty for launch lessons. */
export function alignableStandards(
  version: CourseVersion,
  lessonCode: string,
): string[] {
  return primaryStandards(catalogLessonFor(version, lessonCode)).map(standardCode);
}

export type ReadinessCheck = { label: string; done: boolean; detail: string };

/**
 * What a lesson still needs before it is worth putting in front of a student.
 *
 * Advisory, not a gate: an incomplete lesson is a normal state while it is
 * being written, and the version's own publication gate is the day budget
 * (CLAUDE.md §7). What this must never do is let an author believe a lesson is
 * finished when a student would meet a blank stage.
 */
export function lessonReadiness(
  versionId: string,
  lessonCode: string,
): { checks: ReadinessCheck[]; complete: boolean } {
  const draft = authoredLesson(versionId, lessonCode);
  const exitItems = (draft?.items ?? []).filter((i) => i.purpose === "exit_ticket");
  const videosWithoutTranscript = (draft?.videos ?? []).filter(
    (v) => v.transcript.trim().length === 0,
  );

  const checks: ReadinessCheck[] = [
    {
      label: "Goal and relevance written",
      done: Boolean(draft?.goal.trim() && draft?.relevance.trim()),
      detail: "Stages 3 and 4 — why the lesson exists, and what the student is aiming at.",
    },
    {
      label: "Success criteria listed",
      done: (draft?.successCriteria.length ?? 0) > 0,
      detail: "How a student knows they met the goal, in their own words.",
    },
    {
      label: "Instruction stage has elements",
      done: (draft?.blocks ?? []).some((b) => b.section === "instruction"),
      detail: "Stage 5 — the text, callouts, tables, images, and video a student reads.",
    },
    {
      label: "Every image has alternative text",
      done: (draft?.blocks ?? []).every(
        (b) => b.kind !== "image" || b.alt.trim().length > 0,
      ),
      detail: "An image without it is invisible to part of the class (CLAUDE.md §12).",
    },
    {
      label: "Worked model written",
      done: (draft?.workedModel.length ?? 0) > 0,
      detail: "Stage 6 — reasoning exposed, not just the answer.",
    },
    {
      label: "Guided practice written",
      done: (draft?.guidedPractice.length ?? 0) > 0,
      detail: "Stage 7 — practice with support that fades.",
    },
    {
      label: "Exit Ticket has items",
      done: exitItems.length > 0,
      detail:
        "Without items the Exit Ticket cannot be scored, and the lesson shows that plainly rather than faking a result.",
    },
    {
      label: "Every material says how else to get it",
      done: (draft?.materials ?? []).every((m) => m.accessNote.trim().length > 0),
      detail:
        "A reading or worksheet in one format only is a lesson some students cannot take (CLAUDE.md §12).",
    },
    {
      label: "Every video has a transcript",
      done: videosWithoutTranscript.length === 0,
      detail: "Media without a transcript is not accessible (CLAUDE.md §12).",
    },
  ];

  return { checks, complete: checks.every((c) => c.done) };
}

export type VersionAuthoringSummary = {
  lessonsInCourse: number;
  lessonsStarted: number;
  lessonsComplete: number;
  videos: number;
  materials: number;
  items: number;
  blocks: number;
};

export function versionAuthoringSummary(versionId: string): VersionAuthoringSummary {
  const version = versionForAuthoring(versionId);
  const course = getCourse(version.courseTitle);
  const lessonsInCourse = course
    ? course.units.reduce((n, u) => n + u.lessons.length, 0)
    : 0;
  const drafts = authoredLessonsForVersion(versionId);
  return {
    lessonsInCourse,
    lessonsStarted: drafts.length,
    lessonsComplete: drafts.filter((d) => lessonReadiness(versionId, d.lessonCode).complete)
      .length,
    videos: drafts.reduce((n, d) => n + d.videos.length, 0),
    materials: drafts.reduce((n, d) => n + d.materials.length, 0),
    items: drafts.reduce((n, d) => n + d.items.length, 0),
    blocks: drafts.reduce((n, d) => n + d.blocks.length, 0),
  };
}

// ---------------------------------------------------------------------------
// Write guards
// ---------------------------------------------------------------------------

/**
 * The one gate every write passes: the authorization, and the draft rule.
 *
 * Read this before offering an editing control, so a control that cannot
 * complete its action is never shown as if it could (CLAUDE.md §12).
 */
export function authoringGate(
  actor: { curriculumAuthor?: boolean } | null,
  versionId: string,
): { version: CourseVersion; editable: boolean; blockers: string[] } {
  const version = versionForAuthoring(versionId);
  const blockers: string[] = [];
  if (!actor?.curriculumAuthor) {
    blockers.push(
      "Curriculum authoring is a separate authorization, and you do not hold it.",
    );
  }
  if (version.status !== "draft") {
    blockers.push(
      `This version is ${version.status.replace(/_/g, " ")}. Content is editable only while a version is a draft — to change published content, create the next version.`,
    );
  }
  return { version, editable: blockers.length === 0, blockers };
}

function assertEditable(actor: User, versionId: string): CourseVersion {
  assertCanAuthorCurriculum(actor);
  const version = versionForAuthoring(versionId);
  if (version.status !== "draft") {
    throw new LessonAuthoringError(
      `${version.courseTitle} ${version.version} is ${version.status.replace(/_/g, " ")}. Lesson content is editable only while a version is a draft.`,
    );
  }
  return version;
}

function requireReason(reason: string): string {
  const trimmed = reason.trim();
  if (trimmed.length === 0) {
    throw new LessonAuthoringError("A curriculum change requires a recorded reason.");
  }
  return trimmed;
}

/** Creates the draft row on first write. Never called outside a transaction. */
function upsertDraft(
  version: CourseVersion,
  lessonCode: string,
  actor: User,
): AuthoredLesson {
  catalogLessonFor(version, lessonCode);
  const existing = authoredLesson(version.id, lessonCode);
  if (existing) return existing;

  const created: AuthoredLesson = {
    id: nextId("al"),
    courseVersionId: version.id,
    lessonCode,
    relevance: "",
    goal: "",
    successCriteria: [],
    blocks: [],
    vocabulary: [],
    workedModel: [],
    guidedPractice: [],
    independentTask: "",
    notesOutline: [],
    videos: [],
    materials: [],
    items: [],
    createdAt: nextTimestamp(),
    updatedAt: nextTimestamp(),
    updatedByUserId: actor.id,
  };
  db().authoredLessons.push(created);
  return created;
}

/** A summary small enough to read in an audit row, rather than the whole script. */
function scriptShape(lesson: AuthoredLesson) {
  return {
    goal: lesson.goal.slice(0, 120),
    successCriteria: lesson.successCriteria.length,
    blocks: lesson.blocks.length,
    vocabulary: lesson.vocabulary.length,
    workedModel: lesson.workedModel.length,
    guidedPractice: lesson.guidedPractice.length,
    notesOutline: lesson.notesOutline.length,
    videos: lesson.videos.length,
    materials: lesson.materials.length,
    items: lesson.items.length,
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export type ScriptInput = {
  versionId: string;
  lessonCode: string;
  relevance: string;
  goal: string;
  successCriteria: string[];
  vocabulary: { term: string; meaning: string }[];
  workedModel: { step: string; reasoning: string }[];
  guidedPractice: { prompt: string; hint: string; answer: string }[];
  independentTask: string;
  notesOutline: string[];
  reason: string;
};

/** Saves the lesson script. One write, one audit event, the whole thing atomic. */
export function saveLessonScript(
  actor: User,
  input: ScriptInput,
  idempotencyKey: string,
): AuthoredLesson {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const lesson = upsertDraft(version, input.lessonCode, actor);
        const before = scriptShape(lesson);

        lesson.relevance = input.relevance.trim();
        lesson.goal = input.goal.trim();
        lesson.successCriteria = input.successCriteria
          .map((s) => s.trim())
          .filter(Boolean);
        lesson.vocabulary = input.vocabulary
          .map((v) => ({ term: v.term.trim(), meaning: v.meaning.trim() }))
          .filter((v) => v.term && v.meaning);
        lesson.workedModel = input.workedModel
          .map((w) => ({ step: w.step.trim(), reasoning: w.reasoning.trim() }))
          .filter((w) => w.step && w.reasoning);
        lesson.guidedPractice = input.guidedPractice
          .map((g) => ({
            prompt: g.prompt.trim(),
            hint: g.hint.trim(),
            answer: g.answer.trim(),
          }))
          .filter((g) => g.prompt && g.answer);
        lesson.independentTask = input.independentTask.trim();
        lesson.notesOutline = input.notesOutline.map((s) => s.trim()).filter(Boolean);
        lesson.updatedAt = nextTimestamp();
        lesson.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: "curriculum.lesson_script_saved",
          targetEntity: "authored_lesson",
          targetId: lesson.id,
          before,
          after: {
            ...scriptShape(lesson),
            courseVersionId: version.id,
            lessonCode: lesson.lessonCode,
          },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.lesson_script_saved", idempotencyKey),
        });

        return lesson;
      },
      (existingId) => {
        const lesson = db().authoredLessons.find((l) => l.id === existingId);
        if (!lesson) throw new LessonAuthoringError("Duplicate write with no record.");
        return lesson;
      },
    ),
  );
}

// ---------------------------------------------------------------------------
// The lesson canvas
// ---------------------------------------------------------------------------

/** The block kinds an author can place, with what each one is for. */
export const BLOCK_KINDS: readonly {
  value: LessonBlock["kind"];
  label: string;
  meaning: string;
}[] = [
  { value: "heading", label: "Heading", meaning: "Breaks a long stage into parts a student can navigate." },
  { value: "text", label: "Paragraph", meaning: "The explanation itself." },
  {
    value: "callout",
    label: "Callout",
    meaning:
      "A boxed aside. Use the memory tone only for something that comes back later — warmth is reserved for retrieval.",
  },
  { value: "list", label: "List", meaning: "Steps, criteria, or examples, bulleted or numbered." },
  { value: "definition", label: "Key term", meaning: "A term and its meaning, set apart so it can be found again." },
  { value: "table", label: "Table", meaning: "A comparison a paragraph would hide." },
  { value: "image", label: "Image", meaning: "A diagram or photograph. Alternative text is required." },
  { value: "video", label: "Video", meaning: "Places a video already attached to this lesson, with its transcript." },
  {
    value: "material",
    label: "Material",
    meaning:
      "Places a reading, worksheet, data set, or reference sheet already attached to this lesson, with what it is for.",
  },
];

export type BlockInput = {
  versionId: string;
  lessonCode: string;
  /** Set when replacing an existing block; absent when placing a new one. */
  blockId: string | null;
  /** Which lesson stage the element is composed into. */
  section: LessonSection;
  kind: LessonBlock["kind"];
  text: string;
  title: string;
  tone: "note" | "important" | "example" | "memory";
  ordered: boolean;
  items: string[];
  term: string;
  meaning: string;
  caption: string;
  headers: string[];
  rows: string[][];
  url: string;
  alt: string;
  videoId: string;
  materialId: string;
  reason: string;
};

/**
 * Builds the block a `kind` describes, rejecting the ones a student could not
 * read. The validation is the product, not paperwork: an image with no
 * alternative text and a video with no transcript are both lessons that exclude
 * part of the class (CLAUDE.md §12).
 */
function buildBlock(
  lesson: AuthoredLesson,
  blockId: string,
  input: BlockInput,
): LessonBlock {
  const text = input.text.trim();
  const at = { id: blockId, section: input.section };
  switch (input.kind) {
    case "heading":
      if (text.length === 0) throw new LessonAuthoringError("A heading needs text.");
      return { ...at, kind: "heading", text };
    case "text":
      if (text.length === 0) throw new LessonAuthoringError("A paragraph needs text.");
      return { ...at, kind: "text", text };
    case "callout":
      if (text.length === 0) throw new LessonAuthoringError("A callout needs text.");
      return { ...at, kind: "callout", tone: input.tone, title: input.title.trim(), text };
    case "list": {
      const items = input.items.map((i) => i.trim()).filter(Boolean);
      if (items.length === 0) throw new LessonAuthoringError("A list needs at least one line.");
      return { ...at, kind: "list", ordered: input.ordered, items };
    }
    case "definition": {
      const term = input.term.trim();
      const meaning = input.meaning.trim();
      if (term.length === 0 || meaning.length === 0) {
        throw new LessonAuthoringError("A key term needs both the term and its meaning.");
      }
      return { ...at, kind: "definition", term, meaning };
    }
    case "table": {
      const headers = input.headers.map((h) => h.trim()).filter(Boolean);
      if (headers.length === 0) {
        throw new LessonAuthoringError("A table needs column headings, so its rows can be read.");
      }
      const rows = input.rows
        .map((row) => row.map((cell) => cell.trim()))
        .filter((row) => row.some((cell) => cell.length > 0))
        .map((row) => {
          const padded = [...row];
          while (padded.length < headers.length) padded.push("");
          return padded.slice(0, headers.length);
        });
      if (rows.length === 0) throw new LessonAuthoringError("A table needs at least one row.");
      return { ...at, kind: "table", caption: input.caption.trim(), headers, rows };
    }
    case "image": {
      const url = normalizeMediaUrl(input.url);
      const alt = input.alt.trim();
      if (alt.length === 0) {
        throw new LessonAuthoringError(
          "An image needs alternative text. Without it the image is simply missing for part of the class.",
        );
      }
      return { ...at, kind: "image", url, alt, caption: input.caption.trim() };
    }
    case "video": {
      const video = lesson.videos.find((v) => v.id === input.videoId);
      if (!video) {
        throw new LessonAuthoringError(
          "Attach the video to this lesson first; the canvas places a video it already has, with its transcript.",
        );
      }
      return { ...at, kind: "video", videoId: video.id };
    }
    case "material": {
      const material = lesson.materials.find((m) => m.id === input.materialId);
      if (!material) {
        throw new LessonAuthoringError(
          "Attach the material to this lesson first; the canvas places a material it already has, with its purpose and how to get it another way.",
        );
      }
      return { ...at, kind: "material", materialId: material.id };
    }
  }
}

/**
 * Places a new element at the end of its section, or replaces one in place.
 *
 * Moving an element to a different section re-places it at the end of that
 * section rather than leaving it wherever its old index happens to fall in the
 * new one. Landing in the middle of a stage a person did not choose is the kind
 * of surprise that makes an author stop trusting the canvas.
 */
export function saveLessonBlock(
  actor: User,
  input: BlockInput,
  idempotencyKey: string,
): LessonBlock {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const lesson = upsertDraft(version, input.lessonCode, actor);

        const blockId = input.blockId ?? nextId("ab");
        const block = buildBlock(lesson, blockId, input);
        const existingAt = lesson.blocks.findIndex((b) => b.id === blockId);
        const previousSection =
          existingAt >= 0 ? lesson.blocks[existingAt].section : null;
        const moved = previousSection !== null && previousSection !== block.section;

        if (existingAt < 0 || moved) {
          lesson.blocks = lesson.blocks.filter((b) => b.id !== blockId);
          lesson.blocks.push(block);
        } else {
          lesson.blocks[existingAt] = block;
        }
        lesson.updatedAt = nextTimestamp();
        lesson.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: existingAt >= 0 ? "curriculum.block_changed" : "curriculum.block_added",
          targetEntity: "authored_lesson",
          targetId: lesson.id,
          before:
            existingAt >= 0
              ? { blockId, position: existingAt, section: previousSection }
              : { blocks: lesson.blocks.length - 1 },
          after: {
            blockId,
            kind: block.kind,
            section: block.section,
            blocks: lesson.blocks.length,
          },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.block_saved", idempotencyKey),
        });

        return block;
      },
      () => {
        throw new LessonAuthoringError(
          "That block was already saved by an earlier submission.",
        );
      },
    ),
  );
}

/**
 * Moves an element one position up or down WITHIN its own section.
 *
 * The neighbour is the nearest block in the same section, not the adjacent
 * array index — otherwise a single arrow press would silently reorder two
 * different stages against each other.
 */
export function moveLessonBlock(
  actor: User,
  input: { versionId: string; lessonCode: string; blockId: string; direction: "up" | "down"; reason: string },
  idempotencyKey: string,
): AuthoredLesson {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const lesson = authoredLesson(version.id, input.lessonCode);
        if (!lesson) throw new LessonAuthoringError("That lesson has no draft content.");

        const at = lesson.blocks.findIndex((b) => b.id === input.blockId);
        if (at < 0) throw new LessonAuthoringError("That block is not on this lesson.");
        const section = lesson.blocks[at].section;

        let to = -1;
        if (input.direction === "up") {
          for (let i = at - 1; i >= 0; i -= 1) {
            if (lesson.blocks[i].section === section) {
              to = i;
              break;
            }
          }
        } else {
          for (let i = at + 1; i < lesson.blocks.length; i += 1) {
            if (lesson.blocks[i].section === section) {
              to = i;
              break;
            }
          }
        }
        if (to < 0) {
          throw new LessonAuthoringError(
            `That element is already ${input.direction === "up" ? "first" : "last"} in ${LESSON_SECTION_PART[section].label}.`,
          );
        }

        const moved = lesson.blocks[at];
        lesson.blocks[at] = lesson.blocks[to];
        lesson.blocks[to] = moved;
        lesson.updatedAt = nextTimestamp();
        lesson.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: "curriculum.block_moved",
          targetEntity: "authored_lesson",
          targetId: lesson.id,
          before: { blockId: input.blockId, position: at, section },
          after: { blockId: input.blockId, position: to, section },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.block_moved", idempotencyKey),
        });

        return lesson;
      },
      (existingId) => {
        const lesson = db().authoredLessons.find((l) => l.id === existingId);
        if (!lesson) throw new LessonAuthoringError("Duplicate write with no record.");
        return lesson;
      },
    ),
  );
}

export function removeLessonBlock(
  actor: User,
  input: { versionId: string; lessonCode: string; blockId: string; reason: string },
  idempotencyKey: string,
): AuthoredLesson {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const lesson = authoredLesson(version.id, input.lessonCode);
        if (!lesson) throw new LessonAuthoringError("That lesson has no draft content.");
        const block = lesson.blocks.find((b) => b.id === input.blockId);
        if (!block) throw new LessonAuthoringError("That block is not on this lesson.");

        lesson.blocks = lesson.blocks.filter((b) => b.id !== input.blockId);
        lesson.updatedAt = nextTimestamp();
        lesson.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: "curriculum.block_removed",
          targetEntity: "authored_lesson",
          targetId: lesson.id,
          before: { blockId: block.id, kind: block.kind, section: block.section },
          after: { blocks: lesson.blocks.length },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.block_removed", idempotencyKey),
        });

        return lesson;
      },
      (existingId) => {
        const lesson = db().authoredLessons.find((l) => l.id === existingId);
        if (!lesson) throw new LessonAuthoringError("Duplicate write with no record.");
        return lesson;
      },
    ),
  );
}

export type VideoInput = {
  versionId: string;
  lessonCode: string;
  title: string;
  url: string;
  minutes: number | null;
  transcript: string;
  captionsUrl: string | null;
  reason: string;
};

/**
 * Attaches a video to a lesson.
 *
 * The video is referenced by URL. Uploading the file itself needs Supabase
 * Storage, which this build does not have (ADR 0002) — so rather than offer an
 * upload control that cannot complete its action, the lesson holds a reference
 * and says where the file lives. A transcript is required, not optional: a
 * video nobody can read is a lesson some students cannot take.
 */
export function addLessonVideo(
  actor: User,
  input: VideoInput,
  idempotencyKey: string,
): LessonVideo {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const lesson = upsertDraft(version, input.lessonCode, actor);

        const url = normalizeMediaUrl(input.url);
        const captionsUrl = input.captionsUrl?.trim()
          ? normalizeMediaUrl(input.captionsUrl)
          : null;
        const transcript = input.transcript.trim();
        if (transcript.length === 0) {
          throw new LessonAuthoringError(
            "A video needs a transcript before it can be attached. Media without one is not accessible.",
          );
        }
        const title = input.title.trim();
        if (title.length === 0) {
          throw new LessonAuthoringError("A video needs a title students can read.");
        }
        if (lesson.videos.some((v) => v.url === url)) {
          throw new LessonAuthoringError("That video is already attached to this lesson.");
        }

        const video: LessonVideo = {
          id: nextId("av"),
          title,
          source: "url",
          url,
          minutes: input.minutes && input.minutes > 0 ? input.minutes : null,
          transcript,
          captionsUrl,
          addedAt: nextTimestamp(),
          addedByUserId: actor.id,
        };
        lesson.videos.push(video);
        lesson.updatedAt = nextTimestamp();
        lesson.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: "curriculum.lesson_video_added",
          targetEntity: "authored_lesson",
          targetId: lesson.id,
          before: { videos: lesson.videos.length - 1 },
          after: {
            videos: lesson.videos.length,
            videoId: video.id,
            title: video.title,
            url: video.url,
            hasTranscript: true,
            hasCaptions: captionsUrl !== null,
          },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.lesson_video_added", idempotencyKey),
        });

        return video;
      },
      () => {
        throw new LessonAuthoringError(
          "That video was already attached by an earlier submission.",
        );
      },
    ),
  );
}

function normalizeMediaUrl(raw: string): string {
  const value = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new LessonAuthoringError(
      "That is not a complete web address. Include https:// and the full path.",
    );
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new LessonAuthoringError("A media address must be http or https.");
  }
  return parsed.toString();
}

export function removeLessonVideo(
  actor: User,
  input: { versionId: string; lessonCode: string; videoId: string; reason: string },
  idempotencyKey: string,
): AuthoredLesson {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const lesson = authoredLesson(version.id, input.lessonCode);
        if (!lesson) throw new LessonAuthoringError("That lesson has no draft content.");
        const video = lesson.videos.find((v) => v.id === input.videoId);
        if (!video) throw new LessonAuthoringError("That video is not on this lesson.");
        const placed = lesson.blocks.filter(
          (b) => b.kind === "video" && b.videoId === input.videoId,
        ).length;
        if (placed > 0) {
          throw new LessonAuthoringError(
            `The canvas places this video ${placed === 1 ? "once" : `${placed} times`}. Remove ${placed === 1 ? "that block" : "those blocks"} first — detaching it here would leave the lesson with a gap where a student expects the video.`,
          );
        }

        lesson.videos = lesson.videos.filter((v) => v.id !== input.videoId);
        lesson.updatedAt = nextTimestamp();
        lesson.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: "curriculum.lesson_video_removed",
          targetEntity: "authored_lesson",
          targetId: lesson.id,
          before: { videoId: video.id, title: video.title, url: video.url },
          after: { videos: lesson.videos.length },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.lesson_video_removed", idempotencyKey),
        });

        return lesson;
      },
      (existingId) => {
        const lesson = db().authoredLessons.find((l) => l.id === existingId);
        if (!lesson) throw new LessonAuthoringError("Duplicate write with no record.");
        return lesson;
      },
    ),
  );
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

/** The material kinds an author can attach, with what each one is for. */
export const MATERIAL_KINDS: readonly {
  value: LessonMaterialKind;
  label: string;
  meaning: string;
}[] = [
  { value: "reading", label: "Reading", meaning: "An article, excerpt, or primary source the student reads." },
  { value: "worksheet", label: "Worksheet", meaning: "A practice or recording sheet the student writes on." },
  { value: "slides", label: "Slides", meaning: "A deck the student moves through at their own pace." },
  { value: "dataset", label: "Data set", meaning: "The numbers, table, or file the task actually works on." },
  { value: "reference", label: "Reference sheet", meaning: "Something to keep open beside the work — formulas, a word bank, a rubric." },
  {
    value: "manipulative",
    label: "Hands-on material",
    meaning:
      "A physical object the student needs to have in front of them. The access note is where you say how to get it.",
  },
];

export type MaterialInput = {
  versionId: string;
  lessonCode: string;
  kind: LessonMaterialKind;
  title: string;
  url: string;
  purpose: string;
  accessNote: string;
  minutes: number | null;
  reason: string;
};

/**
 * Attaches a material to a lesson.
 *
 * Same shape as a video, and for the same reasons: the material is referenced
 * by URL because uploading the file itself needs Supabase Storage, which this
 * build does not have (ADR 0002), and it is attached once so the canvas can
 * place it without describing it a second time.
 *
 * `purpose` and `accessNote` are both required. A link with no task attached is
 * noise on a page a student is trying to work through, and a material that
 * exists in one format only is a lesson some students cannot take
 * (CLAUDE.md §12).
 */
export function addLessonMaterial(
  actor: User,
  input: MaterialInput,
  idempotencyKey: string,
): LessonMaterial {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const lesson = upsertDraft(version, input.lessonCode, actor);

        const url = normalizeMediaUrl(input.url);
        const title = input.title.trim();
        if (title.length === 0) {
          throw new LessonAuthoringError("A material needs a title students can read.");
        }
        const purpose = input.purpose.trim();
        if (purpose.length === 0) {
          throw new LessonAuthoringError(
            "Say what the student does with this material. A link with no task attached is noise.",
          );
        }
        const accessNote = input.accessNote.trim();
        if (accessNote.length === 0) {
          throw new LessonAuthoringError(
            "A material needs an access note: what format it is, and how a student who cannot open that format gets the same content.",
          );
        }
        if (lesson.materials.some((m) => m.url === url)) {
          throw new LessonAuthoringError(
            "That material is already attached to this lesson.",
          );
        }

        const material: LessonMaterial = {
          id: nextId("am"),
          kind: input.kind,
          title,
          source: "url",
          url,
          purpose,
          accessNote,
          minutes: input.minutes && input.minutes > 0 ? input.minutes : null,
          addedAt: nextTimestamp(),
          addedByUserId: actor.id,
        };
        lesson.materials.push(material);
        lesson.updatedAt = nextTimestamp();
        lesson.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: "curriculum.lesson_material_added",
          targetEntity: "authored_lesson",
          targetId: lesson.id,
          before: { materials: lesson.materials.length - 1 },
          after: {
            materials: lesson.materials.length,
            materialId: material.id,
            kind: material.kind,
            title: material.title,
            url: material.url,
          },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.lesson_material_added", idempotencyKey),
        });

        return material;
      },
      () => {
        throw new LessonAuthoringError(
          "That material was already attached by an earlier submission.",
        );
      },
    ),
  );
}

export function removeLessonMaterial(
  actor: User,
  input: { versionId: string; lessonCode: string; materialId: string; reason: string },
  idempotencyKey: string,
): AuthoredLesson {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const lesson = authoredLesson(version.id, input.lessonCode);
        if (!lesson) throw new LessonAuthoringError("That lesson has no draft content.");
        const material = lesson.materials.find((m) => m.id === input.materialId);
        if (!material) {
          throw new LessonAuthoringError("That material is not on this lesson.");
        }
        const placed = lesson.blocks.filter(
          (b) => b.kind === "material" && b.materialId === input.materialId,
        ).length;
        if (placed > 0) {
          throw new LessonAuthoringError(
            `The canvas places this material ${placed === 1 ? "once" : `${placed} times`}. Remove ${placed === 1 ? "that block" : "those blocks"} first — detaching it here would leave the lesson pointing at something that is no longer there.`,
          );
        }

        lesson.materials = lesson.materials.filter((m) => m.id !== input.materialId);
        lesson.updatedAt = nextTimestamp();
        lesson.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: "curriculum.lesson_material_removed",
          targetEntity: "authored_lesson",
          targetId: lesson.id,
          before: { materialId: material.id, title: material.title, url: material.url },
          after: { materials: lesson.materials.length },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.lesson_material_removed", idempotencyKey),
        });

        return lesson;
      },
      (existingId) => {
        const lesson = db().authoredLessons.find((l) => l.id === existingId);
        if (!lesson) throw new LessonAuthoringError("Duplicate write with no record.");
        return lesson;
      },
    ),
  );
}

export type QuizItemInput = {
  versionId: string;
  lessonCode: string;
  /** Set when replacing an existing item; absent when writing a new one. */
  itemId: string | null;
  purpose: ItemPurpose;
  standard: string;
  stem: string;
  choices: { text: string; errorCode: string }[];
  correctIndex: number;
  rationale: string;
  reason: string;
};

/**
 * Writes one quiz item.
 *
 * The validation here is the product, not paperwork. An item that claims a
 * standard the lesson does not teach, or a distractor with no error family
 * behind it, produces evidence that cannot direct anything — which is the whole
 * mechanism this platform runs on.
 */
export function saveQuizItem(
  actor: User,
  input: QuizItemInput,
  idempotencyKey: string,
): AuthoredQuizItem {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const lesson = upsertDraft(version, input.lessonCode, actor);

        const allowed = alignableStandards(version, input.lessonCode);
        if (allowed.length === 0) {
          throw new LessonAuthoringError(
            `${input.lessonCode} claims no new primary standard, so an item here has nothing to align to. Items belong on the lessons that carry the coverage.`,
          );
        }
        const standard = standardCode(input.standard.trim());
        if (!allowed.includes(standard)) {
          throw new LessonAuthoringError(
            `${standard || "That standard"} is not primary coverage for ${input.lessonCode}. This lesson covers ${allowed.join(", ")}.`,
          );
        }

        const stem = input.stem.trim();
        if (stem.length < 8) {
          throw new LessonAuthoringError("An item needs a question a student can read.");
        }
        const rationale = input.rationale.trim();
        if (rationale.length === 0) {
          throw new LessonAuthoringError(
            "An item needs an explanation, shown after the student answers.",
          );
        }

        const texts = input.choices.map((c) => c.text.trim());
        if (texts.length < 2 || texts.length > 6) {
          throw new LessonAuthoringError("An item needs between two and six choices.");
        }
        if (texts.some((t) => t.length === 0)) {
          throw new LessonAuthoringError("Every choice needs text.");
        }
        if (new Set(texts.map((t) => t.toLowerCase())).size !== texts.length) {
          throw new LessonAuthoringError("Two choices are identical.");
        }
        if (input.correctIndex < 0 || input.correctIndex >= texts.length) {
          throw new LessonAuthoringError("Mark exactly one choice as correct.");
        }

        const itemId = input.itemId ?? nextId("ai");
        const choices: AuthoredChoice[] = texts.map((text, index) => {
          const isCorrect = index === input.correctIndex;
          const errorCode = input.choices[index].errorCode.trim();
          if (!isCorrect && errorCode.length === 0) {
            throw new LessonAuthoringError(
              "Every wrong choice needs the error it reveals. A distractor without one is a mark, not a diagnosis.",
            );
          }
          return {
            id: `${itemId}-${String.fromCharCode(97 + index)}`,
            text,
            errorCode: isCorrect ? null : errorCode,
          };
        });

        const existing = lesson.items.find((i) => i.id === itemId);
        const item: AuthoredQuizItem = {
          id: itemId,
          purpose: input.purpose,
          standard,
          // The reusable skill is the bare standard code, matching how every
          // other item in the system reports evidence.
          skill: standard,
          stem,
          choices,
          correctChoiceId: choices[input.correctIndex].id,
          rationale,
          addedAt: existing?.addedAt ?? nextTimestamp(),
          addedByUserId: existing?.addedByUserId ?? actor.id,
        };

        if (existing) {
          lesson.items = lesson.items.map((i) => (i.id === itemId ? item : i));
        } else {
          lesson.items.push(item);
        }
        lesson.updatedAt = nextTimestamp();
        lesson.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: existing ? "curriculum.quiz_item_changed" : "curriculum.quiz_item_added",
          targetEntity: "authored_lesson",
          targetId: lesson.id,
          before: existing
            ? { itemId, stem: existing.stem.slice(0, 120), choices: existing.choices.length }
            : { items: lesson.items.length - 1 },
          after: {
            itemId,
            purpose: item.purpose,
            standard: item.standard,
            stem: item.stem.slice(0, 120),
            choices: item.choices.length,
          },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.quiz_item_saved", idempotencyKey),
        });

        return item;
      },
      () => {
        throw new LessonAuthoringError(
          "That item was already saved by an earlier submission.",
        );
      },
    ),
  );
}

export function removeQuizItem(
  actor: User,
  input: { versionId: string; lessonCode: string; itemId: string; reason: string },
  idempotencyKey: string,
): AuthoredLesson {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const lesson = authoredLesson(version.id, input.lessonCode);
        if (!lesson) throw new LessonAuthoringError("That lesson has no draft content.");
        const item = lesson.items.find((i) => i.id === input.itemId);
        if (!item) throw new LessonAuthoringError("That item is not on this lesson.");

        lesson.items = lesson.items.filter((i) => i.id !== input.itemId);
        lesson.updatedAt = nextTimestamp();
        lesson.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: "curriculum.quiz_item_removed",
          targetEntity: "authored_lesson",
          targetId: lesson.id,
          before: { itemId: item.id, stem: item.stem.slice(0, 120) },
          after: { items: lesson.items.length },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.quiz_item_removed", idempotencyKey),
        });

        return lesson;
      },
      (existingId) => {
        const lesson = db().authoredLessons.find((l) => l.id === existingId);
        if (!lesson) throw new LessonAuthoringError("Duplicate write with no record.");
        return lesson;
      },
    ),
  );
}

/**
 * Opens the next draft version of a course.
 *
 * Authoring needs somewhere to write, and published content is immutable, so
 * starting work means starting a version. Content is not carried over: a
 * version is a deliberate statement of what a course is this time, and copying
 * silently would make it easy to publish something nobody re-read.
 */
export function createDraftVersion(
  actor: User,
  input: { courseTitle: string; version: string; notes: string; reason: string },
  idempotencyKey: string,
): CourseVersion {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        assertCanAuthorCurriculum(actor);
        const reason = requireReason(input.reason);
        const course = getCourse(input.courseTitle);
        if (!course) throw new LessonAuthoringError("That course is not in the catalog.");

        const label = input.version.trim();
        if (!/^\d{4}\.\d+$/.test(label)) {
          throw new LessonAuthoringError(
            "A version label looks like 2026.3 — the school year, then the revision.",
          );
        }
        const clash = db().courseVersions.find(
          (v) => v.courseTitle === course.title && v.version === label,
        );
        if (clash) {
          throw new LessonAuthoringError(
            `${course.title} ${label} already exists. Version labels are stable, so pick the next one.`,
          );
        }

        const created: CourseVersion = {
          id: `cv_${course.title.replace(/[^A-Za-z0-9]+/g, "_")}_${label.replace(".", "_")}`,
          courseTitle: course.title,
          version: label,
          status: "draft",
          publishedAt: null,
          retiredAt: null,
          notes: input.notes.trim(),
        };
        db().courseVersions.push(created);

        recordAudit({
          actor,
          action: "curriculum.version_created",
          targetEntity: "course_version",
          targetId: created.id,
          before: null,
          after: { courseTitle: created.courseTitle, version: created.version, status: "draft" },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.version_created", idempotencyKey),
        });

        return created;
      },
      (existingId) => {
        const version = db().courseVersions.find((v) => v.id === existingId);
        if (!version) throw new LessonAuthoringError("Duplicate write with no record.");
        return version;
      },
    ),
  );
}

// ---------------------------------------------------------------------------
// Narrow appends
// ---------------------------------------------------------------------------
//
// `saveLessonScript` replaces the whole script, which is what a form editing
// the whole script should do. These two add to one part of it instead.
//
// They exist because accepting a proposal is an addition, not a replacement: a
// designer who accepts one more worked example has not decided anything about
// the other six, and a save that carried the whole script would let a stale
// browser tab quietly revert them. Nothing about these is assistant-specific —
// they are ordinary authoring writes with the ordinary rules, and a person
// typing an eighth example by hand goes through the same path.

/** Adds worked-model steps to the end of the lesson's worked model. */
export function appendWorkedModel(
  actor: User,
  input: {
    versionId: string;
    lessonCode: string;
    steps: { step: string; reasoning: string }[];
    reason: string;
  },
  idempotencyKey: string,
): AuthoredLesson {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const lesson = upsertDraft(version, input.lessonCode, actor);

        const steps = input.steps
          .map((s) => ({ step: s.step.trim(), reasoning: s.reasoning.trim() }))
          .filter((s) => s.step && s.reasoning);
        if (steps.length === 0) {
          throw new LessonAuthoringError(
            "A worked model step needs both the step and the reasoning behind it.",
          );
        }
        if (lesson.workedModel.length + steps.length > 16) {
          throw new LessonAuthoringError(
            "A lesson's worked model holds at most sixteen steps. Remove some before adding more.",
          );
        }

        const before = lesson.workedModel.length;
        lesson.workedModel.push(...steps);
        lesson.updatedAt = nextTimestamp();
        lesson.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: "curriculum.worked_model_appended",
          targetEntity: "authored_lesson",
          targetId: lesson.id,
          before: { steps: before },
          after: {
            steps: lesson.workedModel.length,
            added: steps.length,
            courseVersionId: version.id,
            lessonCode: lesson.lessonCode,
          },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.worked_model_appended", idempotencyKey),
        });
        return lesson;
      },
      (existingId) => {
        const lesson = db().authoredLessons.find((l) => l.id === existingId);
        if (!lesson) throw new LessonAuthoringError("Duplicate write with no record.");
        return lesson;
      },
    ),
  );
}

/** Adds practice items to the end of the lesson's guided practice. */
export function appendGuidedPractice(
  actor: User,
  input: {
    versionId: string;
    lessonCode: string;
    items: { prompt: string; hint: string; answer: string }[];
    reason: string;
  },
  idempotencyKey: string,
): AuthoredLesson {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const lesson = upsertDraft(version, input.lessonCode, actor);

        const items = input.items
          .map((g) => ({
            prompt: g.prompt.trim(),
            hint: g.hint.trim(),
            answer: g.answer.trim(),
          }))
          .filter((g) => g.prompt && g.answer);
        if (items.length === 0) {
          throw new LessonAuthoringError(
            "A practice item needs a prompt and an answer.",
          );
        }
        if (lesson.guidedPractice.length + items.length > 16) {
          throw new LessonAuthoringError(
            "A lesson holds at most sixteen guided practice items. Remove some before adding more.",
          );
        }

        const before = lesson.guidedPractice.length;
        lesson.guidedPractice.push(...items);
        lesson.updatedAt = nextTimestamp();
        lesson.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: "curriculum.guided_practice_appended",
          targetEntity: "authored_lesson",
          targetId: lesson.id,
          before: { items: before },
          after: {
            items: lesson.guidedPractice.length,
            added: items.length,
            courseVersionId: version.id,
            lessonCode: lesson.lessonCode,
          },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.guided_practice_appended", idempotencyKey),
        });
        return lesson;
      },
      (existingId) => {
        const lesson = db().authoredLessons.find((l) => l.id === existingId);
        if (!lesson) throw new LessonAuthoringError("Duplicate write with no record.");
        return lesson;
      },
    ),
  );
}
