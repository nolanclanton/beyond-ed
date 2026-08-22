"use client";

import { recordExportAction } from "@/lib/actions/staff";
import { ActionForm } from "@/lib/design/action-form";
import { Button } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

const FIELD = `mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 ${FOCUS_RING}`;

export function ExportForm({ idempotencySalt }: { idempotencySalt: string }) {
  return (
    <ActionForm action={recordExportAction} idempotencyKey={`export:${idempotencySalt}`}>
      {(pending) => (
        <>
          <p className="text-sm text-ink-muted">
            An export is not anonymous. The purpose you state below is stored on
            the export record and on the audit event.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`ep-${idempotencySalt}`} className="text-sm font-medium text-ink">
                Purpose (recorded)
              </label>
              <input
                id={`ep-${idempotencySalt}`}
                name="purpose"
                required
                minLength={4}
                maxLength={300}
                placeholder="Board report on intervention return rates, Q2."
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor={`es-${idempotencySalt}`} className="text-sm font-medium text-ink">
                Scope
              </label>
              <select
                id={`es-${idempotencySalt}`}
                name="scope"
                defaultValue="Organization — all sites"
                className={FIELD}
              >
                <option>Organization — all sites</option>
                <option>Intervention outcomes only</option>
                <option>Enrollment and placement only</option>
              </select>
            </div>
          </div>
          <div>
            <Button emphasis="primary" disabled={pending}>
              {pending ? "Recording…" : "Record this export request"}
            </Button>
          </div>
          <p className="text-xs text-ink-muted">
            This records the request and writes the audit event. Producing the file
            itself is not built — no data leaves the system in this build.
          </p>
        </>
      )}
    </ActionForm>
  );
}
