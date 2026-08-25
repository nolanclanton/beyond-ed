/**
 * In-memory data store for the beta (ADR 0002).
 *
 * This stands in for Supabase Postgres until a project is provisioned. It keeps
 * the rules that matter rather than the convenience:
 *
 *  - `evidence` and `auditEvents` are append-only. The only exported way to add
 *    a row is `appendEvidence` / `appendAudit`; there is no update and no
 *    delete. This mirrors the Postgres trigger in
 *    `supabase/migrations/0002_append_only.sql`.
 *  - `gradeRecords` is append-only too: a grade change is a new row that
 *    supersedes the previous one (CLAUDE.md §2).
 *  - Consequential writes go through `transact`, which restores the previous
 *    snapshot if anything throws, so a partial write cannot survive.
 *  - Consequential writes go through `withIdempotency`, so a retry returns the
 *    first result instead of creating a second record.
 *
 * The store lives on `globalThis` so the dev server's module reloading does not
 * silently reset a review session.
 */
import type {
  AuditEvent,
  AuthoredLesson,
  CourseVersion,
  Enrollment,
  EvidenceRecord,
  ExportRecord,
  GradeCategory,
  GradeRecord,
  GradebookConfig,
  Intervention,
  LessonState,
  Organization,
  RosterSection,
  Site,
  TeacherMessage,
  User,
} from "./types";

export type Database = {
  organizations: Organization[];
  sites: Site[];
  users: User[];
  courseVersions: CourseVersion[];
  /** Lesson content authored against a course version (CLAUDE.md §7). */
  authoredLessons: AuthoredLesson[];
  sections: RosterSection[];
  enrollments: Enrollment[];
  lessonStates: LessonState[];
  gradeCategories: GradeCategory[];
  gradebookConfigs: GradebookConfig[];
  interventions: Intervention[];
  messages: TeacherMessage[];
  exports: ExportRecord[];
  /** Append-only. Do not push directly — use `appendEvidence`. */
  readonly evidence: EvidenceRecord[];
  /** Append-only. Do not push directly — use `appendAudit`. */
  readonly auditEvents: AuditEvent[];
  /** Append-only. Do not push directly — use `appendGradeRecord`. */
  readonly gradeRecords: GradeRecord[];
  idempotency: Map<string, string>;
  counters: Map<string, number>;
  seeded: boolean;

  /**
   * Read indexes over the append-only evidence table.
   *
   * These exist for speed, not for semantics: they are rebuilt from the same
   * rows and are maintained ONLY inside `appendEvidence`, so they cannot drift
   * and cannot be used to mutate anything. A district of several hundred
   * students makes a full scan per read too slow to be honest about.
   */
  readonly evidenceByStudent: Map<string, EvidenceRecord[]>;
  readonly evidenceByEnrollment: Map<string, EvidenceRecord[]>;
  readonly supersededEvidenceIds: Set<string>;
  readonly gradesByEnrollment: Map<string, GradeRecord[]>;
  readonly supersededGradeIds: Set<string>;
};

function emptyDatabase(): Database {
  return {
    organizations: [],
    sites: [],
    users: [],
    courseVersions: [],
    authoredLessons: [],
    sections: [],
    enrollments: [],
    lessonStates: [],
    gradeCategories: [],
    gradebookConfigs: [],
    interventions: [],
    messages: [],
    exports: [],
    evidence: [],
    auditEvents: [],
    gradeRecords: [],
    idempotency: new Map(),
    counters: new Map(),
    seeded: false,
    evidenceByStudent: new Map(),
    evidenceByEnrollment: new Map(),
    supersededEvidenceIds: new Set(),
    gradesByEnrollment: new Map(),
    supersededGradeIds: new Set(),
  };
}

const GLOBAL_KEY = Symbol.for("beyond-ed.database");

type GlobalWithDb = typeof globalThis & { [GLOBAL_KEY]?: Database };
const g = globalThis as GlobalWithDb;

if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = emptyDatabase();

