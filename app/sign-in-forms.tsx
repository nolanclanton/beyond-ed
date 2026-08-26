"use client";

import { useActionState, useId, useState } from "react";
import type { ReactNode } from "react";

import {
  claimAccountAction,
  requestPasswordResetAction,
  signInAction,
} from "@/lib/actions/session";
import type { ActionResult } from "@/lib/actions/result";
import { Banner } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

type AnyResult = ActionResult<Record<string, unknown>>;
type Mode = "sign_in" | "claim" | "forgot";

/**
 * The three ways a person can be at this page, as three separate forms rather
 * than one form that changes meaning.
 *
 *   `sign_in`  they have set their password before
 *   `claim`    first time — they have an address and a setup code from their
 *              district, and are choosing a password now
 *   `forgot`   they had a password and have lost it
 *
 * They are mutually exclusive and only one is mounted at a time, so a password
 * manager is never offered two password fields at once and a screen reader
 * never reads out fields belonging to a flow the person is not in.
 *
 * Nothing here decides anything. Every one of these actions hands the question
 * to the database, which is where the invitation, the setup code, and the
 * password actually live.
 */
export function SignInForms() {
  const [mode, setMode] = useState<Mode>("sign_in");

  return (
    <>
      <div
        role="tablist"
        aria-label="How would you like to continue?"
        className="mt-6 inline-flex rounded-xl border border-line bg-canvas p-1"
      >
        <Tab current={mode} value="sign_in" onSelect={setMode}>
          Sign in
        </Tab>
        <Tab current={mode} value="claim" onSelect={setMode}>
          Set up my account
        </Tab>
      </div>

      {mode === "sign_in" ? <SignInForm onForgot={() => setMode("forgot")} /> : null}
      {mode === "claim" ? <ClaimForm /> : null}
      {mode === "forgot" ? <ForgotForm onBack={() => setMode("sign_in")} /> : null}
    </>
  );
}

function Tab({
  current,
  value,
  onSelect,
  children,
}: {
  current: Mode;
  value: Mode;
  onSelect: (m: Mode) => void;
  children: ReactNode;
}) {
  const active = current === value || (current === "forgot" && value === "sign_in");
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onSelect(value)}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${FOCUS_RING} ${
        active ? "bg-surface text-ink shadow-[0_1px_2px_rgba(28,31,35,0.08)]" : "text-ink-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function SignInForm({ onForgot }: { onForgot: () => void }) {
  const id = useId();
  const [state, action, pending] = useActionState<AnyResult | null, FormData>(
    async (_prev, formData) => signInAction(formData),
    null,
  );

  return (
    <div className="mt-5">
      <form action={action} className="flex max-w-sm flex-col gap-4">
        <Field label="Email address" htmlFor={`${id}-email`}>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className={inputClass}
          />
        </Field>
        <Field label="Password" htmlFor={`${id}-password`}>
          <input
            id={`${id}-password`}
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </Field>
        <Submit pending={pending}>Sign in</Submit>
      </form>

      <button
        type="button"
        onClick={onForgot}
        className={`mt-3 text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
      >
        I have forgotten my password
      </button>

      <Result state={state} />
    </div>
  );
}

function ClaimForm() {
  const id = useId();
  const [state, action, pending] = useActionState<AnyResult | null, FormData>(
    async (_prev, formData) => claimAccountAction(formData),
    null,
  );

  return (
    <div className="mt-5">
      <p className="max-w-md text-sm leading-relaxed text-ink-muted">
        Use this the first time only. You need the email address your district
        set up for you and the <strong className="font-semibold text-ink">setup
        code</strong> they gave you with it. You choose your own password here
        &mdash; nobody else sees it.
      </p>

      <form action={action} className="mt-4 flex max-w-sm flex-col gap-4">
        <Field label="Email address" htmlFor={`${id}-email`}>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className={inputClass}
          />
        </Field>

        <Field
          label="Setup code"
          htmlFor={`${id}-code`}
          hint="Eight characters, from your district administrator. Capitals and spacing do not matter."
        >
          <input
            id={`${id}-code`}
            name="claimCode"
            required
            maxLength={40}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="XXXX XXXX"
            className={`${inputClass} font-mono tracking-[0.18em]`}
          />
        </Field>

        <Field
          label="Choose a password"
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

        <Submit pending={pending}>Set up my account</Submit>
      </form>

      <Result state={state} />
    </div>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const id = useId();
  const [state, action, pending] = useActionState<AnyResult | null, FormData>(
    async (_prev, formData) => requestPasswordResetAction(formData),
    null,
  );

  return (
    <div className="mt-5">
      <p className="max-w-md text-sm leading-relaxed text-ink-muted">
        Enter your email address and we will send a link to set a new password.
      </p>

      <form action={action} className="mt-4 flex max-w-sm flex-col gap-4">
        <Field label="Email address" htmlFor={`${id}-email`}>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className={inputClass}
          />
        </Field>
        <Submit pending={pending}>Send a reset link</Submit>
      </form>

      <button
        type="button"
        onClick={onBack}
        className={`mt-3 text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
      >
        Back to signing in
      </button>

      <Result state={state} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function Result({ state }: { state: AnyResult | null }) {
  if (!state) return null;
  return (
    <div className="mt-4 max-w-md" aria-live="polite">
      {state.ok ? (
        <Banner title={state.message} tone="positive" role="status" />
      ) : (
        <Banner title={state.message} tone="urgent" role="alert">
          <p>{state.preserved}</p>
          <p className="mt-1">{state.nextStep}</p>
        </Banner>
      )}
    </div>
  );
}

function Submit({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <div>
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${FOCUS_RING}`}
      >
        {pending ? "Working…" : children}
      </button>
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
  "w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-base text-ink placeholder:text-ink-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
