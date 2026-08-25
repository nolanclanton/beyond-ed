/**
 * Which learning is foundational for which — governed per course version.
 *
 * The workbook already records the links: every one of the 5,130 pathway
 * lessons names six pieces of prior learning, some of them earlier lessons in
 * the same course and some of them reusable supports from the intervention
 * bank. What it does NOT record is how hard each link binds — it says a link
 * exists and what role it plays, not whether a student can start the lesson
 * without it.
 *
 * That judgement is the governor's, and it is what this module stores: an
 * importance for a link, a link retired, or a link added, each scoped to one
 * course version and each audited. An ungoverned link says so rather than
 * showing an invented number (CLAUDE.md §14 — never fabricate curriculum data).
 *
 * Two rules are enforced on every write, and re-checked as a publication gate,
 * because both describe something a student would actually hit:
 *
 * **A lesson's foundation must run before it.** Not after, not itself. This is
 * what makes the map acyclic without a cycle check, and it is why re-sequencing
 * a unit can put an existing link in conflict — the conflict is real, and the
 * gate reports it rather than quietly reordering the map to hide it.
 *
 * **A support's foundation must be able to return the student into this
 * course.** The bank says which courses each support returns into; a support
 * that cannot return here would leave a student with nowhere to come back to.
 *
 * The intervention bank is imported for that rule and for nothing else — the
 * rule is a fact about where a student ends up, not a label. Support NAMES are
 * still joined by the caller, as `prerequisites.ts` intends.
 */
import { recordAudit, requestIdFor } from "@/lib/audit/log";
import { assertCanAuthorCurriculum } from "@/lib/auth/scope";
import { nextTimestamp } from "@/lib/clock";
import { pushInto } from "@/lib/collections";
import { transact, withIdempotency } from "@/lib/db/store";
import type {
  CourseStructure,
  CourseVersion,
  FoundationEdit,
  FoundationImportance,
  User,
} from "@/lib/db/types";
import { returnsInto, supportById } from "@/lib/intervention/bank";

import type { CatalogCourse } from "./catalog";
import { prerequisiteKind, prerequisitesFor } from "./prerequisites";
import {
  effectiveCourse,
  locateInCourse,
  pathwayIndex,
  requireReason,
  requireStructure,
  structureFor,
  touch,
  upsertStructure,
  versionRecord,
  type StructureFinding,
} from "./structure";

export class FoundationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FoundationError";
  }
}

/** A lesson may name at most this many foundations, workbook links included. */
export const MAX_FOUNDATIONS = 10;

/**
 * How the importance number reads in words.
 *
 * Status is never colour alone (CLAUDE.md §12), and this is the sentence a
 * teacher would say — not a label like "strength 4".
 */
export const IMPORTANCE_MEANING: Record<FoundationImportance, string> = {
  1: "Helpful background — a student without it can still start",
  2: "Supporting — smooths the lesson but does not block it",
  3: "Substantial — most students need it first",
  4: "Foundational — this lesson is hard to attempt without it",
  5: "Required — do not advance into this lesson without it",
};

export const IMPORTANCE_LEVELS: readonly FoundationImportance[] = [1, 2, 3, 4, 5];

/** At 4 and above the link is what a governor means by "foundational". */
export const FOUNDATIONAL_AT = 4;

export function isFoundational(importance: FoundationImportance | null): boolean {
  return importance !== null && importance >= FOUNDATIONAL_AT;
}

export function importanceMeaning(importance: FoundationImportance | null): string {
  return importance === null
    ? "Not yet governed — the workbook records the link, not how hard it binds"
    : IMPORTANCE_MEANING[importance];
}

export type Foundation = {
  /** A lesson code, or an intervention support id. */
  targetId: string;
  kind: "lesson" | "support";
  /** The workbook's own description of the link, e.g. `Immediate prior learning`. */
  role: string;
  importance: FoundationImportance | null;
  /** A governor's note. Empty when nobody has written one. */
  note: string;
  source: "workbook" | "authored";
  /** True when this version has retired a link the workbook records. */
  retired: boolean;
};

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

