/**
 * Versioned rule sets (CLAUDE.md §7).
 *
 * Every calculation stores the rule version and the inputs it used, so
 * recomputing with the stored version reproduces the stored output exactly.
 * Changing a rule means adding a version here — never editing one in place.
 */

export const RULE_VERSIONS = {
  /** Exit Ticket decision bands — blueprint §4. */
  exitBands: "exit-bands@2026.08.1",
  /** Mastery estimate and confidence — blueprint §7. */
  mastery: "mastery@2026.08.1",
  /** Recommendation triggers and ranking — blueprint §7, CLAUDE.md §8. */
  recommend: "recommend@2026.08.1",
  /** Default intervention return rule — CLAUDE.md §8. */
  interventionReturn: "return@2026.08.1",
  /** Official gradebook calculation — CLAUDE.md §4. */
  grading: "grading@2026.08.1",
  /** Spiral Review item selection — blueprint §4. */
  spiralReview: "spiral@2026.08.1",
  /** Annual capacity contract — 135 + 40 = 175. */
  dayBudget: "day-budget@2026.08.1",
} as const;

export type RuleVersion = (typeof RULE_VERSIONS)[keyof typeof RULE_VERSIONS];

/** The annual capacity contract. Hard constraint, not a default. */
export const CAPACITY_CONTRACT = {
  pathwayDays: 135,
  interventionDays: 40,
  totalDays: 175,
  planningCycles: 10,
  interventionDaysPerCycle: 4,
  /** Five cycles of 14 pathway days and five of 13 (blueprint §2). */
  cycleShape: [14, 13, 14, 13, 14, 13, 14, 13, 14, 13],
} as const;

/** Exit Ticket decision bands. Rules, not judgment calls (CLAUDE.md §8). */
export const EXIT_BANDS = [
  {
    id: "below_50",
    min: 0,
    max: 49.999999,
    label: "Below 50%",
    outcome: "do_not_advance",
    studentMeaning:
      "Not yet. You get feedback now and one supported retry before moving on.",
    teacherMeaning:
      "Do not advance. Immediate feedback, one supported retry, teacher-visible recommendation.",
  },
  {
    id: "50_69",
    min: 50,
    max: 69.999999,
    label: "50-69%",
    outcome: "provisional_advance",
    studentMeaning:
      "You can keep going. The skill you missed goes into your review list.",
    teacherMeaning:
      "Provisional advancement; missed skill added to individualized review; alert on repeat.",
  },
  {
    id: "70_84",
    min: 70,
    max: 84.999999,
    label: "70-84%",
    outcome: "advance",
    studentMeaning: "You met the goal. This comes back later to keep it fresh.",
    teacherMeaning: "Advance; schedule normal spaced review.",
  },
  {
    id: "85_plus",
    min: 85,
    max: 100,
    label: "85% or higher",
    outcome: "advance_low_priority",
    studentMeaning: "Strong work. This moves down your review list.",
    teacherMeaning:
      "Advance with lower review priority, unless the skill is a prerequisite for an upcoming lesson.",
  },
] as const;

export type ExitBand = (typeof EXIT_BANDS)[number];
export type ExitOutcome = ExitBand["outcome"];

/** Pure. Given a percentage, returns the band in force under `exitBands`. */
export function bandFor(percent: number): ExitBand {
  const clamped = Math.max(0, Math.min(100, percent));
  const band = EXIT_BANDS.find((b) => clamped >= b.min && clamped <= b.max);
  // The bands are exhaustive over [0,100]; the fallback keeps the type honest.
  return band ?? EXIT_BANDS[0];
}

/**
 * Default return rule (CLAUDE.md §8): at least 80% on the readiness check plus
 * one successful transfer item connected to the blocked standard.
 */
export const DEFAULT_RETURN_RULE = {
  version: RULE_VERSIONS.interventionReturn,
  readinessMinPercent: 80,
  transferItemsRequired: 1,
  label: "80% readiness check + 1 transfer item",
  description:
    "At least 80% on the short readiness check plus one successful transfer item connected to the blocked standard.",
} as const;

/** After two unsuccessful cycles on the same skill, route to teacher review. */
export const ANTI_LOOP_MAX_CYCLES = 2;

/** Spiral Review selects 5-7 items (blueprint §4). */
export const SPIRAL_REVIEW_MIN_ITEMS = 5;
export const SPIRAL_REVIEW_MAX_ITEMS = 7;

/** Shown wherever the contract is summarised in one line. */
export const PLANNING_CYCLES_LABEL =
  "10 learning periods · 135 pathway days + 40 intervention-capacity days = 175";

/** Aggregates below this group size are suppressed (CLAUDE.md §3). */
export const MIN_GROUP_SIZE = 10;

/** Meaningful-activity idle threshold in minutes (CLAUDE.md §5). */
export const IDLE_PAUSE_MINUTES = 5;
