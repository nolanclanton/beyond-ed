/**
 * Guarded lesson transitions (CLAUDE.md §9).
 *
 * Status is never set by direct assignment. Illegal transitions raise.
 */
import type { LessonStatus } from "./lesson-status";

/** Locked -> Available -> In progress -> Submitted -> Passed -> Review scheduled -> Completed */
const LESSON_TRANSITIONS: Record<LessonStatus, readonly LessonStatus[]> = {
  locked: ["available"],
  available: ["in_progress"],
  // A submitted lesson that does not meet the bar returns to in progress for
  // the one supported retry the Below-50% band allows.
  in_progress: ["submitted"],
  submitted: ["passed", "in_progress"],
  passed: ["review_scheduled", "completed"],
  review_scheduled: ["completed"],
  completed: [],
};

export class IllegalTransitionError extends Error {
  constructor(entity: string, from: string, to: string) {
    super(
      `Illegal ${entity} transition: ${from} -> ${to}. Allowed from ${from}: ${
        (
          (LESSON_TRANSITIONS as Record<string, readonly string[]>)[from] ?? []
        ).join(", ") || "(terminal)"
      }.`,
    );
    this.name = "IllegalTransitionError";
  }
}

export function canTransitionLesson(
  from: LessonStatus,
  to: LessonStatus,
): boolean {
  return LESSON_TRANSITIONS[from].includes(to);
}

/** The single guarded transition function for lesson state. */
export function transitionLesson(
  from: LessonStatus,
  to: LessonStatus,
): LessonStatus {
  if (!canTransitionLesson(from, to)) {
    throw new IllegalTransitionError("lesson", from, to);
  }
  return to;
}

export { LESSON_TRANSITIONS };
