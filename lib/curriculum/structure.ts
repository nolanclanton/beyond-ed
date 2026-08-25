/**
 * Course structure for one version: the order it runs in, and its framing.
 *
 * The workbook is the baseline. `pnpm catalog` ingests it, and nothing in the
 * product writes back to `data/` (CLAUDE.md §7, §14). What a curriculum author
 * adapts is recorded as an OVERRIDE against a course version, and the effective
 * structure is the baseline with that override laid over it.
 *
 * Three rules make the adaptation safe.
 *
 * **A structural change belongs to a course version, and only a draft is
 * editable.** A roster section keeps the version it was created with, so
 * re-sequencing a course cannot reorder a class already running and cannot
 * change the structure a historical calculation resolved against.
 *
 * **Re-sequencing moves lessons; it never creates, deletes, or relocates
 * them across units.** That is what keeps every publication gate meaningful:
 * the nine units keep fifteen lessons each, so the 135 + 40 = 175 contract
 * holds by construction rather than by hope, and standards coverage is
 * unchanged because the same lessons claim the same standards. Moving a lesson
 * into a different unit would change two unit day budgets at once, which is a
 * blueprint decision, not an authoring one — the same line lesson content
 * already draws at creating a new lesson.
 *
 * **Identifiers never move.** A lesson keeps its code and a unit keeps its id
 * however far either travels; only `day`, `order`, `startDay`, and `endDay` are
 * recomputed, because those describe a position and the position is what
 * changed (CLAUDE.md §7 — stable identifiers).
 *
 * Every write is transactional, idempotent, and audited in the same
 * transaction.
 */
import { recordAudit, requestIdFor } from "@/lib/audit/log";
import { assertCanAuthorCurriculum } from "@/lib/auth/scope";
import { nextTimestamp } from "@/lib/clock";
import { db, nextId, transact, withIdempotency } from "@/lib/db/store";
import type { CourseStructure, CourseVersion, User } from "@/lib/db/types";

import {
  getCourse,
  getCourseById,
  type CatalogCourse,
  type CatalogLesson,
  type CatalogUnit,
} from "./catalog";

export class StructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StructureError";
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function versionRecord(versionId: string): CourseVersion {
  const version = db().courseVersions.find((v) => v.id === versionId);
  if (!version) throw new StructureError("That course version does not exist.");
  return version;
}

/** The baseline course a version was cut from. */
export function baselineCourse(version: CourseVersion): CatalogCourse {
  const course = getCourse(version.courseTitle);
  if (!course) throw new StructureError("That course is not in the catalog.");
  return course;
}

/** The override row, if this version has ever been re-sequenced or re-framed. */
export function structureFor(versionId: string): CourseStructure | undefined {
  return db().courseStructures.find((s) => s.courseVersionId === versionId);
}

/**
 * The course as this version runs it.
 *
 * Returns the baseline object itself when nothing has been overridden, so the
 * common path allocates nothing and reads identically to the workbook.
 *
 * The returned course carries the same stable `id` as the baseline. Lookups
 * that resolve a lesson through the global catalog index — `locateLesson`,
 * `findLesson`, `nextLesson` — answer from the WORKBOOK, not from this. Use the
 * helpers below when the answer has to follow the version's own order.
 */
export function effectiveCourse(version: CourseVersion): CatalogCourse {
  const course = baselineCourse(version);
  const structure = structureFor(version.id);
  if (!structure) return course;
  return applyStructure(course, structure);
}

export function effectiveCourseForVersionId(versionId: string): CatalogCourse {
  return effectiveCourse(versionRecord(versionId));
}

/** Lays an override over a baseline course. Pure — no store reads. */
export function applyStructure(
  course: CatalogCourse,
  structure: CourseStructure,
): CatalogCourse {
  const framingByUnit = new Map(structure.unitFraming.map((u) => [u.unitId, u]));

  const orderedUnits = structure.unitOrder
    ? orderBy(course.units, structure.unitOrder, (u) => u.id)
    : course.units;

  let day = 1;
  const units: CatalogUnit[] = orderedUnits.map((unit, index) => {
    const codes = structure.lessonOrder[unit.id];
    const lessons = codes
      ? orderBy(unit.lessons, codes, (l) => l.code)
      : unit.lessons;
    const startDay = day;
    // Day is a position, so it is recomputed rather than carried. The lesson's
    // code — the thing anything else refers to it by — does not move.
    const renumbered: CatalogLesson[] = lessons.map((lesson) => ({
      ...lesson,
      day: day++,
    }));
    const framing = framingByUnit.get(unit.id);
    return {
      ...unit,
      order: index + 1,
      title: framing ? framing.title : unit.title,
      essentialQuestion: framing ? framing.essentialQuestion : unit.essentialQuestion,
      startDay,
      endDay: day - 1,
      lessons: renumbered,
    };
  });

  return { ...course, units };
}