export function db(): Database {
  const store = g[GLOBAL_KEY] as Database;
  // The store deliberately outlives module reloading, which means a store
  // created before a collection existed can still be in memory during
  // development. Backfill the empty collection rather than crash on a missing
  // array; a fresh process gets it from `emptyDatabase` either way.
  if (!store.authoredLessons) store.authoredLessons = [];
  return store;
}

/** Wipes and re-marks the store as unseeded. Used by the seeder and by tests. */
export function clearDatabase(): void {
  g[GLOBAL_KEY] = emptyDatabase();
  lessonStateIndex = null;
  lessonStateSource = null;
  lessonStateLength = -1;
}

// ---------------------------------------------------------------------------
// Deterministic identifiers
// ---------------------------------------------------------------------------

/**
 * Sequential ids per prefix. Deterministic, so a seeded store is identical on
 * every boot and a recommendation is reproducible from its inputs.
 */
export function nextId(prefix: string): string {
  const d = db();
  const n = (d.counters.get(prefix) ?? 0) + 1;
  d.counters.set(prefix, n);
  return `${prefix}_${String(n).padStart(4, "0")}`;
}

// ---------------------------------------------------------------------------
// Append-only writes
// ---------------------------------------------------------------------------

export function appendEvidence(record: EvidenceRecord): EvidenceRecord {
  const d = db();
  const frozen = Object.freeze(record);
  (d.evidence as EvidenceRecord[]).push(frozen);

  const byStudent = d.evidenceByStudent.get(record.studentId);
  if (byStudent) byStudent.push(frozen);
  else d.evidenceByStudent.set(record.studentId, [frozen]);

  const byEnrollment = d.evidenceByEnrollment.get(record.enrollmentId);
  if (byEnrollment) byEnrollment.push(frozen);
  else d.evidenceByEnrollment.set(record.enrollmentId, [frozen]);

  if (record.supersedesEvidenceId) {
    d.supersededEvidenceIds.add(record.supersedesEvidenceId);
  }
  return frozen;
}

export function appendAudit(event: AuditEvent): AuditEvent {
  (db().auditEvents as AuditEvent[]).push(Object.freeze(event));
  return event;
}

