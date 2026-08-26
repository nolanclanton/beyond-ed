/**
 * Where this deployment lives.
 *
 * OAuth needs an absolute redirect target, and the correct one differs per
 * environment: `beyond-ed.app` in production, a generated hostname on every
 * Vercel preview, `localhost` on a laptop. Getting it wrong sends a person who
 * signed in on a preview branch back to production, or vice versa.
 *
 * Resolution order, most specific first:
 *
 *  1. `NEXT_PUBLIC_SITE_URL` — set this explicitly in production. It is the
 *     only one that can name a custom domain, because Vercel's own variables
 *     report the deployment hostname, not the domain aliased onto it.
 *  2. `VERCEL_PROJECT_PRODUCTION_URL` on a production deployment.
 *  3. `VERCEL_URL` — the per-deployment hostname, which is what a preview wants.
 *  4. localhost.
 *
 * See SUPABASE_SETUP.md for the matching redirect allow-list, which has to be
 * configured in the Supabase dashboard for any of these to be accepted.
 */
function normalize(raw: string): string {
  const withScheme = raw.startsWith("http://") || raw.startsWith("https://")
    ? raw
    : `https://${raw}`;
  return withScheme.replace(/\/+$/, "");
}

export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return normalize(process.env.NEXT_PUBLIC_SITE_URL);
  }
  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return normalize(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }
  if (process.env.VERCEL_URL) {
    return normalize(process.env.VERCEL_URL);
  }
  return "http://localhost:3000";
}

/**
 * The absolute URL the OAuth provider redirects back to.
 *
 * Prefers the origin of the request being handled, so a preview deployment
 * reached by any of its several hostnames returns to the one the person is
 * actually using. Falls back to `siteUrl()` when there is no origin to read.
 */
export function callbackUrl(requestOrigin?: string | null): string {
  const base = requestOrigin ? normalize(requestOrigin) : siteUrl();
  return `${base}/auth/callback`;
}
