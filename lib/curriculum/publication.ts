/**
 * Curriculum version lifecycle (CLAUDE.md §7).
 *
 * Draft -> In review -> Approved -> Published -> Retired.
 * Only `curriculum_author` moves a version forward. Publication writes an audit
 * event and is gated on day-budget validation.
 */
import type { Tone } from "@/lib/design/tokens";

export const CURRICULUM_STATUSES = [
  "draft",
  "in_review",
  "approved",
  "published",
  "retired",
] as const;

export type CurriculumStatus = (typeof CURRICULUM_STATUSES)[number];

const CURRICULUM_TRANSITIONS: Record<
  CurriculumStatus,
  readonly CurriculumStatus[]
> = {
  draft: ["in_review"],
  in_review: ["approved", "draft"],
  approved: ["published", "draft"],
  published: ["retired"],
  retired: [],
};

export class IllegalCurriculumTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Illegal curriculum transition: ${from} -> ${to}.`);
    this.name = "IllegalCurriculumTransitionError";
  }
}

export function transitionCurriculum(
  from: CurriculumStatus,
  to: CurriculumStatus,
): CurriculumStatus {
  if (!CURRICULUM_TRANSITIONS[from].includes(to)) {
    throw new IllegalCurriculumTransitionError(from, to);
  }
  return to;
}

export const CURRICULUM_STATUS_PRESENTATION: Record<
  CurriculumStatus,
  { label: string; meaning: string; tone: Tone }
> = {
  draft: {
    label: "Draft",
    meaning: "Being written. Not visible to students.",
    tone: "neutral",
  },
  in_review: {
    label: "In review",
    meaning: "Submitted for curriculum review.",
    tone: "info",
  },
  approved: {
    label: "Approved",
    meaning: "Reviewed and cleared. Not yet published.",
    tone: "info",
  },
  published: {
    label: "Published",
    meaning: "Available to be referenced by a roster section.",
    tone: "positive",
  },
  retired: {
    label: "Retired",
    meaning: "No longer assignable. Running sections are unaffected.",
    tone: "neutral",
  },
};

export { CURRICULUM_TRANSITIONS };
