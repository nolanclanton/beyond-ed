/**
 * The intervention lifecycle (CLAUDE.md §9, blueprint §7).
 *
 * Recommended -> Teacher reviewed -> Assigned -> In progress -> Readiness check
 * -> Passed -> Returned to pathway -> Escalated -> Closed.
 *
 * Nothing here runs without a human decision. `assignFromRecommendation` takes
 * an actor and a reason; there is no code path that creates an assigned plan on
 * its own. The recommendation is RECOMPUTED server-side from the same
 * deterministic engine before it is acted on, so the browser cannot assign a
 * support the evidence does not justify.
 *
 * The return destination is stored on the plan at assignment time, so the
 * student returns to the exact pathway location rather than the top of a unit.
 */
import { recordAudit, requestIdFor } from "@/lib/audit/log";
import {
  assertCanAssignIntervention,
  assertCanReadStudent,
  NotAuthorizedError,
} from "@/lib/auth/scope";
import { nextTimestamp } from "@/lib/clock";
import { db, nextId, transact, withIdempotency } from "@/lib/db/store";
import type { Intervention, User } from "@/lib/db/types";
import { currentEvidence, recordEvidence } from "@/lib/evidence/ledger";
import {
  ANTI_LOOP_MAX_CYCLES,
  DEFAULT_RETURN_RULE,
  RULE_VERSIONS,
} from "@/lib/rules/versions";
import type { Recommendation } from "@/lib/recommend/engine";

import { recommendationsForEnrollment } from "./queue";
import { transitionIntervention } from "./transitions";

export class InterventionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterventionError";
  }
}

export type RecommendationRef = {
  enrollmentId: string;
  skill: string;
  trigger: string;
};

/** Recomputes the proposal server-side. The client never supplies its content. */
export function resolveRecommendation(ref: RecommendationRef): Recommendation {
  const enrollment = db().enrollments.find((e) => e.id === ref.enrollmentId);
  if (!enrollment) throw new InterventionError("That enrollment does not exist.");
  const match = recommendationsForEnrollment(enrollment).find(
    (r) => r.skill === ref.skill && r.trigger === ref.trigger,
  );
  if (!match) {
    throw new InterventionError(
      "That recommendation is no longer supported by the current evidence. Reload the queue.",
    );
  }
  return match;
}

/** Preview before confirm: what the student sees and what it costs them. */
export function previewAssignment(
  actor: User,
  ref: RecommendationRef,
): {
  recommendation: Recommendation;
  studentName: string;
  openPlans: number;
  openMinutes: number;
  totalMinutesAfter: number;
} {
  const recommendation = resolveRecommendation(ref);
  assertCanReadStudent(actor, recommendation.studentId);
  const d = db();
  const student = d.users.find((u) => u.id === recommendation.studentId);
  const open = d.interventions.filter(
    (i) =>
      i.studentId === recommendation.studentId &&
      i.status !== "closed" &&
      i.status !== "returned_to_pathway",
  );
  const openMinutes = open.reduce((n, i) => n + i.estimatedMinutes, 0);
  return {
    recommendation,
    studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
    openPlans: open.length,
    openMinutes,
    totalMinutesAfter: openMinutes + recommendation.estimatedMinutes,
  };
}

function newPlan(
  recommendation: Recommendation,
  evidenceCount: number,
  dueExpectation: string,
): Intervention {
  const now = nextTimestamp();
  return {
    id: nextId("int"),
    studentId: recommendation.studentId,
    enrollmentId: recommendation.enrollmentId,
    status: "recommended",
    interventionLessonId: recommendation.interventionLessonId,
    targetSkill: recommendation.skill,
    targetStandard: recommendation.standard,
    severity: recommendation.severity,
    triggerEvidenceIds: recommendation.triggerEvidenceIds,
    triggerSummary: recommendation.triggerSummary,
    estimatedMinutes: recommendation.estimatedMinutes,
    returnLessonCode: recommendation.returnLessonCode,
    returnStage: recommendation.returnStage,
    returnRuleVersion: recommendation.returnRuleVersion,
    readinessMinPercent: DEFAULT_RETURN_RULE.readinessMinPercent,
    transferItemsRequired: DEFAULT_RETURN_RULE.transferItemsRequired,
    readinessPercent: null,
    transferPassed: null,
    cycles: 0,
    recommendedByRuleVersion: recommendation.ruleVersion,
    evidenceCountAtDecision: evidenceCount,
    decidedByUserId: null,
    decisionReason: null,
    dueExpectation,
    createdAt: now,
    updatedAt: now,
  };
}

function evidenceCountForSkill(studentId: string, skill: string): number {
  return currentEvidence({ studentId, skill }).length;
}

