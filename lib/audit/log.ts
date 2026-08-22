/**
 * Append-only audit (CLAUDE.md §6).
 *
 * Every attributable human action produces an event, written in the same
 * transaction as the action itself. If the audit write fails, the action fails:
 * `recordAudit` is called inside `transact`, so a throw here rolls the whole
 * change back. There is no unaudited path.
 *
 * Audit is readable by `org_admin` and by the actor for their own actions. It
 * is writable by no one — there is no update and no delete in this module.
 */
import { nextTimestamp } from "@/lib/clock";
import { appendAudit, db, nextId } from "@/lib/db/store";
import { scopeLabel } from "@/lib/auth/scope";
import type { AuditEvent, User } from "@/lib/db/types";

export type AuditInput = {
  actor: User;
  action: string;
  targetEntity: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
  reason: string;
  idempotencyKey: string;
  requestId: string;
};

export function recordAudit(input: AuditInput): AuditEvent {
  if (!input.reason || input.reason.trim().length === 0) {
    // A dismissal requires a reason. So does a site-admin assignment over an
    // unresolved teacher queue item (CLAUDE.md §6).
    throw new Error(`Audit event for ${input.action} requires a reason.`);
  }
  return appendAudit({
    id: nextId("aud"),
    actorUserId: input.actor.id,
    actorRole: input.actor.role,
    scope: scopeLabel(input.actor),
    action: input.action,
    targetEntity: input.targetEntity,
    targetId: input.targetId,
    before: input.before === undefined ? null : JSON.stringify(input.before),
    after: input.after === undefined ? null : JSON.stringify(input.after),
    reason: input.reason.trim(),
    idempotencyKey: input.idempotencyKey,
    requestId: input.requestId,
    recordedAt: nextTimestamp(),
  });
}

/** Org admins read everything in their organization; everyone else reads self. */
export function readableAudit(actor: User): AuditEvent[] {
  const d = db();
  const events = [...d.auditEvents].reverse();
  if (actor.role === "org_admin") {
    const orgUsers = new Set(
      d.users.filter((u) => u.orgId === actor.orgId).map((u) => u.id),
    );
    return events.filter((e) => orgUsers.has(e.actorUserId));
  }
  return events.filter((e) => e.actorUserId === actor.id);
}

export function auditForTarget(targetEntity: string, targetId: string): AuditEvent[] {
  return db().auditEvents.filter(
    (e) => e.targetEntity === targetEntity && e.targetId === targetId,
  );
}

/** A stable request id for one server action invocation. */
export function requestIdFor(action: string, key: string): string {
  return `req:${action}:${key}`;
}
