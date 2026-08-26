import { NextResponse, type NextRequest } from "next/server";

import { ROLE_PRESENTATION } from "@/lib/auth/roles";
import { sessionState } from "@/lib/auth/session";

/**
 * Where a link-based sign-in lands.
 *
 * In this build that means one thing: the password-recovery link. Ordinary
 * sign-in and account setup are form posts to server actions and never come
 * through here. (An OAuth provider would also return here, which is why the
 * exchange below is written generally rather than only for recovery.)
 *
 * Its job is to trade the one-time code for a session and then send the person
 * somewhere sensible. It never states a reason it does not know: a used or
 * expired link and a malformed one are indistinguishable from here, so both get
 * `/?error=denied`, which explains recovery links honestly.
 */

/**
 * Only a path within this site.
 *
 * `next` arrives in a URL, so it is attacker-supplied by definition. Anything
 * that is not a single-slash-prefixed relative path is discarded — a
 * protocol-relative `//evil.example` would otherwise turn this route into an
 * open redirect that borrows the site's credibility.
 */
function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (providerError || !code) {
    return NextResponse.redirect(`${origin}/?error=denied`);
  }

  // Imported lazily so this route still builds when Supabase is unconfigured.
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/?error=denied`);
  }

  // A recovery link asks for `/auth/reset`; that page is the point of the link,
  // and it is reachable only with the session this exchange just established.
  if (next) return NextResponse.redirect(`${origin}${next}`);

  // Otherwise send each role to its own workspace. Reading the profile back
  // rather than trusting anything in the callback URL means the destination is
  // decided by the row a district administrator wrote, not by a query
  // parameter.
  const state = await sessionState();
  if (state.kind !== "signed_in") {
    return NextResponse.redirect(`${origin}/?error=denied`);
  }

  return NextResponse.redirect(
    `${origin}${ROLE_PRESENTATION[state.user.role].home}`,
  );
}