/**
 * Accept a recommendation and create the plan.
 *
 * A teacher may do this for their own students. A site admin may do it when a
 * teacher queue item is unresolved — the reason is required either way and the
 * actor's role is recorded on the audit event (CLAUDE.md §3, §6).
 */
export function assignFromRecommendation(
  actor: User,
  ref: RecommendationRef,
  reason: string,
  dueExpectation: string,
  idempotencyKey: string,
): Intervention {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const recommendation = resolveRecommendation(ref);
        assertCanAssignIntervention(actor, recommendation.studentId);
        if (reason.trim().length === 0) {
          throw new InterventionError("An assignment requires a recorded reason.");
        }

        const plan = newPlan(
          recommendation,
          evidenceCountForSkill(recommendation.studentId, recommendation.skill),
          dueExpectation,
        );
        plan.status = transitionIntervention(plan.status, "teacher_reviewed");
        plan.status = transitionIntervention(plan.status, "assigned");
        plan.decidedByUserId = actor.id;
        plan.decisionReason = reason.trim();
        plan.updatedAt = nextTimestamp();
        db().interventions.push(plan);

        recordAudit({
          actor,
          action:
            actor.role === "site_admin"
              ? "intervention.assign_by_site_admin"
              : "intervention.assign",
          targetEntity: "intervention",
          targetId: plan.id,
          before: { status: "recommended" },
          after: {
            status: plan.status,
            skill: plan.targetSkill,
            support: plan.interventionLessonId,
            returnTo: `${plan.returnLessonCode} stage ${plan.returnStage}`,
            returnRule: plan.returnRuleVersion,
            triggerEvidence: plan.triggerEvidenceIds,
          },
          reason: reason.trim(),
          idempotencyKey,
          requestId: requestIdFor("intervention.assign", idempotencyKey),
        });

        return plan;
      },
      (existingId) => {
        const plan = db().interventions.find((i) => i.id === existingId);
        if (!plan) throw new InterventionError("Duplicate write with no record.");
        return plan;
      },
    ),
  );
}

/** Dismiss a proposal. A reason is required (CLAUDE.md §6). */
export function dismissRecommendation(
  actor: User,
  ref: RecommendationRef,
  reason: string,
  idempotencyKey: string,
): Intervention {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const recommendation = resolveRecommendation(ref);
        assertCanAssignIntervention(actor, recommendation.studentId);
        if (reason.trim().length === 0) {
          throw new InterventionError("A dismissal requires a recorded reason.");
        }

        const plan = newPlan(
          recommendation,
          evidenceCountForSkill(recommendation.studentId, recommendation.skill),
          "n/a",
        );
        plan.status = transitionIntervention(plan.status, "closed");
        plan.decidedByUserId = actor.id;
        plan.decisionReason = reason.trim();
        plan.updatedAt = nextTimestamp();
        db().interventions.push(plan);

        recordAudit({
          actor,
          action: "intervention.dismiss",
          targetEntity: "intervention",
          targetId: plan.id,
          before: { status: "recommended", skill: plan.targetSkill },
          after: { status: plan.status },
          reason: reason.trim(),
          idempotencyKey,
          requestId: requestIdFor("intervention.dismiss", idempotencyKey),
        });

        return plan;
      },
      (existingId) => {
        const plan = db().interventions.find((i) => i.id === existingId);
        if (!plan) throw new InterventionError("Duplicate write with no record.");
        return plan;
      },
    ),
  );
}

/** Escalate straight from review — a conference, diagnostic, or specialist. */
export function escalateRecommendation(
  actor: User,
  ref: RecommendationRef,
  reason: string,
  idempotencyKey: string,
): Intervention {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const recommendation = resolveRecommendation(ref);
        assertCanAssignIntervention(actor, recommendation.studentId);
        if (reason.trim().length === 0) {
          throw new InterventionError("An escalation requires a recorded reason.");
        }
        const plan = newPlan(
          recommendation,
          evidenceCountForSkill(recommendation.studentId, recommendation.skill),
          "Teacher-scheduled",
        );
        plan.status = transitionIntervention(plan.status, "teacher_reviewed");
        plan.status = transitionIntervention(plan.status, "escalated");
        plan.decidedByUserId = actor.id;
        plan.decisionReason = reason.trim();
        plan.severity = "teacher_review";
        plan.updatedAt = nextTimestamp();
        db().interventions.push(plan);

        recordAudit({
          actor,
          action: "intervention.escalate",
          targetEntity: "intervention",
          targetId: plan.id,
          before: { status: "teacher_reviewed" },
          after: { status: plan.status, skill: plan.targetSkill },
          reason: reason.trim(),
          idempotencyKey,
          requestId: requestIdFor("intervention.escalate", idempotencyKey),
        });

        return plan;
      },
      (existingId) => {
        const plan = db().interventions.find((i) => i.id === existingId);
        if (!plan) throw new InterventionError("Duplicate write with no record.");
        return plan;
      },
    ),
  );
}

