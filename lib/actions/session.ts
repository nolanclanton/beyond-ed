"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ROLE_PRESENTATION } from "@/lib/auth/roles";
import { authMode, DEMO_SESSION_COOKIE, sessionState } from "@/lib/auth/session";
import { clearDatabase, db } from "@/lib/db/store";
import { ensureSeeded } from "@/lib/db/seed";
import { createClient } from "@/lib/supabase/server";
import { callbackUrl } from "@/lib/supabase/site-url";
import { failure, type ActionResult } from "./result";

/**
 * Session actions for both modes (see `lib/auth/session.ts`).
 *
 * Three ways in, and they are not equivalent:
 *
 *   `claimAccountAction`  first time only. Needs the address a district
 *                         administrator provisioned AND the setup code issued
 *                         with it. This is the only path that creates a
 *                         profile, and the database decides whether it may.
 *   `signInAction`        every time after that. Email and password.
 *   `requestPasswordReset`/`setNewPassword` — the recovery pair.
 *
 * There is no fourth. Nothing here creates an account for an address nobody
 * provisioned; `handle_new_auth_user` refuses it, and refuses it whether the
 * request came from this form or from anywhere else.
 */

const Email = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .refine((v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Enter a valid email address.");

/**
 * Ten characters, and no upper bound worth enforcing.
 *
 * Length is the property that matters; a composition rule ("one capital, one
 * symbol") produces predictable passwords and teaches people to write them
 * down. Supabase enforces its own minimum as well; this is the stricter of the
 * two.
 */
const Password = z
  .string()
  .min(10, "Use at least 10 characters. A short phrase is easier to remember than a jumble.")
  .max(200);

/** Typed off a slip of paper, so separators and case are forgiven. */
const ClaimCode = z
  .string()
  .trim()
  .min(1, "Enter the setup code your district administrator gave you.")
  .max(40)
  .transform((v) => v.replace(/[^A-Za-z0-9]/g, "").toUpperCase());

// ---------------------------------------------------------------------------
// First time in
// ---------------------------------------------------------------------------

const Claim = z
  .object({
    email: Email,
    claimCode: ClaimCode,
    password: Password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Those two passwords are not the same.",
    path: ["confirmPassword"],
  });

/**
 * Claiming a provisioned account.
 *
 * Everything consequential happens in the database: `handle_new_auth_user`
 * checks that a pending invitation exists for this address, that the setup code
 * matches it, and then builds the profile from the invitation. If any of that
 * fails it raises, which aborts the transaction that would have created the
 * `auth.users` row — so a failed attempt leaves nothing behind and the address
 * can still be claimed properly afterwards.
 */
export async function claimAccountAction(
  formData: FormData,
): Promise<ActionResult> {
  if (authMode() !== "supabase") {
    return failure(
      "Accounts are not available in the local demo build.",
      "Nothing was changed.",
      "Configure a Supabase project, or choose a demo portal instead.",
    );
  }

  const parsed = Claim.safeParse({
    email: formData.get("email"),
    claimCode: formData.get("claimCode"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return failure(
      parsed.error.issues[0]?.message ?? "Check the details and try again.",
      "Nothing was changed.",
      "Correct the highlighted field and try again.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { claim_code: parsed.data.claimCode } },
  });

  if (error) {
    // Supabase applies its own address rules on top of the shape check above,
    // and rejects some addresses outright — reserved TLDs like `.test` among
    // them. That failure arrives here looking exactly like a bad setup code, so
    // it gets its own message: sending someone to re-check a code that was
    // right the whole time wastes their time and their administrator's.
    if (
      error.code === "email_address_invalid" ||
      /email address .* is invalid/i.test(error.message)
    ) {
      return failure(
        "That email address was rejected as invalid.",
        "Nothing was changed, and no account was created.",
        "Check it for a typo. If it is spelled correctly, tell your district administrator — a few address formats cannot be used at all, and they will need to provision you on a different one.",
      );
    }

    // Account setup is supposed to send no mail at all. If Supabase reports an
    // EMAIL rate limit here, it means "Confirm email" is switched on for the
    // project — and that setting also breaks setup in a way the person cannot
    // see: a successful claim consumes their invitation while withholding the
    // session, and the invitation cannot be re-issued. So this is reported as
    // our configuration problem, which it is, rather than as their mistake.
    // SUPABASE_SETUP.md §1a is the fix.
    if (error.code === "over_email_send_rate_limit") {
      return failure(
        "Account setup is temporarily unavailable.",
        "Nothing was changed, and no account was created.",
        "This is a configuration problem on our side, not something you did. Tell your district administrator that email confirmation needs to be turned off for Beyond.Ed sign-ups.",
      );
    }

    if (error.status === 429 || error.code === "over_request_rate_limit") {
      return failure(
        "Too many attempts just now.",
        "Nothing was changed, and no account was created.",
        "Wait a minute and try again.",
      );
    }

    // Everything else gets ONE message for two different causes — no account
    // provisioned, and a code that does not match. Telling them apart would let
    // anyone test whether a given address has an account waiting, which is
    // exactly the enumeration the setup code exists to prevent.
    return failure(
      "That email address and setup code do not match an account waiting to be set up.",
      "Nothing was changed, and no account was created.",
      "Check both with your district administrator — the code is shown beside your name in their account list, and it can be read out again.",
    );
  }

  const state = await sessionState();
  if (state.kind !== "signed_in") {
    // The account exists but there is no usable session — this is what an
    // enabled "Confirm email" setting looks like from here.
    return failure(
      "Your account is set up, but it still needs to be confirmed.",
      "Your account was created and your password was saved.",
      "Check your email for a confirmation link, then come back and sign in.",
    );
  }

  redirect(ROLE_PRESENTATION[state.user.role].home);
}

// ---------------------------------------------------------------------------
// Every time after that
// ---------------------------------------------------------------------------

const SignIn = z.object({ email: Email, password: z.string().min(1).max(200) });

export async function signInAction(formData: FormData): Promise<ActionResult> {
  if (authMode() !== "supabase") redirect("/?error=demo_disabled");

  const parsed = SignIn.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return failure(
      "Enter your email address and password.",
      "Nothing was changed.",
      "Fill in both fields and try again.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return failure(
      "That email address and password do not match.",
      "Nothing was changed.",
      "Check both and try again. If you have not set your password yet, use “Set up my account” instead.",
    );
  }

  const state = await sessionState();
  if (state.kind === "deactivated") {
    await supabase.auth.signOut();
    return failure(
      "This account has been withdrawn.",
      "Your records are retained and nothing has been deleted.",
      "Contact your district administrator if this is unexpected.",
    );
  }
  if (state.kind !== "signed_in") {
    await supabase.auth.signOut();
    return failure(
      "That account has no Beyond.Ed workspace.",
      "Nothing was changed.",
      "Ask your district administrator to provision it.",
    );
  }

  redirect(ROLE_PRESENTATION[state.user.role].home);
}

// ---------------------------------------------------------------------------
// Forgotten passwords
// ---------------------------------------------------------------------------

/**
 * Sends a recovery link.
 *
 * Reports success whether or not the address has an account, for the same
 * reason `claimAccountAction` gives one message for two causes: a form that
 * says "no such account" is an account-enumeration oracle, and a school's
 * addresses are guessable.
 */
export async function requestPasswordResetAction(
  formData: FormData,
): Promise<ActionResult> {
  if (authMode() !== "supabase") redirect("/?error=demo_disabled");

  const parsed = Email.safeParse(formData.get("email"));
  if (!parsed.success) {
    return failure(
      "Enter a valid email address.",
      "Nothing was changed.",
      "Check the address and try again.",
    );
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${callbackUrl(origin)}?next=%2Fauth%2Freset`,
  });

  return {
    ok: true,
    message: "If that address has a Beyond.Ed account, a reset link is on its way.",
  };
}

const NewPassword = z
  .object({ password: Password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Those two passwords are not the same.",
    path: ["confirmPassword"],
  });

/**
 * Sets a new password.
 *
 * Only reachable with the session the recovery link established, which is what
 * proves the person controls the address. There is no path here that changes
 * somebody else's password: `updateUser` acts on `auth.uid()` and nothing else.
 */
export async function setNewPasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  if (authMode() !== "supabase") redirect("/?error=demo_disabled");

  const parsed = NewPassword.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return failure(
      parsed.error.issues[0]?.message ?? "Check the details and try again.",
      "Your password has not been changed.",
      "Correct the highlighted field and try again.",
    );
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return failure(
      "This reset link is no longer valid.",
      "Your password has not been changed.",
      "Request a new link from the sign-in page.",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return failure(
      "That password could not be saved.",
      "Your password has not been changed.",
      "Try a longer password, then request a new link if it keeps failing.",
    );
  }

  const state = await sessionState();
  redirect(
    state.kind === "signed_in" ? ROLE_PRESENTATION[state.user.role].home : "/",
  );
}

// ---------------------------------------------------------------------------
// Out
// ---------------------------------------------------------------------------

export async function signOut() {
  if (authMode() === "supabase") {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } else {
    const jar = await cookies();
    jar.delete(DEMO_SESSION_COOKIE);
  }
  redirect("/?signed_out=1");
}

// ---------------------------------------------------------------------------
// Demo mode only (ADR 0003)
// ---------------------------------------------------------------------------

/**
 * Demo identity selection. NOT authentication.
 *
 * Refused outright when Supabase is configured, so a deployment that has a real
 * database cannot be talked into handing out a seeded identity by posting to
 * this action directly.
 */
const DemoSignIn = z.object({ userId: z.string().min(1).max(64) });

export async function signInAs(formData: FormData) {
  if (authMode() === "supabase") redirect("/?error=demo_disabled");

  ensureSeeded();
  const parsed = DemoSignIn.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) redirect("/?error=invalid");

  const user = db().users.find((u) => u.id === parsed.data.userId);
  if (!user) redirect("/?error=unknown");

  const jar = await cookies();
  jar.set(DEMO_SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect(ROLE_PRESENTATION[user.role].home);
}

/**
 * Rebuilds the seeded store from scratch. A demo-mode control, and labelled as
 * one: it is refused when a real database is configured, where "rebuild the
 * data" would mean something very different.
 */
export async function resetDemoData() {
  if (authMode() === "supabase") redirect("/?error=demo_disabled");

  clearDatabase();
  ensureSeeded();
  const jar = await cookies();
  jar.delete(DEMO_SESSION_COOKIE);
  redirect("/?reset=1");
}
