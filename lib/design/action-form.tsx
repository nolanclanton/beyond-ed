"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";

import type { ActionResult } from "@/lib/actions/result";
import { Banner } from "./primitives";

type AnyResult = ActionResult<Record<string, unknown>>;

/**
 * A form bound to a server action, with a durable result state (CLAUDE.md §12).
 *
 * On success the saved outcome is shown. On failure the message explains what
 * was preserved and the safe next step. The submit button is disabled while the
 * action is in flight, and the idempotency key is generated once per mounted
 * form, so a double click cannot create a second record.
 */
export function ActionForm({
  action,
  idempotencyKey,
  children,
  className = "",
  successTone = "positive",
  onSuccessNote,
}: {
  action: (formData: FormData) => Promise<AnyResult>;
  idempotencyKey: string;
  children: ReactNode | ((pending: boolean) => ReactNode);
  className?: string;
  successTone?: "positive" | "info" | "notice";
  onSuccessNote?: (result: AnyResult) => ReactNode;
}) {
  const [state, formAction, pending] = useActionState<AnyResult | null, FormData>(
    async (_prev, formData) => action(formData),
    null,
  );

  return (
    <div className={className}>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        {typeof children === "function" ? children(pending) : children}
      </form>

      {state ? (
        <div className="mt-3" aria-live="polite">
          {state.ok ? (
            <Banner title={state.message} tone={successTone} role="status">
              {onSuccessNote ? onSuccessNote(state) : null}
            </Banner>
          ) : (
            <Banner title={state.message} tone="urgent" role="alert">
              <p>{state.preserved}</p>
              <p className="mt-1">{state.nextStep}</p>
            </Banner>
          )}
        </div>
      ) : null}
    </div>
  );
}
