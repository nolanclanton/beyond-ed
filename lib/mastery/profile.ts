/**
 * Student skill profile and mastery estimate (CLAUDE.md §4, blueprint §7).
 *
 * MASTERY IS NOT A GRADE. This module estimates readiness and directs review.
 * It must never import from `/lib/grades`, and `/lib/grades` must never import
 * from here — the boundary is enforced by lint (`eslint.config.mjs`) and by a
 * test in `/tests/unit/module-boundaries.test.ts`.
 *
 * Mastery combines recent accuracy, evidence variety, independence, difficulty,
 * recency, and transfer performance. Confidence is stored and shown SEPARATELY,
 * so thin evidence is never presented as a precise score.
 *
 * Pure functions over evidence. Deterministic. Stores the rule version and the
 * inputs used with every estimate (CLAUDE.md §7).
 */
import { currentEvidence } from "@/lib/evidence/ledger";
import { RULE_VERSIONS } from "@/lib/rules/versions";
import type { EvidenceRecord } from "@/lib/db/types";

/** Readiness bands. Words, not only colour (CLAUDE.md §4, §12). */
export type ReadinessBand =
  | "not_started"
  | "needs_support"
  | "developing"
  | "secure"
  | "strong";

export type ConfidenceBand = "insufficient" | "low" | "moderate" | "high";

export type MasteryEstimate = {
  skill: string;
  standard: string | null;
  /** 0-100 readiness estimate. NOT a grade and never displayed as one. */
  estimate: number;
  band: ReadinessBand;
  /** Stored and displayed separately from the estimate. */
  confidence: ConfidenceBand;
  confidenceReason: string;
  ruleVersion: string;
  /** The exact inputs used, so the estimate can be recomputed exactly. */
  inputs: {
    attempts: number;
    correct: number;
    distinctSources: string[];
    distinctLessons: string[];
    hintsUsed: number;
    transferAttempts: number;
    transferCorrect: number;
    /** Position of the most recent attempt in the student's evidence order. */
    recencyRank: number;
  };
  lastSeenAt: string | null;
  evidenceIds: string[];
};

/** How much each recent attempt counts. Newest first; older attempts decay. */
const RECENCY_WEIGHTS = [1, 0.85, 0.7, 0.55, 0.4, 0.3, 0.2, 0.15];

/** Independence: each hint on an attempt discounts that attempt's credit. */
const HINT_PENALTY = 0.15;

/** A transfer item in the current grade-level context counts double. */
const TRANSFER_WEIGHT = 2;

export const READINESS_BANDS: Record<
  ReadinessBand,
  { label: string; studentMeaning: string; min: number }
> = {
  not_started: {
    label: "Not started",
    studentMeaning: "No work recorded for this yet.",
    min: -1,
  },
  needs_support: {
    label: "Needs support",
    studentMeaning: "This one is worth some time. Your teacher can help.",
    min: 0,
  },
  developing: {
    label: "Developing",
    studentMeaning: "Coming along. A little more practice will lock it in.",
    min: 50,
  },
  secure: {
    label: "Secure",
    studentMeaning: "You can do this on your own.",
    min: 70,
  },
  strong: {
    label: "Strong",
    studentMeaning: "Solid, including in new situations.",
    min: 85,
  },
};

export const CONFIDENCE_BANDS: Record<
  ConfidenceBand,
  { label: string; meaning: string }
> = {
  insufficient: {
    label: "Not enough evidence",
    meaning:
      "Too little work recorded to say anything yet. This is not a low score — it is no score.",
  },
  low: {
    label: "Low confidence",
    meaning: "Based on very few attempts, all of one kind. Treat as provisional.",
  },
  moderate: {
    label: "Moderate confidence",
    meaning: "Enough attempts to be useful, from a limited range of work.",
  },
  high: {
    label: "High confidence",
    meaning: "Several attempts across different kinds of work, including transfer.",
  },
};

function bandFor(estimate: number): ReadinessBand {
  if (estimate >= READINESS_BANDS.strong.min) return "strong";
  if (estimate >= READINESS_BANDS.secure.min) return "secure";
  if (estimate >= READINESS_BANDS.developing.min) return "developing";
  return "needs_support";
}

/**
 * Confidence is a function of how much and how varied the evidence is —
 * never of how high the estimate is.
 */
