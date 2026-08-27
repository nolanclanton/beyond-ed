/**
 * The AI generation record (vision §9; CLAUDE.md §10.2).
 *
 * One row per bounded operation. It is written when a person asks, and RESOLVED
 * when the same person accepts, edits, or rejects the proposal — so the history
 * says not only that the assistant was used, but what became of what it said.
 * A proposal nobody accepted leaves a `rejected` row, which is the honest
 * record: it was proposed, and it was turned down.
 *
 * ---------------------------------------------------------------------------
 * What is deliberately not stored
 * ---------------------------------------------------------------------------
 *
 * Not the assembled context — only the NAMES of the parts that were assembled.
 * Not the system instruction, which is a constant in source. Not the credential,
 * obviously. Not the model's raw response: what matters is what a person did
 * with it, and if they accepted it the content is in the lesson where anyone can
 * read it.
 *
 * The designer's own instruction IS kept. It is their words, and a later reader
 * asking "why does this worked example use negative numbers" deserves to see
 * "the author asked for negative numbers".
 */
import { recordAudit, requestIdFor } from "@/lib/audit/log";
import { nextTimestamp } from "@/lib/clock";
import { db, nextId } from "@/lib/db/store";
import type { AiGeneration, AiGenerationStatus, User } from "@/lib/db/types";

import type { AiCapabilityName } from "./capabilities";

export type GenerationTarget = {
  targetEntity: AiGeneration["targetEntity"];
  targetId: string;
  courseVersionId: string | null;
  lessonCode: string | null;
  narrativeId: string | null;
  sectionId: string | null;
};

/**
 * Opens a record for a request that is about to be made.
 *
 * Written BEFORE the call, so a request that times out or is refused still
 * leaves a trace. A generation nobody can see is a generation nobody can
 * account for.
 *
 * Not wrapped in `transact`: this is a log of an attempt, and rolling it back
 * because the attempt failed would erase exactly the case worth keeping.
 */
export function openGeneration(
  actor: User,
  input: {
    capability: AiCapabilityName;
    model: string;
    target: GenerationTarget;
    contextKeys: string[];
    instructions: string;
  },
): AiGeneration {
  const generation: AiGeneration = {
    id: nextId("gen"),
    orgId: actor.orgId,
    userId: actor.id,
    capability: input.capability,
    model: input.model,
    targetEntity: input.target.targetEntity,
    targetId: input.target.targetId,
    courseVersionId: input.target.courseVersionId,
    lessonCode: input.target.lessonCode,
    narrativeId: input.target.narrativeId,
    sectionId: input.target.sectionId,
    contextKeys: [...input.contextKeys],
    instructions: input.instructions.trim(),
    status: "proposed",
    resultingAuditId: null,
    inputTokens: null,
    outputTokens: null,
    failureReason: null,
    requestedAt: nextTimestamp(),
    resolvedAt: null,
  };
  db().aiGenerations.push(generation);
  return generation;
}

/** Records what the call cost. Called once, after a successful response. */
export function recordUsage(
  generationId: string,
  usage: { inputTokens: number | null; outputTokens: number | null },
): void {
  const generation = generationById(generationId);
  if (!generation) return;
  generation.inputTokens = usage.inputTokens;
  generation.outputTokens = usage.outputTokens;
}

/** Closes a record that never produced a usable proposal. */
export function failGeneration(generationId: string, reason: string): void {
  const generation = generationById(generationId);
  if (!generation) return;
  generation.status = "failed";
  // The sentence shown to the designer, not a provider error or a stack trace.
  generation.failureReason = reason;
  generation.resolvedAt = nextTimestamp();
}

export function generationById(id: string): AiGeneration | undefined {
  return db().aiGenerations.find((g) => g.id === id);
}

/**
 * Records a person's decision about a proposal.
 *
 * Called from inside the transaction that writes the accepted content, so the
 * decision and the write land together or not at all — the same rule the audit
 * event follows (CLAUDE.md §6). A rejection has no content write of its own and
 * simply records the refusal.
 *
 * `accepted_edited` is a distinct status rather than a flag because it is the
 * most common honest outcome, and a history that could not tell it from
 * `accepted` would overstate how much of the curriculum the assistant wrote.
 */
