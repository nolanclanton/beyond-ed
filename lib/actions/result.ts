/**
 * Every server action returns a durable result state (CLAUDE.md §12).
 *
 * On success the UI shows what was saved. On failure it explains what was
 * preserved and the safe next step — never a silent no-op.
 */
export type ActionResult<T = object> =
  | ({ ok: true; message: string } & T)
  | { ok: false; message: string; preserved: string; nextStep: string };

export function failure(
  message: string,
  preserved = "Nothing was changed.",
  nextStep = "Check the details and try again.",
): { ok: false; message: string; preserved: string; nextStep: string } {
  return { ok: false, message, preserved, nextStep };
}

/**
 * Turns a thrown domain error into a durable failure state. Domain errors carry
 * a message written for the person reading it; anything else is reported
 * generically rather than leaking internals.
 */
export function toFailure(error: unknown): {
  ok: false;
  message: string;
  preserved: string;
  nextStep: string;
} {
  const named = [
    "LessonError",
    "InterventionError",
    "GradeError",
    "CurriculumError",
    "ObservationError",
    "ExportError",
    "NotAuthorizedError",
    "IllegalTransitionError",
    "IllegalInterventionTransitionError",
    "IllegalEnrollmentTransitionError",
    "IllegalCurriculumTransitionError",
    "DuplicateWriteError",
  ];
  if (error instanceof Error && named.includes(error.name)) {
    return failure(
      error.message,
      "Nothing was changed — the whole change was rolled back together.",
      "Reload the page to see the current state, then try again.",
    );
  }
  return failure(
    "That could not be saved.",
    "Nothing was changed — the whole change was rolled back together.",
    "Reload the page and try again. If it keeps failing, tell an administrator what you were doing.",
  );
}
