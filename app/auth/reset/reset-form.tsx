"use client";

import { useActionState, useId } from "react";
import type { ReactNode } from "react";

import { setNewPasswordAction } from "@/lib/actions/session";
import type { ActionResult } from "@/lib/actions/result";
import { Banner } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

type AnyResult = ActionResult<Record<string, unknown>>;

/**
 * Setting a new password.
 *
 * The form carries no identity of its own — no email field, no user id, no
 * token. It acts on the session the recovery link established, and
 * `auth.updateUser` changes the password of `auth.uid()` and nothing else, so
 * there is no version of this request that could reach somebody else's account.
 */
export function ResetForm() {
  const id = useId();
  const [state, action, pending] = useActionState<AnyResult | null, FormData>(
    async (_prev, formData) => setNewPasswordAction(formData),
    null,
  );

  return (
    <div>
      <form action={action} className="flex max-w-sm flex-col gap-4">
        <Field
          label="New password"
          htmlFor={`${id}-password`}
          hint="At least 10 characters. A short phrase you will remember beats a jumble you will not."
        >
          <input
            id={`${id}-password`}
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>

        <Field label="Type it again" htmlFor={`${id}-confirm`}>
          <input
            id={`${id}-confirm`}
            name="confirmPassword"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>

        <div>
          <button
            type="submit"
            disabled={pending}
            className={`inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${FOCUS_RING}`}
          >
            {pending ? "Saving…" : "Save my new password"}
          </button>
        </div>
      </form>

      {/*
        * Only a failure can land here: a successful save redirects to the
        * person's own workspace, so there is no success state to render.
        */}
      {state && !state.ok ? (
        <div className="mt-4 max-w-md" aria-live="polite">
          <Banner title={state.message} tone="urgent" role="alert">
            <p>{state.preserved}</p>
            <p className="mt-1">{state.nextStep}</p>
          </Banner>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-ink-muted">{hint}</p> : null}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
