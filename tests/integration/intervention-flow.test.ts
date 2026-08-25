import { beforeEach, describe, expect, it } from "vitest";

import { readableAudit } from "@/lib/audit/log";
import { readinessItemsFor, transferItemFor } from "@/lib/db/demo-items";
import { ensureSeeded } from "@/lib/db/seed";
import { clearDatabase, db } from "@/lib/db/store";
import type { User } from "@/lib/db/types";
import { recordEvidence } from "@/lib/evidence/ledger";
import {
  assignFromRecommendation,
  dismissRecommendation,
  escalateRecommendation,
  previewAssignment,
  startIntervention,
  submitReadinessCheck,
  submitTransferCheck,
} from "@/lib/intervention/lifecycle";
import { actionQueue, recommendationsForEnrollment } from "@/lib/intervention/queue";
import { ANTI_LOOP_MAX_CYCLES, DEFAULT_RETURN_RULE } from "@/lib/rules/versions";

function user(id: string): User {
  const u = db().users.find((x) => x.id === id);
  if (!u) throw new Error(`missing ${id}`);
  return u;
}

/** The recommendation for Amara's 6.RP.1, which has a runnable support bank. */
function amaraRef() {
  const enrollment = db().enrollments.find((e) => e.id === "enr_amara_Mathematics_6");
  if (!enrollment) throw new Error("seed missing");
  const rec = recommendationsForEnrollment(enrollment).find((r) => r.skill === "6.RP.1");
  if (!rec) throw new Error("expected a 6.RP.1 recommendation");
  return { enrollmentId: rec.enrollmentId, skill: rec.skill, trigger: rec.trigger };
}

