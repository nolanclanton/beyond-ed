import type { CSSProperties } from "react";

import type { Metadata } from "next";
import Link from "next/link";

import { resetDemoData, signInAs } from "@/lib/actions/session";
import { ROLE_PRESENTATION } from "@/lib/auth/roles";
import { PORTALS } from "@/lib/auth/portals";
import { COURSES } from "@/lib/curriculum/catalog";
import { ensureSeeded } from "@/lib/db/seed";
import { db } from "@/lib/db/store";
import { ScrollReveal } from "@/lib/design/scroll-reveal";
import { FOCUS_RING, PORTAL_ACCENTS } from "@/lib/design/tokens";
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
 * Layout: a single lit brand banner states what this is, then the page settles
 * onto the light canvas the product itself uses, with the portal cards lifted
 * over the seam. The dark field is the greeting, not the whole room — a wall of
 * it is heavier than a first screen should be, and the cards read as the
 * product's own surfaces because they are the same surfaces.
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

  const namedPeople = grouped.reduce((n, g) => n + g.users.length, 0);

  /** The four figures that describe the build at a glance. */
  const headline: readonly [string, string][] = [
    [String(CAPACITY_CONTRACT.totalDays), "available workdays"],
    [String(CAPACITY_CONTRACT.pathwayDays), "pathway days"],
    [String(CAPACITY_CONTRACT.interventionDays), "intervention days"],
    [String(COURSES.length), "courses authored"],
  ];

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <ScrollReveal />

      <header className="brand-field-lit text-white">
        <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pb-32 sm:pt-10">
          <div className="rise-in flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-semibold tracking-tight">
              Beyond<span className="text-brand-accent">.Ed</span>
            </p>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-brand-accent"
              />
              Beta preview &middot; no sign-in required
            </p>
          </div>

          <div
            className="rise-in mt-16 max-w-3xl sm:mt-24"
            style={{ "--rise-delay": "0.08s" } as CSSProperties}
          >
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Coherent pathways.
              <br />
              <span className="text-white/70">Evidence you can point at.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              A grades 6&ndash;12 learning and academic-operations platform:
              course pathways that hold together, support that follows the
              evidence, and decisions that stay with a person.
            </p>
          </div>

          <dl className="rise-in-group mt-14 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-white/15 pt-8 sm:mt-16 sm:grid-cols-4">
            {headline.map(([value, label]) => (
              <div key={label}>
                <dd className="text-3xl font-bold tracking-tight text-white">
                  {value}
                </dd>
                <dt className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <main className="mx-auto -mt-20 w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6">
        {params.reset ? (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-positive-line bg-positive-surface px-5 py-4 text-sm text-ink"
          >
            <p className="font-semibold">Demo data rebuilt.</p>
            <p className="mt-0.5 text-ink-muted">
              Everything is back to the seeded starting state.
            </p>
          </div>
        ) : null}
        {params.error ? (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-urgent-line bg-urgent-surface px-5 py-4 text-sm text-ink"
          >
            <p className="font-semibold">That person is not in the demo roster.</p>
            <p className="mt-0.5 text-ink-muted">Choose a portal below.</p>
          </div>
        ) : null}

        <section aria-labelledby="portals">
          <h2 id="portals" className="sr-only">
            Choose a portal
          </h2>
          <ul className="reveal-group grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PORTALS.map((portal, index) => {
              const accent = PORTAL_ACCENTS[portal.role];
              // The student portal leads: it is the surface the product exists
              // for, so it takes the wide slot and a larger reading size.
              const featured = index === 0;
              return (
                <li
                  key={portal.role}
                  className={featured ? "lg:col-span-2" : undefined}
                >
                  <form action={signInAs} className="reveal h-full">
                    <input type="hidden" name="userId" value={portal.defaultUserId} />
                    <button
                      type="submit"
                      className={`group flex h-full w-full flex-col rounded-2xl border border-line bg-surface p-6 text-left shadow-[0_1px_2px_rgba(28,31,35,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-18px_rgba(12,58,71,0.45)] ${accent.edge} ${FOCUS_RING}`}
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.tile}`}
                        aria-hidden="true"
                      >
                        <PortalGlyph role={portal.role} />
                      </span>
                      <span
                        className={`mt-5 block text-[11px] font-bold uppercase tracking-[0.14em] ${accent.text}`}
                      >
                        {portal.eyebrow}
                      </span>
                      <span
                        className={`mt-1.5 block text-xl font-bold tracking-tight text-ink sm:text-2xl ${
                          featured ? "lg:text-3xl" : ""
                        }`}
                      >
                        {portal.name}
                      </span>
                      <span
                        className={`mt-2.5 block flex-1 text-sm leading-relaxed text-ink-muted ${
                          featured ? "max-w-xl lg:text-base" : ""
                        }`}
                      >
                        {portal.summary}
                      </span>
                      <span className="mt-6 flex items-center gap-2 border-t border-line pt-4 text-sm font-semibold text-ink">
                        {portal.cta}
                        <ArrowRight />
                      </span>
                      <span className="mt-1.5 block text-xs text-ink-muted">
                        {portal.dataNote}
                      </span>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="examples" className="mt-5">
          <h2 id="examples" className="sr-only">
            Example lessons
          </h2>
          <div className="reveal flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary-line bg-primary-surface px-6 py-5">
            <div>
              <p className="text-base font-semibold text-ink">
                Explore example lessons
              </p>
              <p className="mt-0.5 text-sm text-ink-muted">
                Operation Firewall and City Transit &middot; open from the student
                portal
              </p>
            </div>
            <form action={signInAs}>
              <input type="hidden" name="userId" value="u_amara" />
              <button
                type="submit"
                className={`group inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-strong ${FOCUS_RING}`}
              >
                View examples
                <ArrowRight />
              </button>
            </form>
          </div>
        </section>

        <section aria-labelledby="about" className="mt-14">
          <h2 id="about" className="reveal text-xl font-bold tracking-tight text-ink">
            What this build is, plainly
          </h2>
          <div className="reveal-group mt-5 grid gap-4 sm:gap-5 lg:grid-cols-3">
            <div className="reveal rounded-2xl border border-line bg-surface p-6">
              <p className="text-sm font-semibold text-ink">
                What is behind the demo
              </p>
              <dl className="mt-4 flex flex-col gap-2.5 text-sm">
                {[
                  [CAPACITY_CONTRACT.totalDays, "available workdays"],
                  [CAPACITY_CONTRACT.pathwayDays, "normal pathway days"],
                  [CAPACITY_CONTRACT.interventionDays, "intervention-capacity days"],
                  [COURSES.length, "courses in the catalog"],
                  [d.sites.length, "sites"],
                  [students, "students"],
                  [teachers, "teachers"],
                ].map(([value, label]) => (
                  <div
                    key={String(label)}
                    className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5 last:border-0 last:pb-0"
                  >
                    <dt className="text-ink-muted">{label}</dt>
                    <dd className="font-bold tabular-nums text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="reveal rounded-2xl border border-line bg-surface p-6 lg:col-span-2">
              <p className="text-sm font-semibold text-ink">
                No accounts, no invented certainty, no assistant
              </p>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-3 text-sm leading-relaxed text-ink-muted">
                  <p>
                    There is no password field because there are no accounts.
                    Choosing a portal sets a cookie holding a seeded user id,
                    which the server reads and scope-checks on every request like
                    a real session. Real sign-in arrives with Supabase Auth.
                  </p>
                  <p>
                    Data lives in memory and resets when the server restarts.
                  </p>
                </div>
                <div className="flex flex-col gap-3 text-sm leading-relaxed text-ink-muted">
                  <p>
                    The seeded tenant &mdash; {organization?.name} &mdash; is a
                    fictional district, and every person, roster, grade, and
                    result in it is invented. Beyond.Ed is standalone software:
                    the organization is a record it reads, not something built
                    into the product.
                  </p>
                  <p>
                    Beyond.Ed contains no AI tutor, chatbot, copilot, or
                    conversational assistant. Individualized review uses
                    transparent, versioned curriculum rules over stored evidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="people" className="mt-5">
          <details className="reveal group rounded-2xl border border-line bg-surface">
            <summary
              className={`flex cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl px-6 py-5 text-sm font-semibold text-ink ${FOCUS_RING}`}
            >
              <Chevron />
              <h2 id="people" className="inline">
                Open as a specific person instead
              </h2>
              <span className="font-normal text-ink-muted">
                ({students + teachers} people seeded &mdash; {namedPeople}{" "}
                hand-written)
              </span>
            </summary>
            <div className="border-t border-line px-6 py-6">
              <div className="flex flex-col gap-6">
                {grouped.map(({ role, users }) => (
                  <div key={role}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                      {ROLE_PRESENTATION[role].label}
                    </p>
                    <ul className="mt-2.5 flex flex-wrap gap-2">
                      {users.map((user) => {
                        const site = d.sites.find((s) => s.id === user.siteId);
                        return (
                          <li key={user.id}>
                            <form action={signInAs}>
                              <input type="hidden" name="userId" value={user.id} />
                              <button
                                type="submit"
                                className={`flex flex-col items-start rounded-lg border border-line bg-canvas px-3.5 py-2 text-left transition-colors hover:border-primary-line hover:bg-primary-surface ${FOCUS_RING}`}
                              >
                                <span className="text-sm font-semibold text-ink">
                                  {user.firstName} {user.lastName}
                                </span>
                                <span className="text-xs text-ink-muted">
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

              <form action={resetDemoData} className="mt-7 border-t border-line pt-5">
                <p className="text-sm text-ink-muted">
                  Rebuild the seeded store from scratch. Anything assigned,
                  dismissed, submitted, or published during this session is
                  discarded.
                </p>
                <button
                  type="submit"
                  className={`mt-3 rounded-lg border border-line-strong bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-sunken ${FOCUS_RING}`}
                >
                  Rebuild demo data
                </button>
              </form>
            </div>
          </details>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-ink-muted sm:px-6">
          <p>
            <Link
              href="/today"
              className={`font-semibold text-ink underline-offset-4 hover:underline ${FOCUS_RING}`}
            >
              Beyond.Ed
            </Link>{" "}
            &mdash; a grades 6&ndash;12 learning and academic-operations
            platform.
          </p>
          <p>Beta preview &middot; seeded demo data</p>
        </div>
      </footer>
    </div>
  );
}

/** The affordance arrow on a card or button. Decorative — the label carries it. */
function ArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="transition-transform duration-200 group-hover:translate-x-0.5"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

/** Disclosure marker for the "specific person" panel. Decorative. */
function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-ink-muted transition-transform duration-200 group-open:rotate-90"
    >
      <path d="M6 3l5 5-5 5" />
    </svg>
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
