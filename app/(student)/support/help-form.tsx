"use client";

import { requestHelpAction } from "@/lib/actions/student";
import { ActionForm } from "@/lib/design/action-form";
import { Button } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

const FIELD = `mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 ${FOCUS_RING}`;

export function HelpRequestForm({ idempotencyKey }: { idempotencyKey: string }) {
  return (
    <ActionForm action={requestHelpAction} idempotencyKey={idempotencyKey}>
      {(pending) => (
        <>
          <div>
            <label htmlFor="help-subject" className="text-sm font-medium text-ink">
              What is this about?
            </label>
            <input
              id="help-subject"
              name="subject"
              required
              minLength={3}
              maxLength={120}
              placeholder="Unit rate — I keep dividing backwards"
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="help-body" className="text-sm font-medium text-ink">
              Tell your teacher what is happening
            </label>
            <textarea
              id="help-body"
              name="body"
              required
              minLength={3}
              maxLength={2000}
              rows={4}
              placeholder="Say where you got stuck and what you already tried."
              className={FIELD}
            />
          </div>
          <div>
            <Button emphasis="primary" disabled={pending}>
              {pending ? "Sending…" : "Send to my teacher"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}
