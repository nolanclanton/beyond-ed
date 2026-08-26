import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { ROLE_PRESENTATION } from "@/lib/auth/roles";
import { Banner, Card, SectionHeading } from "@/lib/design/primitives";
import { AccountsPanel } from "@/lib/provisioning/accounts-panel";
import { grantableRoles, loadDirectory } from "@/lib/provisioning/directory";

export const metadata: Metadata = {
  title: "Accounts and permissions · Beyond.Ed",
  description:
    "Provision district accounts, and see the roles and scope each person holds.",
};

/**
 * Accounts and permissions (blueprint §6, CLAUDE.md §3).
 *
 * Two things live here because they are the same question asked twice: who has
 * an account, and what does that account let them see.
 *
 * The provisioning panel is the district's ONLY route to a new account. Signing
 * up does not create one — the database refuses any address an
 * administrator has not already invited, and any setup code that
 * does not match (migrations 0012 and 0019) — so this page is
 * where a person's access begins and ends.
 */
export default async function PermissionsPage() {
  const actor = await requireUser();
  const directory = await loadDirectory(actor);

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Accounts and permissions
        </h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          Accounts are created here, one address at a time. Scope is
          enforced on every read and write, not only in the interface.
        </p>
      </header>

      <div className="mt-5">
        <Banner title="Default deny. Every grant is explicit and narrow." tone="info">
          Scope is hierarchical: organization &rarr; site &rarr; teacher &rarr;
          roster section &rarr; student &rarr; course &rarr; curriculum
          authorization. Curriculum authoring is checked independently of role, so
          an organization administrator without it cannot publish.
        </Banner>
      </div>

      <section aria-labelledby="accounts" className="mt-8">
        <SectionHeading
          id="accounts"
          hint="Every action here writes an audit event with your name, the time, and your reason."
        >
          District accounts
        </SectionHeading>
        <AccountsPanel
          invitations={directory.invitations}
          people={directory.people}
          sites={directory.sites}
          grantableRoles={grantableRoles(actor)}
          actorId={actor.id}
          error={directory.error}
        />
      </section>

      <section aria-labelledby="roles" className="mt-10">
        <SectionHeading id="roles" hint="The closed role set.">
          Roles
        </SectionHeading>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(ROLE_PRESENTATION).map(([role, p]) => (
            <Card key={role} className="p-4">
              <p className="text-sm font-semibold text-ink">{p.label}</p>
              <p className="mt-0.5 text-xs font-medium text-ink-muted">Scope: {p.scope}</p>
              <p className="mt-1.5 text-sm text-ink-muted">{p.summary}</p>
            </Card>
          ))}
        </div>
      </section>

    </div>
  );
}
