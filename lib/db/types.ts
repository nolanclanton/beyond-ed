/**
 * Record shapes for the Beyond.Ed data layer.
 *
 * These mirror the Postgres tables defined in `/supabase/migrations`. The beta
 * runs them against an in-memory store (ADR 0002); the shapes, the append-only
 * rules, and the scope rules are the same either way.
 */
import type { CurriculumStatus } from "@/lib/curriculum/publication";
import type { LessonStatus } from "@/lib/curriculum/lesson-status";
import type { EnrollmentStatus } from "@/lib/enrollment/status";
import type { InterventionStatus } from "@/lib/intervention/status";

export type Role =
  | "student"
  | "teacher"
  | "site_admin"
  | "org_admin"
  | "curriculum_author";

export type Organization = { id: string; name: string };

export type Site = { id: string; orgId: string; name: string; shortName: string };

export type User = {
  id: string;
  orgId: string;
  /** Students, teachers, and site admins belong to one site. Org admins do not. */
  siteId: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  /**
   * Curriculum authoring is a separate authorization, not a hierarchy level
   * (CLAUDE.md §3). A user may hold it alongside any role.
   */
  curriculumAuthor: boolean;
  gradeLevel: number | null;
};

export type CourseVersion = {
  id: string;
  courseTitle: string;
  /** e.g. `2026.1`. Stable across content edits within the version. */
  version: string;
  status: CurriculumStatus;
  publishedAt: string | null;
  retiredAt: string | null;
  notes: string;
};

export type RosterSection = {
  id: string;
  siteId: string;
  courseTitle: string;
  /** A roster section references exactly one approved course version. */
  courseVersionId: string;
  teacherId: string;
  period: string;
  /** Which planning cycle the section is currently in (1-10). */
  cycle: number;
  dayInCycle: number;
};

export type Enrollment = {
  id: string;
  studentId: string;
  sectionId: string;
  status: EnrollmentStatus;
  /** Denormalised for reads; always equals the section's course. */
  courseTitle: string;
  courseVersionId: string;
  startedAt: string;
  /** Set when a transfer preserves pathway state across sites. */
  transferredFromEnrollmentId: string | null;
};

export type LessonState = {
  id: string;
  enrollmentId: string;
  lessonCode: string;
  status: LessonStatus;
  /** Which of the ten stages the student is on (1-10). */
  stage: number;
  attempts: number;
  updatedAt: string;
};

/**
 * Append-only. Insert and select only — no UPDATE, no DELETE (CLAUDE.md §5).
 * Corrections are new rows linked by `supersedesEvidenceId`.
 */
export type EvidenceRecord = {
  id: string;
  studentId: string;
  enrollmentId: string;
  /** The version in force when the work happened. Never re-pointed. */
  courseVersionId: string;
  lessonCode: string;
  stage: string;
  /** Primary standard the item claims, e.g. `6.RP.1`. */
  standard: string | null;
  /** Reusable skill or rubric dimension the item measures. */
  skill: string;
  itemId: string;
  correct: boolean | null;
  response: string;
  /** Error family from the subject's error model, e.g. `unit-and-scale`. */
  errorCode: string | null;
  attempt: number;
  hintsUsed: number;
  /** Minutes of substantive interaction, not page-open time (CLAUDE.md §5). */
  meaningfulMinutes: number;
  supportUsed: string | null;
  source:
    | "pathway_lesson"
    | "exit_ticket"
    | "spiral_review"
    | "intervention"
    | "readiness_check"
    | "transfer_check"
    | "teacher_observation"
    | "proctored";
  supersedesEvidenceId: string | null;
  recordedAt: string;
  recordedByUserId: string;
};

/** Append-only. Written in the same transaction as the action (CLAUDE.md §6). */
export type AuditEvent = {
  id: string;
  actorUserId: string;
  actorRole: Role;
  scope: string;
  action: string;
  targetEntity: string;
  targetId: string;
  before: string | null;
  after: string | null;
  reason: string;
  idempotencyKey: string;
  requestId: string;
  recordedAt: string;
};

/**
 * Official gradebook. Append-only: a change is a new record that supersedes the
 * previous one, so the original result stays readable (CLAUDE.md §2, §6).
 *
 * NEVER derived from, joined to, or blended with mastery (CLAUDE.md §4).
 */
export type GradeRecord = {
  id: string;
  studentId: string;
  enrollmentId: string;
  categoryId: string;
  assessmentId: string;
  lessonCode: string;
  pointsEarned: number;
  pointsPossible: number;
  ruleVersion: string;
  /** Set when a teacher changes a grade; the original row is retained. */
  supersedesGradeId: string | null;
  enteredByUserId: string;
  reason: string;
  recordedAt: string;
};

export type GradeCategory = {
  id: string;
  courseTitle: string;
  name: string;
  weight: number;
};

export type GradebookConfig = {
  id: string;
  courseTitle: string;
  ruleVersion: string;
  scale: { min: number; letter: string }[];
};

/**
 * Intervention plan. Its return destination is stored at assignment time so the
 * student returns to the exact pathway location (CLAUDE.md §9).
 */
