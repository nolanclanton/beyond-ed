import { cookies } from "next/headers";

import type { User } from "@/lib/db/types";
import { loadProfile } from "@/lib/auth/profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Identity resolution.
 *
 * Identity is an address a district administrator provisioned. `auth.uid()`
 * comes from a token the Auth server revalidated this request, and the profile
 * is read from `public.users`, which only the `handle_new_auth_user` trigger
 * can write — and only from an invitation whose setup code the person produced.
 *
 * There is no self sign-up: an address nobody provisioned gets no account, and
 * the refusal happens in the database rather than here.
 *
 * **There is no demo identity any more.** ADR 0003's seeded picker is gone,
 * along with the cookie it set and the actions that read it. A deployment with
 * no Supabase project does not fall back to it — there is nothing to fall back
 * to, and `unconfigured` says so plainly rather than handing out a pretend
 * session.
 *
 * Identity is resolved SERVER-SIDE on every request; the browser never asserts
 * a role; an unknown identity resolves to no session rather than to a default.
 */

/**
 * Everything the entry page needs to say the right sentence.
 *
 * `currentUser()` collapses these to "a user or nothing", which is what the
 * forty pages behind a role layout want. The entry page wants the distinction:
 * someone whose access was withdrawn, someone whose address was never
 * provisioned, and a deployment that was never configured are three different
 * situations, and none of them is simply "signed out".
 */
export type SessionState =
  | { kind: "unconfigured" }
  | { kind: "signed_out" }
  | { kind: "signed_in"; user: User }
  | { kind: "no_profile"; email: string }
  | { kind: "deactivated"; email: string };

export async function sessionState(): Promise<SessionState> {
  // Read the cookie jar before anything else, unconditionally.
  //
  // Identity is per-request by definition, so no page that depends on it may
  // ever be prerendered — and touching `cookies()` is what tells Next.js that.
  // Without this the unconfigured branch returns before any dynamic API is
  // used, Next happily prerenders the role workspaces at build time, and
  // `requireUser()` throws during the build rather than at a request. That
  // fails the deployment of a site whose environment variables simply have not
  // been set yet, which is the one moment it most needs to build.
  await cookies();

  if (!isSupabaseConfigured()) return { kind: "unconfigured" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { kind: "signed_out" };

  const email = data.user.email ?? "that account";
  const outcome = await loadProfile(supabase, data.user.id);

  switch (outcome.kind) {
    case "ok":
      return { kind: "signed_in", user: outcome.user };
    case "deactivated":
      return { kind: "deactivated", email };
    case "no_profile":
      return { kind: "no_profile", email };
  }
}

export async function currentUser(): Promise<User | null> {
  const state = await sessionState();
  return state.kind === "signed_in" ? state.user : null;
}

/** For pages that cannot render without an identity. */
export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) throw new Error("You are not signed in to Beyond.Ed.");
  return user;
}
