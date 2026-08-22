import type { ReactNode } from "react";
import Link from "next/link";

import { signOut } from "@/lib/actions/session";
import { ROLE_PRESENTATION } from "@/lib/auth/roles";
import type { User } from "@/lib/db/types";
import { db } from "@/lib/db/store";

import { FOCUS_RING } from "./tokens";

export type NavItem = { label: string; href: string };

/**
 * The application shell. One header, one navigation, one identity line.
 *
 * The beta banner is not decoration: this build runs on a seeded in-memory
 * store with demo identities and no real authentication, and every page says so
 * once, in words (CLAUDE.md §12 — functional honesty).
 */
export function AppShell({
  user,
  nav,
  children,
  contextLine,
}: {
  user: User;
  nav: NavItem[];
  children: ReactNode;
  contextLine?: string;
}) {
  const d = db();
  const site = d.sites.find((s) => s.id === user.siteId);
  const role = ROLE_PRESENTATION[user.role];
  // The organization is a tenant read from the record, never a literal in a
  // component. Pointing the product at a different district changes data, not
  // markup.
  const organization = d.organizations.find((o) => o.id === user.orgId);

  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#main"
        className={`sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary focus:shadow-lg ${FOCUS_RING}`}
      >
        Skip to main content
      </a>

      <header className="bg-brand-maroon text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-2.5">
            <Link href={role.home} className={`text-base font-semibold tracking-tight ${FOCUS_RING}`}>
              Beyond<span className="text-white/70">.Ed</span>
            </Link>
            {organization ? (
              <>
                <span aria-hidden="true" className="text-white/40">/</span>
                <span className="text-sm text-white/80">{organization.name}</span>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-white/85">
              {user.firstName} {user.lastName}
              <span aria-hidden="true"> · </span>
              <span className="text-white/70">
                {role.label}
                {user.gradeLevel ? `, grade ${user.gradeLevel}` : ""}
                {site ? ` · ${site.shortName}` : ""}
              </span>
            </p>
            <form action={signOut}>
              <button
                type="submit"
                className={`rounded-md border border-white/30 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/10 ${FOCUS_RING}`}
              >
                Switch demo user
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav aria-label={`${role.label} sections`}>
            <ul className="-mb-px flex gap-1 overflow-x-auto">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`inline-block whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm font-medium text-ink-muted hover:border-primary-line hover:text-primary ${FOCUS_RING}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <p className="mx-auto w-full max-w-6xl px-4 pt-3 text-xs text-ink-muted sm:px-6">
        <strong className="font-semibold text-ink">Beta build.</strong> Demo
        identities, no authentication, and a seeded in-memory store that resets
        when the server restarts. Every person and result is fictional.
        {contextLine ? ` ${contextLine}` : ""}
      </p>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-ink-muted sm:px-6">
          Beyond.Ed contains no AI tutor, chatbot, copilot, or conversational
          assistant. Individualized review and recommendations use transparent,
          versioned curriculum rules over stored evidence, and every
          consequential decision is made by a person.
        </div>
      </footer>
    </div>
  );
}

export const STUDENT_NAV: NavItem[] = [
  { label: "Today", href: "/today" },
  { label: "Learn", href: "/learn" },
  { label: "Progress", href: "/progress" },
  { label: "Grades", href: "/grades" },
  { label: "Review", href: "/review" },
  { label: "Example lessons", href: "/examples" },
  { label: "Support", href: "/support" },
];

export const TEACHER_NAV: NavItem[] = [
  { label: "Action queue", href: "/teacher" },
  { label: "Caseload", href: "/teacher/caseload" },
  { label: "Intervention Center", href: "/teacher/intervention" },
  { label: "Curriculum", href: "/teacher/curriculum" },
  { label: "Reports", href: "/teacher/reports" },
];

export const SITE_NAV: NavItem[] = [
  { label: "Site overview", href: "/site" },
  { label: "Students", href: "/site/students" },
  { label: "Teacher assignments", href: "/site/assignments" },
  { label: "Unresolved queue", href: "/site/queue" },
];

export const ORG_NAV: NavItem[] = [
  { label: "Organization", href: "/org" },
  { label: "Curriculum governance", href: "/org/curriculum" },
  { label: "Intervention system", href: "/org/intervention" },
  { label: "Permissions", href: "/org/permissions" },
  { label: "Audit", href: "/org/audit" },
];