export type Intervention = {
  id: string;
  studentId: string;
  enrollmentId: string;
  status: InterventionStatus;
  /** Intervention lesson id from the catalog, e.g. `I-M6-U1-L1`. */
  interventionLessonId: string;
  targetSkill: string;
  targetStandard: string | null;
  severity: "immediate" | "targeted" | "spaced" | "teacher_review";
  /** Evidence ids that produced the recommendation. Never empty. */
  triggerEvidenceIds: string[];
  triggerSummary: string;
  estimatedMinutes: number;
  returnLessonCode: string;
  returnStage: number;
  returnRuleVersion: string;
  readinessMinPercent: number;
  transferItemsRequired: number;
  /** Filled as the plan runs. */
  readinessPercent: number | null;
  transferPassed: boolean | null;
  cycles: number;
  recommendedByRuleVersion: string;
  /**
   * How much evidence existed on this skill when the human decided. Recorded so
   * a later reader knows what the decision was made against. Suppression of a
   * settled skill is measured against `updatedAt` rather than this count — see
   * `lib/intervention/queue.ts`.
   */
  evidenceCountAtDecision: number;
  decidedByUserId: string | null;
  decisionReason: string | null;
  dueExpectation: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * ---------------------------------------------------------------------------
 * Authored lesson content (CLAUDE.md §7).
 * ---------------------------------------------------------------------------
 *
 * What a curriculum author BUILDS: the script a student reads, the video that
 * carries it, and the quiz that produces evidence. It hangs off a course
 * VERSION, which is what makes the versioning rules hold without a second
 * lifecycle:
 *
 *   - Content is editable only while its version is a draft.
 *   - A roster section keeps the version it was created with, so publishing
 *     authored content cannot change what a running section is teaching, and
 *     cannot alter prior evidence.
 *   - `lessonCode` is a stable identifier from the catalog. Authoring attaches
 *     content to a lesson the course plan already reserves days for, so it can
 *     never break the 135 + 40 = 175 contract.
 */

/** What a quiz item is for. The four purposes the engine knows how to score. */
export type ItemPurpose =
  | "exit_ticket"
  | "readiness_check"
  | "transfer_check"
  | "spiral_review";

export type LessonVideo = {
  id: string;
  title: string;
  /**
   * Where the file lives. `url` is the only source in this build: binary
   * upload needs Supabase Storage, which is not provisioned yet (ADR 0002,
   * ADR 0010). The field exists so the storage-backed source can be added
   * without changing every reader.
   */
  source: "url";
  url: string;
  minutes: number | null;
  /**
   * Required. A video without a transcript is not accessible, and an
   * inaccessible lesson is not a finished lesson (CLAUDE.md §12).
   */
  transcript: string;
  /** Optional WebVTT track. A transcript is required either way. */
  captionsUrl: string | null;
  addedAt: string;
  addedByUserId: string;
};

export type AuthoredChoice = {
  id: string;
  text: string;
  /**
   * The error family this distractor reveals, from the subject's own error
   * model. Null on the correct choice. This is what turns a wrong answer into
   * a diagnosis rather than a mark.
   */
  errorCode: string | null;
};

export type AuthoredQuizItem = {
  id: string;
  purpose: ItemPurpose;
  /** Must be a standard the lesson claims as primary coverage. */
  standard: string;
  skill: string;
  stem: string;
  choices: AuthoredChoice[];
  correctChoiceId: string;
  /** Shown after completion — explanations appear after, never during. */
  rationale: string;
  addedAt: string;
  addedByUserId: string;
};

export type AuthoredLesson = {
  id: string;
  courseVersionId: string;
  /** Stable catalog identifier, e.g. `M6-U1-L2`. Never regenerated on edit. */
  lessonCode: string;

  /** Stage 3 — why this lesson exists for the person reading it. */
  relevance: string;
  /** Stage 4 — the goal and how a student knows they met it. */
  goal: string;
  successCriteria: string[];
  /** Stage 5 — the script: accessible instruction, in order. */
  instruction: string[];
  vocabulary: { term: string; meaning: string }[];
  /** Stage 6 — the worked model, exposing reasoning rather than the answer. */
  workedModel: { step: string; reasoning: string }[];
  /** Stage 7 — guided practice with fading support. */
  guidedPractice: { prompt: string; hint: string; answer: string }[];
  /** Stage 8 — independent application. */
  independentTask: string;
  /** Stage 1 — the notes record the student keeps. */
  notesOutline: string[];

  videos: LessonVideo[];
  items: AuthoredQuizItem[];

  createdAt: string;
  updatedAt: string;
  updatedByUserId: string;
};

export type TeacherMessage = {
  id: string;
  fromUserId: string;
  toStudentId: string;
  subject: string;
  body: string;
  sentAt: string;
  /** A student-initiated request for a person, per blueprint §4 Support. */
  isHelpRequest: boolean;
  resolvedAt: string | null;
};

/** Purpose-bound export record (CLAUDE.md §3). */
export type ExportRecord = {
  id: string;
  requestedByUserId: string;
  purpose: string;
  scope: string;
  rowCount: number;
  requestedAt: string;
};
