/**
 * Supabase environment resolution.
 *
 * Two variables, both public by design:
 *
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *
 * The publishable key is meant to reach the browser. It carries no authority of
 * its own — every request it signs is still resolved against `auth.uid()` and
 * the row-level security policies in `/supabase/policies`. That is why the
 * policies are the security boundary and this key is not a secret.
 *
 * **There is no service-role key in this codebase, on the server or anywhere
 * else.** CLAUDE.md §3 confines it to migrations and system jobs, and nothing
 * the product does needs one: if a feature appears to, the policy is wrong and
 * the policy is what gets fixed. Keeping it absent means it cannot leak.
 *
 * `isSupabaseConfigured()` is the single switch between the two modes this
 * build can run in — see `lib/auth/session.ts`.
 */

/** True when a Supabase project is wired up. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export type SupabaseEnv = { url: string; publishableKey: string };

/**
 * Reads and validates both variables.
 *
 * Throws rather than returning a partial configuration: a client built from a
 * URL with no key fails later, at a request, with an error that describes
 * nothing. Callers that can run without Supabase check `isSupabaseConfigured()`
 * first.
 */
export function supabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!publishableKey) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Supabase is not configured: ${missing.join(" and ")} ${
        missing.length === 1 ? "is" : "are"
      } missing. See SUPABASE_SETUP.md.`,
    );
  }

  return { url: url as string, publishableKey: publishableKey as string };
}
