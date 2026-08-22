/**
 * The recommendation engine (CLAUDE.md §8).
 *
 * A PURE FUNCTION of stored evidence and a versioned rule set:
 *
 *     recommend(evidence, skillProfile, curriculumVersion, ruleVersion)
 *       -> Recommendation[]
 *
 * Same inputs, same outputs. Always. There is no model inference, no
 * randomness, no wall-clock read, no network call, and no hidden state in this
 * directory. It performs NO I/O: every fact it needs arrives as an argument.
 * The type-only imports below are erased at build and add no runtime edge.
 *
 * A recommendation is a PROPOSAL, never an action. Nothing here creates,
 * assigns, or changes anything. A teacher — or, for an unresolved queue item, a
 * site admin with a recorded reason — decides.
 */
import {
  ANTI_LOOP_MAX_CYCLES,
  DEFAULT_RETURN_RULE,
  RULE_VERSIONS,
} from "@/lib/rules/versions";

import type { EvidenceRecord } from "@/lib/db/types";
import type { MasteryEstimate } from "@/lib/mastery/profile";

export type Severity = "immediate" | "targeted" | "spaced" | "teacher_review";

export type TriggerKind =
  | "prerequisite_below_readiness"
  | "repeated_error_pattern"
  | "exit_ticket_failed_twice"
  | "developing_skill_required_soon"
  | "rubric_dimension_limits_performance"
  | "skill_going_stale"
  | "evidence_conflict"
  | "unusually_rapid_completion"
  | "intervention_repeatedly_failed";

/** One candidate support the catalog can offer for a skill. */
export type InterventionOption = {
  id: string;
  target: string;
  estimatedMinutes: number;
  standard: string | null;
  /** True when the site has confirmed local resources for this support. */
  approvedLocally: boolean;
};

export type RecommendContext = {
  studentId: string;
  enrollmentId: string;
  courseTitle: string;
  /** The version in force for this roster section. */
  courseVersionId: string;
  /** Exact pathway location the student returns to. */
  currentLessonCode: string;
  currentStage: number;
  /** Standards the next lessons depend on, nearest first. */
  upcomingStandards: string[];
  /** Candidate supports, keyed by the standard or skill they target. */
  options: Record<string, InterventionOption>;
  /** Skills that already have an open plan — suppresses duplicates. */
  activeSkills: string[];
  /** Completed cycles per skill, for the anti-loop rule. */
  priorCycles: Record<string, number>;
  /** Whether a previous plan on this skill ended in a pass. */
  priorOutcome: Record<string, "passed" | "failed" | undefined>;
  /** Minutes of support already on the student's plate this cycle. */
  currentWorkloadMinutes: number;
};

export type Recommendation = {
  /** Deterministic. Same inputs produce the same id. */
  id: string;
  studentId: string;
  enrollmentId: string;
  skill: string;
  standard: string | null;
  severity: Severity;
  trigger: TriggerKind;
  /** Why this exists, in one sentence, citing the evidence. */
  triggerSummary: string;
  /** Never empty — every recommendation cites its trigger evidence. */
  triggerEvidenceIds: string[];
  /** Confidence in the ESTIMATE behind this, carried through, not invented. */
  confidence: MasteryEstimate["confidence"];
  interventionLessonId: string;
  interventionTarget: string;
  estimatedMinutes: number;
  currentLessonCode: string;
  upcomingDependency: string | null;
  returnLessonCode: string;
  returnStage: number;
  returnRule: string;
  returnRuleVersion: string;
  ruleVersion: string;
  /** Inspectable ranking inputs (CLAUDE.md §8). */
  ranking: {
    dependencyStrength: number;
    evidenceMatch: number;
    workloadCost: number;
    priorCompletion: number;
    priorOutcome: number;
    localResources: number;
    score: number;
  };
};

const SEVERITY_ORDER: Record<Severity, number> = {
  immediate: 0,
  teacher_review: 1,
  targeted: 2,
  spaced: 3,
};

/**
 * The whole engine. Deterministic and total: given the same arguments it
 * returns the same array, in the same order, every time.
 */
