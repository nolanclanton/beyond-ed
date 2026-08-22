import type { Tone } from "@/lib/design/tokens";

/**
 * Canonical lesson status (CLAUDE.md §9, blueprint §3).
 *
 * This union is the only vocabulary the UI may use for lesson state. Interfaces
 * read this state; they never derive completion from page visits, scroll
 * position, percentages, or stale local state.
 *
 * The guarded transition function lives with the server-side lesson writes and
 * is out of scope for this static page — nothing here mutates state.
 */
export const LESSON_STATUSES = [
  "locked",
  "available",
  "in_progress",
  "submitted",
  "passed",
  "review_scheduled",
  "completed",
] as const;

export type LessonStatus = (typeof LESSON_STATUSES)[number];

/** Canonical label, plus the plain-language line a student actually reads. */
export const LESSON_STATUS_PRESENTATION: Record<
  LessonStatus,
  { label: string; studentMeaning: string; tone: Tone }
> = {
  locked: {
    label: "Locked",
    studentMeaning: "Opens after the lesson before it is complete.",
    tone: "neutral",
  },
  available: {
    label: "Available",
    studentMeaning: "Ready for you to start.",
    tone: "info",
  },
  in_progress: {
    label: "In progress",
    studentMeaning: "You have started this and can pick it back up.",
    tone: "info",
  },
  submitted: {
    label: "Submitted",
    studentMeaning: "Turned in. Waiting on your result.",
    tone: "info",
  },
  passed: {
    label: "Passed",
    studentMeaning: "You met the goal for this lesson.",
    tone: "positive",
  },
  review_scheduled: {
    label: "Review scheduled",
    studentMeaning: "Done for now. This comes back later to keep it fresh.",
    tone: "positive",
  },
  completed: {
    label: "Completed",
    studentMeaning: "Finished, including its review.",
    tone: "positive",
  },
};

/** The ten stages of the core lesson structure (blueprint §4). */
export const LESSON_STAGES = [
  "Notes or workbook evidence",
  "Spiral Review",
  "Introduction and relevance",
  "Goal and success criteria",
  "Instruction",
  "Worked model",
  "Guided practice",
  "Independent application",
  "Exit Ticket",
  "Next-step decision",
] as const;

export type LessonStage = (typeof LESSON_STAGES)[number];
