import type { Metadata } from "next";
import Link from "next/link";

import { resetDemoData, signInAs } from "@/lib/actions/session";
import { ROLE_PRESENTATION } from "@/lib/auth/roles";
import { PORTALS } from "@/lib/auth/portals";
import { COURSES } from "@/lib/curriculum/catalog";
import { ensureSeeded } from "@/lib/db/seed";
import { db } from "@/lib/db/store";
import { FOCUS_RING, FOCUS_RING_ON_BRAND, PORTAL_ACCENTS } from "@/lib/design/tokens";
import { CAPACITY_CONTRACT } from "@/lib/rules/versions";

export const metadata: Metadata = {
  title: "Beyond.Ed",
  description:
    "A grades 6-12 learning and academic-operations platform: coherent core pathways, evidence-based intervention, and accountable human decisions.",
};

/**
 * The entry screen.
 *
 * A PORTAL picker, not a roster. Five choices, each opening as the demo person
 * whose record demonstrates that role. Everyone else stays reachable from the
 * disclosure at the bottom, so nothing is lost — it is just no longer the first
 * thing a reviewer has to read.
 *
 * This is not authentication. There is no password field because there are no
 * accounts (ADR 0003). Choosing a portal sets a cookie holding a seeded user
 * id, which the server reads and scope-checks on every request.
 */
