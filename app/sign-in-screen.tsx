import type { CSSProperties } from "react";

import { SignInForms } from "@/app/sign-in-forms";
import { signOut } from "@/lib/actions/session";
import type { SessionState } from "@/lib/auth/session";
import { COURSES } from "@/lib/curriculum/catalog";
import { FOCUS_RING } from "@/lib/design/tokens";
import { CAPACITY_CONTRACT } from "@/lib/rules/versions";

/**
 * The sign-in screen — the entry point in Supabase mode.
 *
 * There is no "create an account" link, because a person cannot create one. A
 * district administrator provisions each account in advance, and the database
 * refuses any sign-up whose address has no pending invitation. The page says so
 * rather than letting somebody hunt for a registration form that was never
 * built.
 *
 * It keeps the entry screen's own chrome — the lit brand banner, the four
 * figures, the light canvas the product uses — so signing in looks like the
 * same piece of software as everything behind it.
 */
export function SignInScreen({
  state,
  notice,
}: {
  state: SessionState;
  notice: { error?: string; signedOut?: boolean };
}) {
  const headline: readonly [string, string][] = [
    [String(CAPACITY_CONTRACT.totalDays), "available workdays"],
    [String(CAPACITY_CONTRACT.pathwayDays), "pathway days"],
    [String(CAPACITY_CONTRACT.interventionDays), "intervention days"],
    [String(COURSES.length), "courses authored"],
  ];

  const blocked = state.kind === "no_profile" || state.kind === "deactivated";

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <header className="brand-field-lit text-white">
        <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pb-32 sm:pt-10">
          <div className="rise-in flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-semibold tracking-tight">
              Beyond<span className="text-brand-accent">.Ed</span>
            </p>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-brand-accent"
              />
              District accounts
            </p>
          </div>

          <div
            className="rise-in mt-16 max-w-3xl sm:mt-24"
            style={{ "--rise-delay": "0.08s" } as CSSProperties}
          >
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Coherent pathways.
              <br />
              <span className="text-white/70">Evidence you can point at.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              A grades 6&ndash;12 learning and academic-operations platform:
              course pathways that hold together, support that follows the
              evidence, and decisions that stay with a person.
            </p>
          </div>

          <dl className="rise-in-group mt-14 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-white/15 pt-8 sm:mt-16 sm:grid-cols-4">
            {headline.map(([value, label]) => (
              <div key={label}>
                <dd className="text-3xl font-bold tracking-tight text-white">
                  {value}
                </dd>
                <dt className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <main className="mx-auto -mt-20 w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-5">
          <section
            aria-labelledby="sign-in"
            className="rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,31,35,0.06)] sm:p-8 lg:col-span-3"
          >
            <h2
              id="sign-in"
              className="text-2xl font-bold tracking-tight text-ink sm:text-3xl"
            >
              Sign in to Beyond.Ed
            </h2>
            <p className="mt-2 max-w-md text-base leading-relaxed text-ink-muted">
              Use the email address your district set up for you.
            </p>

            <Notice state={state} notice={notice} />

            {blocked ? (
              <form action={signOut} className="mt-5">
                <button
                  type="submit"
                  className={`text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                >
                  Sign out and use a different account
                </button>
              </form>
            ) : (
              <SignInForms />
            )}

            <div className="mt-8 border-t border-line pt-5">
              <p className="text-sm font-semibold text-ink">Cannot sign in?</p>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted">
                Accounts are created by a district administrator, one address at
                a time. If yours has not been set up yet, no attempt will work
                &mdash; ask your school office or district administrator to add
                you. They can also read your setup code back to you at any time
                before you use it.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="what-this-is"
            className="rounded-2xl border border-line bg-surface p-6 sm:p-8 lg:col-span-2"
          >
            <h2 id="what-this-is" className="text-sm font-semibold text-ink">
              How accounts work here
            </h2>
            <ul className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-ink-muted">
              <li>
                <span className="font-semibold text-ink">No self sign-up.</span>{" "}
                A district administrator provisions each account with its role,
                school, and grade. Entering an address nobody has provisioned
                does not create an account.
              </li>
              <li>
                <span className="font-semibold text-ink">
                  A setup code, once.
                </span>{" "}
                Your administrator gives you a short code with your address. It
                proves the account is yours, it works only the first time, and
                after that you sign in with your own password.
              </li>
              <li>
                <span className="font-semibold text-ink">
                  Your records stay yours.
                </span>{" "}
                Students see their own work. Staff see only the students in
                their own scope, and every override, grade change, and export is
                logged with who did it and why.
              </li>
              <li>
                <span className="font-semibold text-ink">No AI assistant.</span>{" "}
                Beyond.Ed contains no tutor, chatbot, or copilot. Individualized
                review uses transparent, versioned curriculum rules over stored
                evidence, and help comes from a person.
              </li>
            </ul>
          </section>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-ink-muted sm:px-6">
          <p>
            Beyond.Ed &mdash; a grades 6&ndash;12 learning and
            academic-operations platform.
          </p>
          <p>District-provisioned accounts</p>
        </div>
      </footer>
    </div>
  );
}

/**
 * The one paragraph that explains what just happened.
 *
 * Deliberately not red for the common cases. An address that has not been
 * provisioned yet is an ordinary administrative fact, not an emergency, and
 * CLAUDE.md §13 reserves red for genuinely urgent states. Only a withdrawn
 * account — where somebody needs to act — gets the urgent surface.
 */
function Notice({
  state,
  notice,
}: {
  state: SessionState;
  notice: { error?: string; signedOut?: boolean };
}) {
  if (state.kind === "deactivated") {
    return (
      <div
        role="alert"
        className="mt-6 rounded-2xl border border-urgent-line bg-urgent-surface px-5 py-4 text-sm"
      >
        <p className="font-semibold text-ink">This account has been withdrawn.</p>
        <p className="mt-1 leading-relaxed text-ink-muted">
          {state.email} is no longer active in Beyond.Ed. Your records are
          retained and nothing has been deleted. Contact your district
          administrator if this is unexpected.
        </p>
      </div>
    );
  }

  if (state.kind === "no_profile") {
    return (
      <div
        role="alert"
        className="mt-6 rounded-2xl border border-primary-line bg-primary-surface px-5 py-4 text-sm"
      >
        <p className="font-semibold text-ink">
          That account is signed in, but has no Beyond.Ed workspace.
        </p>
        <p className="mt-1 leading-relaxed text-ink-muted">
          {state.email} is not provisioned. Ask your district administrator to
          add it, or sign out and use the address they set up for you.
        </p>
      </div>
    );
  }

  if (notice.error === "denied") {
    return (
      <div
        role="alert"
        className="mt-6 rounded-2xl border border-primary-line bg-primary-surface px-5 py-4 text-sm"
      >
        <p className="font-semibold text-ink">That link did not work.</p>
        <p className="mt-1 leading-relaxed text-ink-muted">
          Password reset links can only be used once, and they expire. Choose
          &ldquo;I have forgotten my password&rdquo; below to get a new one.
        </p>
      </div>
    );
  }

  if (notice.error === "oauth_start" || notice.error === "unconfigured") {
    return (
      <div
        role="alert"
        className="mt-6 rounded-2xl border border-urgent-line bg-urgent-surface px-5 py-4 text-sm"
      >
        <p className="font-semibold text-ink">Sign-in is unavailable.</p>
        <p className="mt-1 leading-relaxed text-ink-muted">
          This is a configuration problem on our side, not something you did.
          Nothing about your account has changed &mdash; please try again
          shortly.
        </p>
      </div>
    );
  }

  if (notice.error === "demo_disabled") {
    return (
      <div
        role="alert"
        className="mt-6 rounded-2xl border border-primary-line bg-primary-surface px-5 py-4 text-sm"
      >
        <p className="font-semibold text-ink">
          That control does not exist on this deployment.
        </p>
        <p className="mt-1 leading-relaxed text-ink-muted">
          Demo identities and seeded data are local-development only. This
          deployment has a real database, so sign in with your district account.
        </p>
      </div>
    );
  }

  if (notice.signedOut) {
    return (
      <div
        role="status"
        className="mt-6 rounded-2xl border border-positive-line bg-positive-surface px-5 py-4 text-sm"
      >
        <p className="font-semibold text-ink">You are signed out.</p>
        <p className="mt-1 text-ink-muted">
          Close this tab on a shared device to finish.
        </p>
      </div>
    );
  }

  return null;
}
