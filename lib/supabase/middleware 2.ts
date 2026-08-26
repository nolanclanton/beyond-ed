/**
 * Session refresh, run on every matched request.
 *
 * Supabase access tokens are short-lived. A Server Component cannot set a
 * cookie, so without this the refreshed token would be minted on each request
 * and immediately thrown away, and a signed-in person would be logged out the
 * moment their first token expired. Middleware is the one place in the request
 * that can both read the old cookies and write the new ones.
 *
 * It refreshes the session and nothing else. Route protection lives in the role
 * layouts under `/app`, where the profile — and therefore the role — has
 * actually been resolved from the database; middleware only knows whether a
 * token exists, which is not the same question.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured, supabaseEnv } from "./env";

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // An unconfigured deployment has no session to refresh; the entry page says
  // so plainly rather than pretending to have one.
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const { url, publishableKey } = supabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Do not remove. `getUser()` revalidates the token against the Auth server,
  // which is what triggers the refresh and the cookie writes above. Reading the
  // session from the cookie alone would trust a value the browser sent.
  await supabase.auth.getUser();

  return response;
}