export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; error?: string }>;
}) {
  ensureSeeded();
  const params = await searchParams;
  const d = db();

  const isGenerated = (id: string) => id.startsWith("u_s_") || id.startsWith("u_t_");
  const students = d.users.filter((u) => u.role === "student").length;
  const teachers = d.users.filter((u) => u.role === "teacher").length;
  const organization = d.organizations[0];

  const order = ["student", "teacher", "site_admin", "org_admin", "curriculum_author"] as const;
  const grouped = order.map((role) => ({
    role,
    users: d.users
      .filter((u) => u.role === role)
      .filter((u) => role === "site_admin" || !isGenerated(u.id))
      .sort((a, b) => a.lastName.localeCompare(b.lastName)),
  }));

  return (
    <div className="brand-field flex min-h-full flex-col text-white">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-14 sm:px-6 sm:py-20">
        <header className="text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Beyond<span className="text-brand-accent">.Ed</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            Coherent course pathways, evidence-based support, and decisions that
            stay with a person.
          </p>
          <p className="mt-5 inline-flex items-center rounded-full border border-white/25 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white/80">
            Beta portal preview &middot; no sign-in required
          </p>
        </header>

        {params.reset ? (
          <div
            role="status"
            className="mx-auto mt-8 max-w-2xl rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm"
          >
            <p className="font-semibold">Demo data rebuilt.</p>
            <p className="mt-0.5 text-white/80">
              Everything is back to the seeded starting state.
            </p>
          </div>
        ) : null}
        {params.error ? (
          <div
            role="alert"
            className="mx-auto mt-8 max-w-2xl rounded-xl border border-urgent-line bg-urgent-surface px-4 py-3 text-sm text-ink"
          >
            <p className="font-semibold">That person is not in the demo roster.</p>
            <p className="mt-0.5">Choose a portal below.</p>
          </div>
        ) : null}

        <section aria-labelledby="portals" className="mt-12">
          <h2 id="portals" className="sr-only">
            Choose a portal
          </h2>
          <ul className="grid gap-5 md:grid-cols-2">
            {PORTALS.map((portal, index) => {
              const accent = PORTAL_ACCENTS[portal.role];
              const isLast = index === PORTALS.length - 1;
              return (
                <li
                  key={portal.role}
                  className={
                    isLast && PORTALS.length % 2 === 1 ? "md:col-span-2" : undefined
                  }
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-surface text-ink shadow-lg">
                    <div className={`h-1.5 ${accent.tile}`} aria-hidden="true" />
                    <div className="flex flex-1 flex-col p-6">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.tile}`}
                        aria-hidden="true"
                      >
                        <PortalGlyph role={portal.role} />
                      </span>
                      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink-muted">
                        {portal.eyebrow}
                      </p>
                      <h3 className="mt-1 text-2xl font-bold tracking-tight text-ink">
                        {portal.name}
                      </h3>
                      <p className="mt-2 flex-1 text-sm text-ink-muted">{portal.summary}</p>

                      <form action={signInAs} className="mt-5">
                        <input type="hidden" name="userId" value={portal.defaultUserId} />
                        <button
                          type="submit"
                          className={`w-full rounded-lg px-5 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 ${accent.tile} ${FOCUS_RING}`}
                        >
                          {portal.cta}
                        </button>
                      </form>
                      <p className="mt-3 text-xs text-ink-muted">{portal.dataNote}</p>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="examples" className="mt-6">
          <h2 id="examples" className="sr-only">
            Example lessons
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/20 bg-white/5 px-6 py-5">
            <div>
              <p className="text-base font-semibold">Explore example lessons</p>
              <p className="mt-0.5 text-sm text-white/75">
                Operation Firewall and City Transit &middot; open from the student
                portal
              </p>
            </div>
            <form action={signInAs}>
              <input type="hidden" name="userId" value="u_amara" />
              <button
                type="submit"
                className={`rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 ${FOCUS_RING_ON_BRAND}`}
              >
                View examples &rarr;
              </button>
            </form>
          </div>
        </section>

        <section aria-labelledby="about" className="mt-14">
          <h2 id="about" className="sr-only">
            About this build
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-white">
                What is behind the demo
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {[
                  [CAPACITY_CONTRACT.totalDays, "available workdays"],
                  [CAPACITY_CONTRACT.pathwayDays, "normal pathway days"],
                  [CAPACITY_CONTRACT.interventionDays, "intervention-capacity days"],
                  [COURSES.length, "courses in the catalog"],
                  [d.sites.length, "sites"],
                  [students, "students"],
                  [teachers, "teachers"],
                ].map(([value, label]) => (
                  <div key={String(label)}>
                    <dt className="sr-only">{String(label)}</dt>
                    <dd className="text-white/80">
                      <strong className="font-bold text-white">{value}</strong>{" "}
                      {label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                What this build is, plainly
              </p>
              <p className="mt-3 text-sm text-white/80">
                There is no password field because there are no accounts.
                Choosing a portal sets a cookie holding a seeded user id, which
                the server reads and scope-checks on every request like a real
                session. Real sign-in arrives with Supabase Auth.
              </p>
              <p className="mt-3 text-sm text-white/80">
                Data lives in memory and resets when the server restarts. The
                seeded tenant &mdash; {organization?.name} &mdash; is a fictional
                district, and every person, roster, grade, and result in it is
                invented. Beyond.Ed is standalone software: the organization is a
                record it reads, not something built into the product.
              </p>
              <p className="mt-3 text-sm text-white/80">
                Beyond.Ed contains no AI tutor, chatbot, copilot, or
                conversational assistant. Individualized review uses transparent,
                versioned curriculum rules over stored evidence.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="people" className="mt-12">
          <details className="rounded-2xl border border-white/20 bg-white/5">
            <summary
              className={`cursor-pointer list-none px-6 py-4 text-sm font-semibold text-white ${FOCUS_RING_ON_BRAND}`}
            >
              <h2 id="people" className="inline">
                Open as a specific person instead
              </h2>
              <span className="ml-2 font-normal text-white/70">
                ({students + teachers + grouped.reduce((n, g) => n + (g.role === "site_admin" ? g.users.length : 0), 0)}{" "}
                people seeded &mdash; these are the hand-written ones)
              </span>
            </summary>
            <div className="border-t border-white/15 px-6 py-5">
              <div className="flex flex-col gap-5">
                {grouped.map(({ role, users }) => (
                  <div key={role}>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                      {ROLE_PRESENTATION[role].label}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {users.map((user) => {
                        const site = d.sites.find((s) => s.id === user.siteId);
                        return (
                          <li key={user.id}>
                            <form action={signInAs}>
                              <input type="hidden" name="userId" value={user.id} />
                              <button
                                type="submit"
                                className={`flex flex-col items-start rounded-lg border border-white/25 bg-white/5 px-3.5 py-2 text-left transition-colors hover:bg-white/15 ${FOCUS_RING_ON_BRAND}`}
                              >
                                <span className="text-sm font-semibold text-white">
                                  {user.firstName} {user.lastName}
                                </span>
                                <span className="text-xs text-white/70">
                                  {user.gradeLevel
                                    ? `Grade ${user.gradeLevel}`
                                    : ROLE_PRESENTATION[role].scope}
                                  {site ? ` · ${site.shortName}` : ""}
                                  {user.curriculumAuthor && role !== "curriculum_author"
                                    ? " · also a curriculum author"
                                    : ""}
                                </span>
                              </button>
                            </form>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              <form action={resetDemoData} className="mt-6 border-t border-white/15 pt-5">
                <p className="text-sm text-white/80">
                  Rebuild the seeded store from scratch. Anything assigned,
                  dismissed, submitted, or published during this session is
                  discarded.
                </p>
                <button
                  type="submit"
                  className={`mt-3 rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 ${FOCUS_RING_ON_BRAND}`}
                >
                  Rebuild demo data
                </button>
              </form>
            </div>
          </details>
        </section>

        <p className="mt-12 text-center text-xs text-white/55">
          <Link href="/today" className={`underline underline-offset-4 ${FOCUS_RING_ON_BRAND}`}>
            Beyond.Ed
          </Link>{" "}
          &mdash; a grades 6&ndash;12 learning and academic-operations platform.
        </p>
      </main>
    </div>
  );
}

/** Simple geometric glyphs. Decorative — every card is labelled in text. */
function PortalGlyph({ role }: { role: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "text-white",
  };
  switch (role) {
    case "student":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M10 3 2 7l8 4 8-4-8-4Z" />
          <path d="M5 9v4c0 1.1 2.2 2 5 2s5-.9 5-2V9" />
        </svg>
      );
    case "teacher":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M3 4h6a2 2 0 0 1 2 2v10a2 2 0 0 0-2-2H3V4Z" />
          <path d="M17 4h-4a2 2 0 0 0-2 2v10a2 2 0 0 1 2-2h4V4Z" />
        </svg>
      );
    case "site_admin":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M3 17V8l7-5 7 5v9" />
          <path d="M8 17v-5h4v5" />
        </svg>
      );
    case "org_admin":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M10 3v4M4 17v-6M16 17v-6M10 7 4 11M10 7l6 4" />
          <circle cx="10" cy="3" r="1.4" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 4h9a3 3 0 0 1 3 3v9H7a3 3 0 0 1-3-3V4Z" />
          <path d="M7 8h6M7 11h4" />
        </svg>
      );
  }
}
