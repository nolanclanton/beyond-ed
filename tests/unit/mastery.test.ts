import { describe, expect, it } from "vitest";

import type { EvidenceRecord } from "@/lib/db/types";
import { estimateSkill } from "@/lib/mastery/profile";
import { RULE_VERSIONS } from "@/lib/rules/versions";

function row(partial: Partial<EvidenceRecord> & { id: string }): EvidenceRecord {
  return {
    studentId: "u_test",
    enrollmentId: "enr_test",
    courseVersionId: "cv_test",
    lessonCode: "M6-U1-L1",
    stage: "Exit Ticket",
    standard: "6.RP.2",
    skill: "6.RP.2",
    itemId: "i1",
    correct: true,
    response: "",
    errorCode: null,
    attempt: 1,
    hintsUsed: 0,
    meaningfulMinutes: 2,
    supportUsed: null,
    source: "exit_ticket",
    supersedesEvidenceId: null,
    recordedAt: "2026-08-17T15:00:00.000Z",
    recordedByUserId: "u_test",
    ...partial,
  };
}

/**
 * CLAUDE.md §4: confidence is stored and displayed separately from the estimate.
 * Thin evidence must never be presented as a precise score.
 */
describe("mastery estimate", () => {
  it("reports insufficient confidence below three attempts", () => {
    const m = estimateSkill("6.RP.2", [row({ id: "e1" }), row({ id: "e2" })]);
    expect(m.confidence).toBe("insufficient");
    expect(m.confidenceReason).toContain("2 attempts");
  });

  it("keeps confidence independent of the estimate", () => {
    const allCorrect = estimateSkill("6.RP.2", [
      row({ id: "e1" }),
      row({ id: "e2" }),
    ]);
    const allWrong = estimateSkill("6.RP.2", [
      row({ id: "e1", correct: false }),
      row({ id: "e2", correct: false }),
    ]);
    // A perfect score on thin evidence is just as unconfident as a poor one.
    expect(allCorrect.confidence).toBe("insufficient");
    expect(allWrong.confidence).toBe("insufficient");
    expect(allCorrect.estimate).toBeGreaterThan(allWrong.estimate);
  });

  it("raises confidence with variety, not with score", () => {
    const oneSource = estimateSkill("6.RP.2", [
      row({ id: "e1" }),
      row({ id: "e2" }),
      row({ id: "e3" }),
    ]);
    expect(oneSource.confidence).toBe("low");

    const varied = estimateSkill("6.RP.2", [
      row({ id: "e1" }),
      row({ id: "e2", lessonCode: "M6-U1-L2", source: "spiral_review" }),
      row({ id: "e3", lessonCode: "M6-U1-L2" }),
    ]);
    expect(varied.confidence).toBe("moderate");

    const withTransfer = estimateSkill("6.RP.2", [
      row({ id: "e1" }),
      row({ id: "e2", lessonCode: "M6-U1-L2", source: "spiral_review" }),
      row({ id: "e3", lessonCode: "M6-U1-L2" }),
      row({ id: "e4", source: "readiness_check" }),
      row({ id: "e5", lessonCode: "M6-U1-L3" }),
      row({ id: "e6", source: "transfer_check", lessonCode: "M6-U1-L3" }),
    ]);
    expect(withTransfer.confidence).toBe("high");
  });

  it("discounts an answer that needed hints", () => {
    const independent = estimateSkill("6.RP.2", [
      row({ id: "e1" }),
      row({ id: "e2" }),
      row({ id: "e3" }),
    ]);
    const hinted = estimateSkill("6.RP.2", [
      row({ id: "e1", hintsUsed: 3 }),
      row({ id: "e2", hintsUsed: 3 }),
      row({ id: "e3", hintsUsed: 3 }),
    ]);
    expect(hinted.estimate).toBeLessThan(independent.estimate);
  });

  it("weights a transfer item more heavily than a routine item", () => {
    const transferMissed = estimateSkill("6.RP.2", [
      row({ id: "e1" }),
      row({ id: "e2" }),
      row({ id: "e3", source: "transfer_check", correct: false }),
    ]);
    const routineMissed = estimateSkill("6.RP.2", [
      row({ id: "e1" }),
      row({ id: "e2" }),
      row({ id: "e3", correct: false }),
    ]);
    expect(transferMissed.estimate).toBeLessThan(routineMissed.estimate);
  });

  it("reports not started with no scored evidence", () => {
    const m = estimateSkill("6.RP.2", []);
    expect(m.band).toBe("not_started");
    expect(m.estimate).toBe(0);
    expect(m.confidence).toBe("insufficient");
  });

  it("stores its rule version and inputs so it can be recomputed exactly", () => {
    const rows = [row({ id: "e1" }), row({ id: "e2" }), row({ id: "e3", correct: false })];
    const first = estimateSkill("6.RP.2", rows);
    const second = estimateSkill("6.RP.2", rows);
    expect(first.ruleVersion).toBe(RULE_VERSIONS.mastery);
    expect(second).toEqual(first);
    expect(first.inputs.attempts).toBe(3);
    expect(first.inputs.correct).toBe(2);
    expect(first.evidenceIds).toEqual(["e1", "e2", "e3"]);
  });
});