export function appendGradeRecord(record: GradeRecord): GradeRecord {
  const d = db();
  const frozen = Object.freeze(record);
  (d.gradeRecords as GradeRecord[]).push(frozen);

  const byEnrollment = d.gradesByEnrollment.get(record.enrollmentId);
  if (byEnrollment) byEnrollment.push(frozen);
  else d.gradesByEnrollment.set(record.enrollmentId, [frozen]);

  if (record.supersedesGradeId) d.supersededGradeIds.add(record.supersedesGradeId);
  return frozen;
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

/**
 * Runs `fn` atomically. If it throws, every table is restored to its state
 * before the call, so a multi-record change cannot land half-written
 * (CLAUDE.md §1 — partial writes are a defect).
 */
export function transact<T>(fn: () => T): T {
  const d = db();
  const snapshot = {
    organizations: [...d.organizations],
    sites: [...d.sites],
    users: [...d.users],
    courseVersions: d.courseVersions.map((r) => ({ ...r })),
    // Authored lesson content is the one record with nested arrays that are
    // mutated in place, so a shallow row copy would let a rolled-back write
    // survive inside `videos` or `items`. Copy the whole shape.
    authoredLessons: d.authoredLessons.map((r) => ({
      ...r,
      successCriteria: [...r.successCriteria],
      blocks: r.blocks.map((b) =>
        b.kind === "list"
          ? { ...b, items: [...b.items] }
          : b.kind === "table"
            ? { ...b, headers: [...b.headers], rows: b.rows.map((row) => [...row]) }
            : { ...b },
      ),
      vocabulary: r.vocabulary.map((v) => ({ ...v })),
      workedModel: r.workedModel.map((w) => ({ ...w })),
      guidedPractice: r.guidedPractice.map((g) => ({ ...g })),
      notesOutline: [...r.notesOutline],
      videos: r.videos.map((v) => ({ ...v })),
      items: r.items.map((i) => ({ ...i, choices: i.choices.map((c) => ({ ...c })) })),
    })),
    sections: d.sections.map((r) => ({ ...r })),
    enrollments: d.enrollments.map((r) => ({ ...r })),
    lessonStates: d.lessonStates.map((r) => ({ ...r })),
    gradeCategories: [...d.gradeCategories],
    gradebookConfigs: [...d.gradebookConfigs],
    interventions: d.interventions.map((r) => ({ ...r })),
    messages: d.messages.map((r) => ({ ...r })),
    exports: [...d.exports],
    evidence: [...d.evidence],
    auditEvents: [...d.auditEvents],
    gradeRecords: [...d.gradeRecords],
    idempotency: new Map(d.idempotency),
    counters: new Map(d.counters),
    evidenceByStudent: new Map(
      [...d.evidenceByStudent].map(([k, v]) => [k, [...v]]),
    ),
    evidenceByEnrollment: new Map(
      [...d.evidenceByEnrollment].map(([k, v]) => [k, [...v]]),
    ),
    supersededEvidenceIds: new Set(d.supersededEvidenceIds),
    gradesByEnrollment: new Map(
      [...d.gradesByEnrollment].map(([k, v]) => [k, [...v]]),
    ),
    supersededGradeIds: new Set(d.supersededGradeIds),
  };
  try {
    return fn();
  } catch (error) {
    Object.assign(d, snapshot);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

export class DuplicateWriteError extends Error {
  constructor(public readonly existingId: string) {
    super(`This action was already recorded (${existingId}).`);
    this.name = "DuplicateWriteError";
  }
}

/**
 * Every consequential write takes a client-supplied idempotency key. A retry
 * returns the id the first attempt produced rather than creating a second
 * record (CLAUDE.md §1).
 */
export function withIdempotency<T extends { id: string }>(
  key: string,
  fn: () => T,
  onDuplicate: (existingId: string) => T,
): T {
  const d = db();
  const existing = d.idempotency.get(key);
  if (existing !== undefined) return onDuplicate(existing);
  const result = fn();
  d.idempotency.set(key, result.id);
  return result;
}

export function wasAlreadyApplied(key: string): string | undefined {
  return db().idempotency.get(key);
}

// ---------------------------------------------------------------------------
// Lesson-state lookup
// ---------------------------------------------------------------------------

/**
 * Lesson states by enrollment, memoised.
 *
 * Unlike evidence and grades, lesson states are MUTATED in place — a status
 * moves through its guarded transition — so this cannot be maintained on write
 * the way the append-only indexes are. Instead it is rebuilt whenever the
 * underlying array could have changed identity or length:
 *
 *   - a seed pushes rows, which changes the length;
 *   - a rolled-back `transact` replaces the array with fresh copies, which
 *     changes its identity and would otherwise leave the index pointing at
 *     objects no longer in the store.
 *
 * In-place status changes alter neither, and need no rebuild, because the index
 * holds the same object references the store does.
 */
let lessonStateIndex: Map<string, LessonState[]> | null = null;
let lessonStateSource: LessonState[] | null = null;
let lessonStateLength = -1;

export function lessonStatesFor(enrollmentId: string): LessonState[] {
  const d = db();
  if (
    lessonStateIndex === null ||
    lessonStateSource !== d.lessonStates ||
    lessonStateLength !== d.lessonStates.length
  ) {
    const next = new Map<string, LessonState[]>();
    for (const state of d.lessonStates) {
      const list = next.get(state.enrollmentId);
      if (list) list.push(state);
      else next.set(state.enrollmentId, [state]);
    }
    lessonStateIndex = next;
    lessonStateSource = d.lessonStates;
    lessonStateLength = d.lessonStates.length;
  }
  return lessonStateIndex.get(enrollmentId) ?? [];
}