function loadPlan(id: string): Intervention {
  const plan = db().interventions.find((i) => i.id === id);
  if (!plan) throw new InterventionError("That support plan does not exist.");
  return plan;
}

/** Assigned -> In progress. The student starts the support. */
export function startIntervention(
  actor: User,
  interventionId: string,
  idempotencyKey: string,
): Intervention {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const plan = loadPlan(interventionId);
        if (plan.studentId !== actor.id) {
          throw new NotAuthorizedError("this support belongs to another student");
        }
        if (plan.status === "in_progress") return plan;
        const before = plan.status;
        plan.status = transitionIntervention(plan.status, "in_progress");
        plan.updatedAt = nextTimestamp();

        recordAudit({
          actor,
          action: "intervention.start",
          targetEntity: "intervention",
          targetId: plan.id,
          before: { status: before },
          after: { status: plan.status },
          reason: `Started support ${plan.interventionLessonId}.`,
          idempotencyKey,
          requestId: requestIdFor("intervention.start", idempotencyKey),
        });
        return plan;
      },
      (existingId) => loadPlan(existingId),
    ),
  );
}

/**
 * In progress -> Readiness check. Records the readiness result as evidence and
 * stores the percentage against the plan's stored rule version.
 */
export function submitReadinessCheck(
  actor: User,
  interventionId: string,
  results: { itemId: string; correct: boolean; response: string; errorCode: string | null }[],
  idempotencyKey: string,
): { id: string; percent: number; meetsBar: boolean } {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const plan = loadPlan(interventionId);
        if (plan.studentId !== actor.id) {
          throw new NotAuthorizedError("this support belongs to another student");
        }
        const enrollment = db().enrollments.find((e) => e.id === plan.enrollmentId);
        if (!enrollment) throw new InterventionError("Enrollment missing.");

        for (const r of results) {
          recordEvidence({
            studentId: actor.id,
            enrollmentId: plan.enrollmentId,
            courseVersionId: enrollment.courseVersionId,
            lessonCode: plan.returnLessonCode,
            stage: "Readiness check",
            standard: plan.targetStandard,
            skill: plan.targetSkill,
            itemId: r.itemId,
            correct: r.correct,
            response: r.response,
            errorCode: r.correct ? null : r.errorCode,
            attempt: plan.cycles + 1,
            hintsUsed: 0,
            meaningfulMinutes: 2,
            supportUsed: plan.interventionLessonId,
            source: "readiness_check",
            supersedesEvidenceId: null,
            recordedByUserId: actor.id,
          });
        }

        const correct = results.filter((r) => r.correct).length;
        const percent =
          results.length === 0 ? 0 : Math.round((correct / results.length) * 1000) / 10;

        const before = plan.status;
        if (plan.status === "in_progress") {
          plan.status = transitionIntervention(plan.status, "readiness_check");
        }
        plan.readinessPercent = percent;
        plan.updatedAt = nextTimestamp();

        recordAudit({
          actor,
          action: "intervention.readiness_check",
          targetEntity: "intervention",
          targetId: plan.id,
          before: { status: before, readinessPercent: null },
          after: {
            status: plan.status,
            readinessPercent: percent,
            bar: plan.readinessMinPercent,
            ruleVersion: plan.returnRuleVersion,
          },
          reason: `Readiness check: ${correct} of ${results.length}.`,
          idempotencyKey,
          requestId: requestIdFor("intervention.readiness_check", idempotencyKey),
        });

        return { id: plan.id, percent, meetsBar: percent >= plan.readinessMinPercent };
      },
      (existingId) => {
        const plan = loadPlan(existingId);
        return {
          id: plan.id,
          percent: plan.readinessPercent ?? 0,
          meetsBar: (plan.readinessPercent ?? 0) >= plan.readinessMinPercent,
        };
      },
    ),
  );
}

export type TransferOutcome = {
  id: string;
  passed: boolean;
  status: Intervention["status"];
  /** Where the student goes next, exactly. */
  returnTo: { lessonCode: string; stage: number } | null;
  message: string;
};

/**
 * Applies the return rule: at least `readinessMinPercent` on the readiness
 * check PLUS the required number of successful transfer items connected to the
 * blocked standard. If the rule is not met, the plan cycles; after
 * ANTI_LOOP_MAX_CYCLES it escalates to teacher review rather than retrying.
 */