function editsFor(structure: CourseStructure | undefined, lessonCode: string) {
  return (structure?.foundationEdits ?? []).filter((e) => e.lessonCode === lessonCode);
}

/**
 * Every foundation a lesson has under a version, retired ones included.
 *
 * Pass `null` for `versionId` to read the workbook's own map with no governance
 * applied — which is what the catalog surfaces show.
 */
export function governedFoundations(
  versionId: string | null,
  lessonCode: string,
): Foundation[] {
  const structure = versionId ? structureFor(versionId) : undefined;
  const edits = editsFor(structure, lessonCode);
  const byTarget = new Map(edits.map((e) => [e.targetId, e]));

  const out: Foundation[] = prerequisitesFor(lessonCode).map((p) => {
    const edit = byTarget.get(p.id);
    return {
      targetId: p.id,
      kind: p.kind,
      role: p.reason,
      importance: edit?.importance ?? null,
      note: edit?.note ?? "",
      source: "workbook" as const,
      retired: edit?.removed ?? false,
    };
  });

  const known = new Set(out.map((f) => f.targetId));
  for (const edit of edits) {
    if (known.has(edit.targetId)) continue;
    out.push({
      targetId: edit.targetId,
      kind: prerequisiteKind(edit.targetId),
      role: "Added for this version",
      importance: edit.importance,
      note: edit.note,
      source: "authored",
      retired: edit.removed,
    });
  }

  return out;
}

/** The foundations a lesson actually has under a version. Retired ones dropped. */
export function foundationsFor(
  versionId: string | null,
  lessonCode: string,
): Foundation[] {
  return governedFoundations(versionId, lessonCode).filter((f) => !f.retired);
}

export function lessonFoundations(versionId: string | null, lessonCode: string) {
  return foundationsFor(versionId, lessonCode).filter((f) => f.kind === "lesson");
}

export function supportFoundations(versionId: string | null, lessonCode: string) {
  return foundationsFor(versionId, lessonCode).filter((f) => f.kind === "support");
}

export type Dependent = {
  lessonCode: string;
  importance: FoundationImportance | null;
  role: string;
};

/**
 * What depends on a lesson or a support, under one version.
 *
 * Built by walking the version's own course rather than the whole 30,780-link
 * reverse index: a governor asks this about one course at a time, and the
 * answer has to include links this version added, which the generated index
 * cannot know about.
 */
export function dependentsIn(
  versionId: string | null,
  course: CatalogCourse,
  targetId: string,
): Dependent[] {
  const out: Dependent[] = [];
  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      const found = foundationsFor(versionId, lesson.code).find(
        (f) => f.targetId === targetId,
      );
      if (found) {
        out.push({ lessonCode: lesson.code, importance: found.importance, role: found.role });
      }
    }
  }
  return out;
}

/** How many lessons in a course name each support. Keyed by support id. */
export function supportLoad(
  versionId: string | null,
  course: CatalogCourse,
): Map<string, string[]> {
  const load = new Map<string, string[]>();
  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      for (const foundation of supportFoundations(versionId, lesson.code)) {
        pushInto(load, foundation.targetId, lesson.code);
      }
    }
  }
  return load;
}

export type LessonFoundationSummary = {
  lessonCode: string;
  foundations: number;
  governed: number;
  foundational: number;
  supports: number;
  dependents: number;
  conflicts: number;
};

/**
 * One pass over a course producing everything the matrix needs per lesson.
 *
 * The matrix draws 135 cells and each cell wants counts that would otherwise
 * each be their own scan; this walks the course twice — once forward for
 * foundations, once to fold in dependents — instead of 135 times.
 */
