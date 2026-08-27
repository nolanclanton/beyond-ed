/**
 * The capability registry (vision §8; CLAUDE.md §10.2).
 *
 * ---------------------------------------------------------------------------
 * This file is the security boundary. Not the buttons.
 * ---------------------------------------------------------------------------
 *
 * The browser asks for a capability by name. If the name is not a key of
 * `AI_CAPABILITIES`, the server refuses — before authentication is even
 * consulted, before any record is read, and regardless of what the interface
 * happened to render. Hiding a control is a courtesy to the person using it; it
 * is never what stops a request.
 *
 * Each entry declares what the capability may see, who may run it, what it must
 * return, and what happens to the result. A capability that is not in this map
 * does not exist as far as the product is concerned, and there is no
 * "everything else" entry, no wildcard, and no free-text prompt endpoint.
 *
 * ---------------------------------------------------------------------------
 * What is structurally absent
 * ---------------------------------------------------------------------------
 *
 * `FORBIDDEN_CAPABILITIES` below lists actions that will never be entries here.
 * It is documentation, not configuration: there is no toggle for them, because
 * a toggle is a thing that can be switched on by mistake. Making one real would
 * mean writing a context builder, an output schema, and a write path — which is
 * a §15 escalation, not an afternoon's work.
 *
 * Every capability that exists PROPOSES. None of them writes. The gateway
 * returns a proposal and stops; committing anything is a separate, authenticated
 * human action through the ordinary authoring server actions.
 */
import type { CurriculumGrant } from "@/lib/db/types";

import type { OutputSchemaName } from "./schemas";

/**
 * Which parts of the world a capability may be shown.
 *
 * The context builder reads this and assembles only what is listed. A
 * capability cannot widen its own view: asking for narrative canon while
 * declaring only `lesson_setup` returns lesson setup.
 *
 * There is no context kind for a student, an enrollment, a grade, a mastery
 * estimate, or a piece of evidence, and adding one is a §15 escalation. The
 * assistant helps write curriculum; what a particular child did is none of its
 * business.
 */
export const CONTEXT_KINDS = [
  /** Course, unit, lesson code and title, standards, learning goal, duration. */
  "lesson_setup",
  /** Prior-learning skills the catalog says this lesson depends on. */
  "prerequisites",
  /** The typed lesson script: relevance, goal, criteria, worked model, practice. */
  "lesson_script",
  /** The composed blocks of one named section. */
  "lesson_section",
  /** Every composed block in the lesson, by section. */
  "whole_lesson",
  /** The lesson immediately before and after, by title and goal only. */
  "neighbouring_lessons",
  /** Narrative identity, world, central problem, tone. */
  "narrative_bible",
  /** Characters relevant to the scene, with what each of them knows. */
  "narrative_characters",
  /** What has happened, what students know, the current objective. */
  "narrative_state",
  /** Open plot threads. */
  "plot_threads",
  /** The beat this lesson is paired with, and the beats before it. */
  "narrative_beats",
  /** Art direction, palette, motifs, image rules. */
  "visual_bible",
  /** What must stay consistent and what to avoid. */
  "content_boundaries",
] as const;

export type ContextKind = (typeof CONTEXT_KINDS)[number];

export type AiCapability = {
  /** Shown in the interface and in the administrator's list. */
  label: string;
  /** One sentence saying what it produces and, where it matters, what it will not do. */
  summary: string;
  /** Turned off for everyone when false. An administrator's switch, not a user's. */
  enabled: boolean;
  /** Curriculum grants that may run it. Empty means any curriculum author. */
  requiredGrants: CurriculumGrant[];
  /** Exactly what the context builder may assemble. */
  allowedContext: ContextKind[];
  /** The shape the answer must have, validated before anything is displayed. */
  outputSchema: OutputSchemaName;
  /** Text or image. Image capabilities respect the visual-generation flag. */
  modality: "text" | "image";
  /**
   * True for every capability. Present as a field rather than assumed, so that
   * a future entry cannot quietly be added without one — and so the
   * administrator's page can show the column and have it read the same on every
   * row.
   */
  requiresHumanApproval: true;
  /** Whether asking again with the same inputs is offered as a control. */
  supportsRegeneration: boolean;
  /** Characters of designer-supplied instruction this capability accepts. */
  maxInstructionChars: number;
  /** What the generation record calls this. */
  auditAction: string;
};

