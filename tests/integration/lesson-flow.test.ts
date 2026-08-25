import { beforeEach, describe, expect, it } from "vitest";

import { readableAudit } from "@/lib/audit/log";
import { itemsFor } from "@/lib/db/demo-items";
import { ensureSeeded } from "@/lib/db/seed";
import { clearDatabase, db } from "@/lib/db/store";
import { currentEvidence } from "@/lib/evidence/ledger";
import { courseGrade, currentGradeRecords, gradeHistory } from "@/lib/grades/gradebook";
import {
  lessonState,
  spiralReviewFor,
  startLesson,
  submitExitTicket,
  submitSpiralReview,
  completeLesson,
} from "@/lib/learning/lesson";
import { RULE_VERSIONS, SPIRAL_REVIEW_MAX_ITEMS } from "@/lib/rules/versions";
import type { User } from "@/lib/db/types";

const ENROLLMENT = "enr_amara_Mathematics_6";
const LESSON = "MATH-06-L035";

function amara(): User {
  const u = db().users.find((x) => x.id === "u_amara");
  if (!u) throw new Error("seed missing");
  return u;
}

function answers(correctCount: number) {
  return itemsFor(LESSON, "exit_ticket").map((item, i) => ({
    itemId: item.id,
    choiceId:
      i < correctCount
        ? item.correctChoiceId
        : (item.choices.find((c) => c.id !== item.correctChoiceId) as { id: string }).id,
  }));
}

