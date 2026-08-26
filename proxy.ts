import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Refreshes the Supabase session cookie on every page request. See
 * `lib/supabase/middleware.ts` for why this cannot be done in a layout.
 *
 * Next.js 16 renamed this file convention from `middleware` to `proxy`; the
 * behaviour is unchanged.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /**
     * Everything except static assets and images. The auth routes are
     * deliberately INCLUDED: `/auth/callback` exchanges the OAuth code for a
     * session, and that exchange needs the refreshed cookie jar.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
