import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResetForm } from "./reset-form";
import { authMode, sessionState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Set a new password · Beyond.Ed",
  description: "Choose a new password for your Beyond.Ed account.",
};

/**
 * Where a password-recovery link ends up.
 *
 * Reachable only with the session `/auth/callback` established from that link,
 * which is what proves the person controls the address. Arriving without one —
 * a bookmarked URL, a link already used, a link that has expired — is not an
 * error state to explain here; it is simply not this page, so it goes back to
 * sign-in where the "forgotten my password" flow is.
 */
export default async function ResetPasswordPage() {
  if (authMode() !== "supabase") redirect("/");

  const state = await sessionState();
  if (state.kind !== "signed_in") redirect("/?error=denied");

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <header className="brand-field-lit text-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="text-base font-semibold tracking-tight">
            Beyond<span className="text-brand-accent">.Ed</span>
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Set a new password
        </h1>
        <p className="mt-2 max-w-md text-base leading-relaxed text-ink-muted">
          You are signed in as {state.user.firstName} {state.user.lastName}.
          Choose a new password and you will be taken to your workspace.
        </p>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <ResetForm />
        </div>
      </main>
    </div>
  );
}