export const AI_CAPABILITIES = {
  // -------------------------------------------------------------------------
  // Narrative
  // -------------------------------------------------------------------------
  brainstorm_narrative_hooks: {
    label: "Brainstorm hooks",
    summary:
      "Returns three to five ways the story could create the need for this lesson's mathematics. It returns options and does not choose one.",
    enabled: true,
    requiredGrants: [],
    allowedContext: [
      "lesson_setup",
      "narrative_bible",
      "narrative_state",
      "content_boundaries",
    ],
    outputSchema: "brainstorm_narrative_hooks",
    modality: "text",
    requiresHumanApproval: true,
    supportsRegeneration: true,
    maxInstructionChars: 1000,
    auditAction: "ai.brainstorm_narrative_hooks",
  },

  continue_narrative: {
    label: "Continue the story",
    summary:
      "Proposes the next scene from the canon and the current narrative state. It never edits the narrative state; accepting is a separate action.",
    enabled: true,
    requiredGrants: [],
    allowedContext: [
      "lesson_setup",
      "narrative_bible",
      "narrative_characters",
      "narrative_state",
      "narrative_beats",
      "plot_threads",
      "content_boundaries",
    ],
    outputSchema: "continue_narrative",
    modality: "text",
    requiresHumanApproval: true,
    supportsRegeneration: true,
    maxInstructionChars: 1500,
    auditAction: "ai.continue_narrative",
  },

  summarize_narrative_state: {
    label: "Summarise the story so far",
    summary:
      "Reads the beats already written and reports what happened, what students know, and what is unresolved. Advisory: it changes nothing.",
    enabled: true,
    requiredGrants: [],
    allowedContext: [
      "narrative_bible",
      "narrative_characters",
      "narrative_beats",
      "plot_threads",
      "narrative_state",
    ],
    outputSchema: "summarize_narrative_state",
    modality: "text",
    requiresHumanApproval: true,
    supportsRegeneration: true,
    maxInstructionChars: 600,
    auditAction: "ai.summarize_narrative_state",
  },

  create_character_variations: {
    label: "Character variations",
    summary:
      "Proposes alternative appearances or framings for a character already in the canon, as briefs a designer can hand to the visual studio.",
    enabled: true,
    requiredGrants: [],
    allowedContext: ["narrative_bible", "narrative_characters", "visual_bible"],
    outputSchema: "create_character_variations",
    modality: "text",
    requiresHumanApproval: true,
    supportsRegeneration: true,
    maxInstructionChars: 1000,
    auditAction: "ai.create_character_variations",
  },

  // -------------------------------------------------------------------------
  // Instruction
  // -------------------------------------------------------------------------
  rewrite_selected_section: {
    label: "Rewrite this",
    summary:
      "Rewrites the passage the designer selected, in one named mode. It works on the selection only and returns what it changed.",
    enabled: true,
    requiredGrants: [],
    allowedContext: [
      "lesson_setup",
      "prerequisites",
      "lesson_section",
      "narrative_bible",
      "content_boundaries",
    ],
    outputSchema: "rewrite_selected_section",
    modality: "text",
    requiresHumanApproval: true,
    supportsRegeneration: true,
    maxInstructionChars: 1000,
    auditAction: "ai.rewrite_selected_section",
  },

  generate_worked_example: {
    label: "Generate a worked example",
    summary:
      "Produces one worked example at the requested difficulty, constrained to the learning goal and the lesson's prerequisites. It does not redesign the lesson.",
    enabled: true,
    requiredGrants: [],
    allowedContext: [
      "lesson_setup",
      "prerequisites",
      "lesson_script",
      "lesson_section",
      "content_boundaries",
    ],
    outputSchema: "generate_worked_example",
    modality: "text",
    requiresHumanApproval: true,
    supportsRegeneration: true,
    maxInstructionChars: 1200,
    auditAction: "ai.generate_worked_example",
  },

  generate_guided_practice: {
    label: "Generate guided practice",
    summary:
      "Produces the requested number of practice items with support that fades. It will not introduce a skill the lesson has not taught unless explicitly told to.",
    enabled: true,
    requiredGrants: [],
    allowedContext: [
      "lesson_setup",
      "prerequisites",
      "lesson_script",
      "narrative_bible",
      "content_boundaries",
    ],
    outputSchema: "generate_guided_practice",
    modality: "text",
    requiresHumanApproval: true,
    supportsRegeneration: true,
    maxInstructionChars: 1500,
    auditAction: "ai.generate_guided_practice",
  },

  identify_misconceptions: {
    label: "Likely misconceptions",
    summary:
      "Lists misconceptions students commonly bring to this content, and a scaffold for each. Advisory: it changes nothing.",
    enabled: true,
    requiredGrants: [],
    allowedContext: ["lesson_setup", "prerequisites", "lesson_script"],
    outputSchema: "identify_misconceptions",
    modality: "text",
    requiresHumanApproval: true,
    supportsRegeneration: true,
    maxInstructionChars: 800,
    auditAction: "ai.identify_misconceptions",
  },

  // -------------------------------------------------------------------------
  // Assessment
  // -------------------------------------------------------------------------
  draft_exit_ticket: {
    label: "Draft exit-ticket items",
    summary:
      "Drafts items aligned only to this lesson's stated goal, each wrong choice naming the error family it reveals. Every item is still checked against the lesson's standards when a person accepts it.",
    enabled: true,
    requiredGrants: [],
    allowedContext: ["lesson_setup", "prerequisites", "lesson_script"],
    outputSchema: "draft_exit_ticket",
    modality: "text",
    requiresHumanApproval: true,
    supportsRegeneration: true,
    maxInstructionChars: 1200,
    auditAction: "ai.draft_exit_ticket",
  },

  // -------------------------------------------------------------------------
  // Review
  // -------------------------------------------------------------------------
  check_lesson_alignment: {
    label: "Review this lesson",
    summary:
      "Reads the whole lesson and reports findings against its goal, standards, and prerequisites. It returns a critique and rewrites nothing.",
    enabled: true,
    requiredGrants: [],
    allowedContext: [
      "lesson_setup",
      "prerequisites",
      "whole_lesson",
      "lesson_script",
      "neighbouring_lessons",
      "narrative_beats",
    ],
    outputSchema: "check_lesson_alignment",
    modality: "text",
    requiresHumanApproval: true,
    supportsRegeneration: true,
    maxInstructionChars: 800,
    auditAction: "ai.check_lesson_alignment",
  },

  // -------------------------------------------------------------------------
  // Visual
  // -------------------------------------------------------------------------
  generate_visual_asset: {
    label: "Generate a visual",
    summary:
      "Produces one candidate image from the designer's brief and the narrative's visual bible. The candidate is not part of any lesson until a person accepts it and writes its alternative text.",
    enabled: true,
    requiredGrants: [],
    allowedContext: ["lesson_setup", "narrative_bible", "visual_bible", "content_boundaries"],
    outputSchema: "generate_visual_asset",
    modality: "image",
    requiresHumanApproval: true,
    supportsRegeneration: true,
    maxInstructionChars: 2000,
    auditAction: "ai.generate_visual_asset",
  },
} as const satisfies Record<string, AiCapability>;

