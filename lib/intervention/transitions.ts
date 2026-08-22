/**
 * Guarded intervention transitions (CLAUDE.md §9).
 *
 * Recommended -> Teacher reviewed -> Assigned -> In progress -> Readiness check
 * -> Passed -> Returned to pathway -> Escalated -> Closed.
 *
 * The list above is the canonical order, not a single line: a case can be
 * escalated from review, from practice, or from a failed readiness check, and
 * a dismissal closes it straight out of review with a recorded reason.
 */
import type { InterventionStatus } from "./status";

const INTERVENTION_TRANSITIONS: Record<
  InterventionStatus,
  readonly InterventionStatus[]
> = {
  // A teacher reviews it, or dismisses it with a reason (-> closed).
  recommended: ["teacher_reviewed", "closed"],
  teacher_reviewed: ["assigned", "escalated", "closed"],
  assigned: ["in_progress", "escalated", "closed"],
  in_progress: ["readiness_check", "escalated"],
  // A failed readiness check returns to practice, or escalates on the
  // anti-loop rule after two unsuccessful cycles.
  readiness_check: ["passed", "in_progress", "escalated"],
  passed: ["returned_to_pathway"],
  returned_to_pathway: ["closed"],
  escalated: ["assigned", "closed"],
  closed: [],
};

export class IllegalInterventionTransitionError extends Error {
  constructor(from: string, to: string) {
    super(
      `Illegal intervention transition: ${from} -> ${to}. Allowed from ${from}: ${
        (
          (INTERVENTION_TRANSITIONS as Record<string, readonly string[]>)[
            from
          ] ?? []
        ).join(", ") || "(terminal)"
      }.`,
    );
    this.name = "IllegalInterventionTransitionError";
  }
}

export function canTransitionIntervention(
  from: InterventionStatus,
  to: InterventionStatus,
): boolean {
  return INTERVENTION_TRANSITIONS[from].includes(to);
}

/** The single guarded transition function for intervention state. */
export function transitionIntervention(
  from: InterventionStatus,
  to: InterventionStatus,
): InterventionStatus {
  if (!canTransitionIntervention(from, to)) {
    throw new IllegalInterventionTransitionError(from, to);
  }
  return to;
}

export { INTERVENTION_TRANSITIONS };