export function courseFoundationMatrix(
  versionId: string | null,
  course: CatalogCourse,
): Map<string, LessonFoundationSummary> {
  const summaries = new Map<string, LessonFoundationSummary>();
  const dependentCounts = new Map<string, number>();
  const positions = new Map<string, number>();

  let index = 0;
  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      positions.set(lesson.code, index);
      index += 1;
    }
  }

  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      const foundations = foundationsFor(versionId, lesson.code);
      let conflicts = 0;
      for (const foundation of foundations) {
        if (foundation.kind === "lesson") {
          dependentCounts.set(
            foundation.targetId,
            (dependentCounts.get(foundation.targetId) ?? 0) + 1,
          );
          const at = positions.get(foundation.targetId);
          if (at === undefined || at >= (positions.get(lesson.code) ?? 0)) conflicts += 1;
        } else {
          const support = supportById(foundation.targetId);
          if (!support || !returnsInto(support, course.id)) conflicts += 1;
        }
      }
      summaries.set(lesson.code, {
        lessonCode: lesson.code,
        foundations: foundations.length,
        governed: foundations.filter((f) => f.importance !== null).length,
        foundational: foundations.filter((f) => isFoundational(f.importance)).length,
        supports: foundations.filter((f) => f.kind === "support").length,
        dependents: 0,
        conflicts,
      });
    }
  }

  for (const [code, summary] of summaries) {
    summary.dependents = dependentCounts.get(code) ?? 0;
  }
  return summaries;
}

/**
 * Foundation links this version cannot honour.
 *
 * A publication blocker, and the reason re-sequencing and foundation governance
 * belong to the same surface: moving a lesson earlier can strand something that
 * used to come before it.
 */
