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
  /**
   * The role this person is ACTING AS right now. Every scope decision in the
   * application reads this, and it matches what `current_role_name()` resolves
   * in the database, so the interface and the policies never disagree.
   */
  role: Role;
  /**
   * What they were provisioned as. The one role that cannot be revoked without
   * deactivating the profile. Optional so the seeded store, which knows nothing
   * about grants, keeps type-checking.
   */
  primaryRole?: Role;
  /** Every role they may switch to, including the primary one. */
  heldRoles?: Role[];
  /**
   * Curriculum authoring is a separate authorization, not a hierarchy level
   * (CLAUDE.md §3). A user may hold it alongside any role.
   */
  curriculumAuthor: boolean;
  /**
   * What the holder may DO with curriculum (`CURRICULUM_GRANTS`). Absent means
   * "whatever `curriculumAuthor` alone implies", which is `author` — so an
   * account provisioned before the design studio existed keeps exactly the
   * access it had. Resolved in one place, `curriculumGrantsOf`.
   */
  curriculumGrants?: CurriculumGrant[];
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
  /** Support id from the reusable intervention bank, e.g. `M-INT-013`. */
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

/**
 * ---------------------------------------------------------------------------
 * Lesson materials
 * ---------------------------------------------------------------------------
 *
 * The things a student opens alongside the lesson: a reading, a worksheet, a
 * data set, a reference sheet, a physical manipulative to fetch. A material is
 * attached to the lesson once and may then be placed anywhere on the canvas, in
 * exactly the way a video is — so the same file is never described twice and
 * cannot drift between its two descriptions.
 *
 * `purpose` and `accessNote` are both required, for the same reason alternative
 * text is required on an image: a link with no task attached is noise, and a
 * material a student cannot open is a lesson they cannot take (CLAUDE.md §12).
 */
export const LESSON_MATERIAL_KINDS = [
  "reading",
  "worksheet",
  "slides",
  "dataset",
  "reference",
  "manipulative",
] as const;

export type LessonMaterialKind = (typeof LESSON_MATERIAL_KINDS)[number];