function confidenceFor(inputs: MasteryEstimate["inputs"]): {
  band: ConfidenceBand;
  reason: string;
} {
  const { attempts, distinctSources, distinctLessons, transferAttempts } = inputs;
  if (attempts === 0)
    return { band: "insufficient", reason: "No attempts recorded." };
  if (attempts < 3)
    return {
      band: "insufficient",
      reason: `Only ${attempts} attempt${attempts === 1 ? "" : "s"} recorded. At least 3 are needed before a readiness estimate means anything.`,
    };
  if (distinctSources.length < 2 || distinctLessons.length < 2)
    return {
      band: "low",
      reason: `${attempts} attempts, but all from ${distinctSources.length === 1 ? "one kind of work" : "one lesson"}. Variety is what makes a readiness estimate trustworthy.`,

    };
  if (transferAttempts === 0 || attempts < 6)
    return {
      band: "moderate",
      reason: `${attempts} attempts across ${distinctSources.length} kinds of work${transferAttempts === 0 ? ", none of them a transfer item" : ""}.`,
    };
  return {
    band: "high",
    reason: `${attempts} attempts across ${distinctSources.length} kinds of work, including ${transferAttempts} transfer ${transferAttempts === 1 ? "item" : "items"}.`,
  };
}

/** Estimates readiness for one skill from that skill's current evidence. */
export function estimateSkill(
  skill: string,
  evidence: EvidenceRecord[],
): MasteryEstimate {
  const scored = evidence
    .filter((e) => e.correct !== null)
    .slice()
    .reverse(); // newest first

  const inputs: MasteryEstimate["inputs"] = {
    attempts: scored.length,
    correct: scored.filter((e) => e.correct).length,
    distinctSources: [...new Set(scored.map((e) => e.source))].sort(),
    distinctLessons: [...new Set(scored.map((e) => e.lessonCode))].sort(),
    hintsUsed: scored.reduce((n, e) => n + e.hintsUsed, 0),
    transferAttempts: scored.filter((e) => e.source === "transfer_check").length,
    transferCorrect: scored.filter(
      (e) => e.source === "transfer_check" && e.correct,
    ).length,
    recencyRank: scored.length,
  };

  const confidence = confidenceFor(inputs);
  const standard = evidence.find((e) => e.standard)?.standard ?? null;
  const evidenceIds = evidence.map((e) => e.id);
  const lastSeenAt = evidence.length
    ? evidence[evidence.length - 1].recordedAt
    : null;

  if (scored.length === 0) {
    return {
      skill,
      standard,
      estimate: 0,
      band: "not_started",
      confidence: confidence.band,
      confidenceReason: confidence.reason,
      ruleVersion: RULE_VERSIONS.mastery,
      inputs,
      lastSeenAt,
      evidenceIds,
    };
  }

  let weighted = 0;
  let total = 0;
  scored.forEach((e, i) => {
    const recency = RECENCY_WEIGHTS[Math.min(i, RECENCY_WEIGHTS.length - 1)];
    const kind = e.source === "transfer_check" ? TRANSFER_WEIGHT : 1;
    const weight = recency * kind;
    const independence = Math.max(0, 1 - e.hintsUsed * HINT_PENALTY);
    total += weight;
    if (e.correct) weighted += weight * independence;
  });

  const estimate = total === 0 ? 0 : Math.round((weighted / total) * 100);

  return {
    skill,
    standard,
    estimate,
    band: bandFor(estimate),
    confidence: confidence.band,
    confidenceReason: confidence.reason,
    ruleVersion: RULE_VERSIONS.mastery,
    inputs,
    lastSeenAt,
    evidenceIds,
  };
}

/** The whole skill profile for a student, newest-evidence-first per skill. */
export function skillProfile(studentId: string): MasteryEstimate[] {
  const evidence = currentEvidence({ studentId });
  const bySkill = new Map<string, EvidenceRecord[]>();
  for (const e of evidence) {
    const list = bySkill.get(e.skill) ?? [];
    list.push(e);
    bySkill.set(e.skill, list);
  }
  return [...bySkill.entries()]
    .map(([skill, rows]) => estimateSkill(skill, rows))
    .sort((a, b) => a.estimate - b.estimate || a.skill.localeCompare(b.skill));
}

export function estimateFor(
  studentId: string,
  skill: string,
): MasteryEstimate {
  return estimateSkill(skill, currentEvidence({ studentId, skill }));
}

/** Skills whose estimate is below `secure` — the review pool. */
export function weakSkills(studentId: string): MasteryEstimate[] {
  return skillProfile(studentId).filter(
    (m) => m.band === "needs_support" || m.band === "developing",
  );
}