export type AiCapabilityName = keyof typeof AI_CAPABILITIES;

export const AI_CAPABILITY_NAMES = Object.keys(AI_CAPABILITIES) as AiCapabilityName[];

/**
 * True only for a name in the registry.
 *
 * The gateway calls this before anything else. It is a `keyof` check against a
 * literal object, so there is no pattern to get wrong and no prefix to match.
 */
export function isCapabilityName(value: unknown): value is AiCapabilityName {
  return typeof value === "string" && value in AI_CAPABILITIES;
}

export function capability(name: AiCapabilityName): AiCapability {
  return AI_CAPABILITIES[name];
}

/**
 * Actions that are not capabilities and will not become capabilities here.
 *
 * Listed so the administrator's page can show them as structurally unavailable
 * rather than as switches nobody turned on (vision §20). None of these has a
 * context builder, an output schema, or a write path — the absence is the
 * control, and a toggle would be a worse one.
 */
export const FORBIDDEN_CAPABILITIES: { name: string; why: string }[] = [
  {
    name: "publish_lesson",
    why: "Publication is a human decision with an audit event and a day-budget gate (CLAUDE.md §7, §11).",
  },
  {
    name: "approve_curriculum",
    why: "Approval is the review step. Something that could approve its own output would remove the point of having one.",
  },
  {
    name: "delete_curriculum",
    why: "Nothing in Beyond.Ed is hard-deleted. Removal is a state transition a person makes (CLAUDE.md §6).",
  },
  {
    name: "change_course_sequence",
    why: "Sequence is a blueprint decision validated against the 135 + 40 = 175 day contract (CLAUDE.md §7).",
  },
  {
    name: "modify_standards",
    why: "Standards come from the curriculum architecture workbook and are never authored in code (CLAUDE.md §7).",
  },
  {
    name: "modify_prerequisite_rules",
    why: "Prerequisites decide what a student is allowed to meet next. A governor sets them (CLAUDE.md §7).",
  },
  {
    name: "assign_students",
    why: "Assignment is a teacher's decision on evidence, never a model's (CLAUDE.md §8).",
  },
  {
    name: "message_students",
    why: "Help is human. Nothing generative communicates with a student (CLAUDE.md §10.1).",
  },
  {
    name: "change_permissions",
    why: "Permissions are the boundary everything else rests on.",
  },
  {
    name: "manage_users",
    why: "Accounts are provisioned by a district administrator from a real person's record.",
  },
  {
    name: "run_database_query",
    why: "The assistant has no database access of any kind. It receives a context object and returns text.",
  },
  {
    name: "generate_whole_course",
    why: "A course is a sequence of decisions about children's time. It is not a generation task.",
  },
  {
    name: "autonomous_curriculum_design",
    why: "There is no planning loop, no self-directed task selection, and no way for one operation to start another.",
  },
];