export type LessonMaterial = {
  id: string;
  kind: LessonMaterialKind;
  title: string;
  /**
   * Where it lives. `url` is the only source in this build, for the same reason
   * a video has only one: binary upload needs Supabase Storage, which is not
   * provisioned yet (ADR 0002, ADR 0010).
   */
  source: "url";
  url: string;
  /** What the student does with it. Required. */
  purpose: string;
  /**
   * Required. The format, and how a student who cannot open that format gets
   * the same content.
   */
  accessNote: string;
  minutes: number | null;
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

/**
 * ---------------------------------------------------------------------------
 * Lesson canvas blocks
 * ---------------------------------------------------------------------------
 *
 * What a curriculum author composes into a lesson stage: an ordered list of
 * typed blocks rather than a wall of paragraphs. Each kind renders the same
 * way everywhere it appears, so a lesson looks like the rest of the product
 * however it was written, and every block that can exclude a reader carries the
 * thing that stops it doing so — an image has required alternative text, a
 * video keeps the transcript it was attached with (CLAUDE.md §12).
 *
 * `memory` is the one warm tone available, and it means what amber means
 * everywhere else in the product: something to hold on to and retrieve later
 * (CLAUDE.md §13). It is not for emphasis.
 */
export type CalloutTone = "note" | "important" | "example" | "memory";

export const LESSON_BLOCK_KINDS = [
  "heading",
  "text",
  "callout",
  "list",
  "definition",
  "table",
  "image",
  "video",
  "material",
] as const;

export type LessonBlockKind = (typeof LESSON_BLOCK_KINDS)[number];

/**
 * ---------------------------------------------------------------------------
 * Where a block sits in the lesson
 * ---------------------------------------------------------------------------
 *
 * The ten-stage lesson is the product's fixed spine, and the studio does not
 * get to invent parts of it. What a section says is which of those stages a
 * composed element belongs to, so an author can put a diagram in the worked
 * model and a photograph in the introduction rather than piling everything into
 * the instruction stage.
 *
 * Only the seven stages a person WRITES are here. Spiral Review (2), the Exit
 * Ticket (9), and the next-step decision (10) are produced by rule from stored
 * evidence and from authored items — composing free-form content into them
 * would put an advancement decision partly on material the engine cannot read
 * (CLAUDE.md §8).
 */
export const LESSON_SECTIONS = [
  "notes",
  "relevance",
  "goal",
  "instruction",
  "worked_model",
  "guided_practice",
  "independent",
] as const;

export type LessonSection = (typeof LESSON_SECTIONS)[number];

/** Every block carries its identity and its place. */
type LessonBlockPlacement = {
  id: string;
  /**
   * Which lesson stage the block is composed into. Reading order within a
   * section is the order of the lesson's own block list, filtered to it.
   */
  section: LessonSection;
};

export type LessonBlock =
  | (LessonBlockPlacement & { kind: "heading"; text: string })
  | (LessonBlockPlacement & { kind: "text"; text: string })
  | (LessonBlockPlacement & {
      kind: "callout";
      tone: CalloutTone;
      title: string;
      text: string;
    })
  | (LessonBlockPlacement & { kind: "list"; ordered: boolean; items: string[] })
  | (LessonBlockPlacement & { kind: "definition"; term: string; meaning: string })
  | (LessonBlockPlacement & {
      kind: "table";
      caption: string;
      headers: string[];
      rows: string[][];
    })
  | (LessonBlockPlacement & { kind: "image"; url: string; alt: string; caption: string })
  /** References a video already attached to the lesson, by its id. */
  | (LessonBlockPlacement & { kind: "video"; videoId: string })
  /** References a material already attached to the lesson, by its id. */
  | (LessonBlockPlacement & { kind: "material"; materialId: string });

/** A block's shape before it has been placed — everything but where it sits. */
export type UnplacedLessonBlock<T = LessonBlock> = T extends unknown
  ? Omit<T, "section">
  : never;

export type AuthoredLesson = {
  id: string;
  courseVersionId: string;
  /** Stable catalog identifier, e.g. `MATH-06-L035`. Never regenerated on edit. */
  lessonCode: string;

  /** Stage 3 — why this lesson exists for the person reading it. */
  relevance: string;
  /** Stage 4 — the goal and how a student knows they met it. */
  goal: string;
  successCriteria: string[];
  /**
   * The composed canvas for the whole lesson: every element the author placed,
   * in one reading order. Each block names the stage it belongs to, so this one
   * list serves all seven composable sections (`LESSON_SECTIONS`).
   */
  blocks: LessonBlock[];
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
  /** Readings, worksheets, data sets, and reference sheets, attached once. */
  materials: LessonMaterial[];
  items: AuthoredQuizItem[];

  createdAt: string;
  updatedAt: string;
  updatedByUserId: string;
};

/**
 * ---------------------------------------------------------------------------
 * Course structure: sequence and foundations
 * ---------------------------------------------------------------------------
 *
 * The workbook is the baseline for every course: its units, its lesson spine,
 * and the six pieces of prior learning each lesson names. `pnpm catalog`
 * ingests it and nothing in the product writes back to the generated files
 * (CLAUDE.md §7, §14).
 *
 * What a curriculum author adapts is recorded HERE instead: one override row
 * per course version, holding the order a course actually runs in, the framing
 * a unit is taught under, and the governed strength of each foundation link.
 * Scoping it to the version is what makes the adaptation safe — a roster
 * section keeps the version it was created with, so re-sequencing a course
 * cannot reorder a class already running, and cannot change the structure a
 * historical calculation resolved against.
 *
 * A `null` on `unitOrder` or an absent key in `lessonOrder` means "unchanged
 * from the workbook". The baseline is never copied in, so a course that has not
 * been re-sequenced reads as exactly what was ingested.
 */

/** How strongly one piece of learning is required before another. */
export type FoundationImportance = 1 | 2 | 3 | 4 | 5;

/**
 * A governed foundation link.
 *
 * `removed` retires a link the workbook records; it does not delete it — the
 * baseline stays readable, and the override says the course no longer treats it
 * as prior learning, with the reason on the audit event.
 */
export type FoundationEdit = {
  /** The lesson that depends on something. */
  lessonCode: string;
  /** The lesson code or intervention support id it depends on. */
  targetId: string;
  removed: boolean;
  /**
   * Null until a governor sets it. The workbook records that the link exists
   * and what role it plays, not how strongly it binds — so an ungoverned link
   * says so rather than showing an invented number (CLAUDE.md §14).
   */
  importance: FoundationImportance | null;
  /** An author's own note about why this link is what it is. */
  note: string;
  changedAt: string;
  changedByUserId: string;
};

/** A unit's framing, re-written for one course version. */
export type UnitFramingEdit = {
  unitId: string;
  title: string;
  essentialQuestion: string;
  changedAt: string;
  changedByUserId: string;
};

export type CourseStructure = {
  id: string;
  courseVersionId: string;
  /** Stable course id from the catalog, e.g. `MATH-06`. */
  courseId: string;
  /** Unit ids in the order this version runs them. Null means unchanged. */
  unitOrder: string[] | null;
  /** Unit id -> lesson codes in order. An absent key means unchanged. */
  lessonOrder: Record<string, string[]>;
  unitFraming: UnitFramingEdit[];
  foundationEdits: FoundationEdit[];
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

/**
 * ---------------------------------------------------------------------------
 * Curriculum authoring authorizations (vision §7, CLAUDE.md §3)
 * ---------------------------------------------------------------------------
 *
 * `curriculumAuthor` says a person may build curriculum at all. These say what
 * they may do with it, and they are deliberately separate from the role scale:
 * a teacher may hold `author` without becoming a site administrator, and an
 * organization administrator holds none of them unless someone granted them.
 *
 * The three are cumulative in practice but checked independently, so a
 * narrative cannot reach students because someone happened to be senior.
 *
 * These govern the surfaces added by the design studio. They deliberately do
 * NOT re-gate the course-version lifecycle, which `assertCanAuthorCurriculum`
 * has always governed — changing who may publish a course version is a
 * governance decision of its own, not a side effect of adding an authoring tool.
 */
export const CURRICULUM_GRANTS = ["author", "reviewer", "administrator"] as const;

export type CurriculumGrant = (typeof CURRICULUM_GRANTS)[number];

/**
 * ---------------------------------------------------------------------------
 * The narrative bible (vision §4)
 * ---------------------------------------------------------------------------
 *
 * A narrative is the story world a unit is taught inside. It exists so a
 * designer builds the world ONCE and then writes many lessons in it without
 * re-explaining the characters, the aesthetic, the prior events, or the rules
 * every time.
 *
 * It is deliberately NOT attached to a course version. A narrative is reusable
 * across courses and is duplicated rather than shared, so binding it to a
 * version would make the Narrative Bank impossible and would drag story edits
 * into the publication lifecycle of a course that merely references it. What
 * connects the two is a beat naming a catalog `lessonCode` — a soft reference
 * that survives a course being re-sequenced.
 */
export const NARRATIVE_STATUSES = [
  "draft",
  "in_review",
  "approved_template",
  "published",
  "archived",
] as const;

export type NarrativeStatus = (typeof NARRATIVE_STATUSES)[number];

/** A recurring setting. Saved once so every scene in it looks like itself. */
export type NarrativeLocation = {
  id: string;
  name: string;
  description: string;
  /** Why the story returns here. */
  significance: string;
  /** Visual reference for an asset brief: light, materials, scale, mood. */
  visualReference: string;
};

/**
 * A character in the canon.
 *
 * `knows` is the field that makes continuity work: a character who has not been
 * told something cannot mention it, and a scene written without that fact in
 * front of the designer is the scene that breaks the story.
 */
export type NarrativeCharacter = {
  id: string;
  name: string;
  role: string;
  personality: string;
  motivation: string;
  relationships: string;
  appearance: string;
  /** What this character knows at the point the narrative currently sits. */
  knows: string;
  arc: string;
  /** Reference artwork from the asset library, if one has been accepted. */
  assetId: string | null;
};

export type NarrativeWorld = {
  place: string;
  period: string;
  technologyLevel: string;
  /** Rules the world obeys. A story that breaks its own rules stops teaching. */
  worldRules: string[];
  /** Historical or fictional constraints the designer will not violate. */
  constraints: string[];
  locations: NarrativeLocation[];
};

export type NarrativeCentralProblem = {
  challenge: string;
  stakes: string;
  objective: string;
  /** Why the student is in this story rather than reading about it. */
  studentRole: string;
};

export const STORY_ARC_STAGES = [
  "opening",
  "rising_action",
  "turning_point",
  "complication",
  "climax",
  "resolution",
] as const;

export type StoryArcStage = (typeof STORY_ARC_STAGES)[number];

export type StoryArcMoment = {
  id: string;
  stage: StoryArcStage;
  summary: string;
};

/**
 * One lesson's place in the story.
 *
 * The two fields that matter sit side by side on purpose. `academicObjective`
 * is what the student learns; `narrativeEvent` is what happens in the story;
 * `learningUnlock` is the sentence that joins them — what learning the
 * objective lets the student DO in the story. A beat with an empty unlock is a
 * story bolted onto a lesson rather than one that needs it, and the studio says
 * so rather than pretending otherwise.
 */
export type NarrativeBeat = {
  id: string;
  /** Catalog lesson this beat is paired with. Null while unplaced. */
  lessonCode: string | null;
  academicObjective: string;
  narrativeEvent: string;
  learningUnlock: string;
};

export type NarrativeChapter = {
  id: string;
  title: string;
  summary: string;
  /** Catalog unit this chapter runs alongside. Null while unplaced. */
  unitId: string | null;
  beats: NarrativeBeat[];
};

/**
 * Where the story currently stands.
 *
 * This is what a designer would otherwise re-type into an assistant every time
 * they wrote the next lesson. It is canon: nothing generated may change it, and
 * a proposal that contradicts it is surfaced as a conflict rather than applied
 * (vision §24).
 */
export type NarrativeState = {
  happened: string[];
  studentsKnow: string[];
  cluesRevealed: string[];
  currentObjective: string;
  futureReveals: string[];
};

export const PLOT_THREAD_KINDS = [
  "question",
  "clue",
  "objective",
  "conflict",
  "reveal",
] as const;

export type PlotThreadKind = (typeof PLOT_THREAD_KINDS)[number];

export type PlotThread = {
  id: string;
  kind: PlotThreadKind;
  summary: string;
  openedInChapterId: string | null;
  resolvedInChapterId: string | null;
  resolved: boolean;
  note: string;
};

export const ASSET_ASPECT_RATIOS = [
  "1:1",
  "3:2",
  "4:3",
  "16:9",
  "9:16",
  "21:9",
] as const;

export type AssetAspectRatio = (typeof ASSET_ASPECT_RATIOS)[number];

/**
 * The visual bible (vision §6).
 *
 * The constraints an image must satisfy to belong to this unit. When a visual
 * is requested, only these travel with the brief — which is what keeps a unit
 * looking like one thing without the designer restating the aesthetic each
 * time.
 */
export type VisualBible = {
  artDirection: string;
  visualTone: string;
  palette: string;
  interfaceTreatment: string;
  recurringProps: string[];
  motifs: string[];
  symbols: string[];
  defaultAspectRatio: AssetAspectRatio;
  /** Rules for text inside an image. Text in a picture is text nobody can read aloud. */
  textInImages: string;
  accessibilityRules: string[];
  ageAppropriateness: string;
};

/**
 * What must not drift, and what must not appear.
 *
 * Sent with every narrative-aware request. A constraint the assistant is never
 * told about is a constraint it will break.
 */
export type ContentBoundaries = {
  mustStayConsistent: string[];
  avoid: string[];
  requiredFraming: string[];
};

export type Narrative = {
  id: string;
  orgId: string;
  status: NarrativeStatus;
  /**
   * An official Beyond.Ed template, as opposed to one a district or a person
   * made. Only a curriculum administrator may set it, so the label means
   * something in the bank.
   */
  official: boolean;

  title: string;
  premise: string;
  subject: string;
  /** Catalog course this was written for, e.g. `MATH-06`. Null when general. */
  courseId: string | null;
  unitIds: string[];
  genre: string;
  tone: string;
  gradeBand: string;
  audience: string;

  world: NarrativeWorld;
  characters: NarrativeCharacter[];
  centralProblem: NarrativeCentralProblem;
  storyArc: StoryArcMoment[];
  chapters: NarrativeChapter[];
  state: NarrativeState;
  plotThreads: PlotThread[];
  visualBible: VisualBible;
  boundaries: ContentBoundaries;
  keywords: string[];

  /**
   * Duplication provenance (vision §17). Set once, at creation, and never
   * changed: the copy records where it came from, and neither record can reach
   * the other afterwards.
   */
  basedOnNarrativeId: string | null;
  /** How many narratives have been duplicated from this one. */
  reuseCount: number;

  ownerUserId: string;
  /** People who may edit besides the owner. Sharing, never ownership. */
  sharedWithUserIds: string[];

  createdAt: string;
  updatedAt: string;
  updatedByUserId: string;
};

/**
 * A deliberate checkpoint, not an autosave (vision §21).
 *
 * Editing a narrative writes the record and an audit event. A VERSION is a
 * person saying "keep this one" — a full snapshot a later reader can open,
 * carrying whether the assistant was involved in producing it.
 */
export type NarrativeVersion = {
  id: string;
  narrativeId: string;
  label: string;
  note: string;
  snapshot: Narrative;
  aiAssisted: boolean;
  createdAt: string;
  createdByUserId: string;
};

/**
 * ---------------------------------------------------------------------------
 * The asset library (vision §6, §18)
 * ---------------------------------------------------------------------------
 *
 * `alt` is required for the same reason it is required on a lesson image: a
 * picture without it is simply missing for part of the class (CLAUDE.md §12).
 * A candidate that has not been accepted is not curriculum and never renders in
 * a lesson.
 */
export const ASSET_KINDS = [
  "hero",
  "character",
  "environment",
  "diagram",
  "map",
  "mission_brief",
  "case_file",
  "artifact",
  "interface",
  "infographic",
  "chapter_cover",
  "background",
] as const;

export type AssetKind = (typeof ASSET_KINDS)[number];

export type AssetStatus = "candidate" | "accepted" | "rejected";

export type NarrativeAsset = {
  id: string;
  orgId: string;
  narrativeId: string | null;
  /** Catalog lesson the asset was made for. Null when it belongs to the world. */
  lessonCode: string | null;
  kind: AssetKind;
  title: string;
  /** What the picture must show. The designer's brief, never the model's. */
  brief: string;
  alt: string;
  aspectRatio: AssetAspectRatio;
  /**
   * Where the image came from. `url` is a designer-supplied address; the
   * generated source is stored as a data URI until Supabase Storage is
   * provisioned (ADR 0002).
   */
  source: "url" | "generated";
  url: string;
  /** Set when the image was proposed by the assistant. */
  generationId: string | null;
  status: AssetStatus;
  /** How many lessons place it. Reads only; never inferred from a page view. */
  usageCount: number;
  addedAt: string;
  addedByUserId: string;
};

/**
 * ---------------------------------------------------------------------------
 * The AI generation record (vision §8, CLAUDE.md §10.2)
 * ---------------------------------------------------------------------------
 *
 * One row per bounded assistant operation, written when the request is made and
 * resolved when a person decides what to do with the proposal. It is what makes
 * "AI-assisted" an attributable fact in the history rather than a claim.
 *
 * It stores WHAT was asked and WHICH context parts were assembled — never the
 * assembled context itself, never a system prompt, and never a credential. The
 * designer's own instruction is kept because it is their words and a later
 * reader needs to see what was actually requested.
 */
export type AiGenerationStatus =
  | "proposed"
  | "accepted"
  | "accepted_edited"
  /**
   * An advisory result a person read. A review, a misconception list, and a
   * narrative summary commit nothing by design, so calling them "rejected"
   * would make the usage figures read as if designers were turning down work
   * they had in fact acted on.
   */
  | "acknowledged"
  | "rejected"
  | "failed";

export type AiGeneration = {
  id: string;
  orgId: string;
  userId: string;
  /** A name from the capability registry. The server rejects anything else. */
  capability: string;
  model: string;
  targetEntity: "authored_lesson" | "narrative" | "narrative_asset";
  targetId: string;
  courseVersionId: string | null;
  lessonCode: string | null;
  narrativeId: string | null;
  /** Which lesson stage or narrative element the request was about. */
  sectionId: string | null;
  /** Names of the context parts that were assembled. Not their contents. */
  contextKeys: string[];
  /** The designer's own instruction, in their words. */
  instructions: string;
  status: AiGenerationStatus;
  /** The audit event for the write, once a person accepted the proposal. */
  resultingAuditId: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  /** Written for a person to read. Never a stack trace, never a raw API error. */
  failureReason: string | null;
  requestedAt: string;
  resolvedAt: string | null;
};

/**
 * ---------------------------------------------------------------------------
 * Which assistance capabilities an organization has turned on (vision §7, §20)
 * ---------------------------------------------------------------------------
 *
 * The capability registry in `lib/ai/capabilities.ts` says what CAN exist. This
 * says what one organization has decided to allow, and a curriculum
 * administrator is the only person who writes it.
 *
 * A row can only ever name a capability that is already in the registry — the
 * domain refuses anything else — so this table cannot conjure a capability into
 * being. It narrows or restores; it never invents. That is what keeps the
 * prohibited list structurally unavailable rather than one row away from
 * working.
 *
 * Absence is meaningful: no row means "whatever the registry defaults to",
 * which is how a new capability arrives switched on without anybody having to
 * go and enable it, and how an organization that has never visited the page
 * behaves sensibly.
 */
export type AiCapabilitySetting = {
  id: string;
  orgId: string;
  /** A name from the capability registry. Validated on write. */
  capability: string;
  enabled: boolean;
  /** Why it was turned off, or turned back on. Required. */
  reason: string;
  changedAt: string;
  changedByUserId: string;
};
