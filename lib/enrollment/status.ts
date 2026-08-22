/**
 * Canonical enrollment status and its guarded transitions (CLAUDE.md §9).
 *
 * Nothing in this system is hard-deleted. Removal is a state transition plus an
 * audit event (CLAUDE.md §6).
 */
import type { Tone } from "@/lib/design/tokens";

export const ENROLLMENT_STATUSES = [
  "pending",
  "active",
  "transferred",
  "withdrawn",
  "archived",
] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

const ENROLLMENT_TRANSITIONS: Record<
  EnrollmentStatus,
  readonly EnrollmentStatus[]
> = {
  pending: ["active", "withdrawn"],
  active: ["transferred", "withdrawn", "archived"],
  transferred: ["active", "archived"],
  withdrawn: ["archived"],
  archived: [],
};

export class IllegalEnrollmentTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Illegal enrollment transition: ${from} -> ${to}.`);
    this.name = "IllegalEnrollmentTransitionError";
  }
}

export function transitionEnrollment(
  from: EnrollmentStatus,
  to: EnrollmentStatus,
): EnrollmentStatus {
  if (!ENROLLMENT_TRANSITIONS[from].includes(to)) {
    throw new IllegalEnrollmentTransitionError(from, to);
  }
  return to;
}

export const ENROLLMENT_STATUS_PRESENTATION: Record<
  EnrollmentStatus,
  { label: string; meaning: string; tone: Tone }
> = {
  pending: {
    label: "Pending",
    meaning: "Placed but not yet started.",
    tone: "neutral",
  },
  active: { label: "Active", meaning: "Currently enrolled.", tone: "info" },
  transferred: {
    label: "Transferred",
    meaning: "Moved to another site with pathway state preserved.",
    tone: "attention",
  },
  withdrawn: {
    label: "Withdrawn",
    meaning: "No longer enrolled. Records retained.",
    tone: "neutral",
  },
  archived: {
    label: "Archived",
    meaning: "Closed out. Records retained and readable.",
    tone: "neutral",
  },
};

export { ENROLLMENT_TRANSITIONS };
