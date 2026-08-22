import { beforeEach, describe, expect, it } from "vitest";

import { readableAudit } from "@/lib/audit/log";
import { ensureSeeded } from "@/lib/db/seed";
import { clearDatabase, db } from "@/lib/db/store";
import type { User } from "@/lib/db/types";
import {
  allEvidence,
  currentEvidence,
  evidenceById,
  supersessionChain,
} from "@/lib/evidence/ledger";
import { recordObservation } from "@/lib/evidence/observation";
import { enterGrade } from "@/lib/grades/entry";
import { courseGrade, currentGradeRecords, gradeHistory } from "@/lib/grades/gradebook";
import { estimateFor } from "@/lib/mastery/profile";
import { RULE_VERSIONS } from "@/lib/rules/versions";

function user(id: string): User {
  const u = db().users.find((x) => x.id === id);
  if (!u) throw new Error(`missing ${id}`);
  return u;
}

const ENROLLMENT = "enr_amara_Mathematics_6";

describe("evidence is append-only (CLAUDE.md §5)", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  it("exposes no update or delete", () => {
    const store = db();
    // The typed store marks these readonly; the runtime contract is that the
    // only mutation used anywhere is push, via the append helpers.
    expect(Object.isFrozen(store.evidence[0])).toBe(true);
    expect(Object.isFrozen(store.auditEvents[0])).toBe(true);
    expect(Object.isFrozen(store.gradeRecords[0])).toBe(true);
  });

  it("records a correction as a new row and keeps the original readable", () => {
    const original = currentEvidence({ studentId: "u_amara" }).find((e) => !e.correct);
    if (!original) throw new Error("expected a missed response in the seed");
    const totalBefore = allEvidence("u_amara").length;

    const correction = recordObservation(
      user("u_alvarez"),
      {
        studentId: "u_amara",
        enrollmentId: original.enrollmentId,
        lessonCode: original.lessonCode,
        skill: original.skill,
        standard: original.standard,
        note: "Explained it correctly at the board; the written response was mis-keyed.",
        correct: true,
        supersedesEvidenceId: original.id,
      },
      "k-correct",
    );

    // Appended, not replaced.
    expect(allEvidence("u_amara").length).toBe(totalBefore + 1);
    expect(evidenceById(original.id)).toBeDefined();
    expect(evidenceById(original.id)?.correct).toBe(false);

    // Reads resolve supersession explicitly.
    const current = currentEvidence({ studentId: "u_amara" });
    expect(current.find((e) => e.id === original.id)).toBeUndefined();
    expect(current.find((e) => e.id === correction.id)).toBeDefined();

    const chain = supersessionChain(correction.id);
    expect(chain.map((c) => c.id)).toEqual([original.id, correction.id]);
  });

  it("feeds the correction into mastery without rewriting history", () => {
    const original = currentEvidence({ studentId: "u_amara" }).find((e) => !e.correct);
    if (!original) throw new Error("expected a missed response");
    const before = estimateFor("u_amara", original.skill).estimate;

    recordObservation(
      user("u_alvarez"),
      {
        studentId: "u_amara",
        enrollmentId: original.enrollmentId,
        lessonCode: original.lessonCode,
        skill: original.skill,
        standard: original.standard,
        note: "Demonstrated in conference.",
        correct: true,
        supersedesEvidenceId: original.id,
      },
      "k-correct",
    );

    expect(estimateFor("u_amara", original.skill).estimate).toBeGreaterThan(before);
    expect(evidenceById(original.id)?.correct).toBe(false);
  });

  it("audits an observation and requires a note", () => {
    const enrollment = db().enrollments.find((e) => e.id === ENROLLMENT);
    if (!enrollment) throw new Error("missing");
    expect(() =>
      recordObservation(
        user("u_alvarez"),
        {
          studentId: "u_amara",
          enrollmentId: ENROLLMENT,
          lessonCode: "M6-U1-L2",
          skill: "6.RP.2",
          standard: "6.RP.2",
          note: "",
          correct: null,
          supersedesEvidenceId: null,
        },
        "k-empty",
      ),
    ).toThrow(/needs a note/);

    const row = recordObservation(
      user("u_alvarez"),
      {
        studentId: "u_amara",
        enrollmentId: ENROLLMENT,
        lessonCode: "M6-U1-L2",
        skill: "6.RP.2",
        standard: "6.RP.2",
        note: "Used the unit rate correctly in discussion.",
        correct: true,
        supersedesEvidenceId: null,
      },
      "k-obs",
    );
    const event = readableAudit(user("u_okonjo")).find((e) => e.targetId === row.id);
    expect(event?.action).toBe("evidence.observe");
    expect(event?.reason).toContain("unit rate");
  });

  it("refuses an observation on a student outside scope", () => {
    expect(() =>
      recordObservation(
        user("u_farouk"),
        {
          studentId: "u_amara",
          enrollmentId: ENROLLMENT,
          lessonCode: "M6-U1-L2",
          skill: "6.RP.2",
          standard: "6.RP.2",
          note: "Note.",
          correct: null,
          supersedesEvidenceId: null,
        },
        "k",
      ),
    ).toThrow(/outside your scope/);
  });
});

