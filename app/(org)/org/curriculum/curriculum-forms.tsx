"use client";

import { useState } from "react";

import {
  approveVersionAction,
  publishVersionAction,
  retireVersionAction,
  submitForReviewAction,
} from "@/lib/actions/curriculum";
import { ActionForm } from "@/lib/design/action-form";
import { Button } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

const FIELD = `mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 ${FOCUS_RING}`;

const ACTIONS = {
  in_review: { fn: submitForReviewAction, label: "Submit for review", verb: "Submitting…" },
  approved: { fn: approveVersionAction, label: "Approve", verb: "Approving…" },
  published: { fn: publishVersionAction, label: "Publish", verb: "Publishing…" },
  retired: { fn: retireVersionAction, label: "Retire", verb: "Retiring…" },
} as const;

/**
 * A curriculum lifecycle move. Every one requires a recorded reason and writes
 * an audit event. Publish is additionally gated on day-budget validation — the
 * server refuses it and returns the over-allocation message.
 */
export function CurriculumMoveForm({
  versionId,
  to,
  idempotencySalt,
  blocked,
  blockers,
}: {
  versionId: string;
  to: keyof typeof ACTIONS;
  idempotencySalt: string;
  blocked?: boolean;
  blockers?: string[];
}) {
  const [open, setOpen] = useState(false);
  const action = ACTIONS[to];

  if (blocked) {
    return (
      <div className="rounded-lg border border-notice-line bg-notice-surface p-4">
        <p className="text-sm font-semibold text-ink">
          {action.label} is blocked
        </p>
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-ink">
          {(blockers ?? []).map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-muted">
          The control is shown as unavailable rather than hidden, so the reason is
          visible. Fix the budget and the gate clears.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Button
        type="button"
        emphasis={to === "retired" ? "caution" : "secondary"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Close" : action.label}
      </Button>
      {open ? (
        <ActionForm
          className="mt-3"
          action={action.fn}
          idempotencyKey={`curriculum:${to}:${idempotencySalt}`}
        >
          {(pending) => (
            <>
              <input type="hidden" name="versionId" value={versionId} />
              <div>
                <label htmlFor={`cr-${to}-${idempotencySalt}`} className="text-sm font-medium text-ink">
                  Reason (recorded on the audit event)
                </label>
                <input
                  id={`cr-${to}-${idempotencySalt}`}
                  name="reason"
                  required
                  minLength={4}
                  maxLength={500}
                  placeholder={
                    to === "published"
                      ? "Approved by the curriculum committee on review of the Unit 5 revisions."
                      : "Reason for this change."
                  }
                  className={FIELD}
                />
              </div>
              <div>
                <Button emphasis="primary" disabled={pending}>
                  {pending ? action.verb : `Confirm: ${action.label.toLowerCase()}`}
                </Button>
              </div>
            </>
          )}
        </ActionForm>
      ) : null}
    </div>
  );
}