describe("the support-to-return loop", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  it("previews the student view and the workload before anything is created", () => {
    const before = db().interventions.length;
    const preview = previewAssignment(user("u_alvarez"), amaraRef());
    expect(preview.studentName).toBe("Amara Oyelaran");
    expect(preview.recommendation.triggerEvidenceIds.length).toBeGreaterThan(0);
    expect(preview.totalMinutesAfter).toBeGreaterThan(preview.openMinutes);
    // Preview creates nothing.
    expect(db().interventions.length).toBe(before);
  });

  it("assigns with a stored return destination and return rule", () => {
    const plan = assignFromRecommendation(
      user("u_alvarez"),
      amaraRef(),
      "Two attempts missed on the same ratio item.",
      "Before the next intervention-capacity day",
      "k-assign",
    );
    expect(plan.status).toBe("assigned");
    expect(plan.decidedByUserId).toBe("u_alvarez");
    expect(plan.returnLessonCode).toBe("MATH-06-L035");
    expect(plan.returnRuleVersion).toBe(DEFAULT_RETURN_RULE.version);
    expect(plan.readinessMinPercent).toBe(80);
    expect(plan.transferItemsRequired).toBe(1);
    expect(plan.triggerEvidenceIds.length).toBeGreaterThan(0);
  });

  it("audits the assignment with actor, role, before, after, and reason", () => {
    const plan = assignFromRecommendation(
      user("u_alvarez"),
      amaraRef(),
      "Two attempts missed on the same ratio item.",
      "This week",
      "k-assign",
    );
    const event = readableAudit(user("u_okonjo")).find(
      (e) => e.targetId === plan.id && e.action === "intervention.assign",
    );
    expect(event).toBeDefined();
    expect(event?.actorRole).toBe("teacher");
    expect(event?.reason).toBe("Two attempts missed on the same ratio item.");
    expect(JSON.parse(event?.after ?? "{}")).toMatchObject({
      status: "assigned",
      returnTo: "MATH-06-L035 stage 1",
    });
  });

  it("is idempotent — a retry returns the same plan", () => {
    // The ref is captured once, as a browser retry would: the same request,
    // replayed. Resolving it again would correctly find the skill already
    // suppressed, which is a different guarantee (tested below).
    const ref = amaraRef();
    const first = assignFromRecommendation(user("u_alvarez"), ref, "Reason.", "This week", "same");
    const before = db().interventions.length;
    const auditBefore = db().auditEvents.length;
    const second = assignFromRecommendation(user("u_alvarez"), ref, "Reason.", "This week", "same");
    expect(second.id).toBe(first.id);
    expect(db().interventions.length).toBe(before);
    expect(db().auditEvents.length).toBe(auditBefore);
  });

  it("suppresses the skill from the queue once a plan is open", () => {
    const ref = amaraRef();
    assignFromRecommendation(user("u_alvarez"), ref, "Reason.", "This week", "k1");
    const queue = actionQueue(user("u_alvarez"));
    expect(
      queue.some((q) => q.recommendation.enrollmentId === ref.enrollmentId && q.recommendation.skill === ref.skill),
    ).toBe(false);
  });

  it("requires a reason to assign, dismiss, or escalate", () => {
    expect(() =>
      assignFromRecommendation(user("u_alvarez"), amaraRef(), "   ", "This week", "k1"),
    ).toThrow(/requires a recorded reason/);
    expect(() => dismissRecommendation(user("u_alvarez"), amaraRef(), "", "k2")).toThrow(
      /requires a recorded reason/,
    );
    expect(() => escalateRecommendation(user("u_alvarez"), amaraRef(), "", "k3")).toThrow(
      /requires a recorded reason/,
    );
  });

  it("keeps a dismissed proposal off the queue until new evidence arrives", () => {
    const ref = amaraRef();
    dismissRecommendation(
      user("u_alvarez"),
      ref,
      "Covered in a small group on Tuesday.",
      "k-dismiss",
    );
    expect(
      actionQueue(user("u_alvarez")).some((q) => q.recommendation.skill === ref.skill),
    ).toBe(false);

    // New evidence on the same skill justifies reconsidering it.
    const enrollment = db().enrollments.find((e) => e.id === ref.enrollmentId);
    if (!enrollment) throw new Error("missing");
    recordEvidence({
      studentId: "u_amara",
      enrollmentId: enrollment.id,
      courseVersionId: enrollment.courseVersionId,
      lessonCode: "MATH-06-L035",
      stage: "Exit Ticket",
      standard: "6.RP.1",
      skill: "6.RP.1",
      itemId: "new-item",
      correct: false,
      response: "",
      errorCode: "fraction-or-ratio",
      attempt: 1,
      hintsUsed: 0,
      meaningfulMinutes: 2,
      supportUsed: null,
      source: "exit_ticket",
      supersedesEvidenceId: null,
      recordedByUserId: "u_amara",
    });
    expect(
      actionQueue(user("u_alvarez")).some((q) => q.recommendation.skill === ref.skill),
    ).toBe(true);
  });

  it("runs the whole loop and returns the student to the exact pathway location", () => {
    const plan = assignFromRecommendation(
      user("u_alvarez"),
      amaraRef(),
      "Two attempts missed on the same ratio item.",
      "This week",
      "k-assign",
    );
    const amara = user("u_amara");
    startIntervention(amara, plan.id, "k-start");
    expect(db().interventions.find((i) => i.id === plan.id)?.status).toBe("in_progress");

    const readiness = readinessItemsFor("6.RP.1");
    expect(readiness.length).toBeGreaterThanOrEqual(2);
    const check = submitReadinessCheck(
      amara,
      plan.id,
      readiness.map((i) => ({
        itemId: i.id,
        correct: true,
        response: "Correct",
        errorCode: null,
      })),
      "k-readiness",
    );
    expect(check.percent).toBe(100);
    expect(check.meetsBar).toBe(true);

    const transfer = transferItemFor("6.RP.1");
    if (!transfer) throw new Error("expected a transfer item");
    const outcome = submitTransferCheck(
      amara,
      plan.id,
      { itemId: transfer.id, correct: true, response: "Correct", errorCode: null },
      "k-transfer",
    );
    expect(outcome.passed).toBe(true);
    expect(outcome.status).toBe("returned_to_pathway");
    expect(outcome.returnTo).toEqual({ lessonCode: "MATH-06-L035", stage: 1 });
  });

  it("does not propose the same support again after a successful return", () => {
    const ref = amaraRef();
    const plan = assignFromRecommendation(user("u_alvarez"), ref, "Reason.", "This week", "k-a");
    const amara = user("u_amara");
    const transfer = transferItemFor("6.RP.1");
    if (!transfer) throw new Error("expected a transfer item");

    startIntervention(amara, plan.id, "k-s");
    submitReadinessCheck(
      amara,
      plan.id,
      readinessItemsFor("6.RP.1").map((i) => ({
        itemId: i.id,
        correct: true,
        response: "Correct",
        errorCode: null,
      })),
      "k-r",
    );
    submitTransferCheck(
      amara,
      plan.id,
      { itemId: transfer.id, correct: true, response: "Correct", errorCode: null },
      "k-t",
    );

    // The historical misses that produced the plan are still in the ledger —
    // they are never deleted — but they must not re-trigger the same support
    // for a student who has just demonstrated the skill.
    expect(
      actionQueue(user("u_alvarez")).some((q) => q.recommendation.skill === ref.skill),
    ).toBe(false);

    // A NEW miss on the same skill does justify reconsidering it.
    const enrollment = db().enrollments.find((e) => e.id === ref.enrollmentId);
    if (!enrollment) throw new Error("missing");
    recordEvidence({
      studentId: "u_amara",
      enrollmentId: enrollment.id,
      courseVersionId: enrollment.courseVersionId,
      lessonCode: "MATH-06-L035",
      stage: "Exit Ticket",
      standard: "6.RP.1",
      skill: "6.RP.1",
      itemId: "later-item",
      correct: false,
      response: "",
      errorCode: "fraction-or-ratio",
      attempt: 1,
      hintsUsed: 0,
      meaningfulMinutes: 2,
      supportUsed: null,
      source: "exit_ticket",
      supersedesEvidenceId: null,
      recordedByUserId: "u_amara",
    });
    expect(
      actionQueue(user("u_alvarez")).some((q) => q.recommendation.skill === ref.skill),
    ).toBe(true);
  });

  it("does not return the student when the transfer item fails", () => {
    const plan = assignFromRecommendation(user("u_alvarez"), amaraRef(), "Reason.", "This week", "k-a");
    const amara = user("u_amara");
    startIntervention(amara, plan.id, "k-s");
    submitReadinessCheck(
      amara,
      plan.id,
      readinessItemsFor("6.RP.1").map((i) => ({
        itemId: i.id,
        correct: true,
        response: "Correct",
        errorCode: null,
      })),
      "k-r",
    );
    const transfer = transferItemFor("6.RP.1");
    if (!transfer) throw new Error("expected a transfer item");
    const outcome = submitTransferCheck(
      amara,
      plan.id,
      { itemId: transfer.id, correct: false, response: "Wrong", errorCode: "fraction-or-ratio" },
      "k-t",
    );
    expect(outcome.passed).toBe(false);
    expect(outcome.status).toBe("in_progress");
    expect(outcome.returnTo).toBeNull();
  });

  it("escalates rather than allowing a third cycle", () => {
    const plan = assignFromRecommendation(user("u_alvarez"), amaraRef(), "Reason.", "This week", "k-a");
    const amara = user("u_amara");
    const transfer = transferItemFor("6.RP.1");
    if (!transfer) throw new Error("expected a transfer item");

    startIntervention(amara, plan.id, "k-s");
    for (let cycle = 0; cycle < ANTI_LOOP_MAX_CYCLES; cycle++) {
      submitReadinessCheck(
        amara,
        plan.id,
        readinessItemsFor("6.RP.1").map((i) => ({
          itemId: i.id,
          correct: false,
          response: "Wrong",
          errorCode: "fraction-or-ratio",
        })),
        `k-r-${cycle}`,
      );
      submitTransferCheck(
        amara,
        plan.id,
        { itemId: transfer.id, correct: false, response: "Wrong", errorCode: "fraction-or-ratio" },
        `k-t-${cycle}`,
      );
    }
    const after = db().interventions.find((i) => i.id === plan.id);
    expect(after?.cycles).toBe(ANTI_LOOP_MAX_CYCLES);
    expect(after?.status).toBe("escalated");
  });

  it("requires the readiness check before the transfer item", () => {
    const plan = assignFromRecommendation(user("u_alvarez"), amaraRef(), "Reason.", "This week", "k-a");
    const amara = user("u_amara");
    startIntervention(amara, plan.id, "k-s");
    const transfer = transferItemFor("6.RP.1");
    if (!transfer) throw new Error("expected a transfer item");
    expect(() =>
      submitTransferCheck(
        amara,
        plan.id,
        { itemId: transfer.id, correct: true, response: "", errorCode: null },
        "k-t",
      ),
    ).toThrow(/readiness check has to be recorded/);
  });

  it("records a site-admin assignment under its own action", () => {
    const plan = assignFromRecommendation(
      user("u_salinas"),
      amaraRef(),
      "Unresolved for six school days; teacher on leave.",
      "This week",
      "k-site",
    );
    const event = readableAudit(user("u_okonjo")).find((e) => e.targetId === plan.id);
    expect(event?.action).toBe("intervention.assign_by_site_admin");
    expect(event?.actorRole).toBe("site_admin");
  });

  it("refuses a recommendation the evidence no longer supports", () => {
    expect(() =>
      assignFromRecommendation(
        user("u_alvarez"),
        { enrollmentId: "enr_amara_Mathematics_6", skill: "not-a-real-skill", trigger: "x" },
        "Reason.",
        "This week",
        "k",
      ),
    ).toThrow(/no longer supported by the current evidence/);
  });

  it("refuses a student outside the actor's scope", () => {
    expect(() =>
      assignFromRecommendation(user("u_farouk"), amaraRef(), "Reason.", "This week", "k"),
    ).toThrow(/cannot assign support/);
  });

  it("rolls back completely when the audit reason is missing", () => {
    const before = db().interventions.length;
    const auditBefore = db().auditEvents.length;
    expect(() =>
      assignFromRecommendation(user("u_alvarez"), amaraRef(), "", "This week", "k"),
    ).toThrow();
    expect(db().interventions.length).toBe(before);
    expect(db().auditEvents.length).toBe(auditBefore);
  });
});