export function recommend(
  evidence: readonly EvidenceRecord[],
  skillProfile: readonly MasteryEstimate[],
  context: RecommendContext,
  ruleVersion: string = RULE_VERSIONS.recommend,
): Recommendation[] {
  const out: Recommendation[] = [];
  const bySkill = groupBy(evidence, (e) => e.skill);

  for (const estimate of [...skillProfile].sort((a, b) =>
    a.skill.localeCompare(b.skill),
  )) {
    const rows = (bySkill.get(estimate.skill) ?? [])
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id));
    if (rows.length === 0) continue;

    // Duplicate protection: a skill with an open plan is not re-proposed
    // unless new evidence justifies it (CLAUDE.md §8).
    if (context.activeSkills.includes(estimate.skill)) continue;

    const trigger = detectTrigger(estimate, rows, context);
    if (!trigger) continue;

    const option =
      context.options[estimate.skill] ??
      (estimate.standard ? context.options[estimate.standard] : undefined);
    if (!option) continue;

    const dependencyIndex = estimate.standard
      ? context.upcomingStandards.indexOf(estimate.standard)
      : -1;

    const ranking = rank(estimate, rows, option, dependencyIndex, context);

    out.push({
      id: `rec:${context.enrollmentId}:${estimate.skill}:${trigger.kind}`,
      studentId: context.studentId,
      enrollmentId: context.enrollmentId,
      skill: estimate.skill,
      standard: estimate.standard,
      severity: trigger.severity,
      trigger: trigger.kind,
      triggerSummary: trigger.summary,
      triggerEvidenceIds: trigger.evidenceIds,
      confidence: estimate.confidence,
      interventionLessonId: option.id,
      interventionTarget: option.target,
      estimatedMinutes: option.estimatedMinutes,
      currentLessonCode: context.currentLessonCode,
      upcomingDependency:
        dependencyIndex >= 0 ? context.upcomingStandards[dependencyIndex] : null,
      returnLessonCode: context.currentLessonCode,
      returnStage: context.currentStage,
      returnRule: DEFAULT_RETURN_RULE.label,
      returnRuleVersion: DEFAULT_RETURN_RULE.version,
      ruleVersion,
      ranking,
    });
  }

  return out.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      b.ranking.score - a.ranking.score ||
      a.id.localeCompare(b.id),
  );
}

type Trigger = {
  kind: TriggerKind;
  severity: Severity;
  summary: string;
  evidenceIds: string[];
};

/**
 * Trigger detection, in the order the blueprint lists it. The first matching
 * rule wins, so the most urgent reading of the evidence is the one presented.
 *
 * NO AUTOMATIC INTERVENTION FROM A SINGLE ISOLATED MISS: every rule below
 * requires either a repeated pattern or a confirmed readiness shortfall
 * against otherwise sufficient evidence.
 */
