import { cookies } from "next/headers";

import { db } from "@/lib/db/store";
import { ensureSeeded } from "@/lib/db/seed";
import type { User } from "@/lib/db/types";
import { loadProfile } from "@/lib/auth/profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Identity resolution.
 *
 * This build runs in one of two modes, decided by whether a Supabase project is
 * configured. There is no third mode and no way to mix them.
 *
 * **Supabase mode** — the real one, and the only one production runs in.
 * Identity is an address a district administrator provisioned. `auth.uid()`
 * comes from a token the Auth server revalidated this request, and the profile
 * is read from `public.users`, which only the `handle_new_auth_user` trigger
 * can write, and only from an invitation whose setup code the person produced.
 * There is no self sign-up: an address nobody provisioned gets no account, and
 * the refusal happens in the database rather than here.
 *
 * **Demo mode** — local development with no project configured. The landing
 * page is the labelled identity picker described in ADR 0003: a cookie naming a
 * seeded user id, no credentials, resets on restart. It exists so the five role
 * workspaces stay reviewable on a laptop without provisioning a database, and
 * it cannot be reached in production because production has the variables set.
 *
 * What is the same in both: identity is resolved SERVER-SIDE on every request,
 * the browser never asserts a role, and an unknown identity resolves to no
 * session rather than to a default.
 *
 * `next/headers` makes this module server-only by construction — importing it
 * from a Client Component is a build error.
 */
const COOKIE = "beyond_ed_demo_user";

export type AuthMode = "supabase" | "demo";

export function authMode(): AuthMode {
  return isSupabaseConfigured() ? "supabase" : "demo";
}

/**
 * Everything the sign-in page needs to say the right sentence.
 *
 * `currentUser()` collapses all four of these to "a user or nothing", which is
 * what the forty pages behind a role layout want. The sign-in page wants the
 * distinction: someone whose access was withdrawn and someone whose address was
 * never provisioned are in very different situations and neither is simply
 * "signed out".
 */
export type SessionState =
  | { kind: "signed_out" }
  | { kind: "signed_in"; user: User }
  | { kind: "no_profile"; email: string }
  | { kind: "deactivated"; email: string };

export async function sessionState(): Promise<SessionState> {
  if (!isSupabaseConfigured()) {
    const user = await demoUser();
    return user ? { kind: "signed_in", user } : { kind: "signed_out" };
  }

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
  if (!user) {
    throw new Error(
      authMode() === "supabase"
        ? "You are not signed in to Beyond.Ed."
        : "No demo identity selected. Choose one on the Beyond.Ed sign-in page.",
    );
  }
  return user;
}

/**
 * Demo mode only (ADR 0003). Reads an httpOnly cookie holding a seeded user id.
 * No credential is collected, stored, or checked; the browser can name a seeded
 * person but cannot assert a role, a site, or a scope.
 */
async function demoUser(): Promise<User | null> {
  ensureSeeded();
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  return db().users.find((u) => u.id === id) ?? null;
}

export const DEMO_SESSION_COOKIE = COOKIE;
