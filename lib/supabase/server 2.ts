/**
 * The SERVER Supabase client.
 *
 * This is the one every read and every write goes through. It is built from the
 * request's cookies, so the database sees the signed-in person as `auth.uid()`
 * and applies the row-level security policies in `/supabase/policies` to them
 * directly. Scope is enforced by the database, not by the query that happens to
 * be written above it — which is what CLAUDE.md §0.2 asks for and what the
 * application-layer resolver in `lib/auth/scope.ts` could only approximate.
 *
 * `next/headers` makes this module server-only by construction: importing it
 * from a Client Component is a build error. That is the guarantee that matters,
 * and it is why there is no runtime check here.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseEnv } from "./env";

export async function createClient() {
  const { url, publishableKey } = supabaseEnv();
  const jar = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            jar.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. This is expected and safe to
          // ignore: `middleware.ts` refreshes the session on every request, so
          // the write this call could not make has already happened there.
        }
      },
    },
  });
}
