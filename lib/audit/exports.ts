/**
 * Purpose-bound exports (CLAUDE.md §3).
 *
 * An export records the requester, the purpose, the scope, the row count, and
 * the timestamp — and writes an audit event in the same transaction. There is
 * no unlogged export path.
 */
import { assertCanReadStudent } from "@/lib/auth/scope";
import { nextTimestamp } from "@/lib/clock";
import { db, nextId, transact, withIdempotency } from "@/lib/db/store";
import type { ExportRecord, User } from "@/lib/db/types";
import { MIN_GROUP_SIZE } from "@/lib/rules/versions";

import { recordAudit, requestIdFor } from "./log";

export class ExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExportError";
  }
}

/**
 * Small-group privacy: an aggregate below the configured minimum group size is
 * suppressed, not rounded. Never expose an individual through a filtered
 * aggregate.
 */
export function suppressSmallGroup<T>(rows: T[]): { rows: T[]; suppressed: boolean } {
  if (rows.length > 0 && rows.length < MIN_GROUP_SIZE) {
    return { rows: [], suppressed: true };
  }
  return { rows, suppressed: false };
}

export function recordExport(
  actor: User,
  input: { purpose: string; scope: string; studentIds: string[] },
  idempotencyKey: string,
): ExportRecord {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        if (actor.role !== "org_admin") {
          throw new ExportError("Exports are an organization-administrator action.");
        }
        if (input.purpose.trim().length === 0) {
          throw new ExportError("An export requires a stated purpose.");
        }
        for (const id of input.studentIds) assertCanReadStudent(actor, id);

        const record: ExportRecord = {
          id: nextId("exp"),
          requestedByUserId: actor.id,
          purpose: input.purpose.trim(),
          scope: input.scope,
          rowCount: input.studentIds.length,
          requestedAt: nextTimestamp(),
        };
        db().exports.push(record);

        recordAudit({
          actor,
          action: "export.request",
          targetEntity: "export",
          targetId: record.id,
          before: null,
          after: { scope: record.scope, rowCount: record.rowCount },
          reason: record.purpose,
          idempotencyKey,
          requestId: requestIdFor("export.request", idempotencyKey),
        });

        return record;
      },
      (existingId) => {
        const row = db().exports.find((e) => e.id === existingId);
        if (!row) throw new ExportError("Duplicate write with no record.");
        return row;
      },
    ),
  );
}