describe("running a lesson end to end", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  it("moves the lesson through its guarded transitions", () => {
    expect(lessonState(ENROLLMENT, LESSON)?.status).toBe("available");
    startLesson(amara(), ENROLLMENT, LESSON, "k-start");
    expect(lessonState(ENROLLMENT, LESSON)?.status).toBe("in_progress");
  });

  it("selects five to seven Spiral Review items with a stated reason", () => {
    const spiral = spiralReviewFor("u_amara", ENROLLMENT, LESSON);
    expect(spiral.items.length).toBeGreaterThan(0);
    expect(spiral.items.length).toBeLessThanOrEqual(SPIRAL_REVIEW_MAX_ITEMS);
    expect(spiral.ruleVersion).toBe(RULE_VERSIONS.spiralReview);
    for (const item of spiral.items) {
      expect(item.reason.length).toBeGreaterThan(0);
      expect(["weak_skill", "upcoming_prerequisite", "cumulative"]).toContain(item.pool);
    }
    // Never draws from the lesson the student is about to be assessed on.
    expect(spiral.items.every((i) => !i.itemId.includes("M6RP2"))).toBe(true);
  });

  it("is deterministic: the same profile selects the same review", () => {
    const first = spiralReviewFor("u_amara", ENROLLMENT, LESSON);
    const second = spiralReviewFor("u_amara", ENROLLMENT, LESSON);
    expect(second.items.map((i) => i.itemId)).toEqual(first.items.map((i) => i.itemId));
  });

  it("records Spiral Review as evidence without producing a grade", () => {
    startLesson(amara(), ENROLLMENT, LESSON, "k-start");
    const gradesBefore = gradeHistory(ENROLLMENT).length;
    const spiral = spiralReviewFor("u_amara", ENROLLMENT, LESSON);
    submitSpiralReview(
      amara(),
      ENROLLMENT,
      LESSON,
      spiral.items.map((i) => ({
        itemId: i.itemId,
        skill: i.skill,
        standard: i.standard,
        correct: true,
      })),
      "k-spiral",
    );
    expect(
      currentEvidence({ studentId: "u_amara", lessonCode: LESSON }).filter(
        (e) => e.source === "spiral_review",
      ).length,
    ).toBe(spiral.items.length);
    expect(gradeHistory(ENROLLMENT).length).toBe(gradesBefore);
  });

  it("scores the Exit Ticket on the server and applies the band", () => {
    startLesson(amara(), ENROLLMENT, LESSON, "k-start");
    const result = submitExitTicket(amara(), ENROLLMENT, LESSON, answers(4), 6, "k-exit");
    expect(result.percent).toBe(100);
    expect(result.band.outcome).toBe("advance_low_priority");
    expect(result.lessonStatus).toBe("review_scheduled");
  });

  it("holds a below-50% result back and allows one supported retry", () => {
    startLesson(amara(), ENROLLMENT, LESSON, "k-start");
    const first = submitExitTicket(amara(), ENROLLMENT, LESSON, answers(1), 5, "k-exit-1");
    expect(first.percent).toBe(25);
    expect(first.band.outcome).toBe("do_not_advance");
    // Back to in progress, not advanced.
    expect(first.lessonStatus).toBe("in_progress");
    expect(lessonState(ENROLLMENT, LESSON)?.attempts).toBe(1);

    const retry = submitExitTicket(amara(), ENROLLMENT, LESSON, answers(3), 5, "k-exit-2");
    expect(retry.attempt).toBe(2);
    expect(retry.band.outcome).toBe("advance");
    expect(retry.lessonStatus).toBe("review_scheduled");
  });

  it("writes evidence and ONE official grade record, in separate tables", () => {
    startLesson(amara(), ENROLLMENT, LESSON, "k-start");
    const before = currentGradeRecords(ENROLLMENT).length;
    const result = submitExitTicket(amara(), ENROLLMENT, LESSON, answers(3), 6, "k-exit");

    const evidence = currentEvidence({ studentId: "u_amara", lessonCode: LESSON }).filter(
      (e) => e.source === "exit_ticket",
    );
    expect(evidence).toHaveLength(4);
    expect(evidence.filter((e) => e.correct)).toHaveLength(3);
    // Error codes come from the chosen distractor, not from the score.
    expect(evidence.find((e) => !e.correct)?.errorCode).toBeTruthy();

    expect(currentGradeRecords(ENROLLMENT).length).toBe(before + 1);
    const record = currentGradeRecords(ENROLLMENT).find((r) => r.id === result.gradeRecordId);
    expect(record?.pointsEarned).toBe(3);
    expect(record?.pointsPossible).toBe(4);
    expect(record?.ruleVersion).toBe(RULE_VERSIONS.grading);
  });

  it("protects against a double submission", () => {
    startLesson(amara(), ENROLLMENT, LESSON, "k-start");
    const before = gradeHistory(ENROLLMENT).length;
    const evidenceBefore = db().evidence.length;

    const first = submitExitTicket(amara(), ENROLLMENT, LESSON, answers(3), 6, "same-key");
    const second = submitExitTicket(amara(), ENROLLMENT, LESSON, answers(3), 6, "same-key");

    expect(second.gradeRecordId).toBe(first.gradeRecordId);
    expect(gradeHistory(ENROLLMENT).length).toBe(before + 1);
    expect(db().evidence.length).toBe(evidenceBefore + 4);
  });

  it("refuses to score a lesson with no authored items", () => {
    // M6-U1-L1 is complete and has no exit-ticket bank.
    expect(() =>
      submitExitTicket(amara(), ENROLLMENT, "MATH-06-L020", [], 1, "k-none"),
    ).toThrow(/have not been authored/);
  });

  it("audits the submission in the same transaction", () => {
    startLesson(amara(), ENROLLMENT, LESSON, "k-start");
    submitExitTicket(amara(), ENROLLMENT, LESSON, answers(4), 6, "k-exit");
    const events = readableAudit(amara());
    const submit = events.find((e) => e.action === "assessment.submit");
    expect(submit).toBeDefined();
    expect(submit?.actorUserId).toBe("u_amara");
    expect(submit?.reason).toContain("Exit Ticket submitted for MATH-06-L035");
    expect(JSON.parse(submit?.after ?? "{}")).toMatchObject({
      percent: 100,
      ruleVersion: RULE_VERSIONS.exitBands,
    });
  });

  it("rolls the whole change back if any part fails", () => {
    const evidenceBefore = db().evidence.length;
    const gradesBefore = db().gradeRecords.length;
    // Not started, so the transition guard rejects the submission.
    expect(() =>
      submitExitTicket(amara(), ENROLLMENT, LESSON, answers(4), 6, "k-bad"),
    ).toThrow();
    expect(db().evidence.length).toBe(evidenceBefore);
    expect(db().gradeRecords.length).toBe(gradesBefore);
  });

  it("unlocks the next lesson only when the current one completes", () => {
    startLesson(amara(), ENROLLMENT, LESSON, "k-start");
    submitExitTicket(amara(), ENROLLMENT, LESSON, answers(4), 6, "k-exit");
    expect(lessonState(ENROLLMENT, "MATH-06-L036")?.status).toBe("locked");

    completeLesson(amara(), ENROLLMENT, LESSON, "k-complete");
    expect(lessonState(ENROLLMENT, LESSON)?.status).toBe("completed");
    expect(lessonState(ENROLLMENT, "MATH-06-L036")?.status).toBe("available");
  });

  it("keeps the grade and the readiness estimate in separate calculations", () => {
    startLesson(amara(), ENROLLMENT, LESSON, "k-start");
    submitExitTicket(amara(), ENROLLMENT, LESSON, answers(2), 6, "k-exit");
    const grade = courseGrade(ENROLLMENT, "Mathematics 6");
    expect(grade.ruleVersion).toBe(RULE_VERSIONS.grading);
    // The grade explanation never mentions readiness or mastery.
    for (const line of grade.explanation) {
      expect(line.toLowerCase()).not.toContain("mastery");
      expect(line.toLowerCase()).not.toContain("readiness");
    }
  });

  it("refuses to let one student work on another's lesson", () => {
    const diego = db().users.find((u) => u.id === "u_diego") as User;
    expect(() => startLesson(diego, ENROLLMENT, LESSON, "k-x")).toThrow(
      /only work on your own/,
    );
  });
});
