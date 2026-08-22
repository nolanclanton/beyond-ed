/**
 * Individualized Spiral Review selection (blueprint §4).
 *
 * Five to seven items selected by TRANSPARENT, VERSIONED rules from weak
 * skills, upcoming prerequisites, and cumulative skills. The selection must be
 * explainable and reproducible from the stored inputs, so this is a pure
 * function with a stated reason attached to every item it picks.
 *
 * No I/O, no clock, no randomness (CLAUDE.md §8).
 */
import {
  RULE_VERSIONS,
  SPIRAL_REVIEW_MAX_ITEMS,
  SPIRAL_REVIEW_MIN_ITEMS,
} from "@/lib/rules/versions";

import type { MasteryEstimate } from "@/lib/mastery/profile";

export type SpiralCandidate = {
  itemId: string;
  standard: string;
  skill: string;
};

export type SpiralSelection = {
  itemId: string;
  skill: string;
  standard: string;
  /** Which of the three pools this came from, and why it ranked. */
  pool: "weak_skill" | "upcoming_prerequisite" | "cumulative";
  reason: string;
  priority: number;
};

export type SpiralResult = {
  ruleVersion: string;
  items: SpiralSelection[];
  /** Everything the selection was computed from, stored with the result. */
  inputs: {
    weakSkills: string[];
    upcomingStandards: string[];
    cumulativeSkills: string[];
    candidateCount: number;
  };
  explanation: string[];
};

const POOL_PRIORITY = {
  weak_skill: 300,
  upcoming_prerequisite: 200,
  cumulative: 100,
} as const;

/**
 * Selects 5-7 review items. Deterministic: same profile, same upcoming
 * standards, same candidate bank produces the same list in the same order.
 */
export function selectSpiralReview(
  profile: readonly MasteryEstimate[],
  upcomingStandards: readonly string[],
  candidates: readonly SpiralCandidate[],
): SpiralResult {
  const weak = new Map(
    profile
      .filter((m) => m.band === "needs_support" || m.band === "developing")
      .map((m) => [m.skill, m]),
  );
  const upcoming = new Set(upcomingStandards);
  const cumulative = new Map(
    profile
      .filter((m) => m.band === "secure" || m.band === "strong")
      .map((m) => [m.skill, m]),
  );

  const scored: SpiralSelection[] = [];
  const seenSkills = new Set<string>();

  for (const c of [...candidates].sort((a, b) => a.itemId.localeCompare(b.itemId))) {
    // One item per skill keeps a single weak skill from eating the whole set.
    if (seenSkills.has(c.skill)) continue;

    if (weak.has(c.skill)) {
      const m = weak.get(c.skill) as MasteryEstimate;
      scored.push({
        itemId: c.itemId,
        skill: c.skill,
        standard: c.standard,
        pool: "weak_skill",
        reason: `Readiness is ${m.band.replace(/_/g, " ")} for ${c.standard}.`,
        priority: POOL_PRIORITY.weak_skill + (100 - m.estimate),
      });
      seenSkills.add(c.skill);
      continue;
    }

    if (upcoming.has(c.standard)) {
      const distance = upcomingStandards.indexOf(c.standard);
      scored.push({
        itemId: c.itemId,
        skill: c.skill,
        standard: c.standard,
        pool: "upcoming_prerequisite",
        reason: `${c.standard} is needed in an upcoming lesson.`,
        priority: POOL_PRIORITY.upcoming_prerequisite + (20 - distance),
      });
      seenSkills.add(c.skill);
      continue;
    }

    if (cumulative.has(c.skill)) {
      const m = cumulative.get(c.skill) as MasteryEstimate;
      scored.push({
        itemId: c.itemId,
        skill: c.skill,
        standard: c.standard,
        pool: "cumulative",
        reason: `Shown earlier for ${c.standard}. This keeps it fresh.`,
        priority: POOL_PRIORITY.cumulative + m.estimate / 10,
      });
      seenSkills.add(c.skill);
    }
  }

  const ordered = scored.sort(
    (a, b) => b.priority - a.priority || a.itemId.localeCompare(b.itemId),
  );

  // Take up to the maximum; if fewer than the minimum exist, take what there is
  // and say so rather than padding the set out.
  const items = ordered.slice(0, SPIRAL_REVIEW_MAX_ITEMS);

  const explanation: string[] = [];
  const counts = {
    weak_skill: items.filter((i) => i.pool === "weak_skill").length,
    upcoming_prerequisite: items.filter((i) => i.pool === "upcoming_prerequisite")
      .length,
    cumulative: items.filter((i) => i.pool === "cumulative").length,
  };
  explanation.push(
    `${counts.weak_skill} from skills that need work, ${counts.upcoming_prerequisite} from skills an upcoming lesson depends on, ${counts.cumulative} to keep earlier skills fresh.`,
  );
  if (items.length < SPIRAL_REVIEW_MIN_ITEMS) {
    explanation.push(
      `Only ${items.length} of the usual ${SPIRAL_REVIEW_MIN_ITEMS}-${SPIRAL_REVIEW_MAX_ITEMS} items are available — there is not yet enough recorded work to select more.`,
    );
  }

  return {
    ruleVersion: RULE_VERSIONS.spiralReview,
    items,
    inputs: {
      weakSkills: [...weak.keys()].sort(),
      upcomingStandards: [...upcomingStandards],
      cumulativeSkills: [...cumulative.keys()].sort(),
      candidateCount: candidates.length,
    },
    explanation,
  };
}
