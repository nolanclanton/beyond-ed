import type { Tone } from "@/lib/design/tokens";

/**
 * Canonical intervention status (CLAUDE.md §9, blueprint §3 and §7).
 *
 * A recommendation is a proposal, never an action. Nothing reaches `assigned`
 * without a human decision, so the student-facing surface only ever renders
 * `assigned` and later states.
 */
export const INTERVENTION_STATUSES = [
  "recommended",
  "teacher_reviewed",
  "assigned",
  "in_progress",
  "readiness_check",
  "passed",
  "returned_to_pathway",
  "escalated",
  "closed",
] as const;

export type InterventionStatus = (typeof INTERVENTION_STATUSES)[number];

/**
 * Student-facing presentation. Supportive language only — no risk labels, no
 * rankings, no deficit framing (CLAUDE.md §13).
 */
export const INTERVENTION_STATUS_PRESENTATION: Record<
  InterventionStatus,
  { label: string; studentMeaning: string; tone: Tone }
> = {
  recommended: {
    label: "Recommended",
    studentMeaning: "Waiting for your teacher to look at it.",
    tone: "neutral",
  },
  teacher_reviewed: {
    label: "Teacher reviewed",
    studentMeaning: "Your teacher has read this and is deciding.",
    tone: "neutral",
  },
  assigned: {
    label: "Assigned",
    studentMeaning: "Your teacher picked this for you. Ready to start.",
    tone: "info",
  },
  in_progress: {
    label: "In progress",
    studentMeaning: "You have started this and can pick it back up.",
    tone: "info",
  },
  readiness_check: {
    label: "Readiness check",
    studentMeaning: "A short check to show what you can do now.",
    tone: "info",
  },
  passed: {
    label: "Passed",
    studentMeaning: "You showed the skill. Nice work.",
    tone: "positive",
  },
  returned_to_pathway: {
    label: "Returned to pathway",
    studentMeaning: "Finished. You are back in your course.",
    tone: "positive",
  },
  escalated: {
    label: "Escalated",
    studentMeaning: "Your teacher is setting up time to work through this with you.",
    tone: "attention",
  },
  closed: {
    label: "Closed",
    studentMeaning: "Complete. Nothing else needed here.",
    tone: "positive",
  },
};
