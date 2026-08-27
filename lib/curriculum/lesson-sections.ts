/**
 * Where a composed element sits in a lesson (CLAUDE.md §7, blueprint §5).
 *
 * The ten-stage lesson is the product's fixed spine and the studio does not get
 * to invent parts of it. A section names which of those stages an element
 * belongs to, so a diagram can go in the worked model and a photograph in the
 * introduction instead of everything piling into the instruction stage.
 *
 * Pure and I/O-free: the studio reads this to lay out its rails, and the
 * student's lesson reads it to render the same content in the same order. One
 * definition, so the two cannot drift.
 */
import type { LessonBlock, LessonSection } from "@/lib/db/types";
import { LESSON_SECTIONS } from "@/lib/db/types";

export type LessonSectionPart = {
  value: LessonSection;
  /** Position in the fixed ten-stage lesson, so both surfaces name one thing. */
  stage: number;
  label: string;
  meaning: string;
  /**
   * What the typed script already contributes to this stage. Composed elements
   * are placed AFTER it, never instead of it: the worked model's steps and
   * guided practice's fading hints are read by the product, and a free-form
   * replacement for them would be a lesson the engine cannot act on.
   */
  script: string;
};

/**
 * Stages 2, 9, and 10 are absent on purpose. Spiral Review, the Exit Ticket,
 * and the next-step decision are produced by rule from stored evidence and
 * authored items (CLAUDE.md §8); they are built in the quiz, not composed here.
 */
export const LESSON_SECTION_PART: Record<LessonSection, LessonSectionPart> = {
  notes: {
    value: "notes",
    stage: 1,
    label: "Notes record",
    meaning: "The headings a student sets up before starting, and keeps afterwards.",
    script: "The notes outline, written in the script.",
  },
  relevance: {
    value: "relevance",
    stage: 3,
    label: "Introduction and relevance",
    meaning: "What the problem is, and why a student should care about it.",
    script: "The relevance paragraph, written in the script.",
  },
  goal: {
    value: "goal",
    stage: 4,
    label: "Goal and success criteria",
    meaning: "What the student is aiming at, and how they will know they have it.",
    script: "The goal and its success criteria, written in the script.",
  },
  instruction: {
    value: "instruction",
    stage: 5,
    label: "Instruction",
    meaning: "The teaching itself — the stage most of a lesson is composed into.",
    script: "Nothing. This stage is composed here in full.",
  },
  worked_model: {
    value: "worked_model",
    stage: 6,
    label: "Worked model",
    meaning: "The reasoning exposed, not only the answer.",
    script: "The numbered steps and their reasoning, written in the script.",
  },
  guided_practice: {
    value: "guided_practice",
    stage: 7,
    label: "Guided practice",
    meaning: "Practice with support that fades.",
    script: "The prompts, hints, and answers, written in the script.",
  },
  independent: {
    value: "independent",
    stage: 8,
    label: "Independent application",
    meaning: "The task a student does on their own, collected by the teacher.",
    script: "The independent task, written in the script.",
  },
};

/** Every composable part, in the order a student meets it. */
export const LESSON_SECTION_PARTS: readonly LessonSectionPart[] = LESSON_SECTIONS.map(
  (section) => LESSON_SECTION_PART[section],
).sort((a, b) => a.stage - b.stage);

/** True when the value names a composable section. Use before trusting a URL. */
export function isLessonSection(value: string | undefined): value is LessonSection {
  return LESSON_SECTIONS.some((s) => s === value);
}

/**
 * The elements composed into one section, in reading order.
 *
 * Order is the lesson's own block order filtered to the section, so there is
 * one ordering to keep straight rather than seven.
 */
export function blocksInSection(
  blocks: readonly LessonBlock[],
  section: LessonSection,
): LessonBlock[] {
  return blocks.filter((b) => b.section === section);
}

/** How many elements each section holds. Every section appears, empty ones too. */
export function sectionCounts(
  blocks: readonly LessonBlock[],
): Record<LessonSection, number> {
  const counts = Object.fromEntries(LESSON_SECTIONS.map((s) => [s, 0])) as Record<
    LessonSection,
    number
  >;
  for (const block of blocks) counts[block.section] += 1;
  return counts;
}
