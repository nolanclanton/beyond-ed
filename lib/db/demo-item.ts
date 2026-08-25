/**
 * ============================================================================
 * DEMO ASSESSMENT CONTENT — the record shape and the builder
 * ============================================================================
 *
 * Split out from `demo-items.ts` so the per-course recall banks in
 * `demo-recall.ts` can be written against the same shape without a circular
 * import. Nothing here is curriculum: the SHAPE of an item is product design,
 * and the items themselves are demonstration content (ADR 0005).
 */
export type { ItemPurpose } from "./types";
import type { ItemPurpose } from "./types";

export type DemoChoice = {
  id: string;
  text: string;
  /** The error family this distractor reveals. Null on the correct choice. */
  errorCode: string | null;
};

export type DemoItem = {
  id: string;
  lessonCode: string;
  /** The primary standard the lesson this item sits on claims. */
  standard: string;
  /** The reusable skill this item measures. Equal to the standard here. */
  skill: string;
  purpose: ItemPurpose;
  stem: string;
  choices: DemoChoice[];
  correctChoiceId: string;
  /** Shown after completion — explanations appear after, never during. */
  rationale: string;
};

/**
 * Builds one item.
 *
 * The correct choice carries no error code, and every other choice must carry
 * one: a distractor without an error family is a mark rather than a diagnosis,
 * which is the whole mechanism the recommendation engine runs on.
 */
export const item = (
  id: string,
  lessonCode: string,
  standard: string,
  purpose: ItemPurpose,
  stem: string,
  choices: [string, string | null][],
  correct: number,
  rationale: string,
): DemoItem => ({
  id,
  lessonCode,
  standard,
  skill: standard,
  purpose,
  stem,
  choices: choices.map(([text, errorCode], i) => ({
    id: `${id}-${"abcd"[i]}`,
    text,
    errorCode: i === correct ? null : errorCode,
  })),
  correctChoiceId: `${id}-${"abcd"[correct]}`,
  rationale,
});
