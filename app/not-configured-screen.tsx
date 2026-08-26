/**
 * What this deployment shows when it has no database.
 *
 * It exists so that a deployment missing its environment variables fails
 * VISIBLY and harmlessly, rather than throwing on the first query or — worse —
 * quietly falling back to something that looks like a working product. There is
 * no demo mode to fall back to any more, and inventing one here would recreate
 * the exact thing it was removed for.
 *
 * It states the cause without stating the fix in operational detail: a stranger
 * reading this page learns that the site is misconfigured, not how it is wired.
 */
export function NotConfiguredScreen() {
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <header className="brand-field-lit text-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="text-base font-semibold tracking-tight">
            Beyond<span className="text-brand-accent">.Ed</span>
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          This deployment is not configured yet.
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted">
          Beyond.Ed cannot reach its database, so there is nothing to sign in
          to. Nobody&rsquo;s account or records are affected &mdash; this
          deployment simply has not been connected.
        </p>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted">
          If you administer this site, the setup steps are in{" "}
          <code className="rounded border border-line bg-surface px-1.5 py-0.5 text-sm">
            SUPABASE_SETUP.md
          </code>
          . Everyone else: please check back shortly.
        </p>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 text-xs text-ink-muted sm:px-6">
          Beyond.Ed &mdash; a grades 6&ndash;12 learning and academic-operations
          platform.
        </div>
      </footer>
    </div>
  );
}