describe("grade records are append-only (CLAUDE.md §4)", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  it("writes a change as a new record and keeps the original", () => {
    const prior = currentGradeRecords(ENROLLMENT)[0];
    const historyBefore = gradeHistory(ENROLLMENT).length;

    const changed = enterGrade(
      user("u_alvarez"),
      {
        enrollmentId: ENROLLMENT,
        lessonCode: prior.lessonCode,
        assessmentId: prior.assessmentId,
        categoryId: prior.categoryId,
        pointsEarned: 4,
        pointsPossible: 4,
        reason: "Regraded after reviewing the written reasoning.",
      },
      "k-grade",
    );

    expect(gradeHistory(ENROLLMENT).length).toBe(historyBefore + 1);
    expect(changed.supersedesGradeId).toBe(prior.id);
    // The original is still there and still readable.
    expect(gradeHistory(ENROLLMENT).find((r) => r.id === prior.id)).toBeDefined();
    // But it no longer contributes.
    expect(currentGradeRecords(ENROLLMENT).find((r) => r.id === prior.id)).toBeUndefined();
  });

  it("audits a grade change with before and after", () => {
    const prior = currentGradeRecords(ENROLLMENT)[0];
    const changed = enterGrade(
      user("u_alvarez"),
      {
        enrollmentId: ENROLLMENT,
        lessonCode: prior.lessonCode,
        assessmentId: prior.assessmentId,
        categoryId: prior.categoryId,
        pointsEarned: 4,
        pointsPossible: 4,
        reason: "Regraded after reviewing the written reasoning.",
      },
      "k-grade",
    );
    const event = readableAudit(user("u_okonjo")).find((e) => e.targetId === changed.id);
    expect(event?.action).toBe("grade.change");
    expect(JSON.parse(event?.before ?? "{}")).toMatchObject({
      pointsEarned: prior.pointsEarned,
    });
    expect(JSON.parse(event?.after ?? "{}")).toMatchObject({ pointsEarned: 4 });
  });

  it("requires a reason and rejects impossible points", () => {
    const prior = currentGradeRecords(ENROLLMENT)[0];
    const base = {
      enrollmentId: ENROLLMENT,
      lessonCode: prior.lessonCode,
      assessmentId: prior.assessmentId,
      categoryId: prior.categoryId,
      pointsEarned: 4,
      pointsPossible: 4,
    };
    expect(() => enterGrade(user("u_alvarez"), { ...base, reason: "" }, "k1")).toThrow(
      /requires a recorded reason/,
    );
    expect(() =>
      enterGrade(user("u_alvarez"), { ...base, pointsEarned: 9, reason: "Reason." }, "k2"),
    ).toThrow(/between 0 and 4/);
  });

  it("lets only the assigned teacher enter a grade", () => {
    const prior = currentGradeRecords(ENROLLMENT)[0];
    const input = {
      enrollmentId: ENROLLMENT,
      lessonCode: prior.lessonCode,
      assessmentId: prior.assessmentId,
      categoryId: prior.categoryId,
      pointsEarned: 4,
      pointsPossible: 4,
      reason: "Reason.",
    };
    expect(() => enterGrade(user("u_salinas"), input, "k1")).toThrow(/only the assigned teacher/);
    expect(() => enterGrade(user("u_okonjo"), input, "k2")).toThrow(/only the assigned teacher/);
    expect(() => enterGrade(user("u_amara"), input, "k3")).toThrow(/only the assigned teacher/);
  });

  it("stores the grading rule version with every record", () => {
    for (const record of gradeHistory(ENROLLMENT)) {
      expect(record.ruleVersion).toBe(RULE_VERSIONS.grading);
    }
    expect(courseGrade(ENROLLMENT, "Mathematics 6").ruleVersion).toBe(RULE_VERSIONS.grading);
  });
});
