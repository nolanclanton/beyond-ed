import { cookies } from "next/headers";

import { db } from "@/lib/db/store";
import { ensureSeeded } from "@/lib/db/seed";
import type { User } from "@/lib/db/types";

/**
 * Demo identity resolution.
 *
 * THIS IS NOT AUTHENTICATION. The approved stack uses Supabase Auth
 * (CLAUDE.md §1), which needs a provisioned project and a human to set the
 * environment variables. Until then the beta resolves an identity from a
 * server-read cookie holding a seeded user id, so every role's workspace is
 * reviewable. There are no passwords and no credentials anywhere in this build.
 *
 * What is real, and stays real when Supabase Auth lands:
 *  - the identity is resolved SERVER-SIDE on every request; the browser never
 *    asserts who it is beyond naming a seeded user id,
 *  - every read and every write is scope-checked against that identity in
 *    `lib/auth/scope.ts`,
 *  - an unknown or absent id resolves to no session rather than to a default.
 *
 * `next/headers` is server-only by construction: importing this module from a
 * Client Component is a build error, which is the guarantee that matters.
 *
 * See ADR 0003.
 */
const COOKIE = "beyond_ed_demo_user";

export async function currentUser(): Promise<User | null> {
  ensureSeeded();
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  return db().users.find((u) => u.id === id) ?? null;
}

/** For pages that cannot render without an identity. */
export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) {
    throw new Error(
      "No demo identity selected. Choose one on the Beyond.Ed sign-in page.",
    );
  }
  return user;
}

export const DEMO_SESSION_COOKIE = COOKIE;