function detectTrigger(
  estimate: MasteryEstimate,
  rows: EvidenceRecord[],
  context: RecommendContext,
): Trigger | null {
  const misses = rows.filter((e) => e.correct === false);
  const scored = rows.filter((e) => e.correct !== null);

  // A single isolated miss never triggers anything.
  if (misses.length < 2 && estimate.band !== "needs_support") return null;
  if (scored.length < 2) return null;

  // --- Teacher review: repeated intervention failure (anti-loop rule) -------
  const cycles = context.priorCycles[estimate.skill] ?? 0;
  if (cycles >= ANTI_LOOP_MAX_CYCLES) {
    return {
      kind: "intervention_repeatedly_failed",
      severity: "teacher_review",
      summary: `${cycles} support cycles on this skill have not resolved it. The anti-loop rule routes this to you rather than proposing a third retry.`,
      evidenceIds: misses.slice(-3).map((e) => e.id),
    };
  }

  // --- Teacher review: pathway and proctored evidence diverge ---------------
  const proctored = scored.filter((e) => e.source === "proctored");
  const pathway = scored.filter((e) => e.source !== "proctored");
  if (proctored.length >= 1 && pathway.length >= 3) {
    const proctoredRate = rate(proctored);
    const pathwayRate = rate(pathway);
    if (Math.abs(proctoredRate - pathwayRate) >= 0.5) {
      return {
        kind: "evidence_conflict",
        severity: "teacher_review",
        summary: `Pathway work and proctored work disagree sharply on this skill (${pct(pathwayRate)} vs ${pct(proctoredRate)}). Worth a look before any support is assigned.`,
        evidenceIds: [...proctored, ...pathway.slice(-2)].map((e) => e.id),
      };
    }
  }

  // --- Teacher review: unusually rapid completion --------------------------
  const rapid = scored.filter(
    (e) => e.meaningfulMinutes < 1 && e.hintsUsed === 0,
  );
  if (rapid.length >= 3 && rate(rapid) < 0.5) {
    return {
      kind: "unusually_rapid_completion",
      severity: "teacher_review",
      summary: `${rapid.length} responses on this skill were submitted with under a minute of meaningful activity each and mostly missed. This reads as clicking through, not as a skill gap.`,
      evidenceIds: rapid.slice(-3).map((e) => e.id),
    };
  }

  // --- Immediate: same Exit Ticket failed twice ----------------------------
  const exitFails = misses.filter((e) => e.source === "exit_ticket");
  const exitLessons = new Map<string, EvidenceRecord[]>();
  for (const e of exitFails) {
    exitLessons.set(e.lessonCode, [...(exitLessons.get(e.lessonCode) ?? []), e]);
  }
  for (const [lessonCode, fails] of [...exitLessons.entries()].sort()) {
    const attempts = new Set(fails.map((f) => f.attempt));
    if (attempts.size >= 2) {
      return {
        kind: "exit_ticket_failed_twice",
        severity: "immediate",
        summary: `The Exit Ticket for ${lessonCode} was missed on two separate attempts on this skill.`,
        evidenceIds: fails.map((e) => e.id),
      };
    }
  }

  // --- Immediate: a required prerequisite is below readiness ---------------
  const dependencyIndex = estimate.standard
    ? context.upcomingStandards.indexOf(estimate.standard)
    : -1;
  if (
    estimate.band === "needs_support" &&
    estimate.confidence !== "insufficient"
  ) {
    return {
      kind: "prerequisite_below_readiness",
      severity: dependencyIndex >= 0 && dependencyIndex < 3 ? "immediate" : "targeted",
      summary:
        dependencyIndex >= 0
          ? `Readiness for ${estimate.standard} is below the bar and the next lessons depend on it.`
          : `Readiness for this skill is below the bar across ${estimate.inputs.attempts} attempts.`,
      evidenceIds: misses.slice(-3).map((e) => e.id),
    };
  }

  // --- Immediate: two recent misses share an error pattern -----------------
  const recentMisses = misses.slice(-4);
  const byError = groupBy(
    recentMisses.filter((e) => e.errorCode),
    (e) => e.errorCode as string,
  );
  for (const [errorCode, group] of [...byError.entries()].sort()) {
    if (group.length >= 2) {
      return {
        kind: "repeated_error_pattern",
        severity: "immediate",
        summary: `Two recent misses share the same error pattern (${errorCode.replace(/-/g, " ")}).`,
        evidenceIds: group.map((e) => e.id),
      };
    }
  }

  // --- Targeted: a rubric dimension repeatedly limits performance ----------
  if (
    misses.length >= 2 &&
    misses.every((e) => e.standard === null) &&
    estimate.band !== "strong"
  ) {
    return {
      kind: "rubric_dimension_limits_performance",
      severity: "targeted",
      summary: `This rubric dimension has limited the result on ${misses.length} separate pieces of work.`,
      evidenceIds: misses.slice(-3).map((e) => e.id),
    };
  }

  // --- Targeted: developing skill required soon ----------------------------
  if (estimate.band === "developing" && dependencyIndex >= 0) {
    return {
      kind: "developing_skill_required_soon",
      severity: "targeted",
      summary: `Still developing, and ${estimate.standard} is required in an upcoming lesson.`,
      evidenceIds: misses.slice(-2).map((e) => e.id).concat(
        misses.length === 0 ? scored.slice(-1).map((e) => e.id) : [],
      ),
    };
  }

  // --- Spaced: previously demonstrated skill going stale -------------------
  if (
    (estimate.band === "secure" || estimate.band === "strong") &&
    dependencyIndex >= 0 &&
    estimate.inputs.recencyRank >= 3
  ) {
    return {
      kind: "skill_going_stale",
      severity: "spaced",
      summary: `Demonstrated earlier and not seen recently, and an upcoming lesson depends on it.`,
      evidenceIds: scored.slice(-2).map((e) => e.id),
    };
  }

  return null;
}

/**
 * Ranking. Every input is explicit and inspectable (CLAUDE.md §8):
 * dependency strength, evidence match, workload, prior completion, prior
 * outcome, and approved local resources.
 */
function rank(
  estimate: MasteryEstimate,
  rows: EvidenceRecord[],
  option: InterventionOption,
  dependencyIndex: number,
  context: RecommendContext,
): Recommendation["ranking"] {
  const dependencyStrength =
    dependencyIndex < 0 ? 0 : Math.max(0, 40 - dependencyIndex * 8);

  const misses = rows.filter((e) => e.correct === false).length;
  const evidenceMatch = Math.min(30, misses * 8 + estimate.inputs.attempts);

  // More support already assigned makes another support cost more.
  const workloadCost = Math.min(
    20,
    Math.round((context.currentWorkloadMinutes + option.estimatedMinutes) / 10),
  );

  const priorCompletion = (context.priorCycles[estimate.skill] ?? 0) * -6;
  const outcome = context.priorOutcome[estimate.skill];
  const priorOutcome = outcome === "failed" ? -10 : outcome === "passed" ? -4 : 0;
  const localResources = option.approvedLocally ? 8 : 0;

  const score =
    dependencyStrength +
    evidenceMatch -
    workloadCost +
    priorCompletion +
    priorOutcome +
    localResources;

  return {
    dependencyStrength,
    evidenceMatch,
    workloadCost,
    priorCompletion,
    priorOutcome,
    localResources,
    score,
  };
}

// --- small pure helpers ----------------------------------------------------

function groupBy<T, K>(xs: readonly T[], key: (x: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const x of xs) {
    const k = key(x);
    m.set(k, [...(m.get(k) ?? []), x]);
  }
  return m;
}

function rate(rows: EvidenceRecord[]): number {
  if (rows.length === 0) return 0;
  return rows.filter((e) => e.correct).length / rows.length;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