export function foundationConflicts(version: CourseVersion): StructureFinding[] {
  const course = effectiveCourse(version);
  const findings: StructureFinding[] = [];

  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      const here = pathwayIndex(course, lesson.code);
      for (const foundation of foundationsFor(version.id, lesson.code)) {
        if (foundation.kind === "lesson") {
          const at = pathwayIndex(course, foundation.targetId);
          if (at < 0) {
            findings.push({
              severity: "error",
              message: `${lesson.code} depends on ${foundation.targetId}, which is not a lesson in ${course.title}.`,
            });
          } else if (at >= here) {
            findings.push({
              severity: "error",
              message: `${lesson.code} (day ${lesson.day}) depends on ${foundation.targetId}, which this version runs on day ${at + 1}. A foundation has to come first.`,
            });
          }
          continue;
        }
        const support = supportById(foundation.targetId);
        if (!support) {
          findings.push({
            severity: "error",
            message: `${lesson.code} depends on ${foundation.targetId}, which is not in the intervention bank.`,
          });
        } else if (!returnsInto(support, course.id)) {
          findings.push({
            severity: "error",
            message: `${lesson.code} depends on ${support.id} (${support.skill}), which cannot return a student into ${course.title}.`,
          });
        }
      }
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

function assertEditable(actor: User, versionId: string): CourseVersion {
  assertCanAuthorCurriculum(actor);
  const version = versionRecord(versionId);
  if (version.status !== "draft") {
    throw new FoundationError(
      `${version.courseTitle} ${version.version} is ${version.status.replace(/_/g, " ")}. The foundation map is editable only while a version is a draft.`,
    );
  }
  return version;
}

function upsertEdit(
  structure: CourseStructure,
  lessonCode: string,
  targetId: string,
  actor: User,
): FoundationEdit {
  const existing = structure.foundationEdits.find(
    (e) => e.lessonCode === lessonCode && e.targetId === targetId,
  );
  if (existing) return existing;
  const created: FoundationEdit = {
    lessonCode,
    targetId,
    removed: false,
    importance: null,
    note: "",
    changedAt: nextTimestamp(),
    changedByUserId: actor.id,
  };
  structure.foundationEdits.push(created);
  return created;
}

/**
 * Checks that a target is a legal foundation for a lesson in this course.
 * Returns the plain-language reason it is not, or null when it is.
 */
export function foundationBlocker(
  course: CatalogCourse,
  lessonCode: string,
  targetId: string,
): string | null {
  const here = locateInCourse(course, lessonCode);
  if (!here) return `${lessonCode} is not a lesson in ${course.title}.`;
  if (targetId === lessonCode) return "A lesson cannot be its own foundation.";

  if (prerequisiteKind(targetId) === "support") {
    const support = supportById(targetId);
    if (!support) return `${targetId} is not in the intervention bank.`;
    if (!returnsInto(support, course.id)) {
      return `${support.id} (${support.skill}) cannot return a student into ${course.title}, so it has nowhere to send them back to.`;
    }
    return null;
  }

  const there = locateInCourse(course, targetId);
  if (!there) {
    return `${targetId} is not a lesson in ${course.title}. A lesson's foundations come from its own course or from the intervention bank.`;
  }
  if (there.index >= here.index) {
    return `${targetId} runs on day ${there.index + 1} and ${lessonCode} on day ${here.index + 1}. A foundation has to come first.`;
  }
  return null;
}

/** Records how hard a foundation binds. The one write a governor makes most. */
export function setFoundationImportance(
  actor: User,
  input: {
    versionId: string;
    lessonCode: string;
    targetId: string;
    importance: FoundationImportance;
    note: string;
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
        const course = effectiveCourse(version);

        const current = governedFoundations(version.id, input.lessonCode).find(
          (f) => f.targetId === input.targetId,
        );
        if (!current) {
          throw new FoundationError(
            `${input.targetId} is not a foundation of ${input.lessonCode}. Add it first.`,
          );
        }
        if (current.retired) {
          throw new FoundationError(
            `${input.targetId} has been retired from ${input.lessonCode} in this version. Restore it before setting its importance.`,
          );
        }
        const blocker = foundationBlocker(course, input.lessonCode, input.targetId);
        if (blocker) throw new FoundationError(blocker);

        const structure = upsertStructure(version, actor);
        const edit = upsertEdit(structure, input.lessonCode, input.targetId, actor);
        const before = { importance: edit.importance, note: edit.note };
        edit.importance = input.importance;
        edit.note = input.note.trim();
        edit.changedAt = nextTimestamp();
        edit.changedByUserId = actor.id;
        touch(structure, actor);

        recordAudit({
          actor,
          action: "curriculum.foundation_weighted",
          targetEntity: "course_version",
          targetId: version.id,
          before: { lessonCode: input.lessonCode, targetId: input.targetId, ...before },
          after: {
            lessonCode: input.lessonCode,
            targetId: input.targetId,
            importance: edit.importance,
            foundational: isFoundational(edit.importance),
            note: edit.note,
          },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.foundation_weighted", idempotencyKey),
        });

        return structure;
      },
      () => requireStructure(input.versionId),
    ),
  );
}

/** Names something else as prior learning for a lesson. */
export function addFoundation(
  actor: User,
  input: {
    versionId: string;
    lessonCode: string;
    targetId: string;
    importance: FoundationImportance;
    note: string;
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
        const course = effectiveCourse(version);
        const targetId = input.targetId.trim().toUpperCase();

        const existing = governedFoundations(version.id, input.lessonCode);
        const already = existing.find((f) => f.targetId === targetId);
        if (already && !already.retired) {
          throw new FoundationError(
            `${targetId} is already a foundation of ${input.lessonCode}.`,
          );
        }
        const active = existing.filter((f) => !f.retired).length;
        if (!already && active >= MAX_FOUNDATIONS) {
          throw new FoundationError(
            `${input.lessonCode} already names ${active} foundations. Retire one before adding another — a list nobody can act on is not a map.`,
          );
        }
        const blocker = foundationBlocker(course, input.lessonCode, targetId);
        if (blocker) throw new FoundationError(blocker);

        const structure = upsertStructure(version, actor);
        const edit = upsertEdit(structure, input.lessonCode, targetId, actor);
        edit.removed = false;
        edit.importance = input.importance;
        edit.note = input.note.trim();
        edit.changedAt = nextTimestamp();
        edit.changedByUserId = actor.id;
        touch(structure, actor);

        recordAudit({
          actor,
          action: "curriculum.foundation_added",
          targetEntity: "course_version",
          targetId: version.id,
          before: { lessonCode: input.lessonCode, foundations: active },
          after: {
            lessonCode: input.lessonCode,
            targetId,
            kind: prerequisiteKind(targetId),
            importance: edit.importance,
            foundational: isFoundational(edit.importance),
          },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.foundation_added", idempotencyKey),
        });

        return structure;
      },
      () => requireStructure(input.versionId),
    ),
  );
}