export function submitTransferCheck(
  actor: User,
  interventionId: string,
  result: { itemId: string; correct: boolean; response: string; errorCode: string | null },
  idempotencyKey: string,
): TransferOutcome {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const plan = loadPlan(interventionId);
        if (plan.studentId !== actor.id) {
          throw new NotAuthorizedError("this support belongs to another student");
        }
        if (plan.status !== "readiness_check") {
          throw new InterventionError(
            "The readiness check has to be recorded before the transfer item.",
          );
        }
        const enrollment = db().enrollments.find((e) => e.id === plan.enrollmentId);
        if (!enrollment) throw new InterventionError("Enrollment missing.");

        recordEvidence({
          studentId: actor.id,
          enrollmentId: plan.enrollmentId,
          courseVersionId: enrollment.courseVersionId,
          lessonCode: plan.returnLessonCode,
          stage: "Transfer check",
          standard: plan.targetStandard,
          skill: plan.targetSkill,
          itemId: result.itemId,
          correct: result.correct,
          response: result.response,
          errorCode: result.correct ? null : result.errorCode,
          attempt: plan.cycles + 1,
          hintsUsed: 0,
          meaningfulMinutes: 3,
          supportUsed: plan.interventionLessonId,
          source: "transfer_check",
          supersedesEvidenceId: null,
          recordedByUserId: actor.id,
        });

        plan.transferPassed = result.correct;
        const readinessOk = (plan.readinessPercent ?? 0) >= plan.readinessMinPercent;
        const passed = readinessOk && result.correct;
        const before = plan.status;

        let message: string;
        let returnTo: TransferOutcome["returnTo"] = null;

        if (passed) {
          plan.status = transitionIntervention(plan.status, "passed");
          plan.status = transitionIntervention(plan.status, "returned_to_pathway");
          returnTo = { lessonCode: plan.returnLessonCode, stage: plan.returnStage };
          message = `Return rule met: ${plan.readinessPercent}% on the readiness check and the transfer item. You are back in ${plan.returnLessonCode}.`;
        } else {
          plan.cycles += 1;
          if (plan.cycles >= ANTI_LOOP_MAX_CYCLES) {
            plan.status = transitionIntervention(plan.status, "escalated");
            message = `That was ${plan.cycles} cycles on this skill. Rather than a third retry, your teacher is picking this up.`;
          } else {
            plan.status = transitionIntervention(plan.status, "in_progress");
            message = readinessOk
              ? "The readiness check was fine but the transfer item did not hold. One more pass at the model."
              : `The readiness check was ${plan.readinessPercent}%, under the ${plan.readinessMinPercent}% bar. One more pass at the model.`;
          }
        }
        plan.updatedAt = nextTimestamp();

        recordAudit({
          actor,
          action: "intervention.transfer_check",
          targetEntity: "intervention",
          targetId: plan.id,
          before: { status: before, cycles: plan.cycles - (passed ? 0 : 1) },
          after: {
            status: plan.status,
            transferPassed: result.correct,
            readinessPercent: plan.readinessPercent,
            cycles: plan.cycles,
            ruleVersion: plan.returnRuleVersion,
            returnTo: returnTo ? `${returnTo.lessonCode} stage ${returnTo.stage}` : null,
          },
          reason: `Transfer item ${result.correct ? "passed" : "not passed"} under ${plan.returnRuleVersion}.`,
          idempotencyKey,
          requestId: requestIdFor("intervention.transfer_check", idempotencyKey),
        });

        return { id: plan.id, passed, status: plan.status, returnTo, message };
      },
      (existingId) => {
        const plan = loadPlan(existingId);
        return {
          id: plan.id,
          passed: plan.status === "returned_to_pathway",
          status: plan.status,
          returnTo:
            plan.status === "returned_to_pathway"
              ? { lessonCode: plan.returnLessonCode, stage: plan.returnStage }
              : null,
          message: "Already recorded.",
        };
      },
    ),
  );
}

/** Closes a plan. Teacher or site admin, with a reason. */
export function closeIntervention(
  actor: User,
  interventionId: string,
  reason: string,
  idempotencyKey: string,
): Intervention {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        const plan = loadPlan(interventionId);
        assertCanAssignIntervention(actor, plan.studentId);
        if (reason.trim().length === 0) {
          throw new InterventionError("Closing a plan requires a recorded reason.");
        }
        const before = plan.status;
        plan.status = transitionIntervention(plan.status, "closed");
        plan.updatedAt = nextTimestamp();

        recordAudit({
          actor,
          action: "intervention.close",
          targetEntity: "intervention",
          targetId: plan.id,
          before: { status: before },
          after: { status: plan.status },
          reason: reason.trim(),
          idempotencyKey,
          requestId: requestIdFor("intervention.close", idempotencyKey),
        });
        return plan;
      },
      (existingId) => loadPlan(existingId),
    ),
  );
}

export function interventionsForStudent(studentId: string): Intervention[] {
  return db().interventions.filter((i) => i.studentId === studentId);
}

export function openInterventionsForStudent(studentId: string): Intervention[] {
  return interventionsForStudent(studentId).filter(
    (i) => i.status !== "closed" && i.status !== "returned_to_pathway",
  );
}

export { RULE_VERSIONS };
