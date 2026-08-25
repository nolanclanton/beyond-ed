import { describe, expect, it } from "vitest";

import type { EvidenceRecord } from "@/lib/db/types";
import { estimateSkill, type MasteryEstimate } from "@/lib/mastery/profile";
import { recommend, type RecommendContext } from "@/lib/recommend/engine";
import { ANTI_LOOP_MAX_CYCLES, RULE_VERSIONS } from "@/lib/rules/versions";

function row(partial: Partial<EvidenceRecord> & { id: string }): EvidenceRecord {
  return {
    studentId: "u_test",
    enrollmentId: "enr_test",
    courseVersionId: "cv_test",
    lessonCode: "MATH-06-L020",
    stage: "Exit Ticket",
    standard: "6.RP.1",
    skill: "6.RP.1",
    itemId: "i1",
    correct: false,
    response: "",
    errorCode: "fraction-or-ratio",
    attempt: 1,
    hintsUsed: 0,
    meaningfulMinutes: 3,
    supportUsed: null,
    source: "exit_ticket",
    supersedesEvidenceId: null,
    recordedAt: "2026-08-17T15:00:00.000Z",
    recordedByUserId: "u_test",
    ...partial,
  };
}

function context(over: Partial<RecommendContext> = {}): RecommendContext {
  return {
    studentId: "u_test",
    enrollmentId: "enr_test",
    courseTitle: "Mathematics 6",
    courseVersionId: "cv_test",
    currentLessonCode: "MATH-06-L035",
    currentStage: 5,
    upcomingStandards: ["6.RP.1", "6.RP.2"],
    options: {
      "6.RP.1": {
        id: "I-M6-U1-L1",
        target: "representation and prerequisite reset",
        estimatedMinutes: 20,
        standard: "6.RP.1",
        approvedLocally: true,
      },
    },
    activeSkills: [],
    priorCycles: {},
    priorOutcome: {},
    currentWorkloadMinutes: 0,
    ...over,
  };
}

function profileFor(rows: EvidenceRecord[]): MasteryEstimate[] {
  return [estimateSkill("6.RP.1", rows)];
}

/** CLAUDE.md §8: deterministic, human-controlled, evidence-citing. */
describe("recommendation engine", () => {
  it("returns the same output for the same input, every time", () => {
    const rows = [
      row({ id: "e1" }),
      row({ id: "e2", attempt: 2 }),
      row({ id: "e3", correct: true, errorCode: null }),
    ];
    const first = recommend(rows, profileFor(rows), context());
    const second = recommend(rows, profileFor(rows), context());
    const third = recommend([...rows].reverse(), profileFor(rows), context());
    expect(second).toEqual(first);
    // Input order must not change the result.
    expect(third).toEqual(first);
  });

  it("never triggers on a single isolated miss", () => {
    const rows = [
      row({ id: "e1", correct: true, errorCode: null }),
      row({ id: "e2", correct: true, errorCode: null }),
      row({ id: "e3", correct: true, errorCode: null }),
      row({ id: "e4", correct: true, errorCode: null }),
      row({ id: "e5" }),
    ];
    expect(recommend(rows, profileFor(rows), context())).toHaveLength(0);
  });

  it("cites trigger evidence on every recommendation", () => {
    const rows = [row({ id: "e1" }), row({ id: "e2", attempt: 2 })];
    const out = recommend(rows, profileFor(rows), context());
    expect(out.length).toBeGreaterThan(0);
    for (const r of out) {
      expect(r.triggerEvidenceIds.length).toBeGreaterThan(0);
      expect(r.triggerSummary.length).toBeGreaterThan(0);
      expect(r.returnLessonCode).toBe("MATH-06-L035");
      expect(r.returnStage).toBe(5);
      expect(r.ruleVersion).toBe(RULE_VERSIONS.recommend);
    }
  });

  it("detects the same Exit Ticket failed twice as immediate", () => {
    const rows = [row({ id: "e1", attempt: 1 }), row({ id: "e2", attempt: 2 })];
    const out = recommend(rows, profileFor(rows), context());
    expect(out[0].trigger).toBe("exit_ticket_failed_twice");
    expect(out[0].severity).toBe("immediate");
  });

  it("routes to teacher review after the anti-loop limit", () => {
    const rows = [row({ id: "e1" }), row({ id: "e2", attempt: 2 })];
    const out = recommend(
      rows,
      profileFor(rows),
      context({ priorCycles: { "6.RP.1": ANTI_LOOP_MAX_CYCLES } }),
    );
    expect(out[0].trigger).toBe("intervention_repeatedly_failed");
    expect(out[0].severity).toBe("teacher_review");
    expect(out[0].triggerSummary).toContain("rather than proposing a third retry");
  });

  it("flags evidence conflict when pathway and proctored results diverge", () => {
    const rows = [
      row({ id: "e1", correct: true, errorCode: null }),
      row({ id: "e2", correct: true, errorCode: null }),
      row({ id: "e3", correct: true, errorCode: null }),
      row({ id: "e4", correct: false }),
      row({ id: "e5", source: "proctored", correct: false }),
    ];
    const out = recommend(rows, profileFor(rows), context());
    expect(out[0]?.trigger).toBe("evidence_conflict");
    expect(out[0]?.severity).toBe("teacher_review");
  });

  it("suppresses a skill that already has an open plan", () => {
    const rows = [row({ id: "e1" }), row({ id: "e2", attempt: 2 })];
    const out = recommend(
      rows,
      profileFor(rows),
      context({ activeSkills: ["6.RP.1"] }),
    );
    expect(out).toHaveLength(0);
  });

  it("proposes nothing when no support exists for the skill", () => {
    const rows = [row({ id: "e1" }), row({ id: "e2", attempt: 2 })];
    const out = recommend(rows, profileFor(rows), context({ options: {} }));
    expect(out).toHaveLength(0);
  });

  it("exposes every ranking input", () => {
    const rows = [row({ id: "e1" }), row({ id: "e2", attempt: 2 })];
    const out = recommend(rows, profileFor(rows), context());
    expect(Object.keys(out[0].ranking).sort()).toEqual([
      "dependencyStrength",
      "evidenceMatch",
      "localResources",
      "priorCompletion",
      "priorOutcome",
      "score",
      "workloadCost",
    ]);
  });

  it("ranks a heavier existing workload lower", () => {
    const rows = [row({ id: "e1" }), row({ id: "e2", attempt: 2 })];
    const light = recommend(rows, profileFor(rows), context())[0];
    const heavy = recommend(
      rows,
      profileFor(rows),
      context({ currentWorkloadMinutes: 180 }),
    )[0];
    expect(heavy.ranking.score).toBeLessThan(light.ranking.score);
  });

  it("creates nothing — it only proposes", () => {
    const rows = [row({ id: "e1" }), row({ id: "e2", attempt: 2 })];
    const before = JSON.stringify(rows);
    recommend(rows, profileFor(rows), context());
    expect(JSON.stringify(rows)).toBe(before);
  });
});