/**
 * Retires a foundation, or restores one this version retired.
 *
 * Nothing is deleted: the workbook link stays readable and the override records
 * that this version no longer treats it as prior learning (CLAUDE.md §6 —
 * removal is a state transition plus an audit event).
 */
export function setFoundationRetired(
  actor: User,
  input: {
    versionId: string;
    lessonCode: string;
    targetId: string;
    retired: boolean;
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

        const current = governedFoundations(version.id, input.lessonCode).find(
          (f) => f.targetId === input.targetId,
        );
        if (!current) {
          throw new FoundationError(
            `${input.targetId} is not a foundation of ${input.lessonCode}.`,
          );
        }
        if (current.retired === input.retired) {
          throw new FoundationError(
            input.retired
              ? `${input.targetId} is already retired from ${input.lessonCode}.`
              : `${input.targetId} is not retired from ${input.lessonCode}.`,
          );
        }
        if (!input.retired) {
          const course = effectiveCourse(version);
          const blocker = foundationBlocker(course, input.lessonCode, input.targetId);
          if (blocker) throw new FoundationError(blocker);
        }

        const structure = upsertStructure(version, actor);
        const edit = upsertEdit(structure, input.lessonCode, input.targetId, actor);
        edit.removed = input.retired;
        edit.changedAt = nextTimestamp();
        edit.changedByUserId = actor.id;
        touch(structure, actor);

        recordAudit({
          actor,
          action: input.retired
            ? "curriculum.foundation_retired"
            : "curriculum.foundation_restored",
          targetEntity: "course_version",
          targetId: version.id,
          before: { lessonCode: input.lessonCode, targetId: input.targetId, retired: !input.retired },
          after: { lessonCode: input.lessonCode, targetId: input.targetId, retired: input.retired },
          reason,
          idempotencyKey,
          requestId: requestIdFor("curriculum.foundation_retired", idempotencyKey),
        });

        return structure;
      },
      () => requireStructure(input.versionId),
    ),
  );
}

/** How many links this version has governed, for the surfaces that summarise it. */
export function governanceSummary(versionId: string): {
  weighted: number;
  foundational: number;
  added: number;
  retired: number;
} {
  const structure = structureFor(versionId);
  const edits = structure?.foundationEdits ?? [];
  const workbookTargets = new Set<string>();
  for (const edit of edits) {
    for (const p of prerequisitesFor(edit.lessonCode)) {
      workbookTargets.add(`${edit.lessonCode}::${p.id}`);
    }
  }
  return {
    weighted: edits.filter((e) => e.importance !== null && !e.removed).length,
    foundational: edits.filter((e) => !e.removed && isFoundational(e.importance)).length,
    added: edits.filter(
      (e) => !e.removed && !workbookTargets.has(`${e.lessonCode}::${e.targetId}`),
    ).length,
    retired: edits.filter((e) => e.removed).length,
  };
}

/** Guard used by the action layer before trusting a submitted number. */
export function toImportance(value: number): FoundationImportance {
  const n = Math.trunc(value);
  if (n < 1 || n > 5) {
    throw new FoundationError("Importance runs from 1 to 5.");
  }
  return n as FoundationImportance;
}