/**
 * Reorders `items` to match `order`, keeping anything `order` does not mention
 * in its original relative position at the end.
 *
 * The tolerance is deliberate: an override is stored against a workbook that a
 * later `pnpm catalog` run can change, and dropping a lesson the override has
 * not heard of would silently shorten a course. `structureIntegrity` reports
 * the mismatch instead.
 */
function orderBy<T>(items: readonly T[], order: readonly string[], key: (item: T) => string): T[] {
  const rank = new Map(order.map((id, index) => [id, index]));
  const known = items.filter((i) => rank.has(key(i)));
  const unknown = items.filter((i) => !rank.has(key(i)));
  known.sort((a, b) => (rank.get(key(a)) ?? 0) - (rank.get(key(b)) ?? 0));
  return [...known, ...unknown];
}

export type StructureFinding = { severity: "error" | "warning"; message: string };

/**
 * Whether the effective structure still describes the same course.
 *
 * A re-sequence cannot add or drop a lesson, so any difference in the lesson
 * set means the override and the workbook have diverged — which happens when
 * the workbook is regenerated under an override written against an older one.
 * This is a publication blocker, not a silent repair.
 */
export function structureIntegrity(version: CourseVersion): StructureFinding[] {
  const baseline = baselineCourse(version);
  const effective = effectiveCourse(version);
  const findings: StructureFinding[] = [];

  const baseCodes = new Set(baseline.units.flatMap((u) => u.lessons.map((l) => l.code)));
  const effectiveCodes = new Set(
    effective.units.flatMap((u) => u.lessons.map((l) => l.code)),
  );

  const dropped = [...baseCodes].filter((c) => !effectiveCodes.has(c));
  const extra = [...effectiveCodes].filter((c) => !baseCodes.has(c));
  if (dropped.length > 0) {
    findings.push({
      severity: "error",
      message: `${dropped.length} lesson(s) in the workbook are missing from this version's sequence, starting with ${dropped[0]}. Reset the sequence and re-apply the changes against the current catalog.`,
    });
  }
  if (extra.length > 0) {
    findings.push({
      severity: "error",
      message: `This version's sequence names ${extra.length} lesson(s) the workbook no longer has, starting with ${extra[0]}.`,
    });
  }
  if (effective.units.length !== baseline.units.length) {
    findings.push({
      severity: "error",
      message: `This version runs ${effective.units.length} units against the workbook's ${baseline.units.length}.`,
    });
  }
  return findings;
}

export type StructureChange = {
  kind: "unit_order" | "lesson_order" | "unit_framing";
  unitId: string | null;
  summary: string;
};

/** What this version does differently from the workbook, in words. */
export function structureChanges(version: CourseVersion): StructureChange[] {
  const structure = structureFor(version.id);
  if (!structure) return [];
  const baseline = baselineCourse(version);
  const effective = effectiveCourse(version);
  const changes: StructureChange[] = [];

  const baseUnitIds = baseline.units.map((u) => u.id).join("|");
  const effUnitIds = effective.units.map((u) => u.id).join("|");
  if (baseUnitIds !== effUnitIds) {
    changes.push({
      kind: "unit_order",
      unitId: null,
      summary: `Units run in a different order: ${effective.units.map((u) => u.order + ". " + u.title).join(", ")}.`,
    });
  }

  for (const unit of effective.units) {
    const base = baseline.units.find((u) => u.id === unit.id);
    if (!base) continue;
    const moved = unit.lessons.filter((l, i) => base.lessons[i]?.code !== l.code);
    if (moved.length > 0) {
      changes.push({
        kind: "lesson_order",
        unitId: unit.id,
        summary: `${unit.title}: ${moved.length} of ${unit.lessons.length} lessons sit at a different position than the workbook places them.`,
      });
    }
    if (base.title !== unit.title || base.essentialQuestion !== unit.essentialQuestion) {
      changes.push({
        kind: "unit_framing",
        unitId: unit.id,
        summary: `${base.title} is framed as "${unit.title}" in this version.`,
      });
    }
  }

  return changes;
}

/** Locates a lesson inside a course that may be re-sequenced. */
export function locateInCourse(
  course: CatalogCourse,
  lessonCode: string,
): { unit: CatalogUnit; lesson: CatalogLesson; index: number } | undefined {
  let index = 0;
  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      if (lesson.code === lessonCode) return { unit, lesson, index };
      index += 1;
    }
  }
  return undefined;
}

