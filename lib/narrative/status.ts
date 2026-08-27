/**
 * The narrative lifecycle (vision §5, §7; CLAUDE.md §9).
 *
 * A narrative moves through explicit, guarded transitions like every other
 * entity in this product. Status is never set by assignment.
 *
 * The shape mirrors the curriculum version lifecycle rather than inventing a
 * second vocabulary, with one addition: `approved_template`. A narrative that
 * has been reviewed and cleared for OTHERS to build on is a different thing
 * from one that has been published for its own unit, and the Narrative Bank
 * needs to tell them apart — a designer looking for a starting point wants the
 * templates, and a designer looking for the story their course actually runs
 * wants the published one.
 *
 * `archived` is a state, not a delete. Nothing in this system is hard-deleted
 * (CLAUDE.md §6): an archived narrative keeps its history, keeps its
 * duplication provenance, and can be restored to draft by the person who owns
 * it. That is why `archived -> draft` is legal and `archived -> published` is
 * not: coming back means coming back to working state, where a person looks at
 * it again before anyone else does.
 *
 * Pure and I/O-free, like `lib/curriculum/publication.ts`.
 */
import type { NarrativeStatus } from "@/lib/db/types";
import type { Tone } from "@/lib/design/tokens";

const NARRATIVE_TRANSITIONS: Record<
  NarrativeStatus,
  readonly NarrativeStatus[]
> = {
  draft: ["in_review", "archived"],
  in_review: ["approved_template", "published", "draft"],
  approved_template: ["published", "draft", "archived"],
  published: ["draft", "archived"],
  archived: ["draft"],
};

export class IllegalNarrativeTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Illegal narrative transition: ${from} -> ${to}.`);
    this.name = "IllegalNarrativeTransitionError";
  }
}

export function transitionNarrative(
  from: NarrativeStatus,
  to: NarrativeStatus,
): NarrativeStatus {
  if (!NARRATIVE_TRANSITIONS[from].includes(to)) {
    throw new IllegalNarrativeTransitionError(from, to);
  }
  return to;
}

/** What a status allows from here. Read this before offering a control. */
export function nextNarrativeStatuses(
  from: NarrativeStatus,
): readonly NarrativeStatus[] {
  return NARRATIVE_TRANSITIONS[from];
}

/**
 * Only a draft is editable.
 *
 * Same rule, same reason as authored lesson content: a narrative someone is
 * reviewing must read the same on their screen as it did when it was submitted,
 * and a narrative other people have duplicated must not change out from under
 * the copies' stated provenance.
 */
export function isNarrativeEditable(status: NarrativeStatus): boolean {
  return status === "draft";
}

export const NARRATIVE_STATUS_PRESENTATION: Record<
  NarrativeStatus,
  { label: string; meaning: string; tone: Tone }
> = {
  draft: {
    label: "Draft",
    meaning: "Being written. Editable, and visible only to people it is shared with.",
    tone: "neutral",
  },
  in_review: {
    label: "In review",
    meaning: "Submitted for curriculum review. Frozen so a reviewer reads what was sent.",
    tone: "info",
  },
  approved_template: {
    label: "Approved template",
    meaning: "Cleared for other designers to duplicate and build on.",
    tone: "info",
  },
  published: {
    label: "Published",
    meaning: "In use by the unit it was written for. Frozen.",
    tone: "positive",
  },
  archived: {
    label: "Archived",
    meaning: "Out of active authoring. Its history and its copies are unaffected.",
    tone: "neutral",
  },
};