export function resolveGeneration(
  actor: User,
  input: {
    generationId: string;
    status: Extract<
      AiGenerationStatus,
      "accepted" | "accepted_edited" | "acknowledged" | "rejected"
    >;
    resultingAuditId: string | null;
    reason: string;
  },
  idempotencyKey: string,
): AiGeneration {
  const generation = generationById(input.generationId);
  if (!generation) {
    throw new Error("That proposal is no longer available. Ask for a new one.");
  }
  if (generation.userId !== actor.id) {
    throw new Error("That proposal was made by someone else.");
  }
  if (generation.status !== "proposed") {
    throw new Error("That proposal has already been decided.");
  }

  generation.status = input.status;
  generation.resultingAuditId = input.resultingAuditId;
  generation.resolvedAt = nextTimestamp();

  recordAudit({
    actor,
    action: `ai.${input.status}`,
    targetEntity: "ai_generation",
    targetId: generation.id,
    before: { status: "proposed", capability: generation.capability },
    after: {
      status: generation.status,
      capability: generation.capability,
      resultingAuditId: generation.resultingAuditId,
    },
    reason: input.reason,
    idempotencyKey: `${idempotencyKey}:generation`,
    requestId: requestIdFor(`ai.${input.status}`, idempotencyKey),
  });
  return generation;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * The assistant's footprint on one thing.
 *
 * This is what makes "AI-assisted" visible in a lesson's or a narrative's
 * history without putting a flag on every block: ask which generations targeted
 * it, and what happened to each.
 */
export function generationsForTarget(
  targetEntity: AiGeneration["targetEntity"],
  targetId: string,
): AiGeneration[] {
  return db()
    .aiGenerations.filter(
      (g) => g.targetEntity === targetEntity && g.targetId === targetId,
    )
    .slice()
    .reverse();
}

export function generationsForLesson(
  courseVersionId: string,
  lessonCode: string,
): AiGeneration[] {
  return db()
    .aiGenerations.filter(
      (g) => g.courseVersionId === courseVersionId && g.lessonCode === lessonCode,
    )
    .slice()
    .reverse();
}

/** True when any proposal was accepted into this lesson. Used for the badge. */
export function lessonIsAiAssisted(
  courseVersionId: string,
  lessonCode: string,
): boolean {
  return generationsForLesson(courseVersionId, lessonCode).some(
    (g) => g.status === "accepted" || g.status === "accepted_edited",
  );
}

/** Everything in the organization, newest first. For the administrator's view. */
export function generationsForOrg(orgId: string): AiGeneration[] {
  return db()
    .aiGenerations.filter((g) => g.orgId === orgId)
    .slice()
    .reverse();
}

export type UsageSummary = {
  capability: string;
  requests: number;
  accepted: number;
  rejected: number;
  failed: number;
  inputTokens: number;
  outputTokens: number;
};

/**
 * Usage by capability.
 *
 * Built so an organization can see what the assistant is actually being used
 * for and how much of it people keep. A capability with many requests and few
 * acceptances is a capability that is not working, and that is worth knowing
 * before the bill says so.
 */
export function usageByCapability(orgId: string): UsageSummary[] {
  const rows = new Map<string, UsageSummary>();
  for (const generation of generationsForOrg(orgId)) {
    const row = rows.get(generation.capability) ?? {
      capability: generation.capability,
      requests: 0,
      accepted: 0,
      rejected: 0,
      failed: 0,
      inputTokens: 0,
      outputTokens: 0,
    };
    row.requests += 1;
    if (generation.status === "accepted" || generation.status === "accepted_edited") {
      row.accepted += 1;
    }
    if (generation.status === "rejected") row.rejected += 1;
    if (generation.status === "failed") row.failed += 1;
    row.inputTokens += generation.inputTokens ?? 0;
    row.outputTokens += generation.outputTokens ?? 0;
    rows.set(generation.capability, row);
  }
  return [...rows.values()].sort((a, b) => b.requests - a.requests);
}

/** Usage by person. Named for accountability, not for ranking anyone. */
export function usageByUser(
  orgId: string,
): { userId: string; name: string; requests: number; accepted: number }[] {
  const d = db();
  const rows = new Map<string, { userId: string; name: string; requests: number; accepted: number }>();
  for (const generation of generationsForOrg(orgId)) {
    const user = d.users.find((u) => u.id === generation.userId);
    const row = rows.get(generation.userId) ?? {
      userId: generation.userId,
      name: user ? `${user.firstName} ${user.lastName}` : "A former colleague",
      requests: 0,
      accepted: 0,
    };
    row.requests += 1;
    if (generation.status === "accepted" || generation.status === "accepted_edited") {
      row.accepted += 1;
    }
    rows.set(generation.userId, row);
  }
  return [...rows.values()].sort((a, b) => b.requests - a.requests);
}