/** Position of a lesson in the effective pathway, 0-134, or -1 if absent. */
export function pathwayIndex(course: CatalogCourse, lessonCode: string): number {
  return locateInCourse(course, lessonCode)?.index ?? -1;
}

// ---------------------------------------------------------------------------
// Write guards
// ---------------------------------------------------------------------------

/**
 * The gate every structural write passes, and the one a page reads before
 * offering a control — so a control that cannot complete its action is never
 * shown as if it could (CLAUDE.md §12).
 */
export function structureGate(
  actor: { curriculumAuthor?: boolean } | null,
  versionId: string,
): { version: CourseVersion; course: CatalogCourse; editable: boolean; blockers: string[] } {
  const version = versionRecord(versionId);
  const blockers: string[] = [];
  if (!actor?.curriculumAuthor) {
    blockers.push(
      "Changing a course's structure is part of the curriculum authoring authorization, and you do not hold it.",
    );
  }
  if (version.status !== "draft") {
    blockers.push(
      `This version is ${version.status.replace(/_/g, " ")}. Structure is editable only while a version is a draft — to re-sequence a published course, create the next version.`,
    );
  }
  return {
    version,
    course: effectiveCourse(version),
    editable: blockers.length === 0,
    blockers,
  };
}

function assertEditable(actor: User, versionId: string): CourseVersion {
  assertCanAuthorCurriculum(actor);
  const version = versionRecord(versionId);
  if (version.status !== "draft") {
    throw new StructureError(
      `${version.courseTitle} ${version.version} is ${version.status.replace(/_/g, " ")}. A course's structure is editable only while its version is a draft.`,
    );
  }
  return version;
}

export function requireReason(reason: string): string {
  const trimmed = reason.trim();
  if (trimmed.length === 0) {
    throw new StructureError("A curriculum change requires a recorded reason.");
  }
  return trimmed;
}

/**
 * The override row, created on first write.
 *
 * `unitOrder` starts null and `lessonOrder` starts empty: the baseline is never
 * copied in, so a course nobody has re-sequenced reads as exactly what the
 * workbook says, and a later catalog rebuild flows straight through.
 */
export function upsertStructure(version: CourseVersion, actor: User): CourseStructure {
  const existing = structureFor(version.id);
  if (existing) return existing;
  const course = baselineCourse(version);
  const created: CourseStructure = {
    id: nextId("cs"),
    courseVersionId: version.id,
    courseId: course.id,
    unitOrder: null,
    lessonOrder: {},
    unitFraming: [],
    foundationEdits: [],
    createdAt: nextTimestamp(),
    updatedAt: nextTimestamp(),
    updatedByUserId: actor.id,
  };
  db().courseStructures.push(created);
  return created;
}

/** The override row a retried write is asked to return. */
export function requireStructure(versionId: string): CourseStructure {
  const structure = structureFor(versionId);
  if (!structure) throw new StructureError("Duplicate write with no record.");
  return structure;
}

export function touch(structure: CourseStructure, actor: User): void {
  structure.updatedAt = nextTimestamp();
  structure.updatedByUserId = actor.id;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export type MoveDirection = "up" | "down";

/** Moves a unit one position earlier or later in the course. */
export function moveUnit(
  actor: User,
  input: { versionId: string; unitId: string; direction: MoveDirection; reason: string },
  idempotencyKey: string,
): CourseStructure {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const structure = upsertStructure(version, actor);
        const course = effectiveCourse(version);

        const order = course.units.map((u) => u.id);
        const at = order.indexOf(input.unitId);
        if (at < 0) throw new StructureError("That unit is not in this course.");
        const to = input.direction === "up" ? at - 1 : at + 1;
        if (to < 0 || to >= order.length) {
          throw new StructureError(
            input.direction === "up"
              ? "That unit already runs first."
              : "That unit already runs last.",
          );
        }

        const moved = order[at];
        order[at] = order[to];
        order[to] = moved;
        structure.unitOrder = order;
        touch(structure, actor);

        recordAudit({
          actor,
          action: "curriculum.unit_moved",
          targetEntity: "course_version",
          targetId: version.id,
          before: { unitId: input.unitId, position: at + 1 },
          after: { unitId: input.unitId, position: to + 1, unitOrder: order },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.unit_moved", idempotencyKey),
        });

        return structure;
      },
      () => requireStructure(input.versionId),
    ),
  );
}

/**
 * Moves a lesson to a new position inside its own unit.
 *
 * `toPosition` is 1-based within the unit. Within the unit is the whole
 * constraint: the unit keeps its lesson count, so the day budget cannot move.
 */
export function moveLesson(
  actor: User,
  input: {
    versionId: string;
    lessonCode: string;
    toPosition: number;
    reason: string;
  },
  idempotencyKey: string,
): CourseStructure {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const structure = upsertStructure(version, actor);
        const course = effectiveCourse(version);

        const at = locateInCourse(course, input.lessonCode);
        if (!at) throw new StructureError("That lesson is not in this course.");

        const codes = at.unit.lessons.map((l) => l.code);
        const from = codes.indexOf(input.lessonCode);
        const to = Math.trunc(input.toPosition) - 1;
        if (to < 0 || to >= codes.length) {
          throw new StructureError(
            `A position in ${at.unit.title} is between 1 and ${codes.length}. Moving a lesson into a different unit would change two unit day budgets at once, which is a blueprint decision rather than an authoring one.`,
          );
        }
        if (to === from) {
          throw new StructureError(
            `${input.lessonCode} already runs at position ${to + 1} in ${at.unit.title}.`,
          );
        }

        codes.splice(from, 1);
        codes.splice(to, 0, input.lessonCode);
        structure.lessonOrder = { ...structure.lessonOrder, [at.unit.id]: codes };
        touch(structure, actor);

        recordAudit({
          actor,
          action: "curriculum.lesson_moved",
          targetEntity: "course_version",
          targetId: version.id,
          before: { lessonCode: input.lessonCode, unitId: at.unit.id, position: from + 1 },
          after: { lessonCode: input.lessonCode, unitId: at.unit.id, position: to + 1 },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.lesson_moved", idempotencyKey),
        });

        return structure;
      },
      () => requireStructure(input.versionId),
    ),
  );
}

/** Re-frames a unit for this version: the title students see, and its question. */
export function setUnitFraming(
  actor: User,
  input: {
    versionId: string;
    unitId: string;
    title: string;
    essentialQuestion: string;
    reason: string;
  },
  idempotencyKey: string,
): CourseStructure {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const structure = upsertStructure(version, actor);
        const before = effectiveCourse(version).units.find((u) => u.id === input.unitId);
        if (!before) throw new StructureError("That unit is not in this course.");

        const title = input.title.trim();
        const essentialQuestion = input.essentialQuestion.trim();
        if (title.length < 3) {
          throw new StructureError("A unit needs a title students can read.");
        }
        if (essentialQuestion.length < 8) {
          throw new StructureError(
            "A unit needs an essential question. It is what the unit is asking, and students see it.",
          );
        }

        const edit = {
          unitId: input.unitId,
          title,
          essentialQuestion,
          changedAt: nextTimestamp(),
          changedByUserId: actor.id,
        };
        structure.unitFraming = [
          ...structure.unitFraming.filter((u) => u.unitId !== input.unitId),
          edit,
        ];
        touch(structure, actor);

        recordAudit({
          actor,
          action: "curriculum.unit_reframed",
          targetEntity: "course_version",
          targetId: version.id,
          before: { unitId: before.id, title: before.title, essentialQuestion: before.essentialQuestion },
          after: { unitId: edit.unitId, title: edit.title, essentialQuestion: edit.essentialQuestion },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.unit_reframed", idempotencyKey),
        });

        return structure;
      },
      () => requireStructure(input.versionId),
    ),
  );
}

/**
 * Returns this version to the workbook's own sequence and framing.
 *
 * Foundation governance is deliberately left alone: the two are separate
 * decisions, and a governor who re-sequenced a unit by mistake should not lose
 * the strengths they recorded to undo it.
 */
export function resetSequence(
  actor: User,
  input: { versionId: string; reason: string },
  idempotencyKey: string,
): CourseStructure {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const version = assertEditable(actor, input.versionId);
        const reason = requireReason(input.reason);
        const structure = structureFor(version.id);
        if (!structure) {
          throw new StructureError(
            "This version already runs the workbook's own sequence.",
          );
        }
        const before = {
          unitOrder: structure.unitOrder,
          reorderedUnits: Object.keys(structure.lessonOrder).length,
          reframedUnits: structure.unitFraming.length,
        };
        structure.unitOrder = null;
        structure.lessonOrder = {};
        structure.unitFraming = [];
        touch(structure, actor);

        recordAudit({
          actor,
          action: "curriculum.sequence_reset",
          targetEntity: "course_version",
          targetId: version.id,
          before,
          after: { unitOrder: null, reorderedUnits: 0, reframedUnits: 0 },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.sequence_reset", idempotencyKey),
        });

        return structure;
      },
      () => requireStructure(input.versionId),
    ),
  );
}

/** Every version of a course, in lifecycle-then-label order. */
export function versionsForCourseId(courseId: string): CourseVersion[] {
  const course = getCourseById(courseId);
  if (!course) return [];
  return db()
    .courseVersions.filter((v) => v.courseTitle === course.title)
    .sort((a, b) => a.version.localeCompare(b.version));
}
