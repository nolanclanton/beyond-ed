import type { Metadata } from "next";

import { authMode, requireUser } from "@/lib/auth/session";
import { Banner, Card, PreviewAction, SectionHeading } from "@/lib/design/primitives";
import { AccountsPanel } from "@/lib/provisioning/accounts-panel";
import { grantableRoles, loadDirectory } from "@/lib/provisioning/directory";

export const metadata: Metadata = {
  title: "Accounts · Beyond.Ed",
  description: "Provision student and teacher accounts for this school.",
};

/**
 * Site-level account provisioning (blueprint §6, CLAUDE.md §3).
 *
 * A site administrator provisions students and teachers **at their own school**
 * and nothing else. That boundary is not enforced by this page: the
 * `can_provision` helper and the `invitations_insert_admin` policy refuse
 * anything wider at the database, so a request crafted by hand fails the same
 * way a mis-built form would. The role list here simply does not offer choices
 * that would be refused, so nothing on screen is a dead control.
 *
 * Withdrawing access is not a delete, here or anywhere. It stops the person
 * signing in from their next attempt onward and leaves every record they
 * produced exactly where it is (CLAUDE.md §6).
 */
export default async function SiteAccountsPage() {
  const actor = await requireUser();

  if (authMode() !== "supabase") {
    return (
      <div className="py-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Accounts</h1>
          <p className="mt-2 max-w-3xl text-base text-ink-muted">
            Provision student and teacher accounts for this school.
          </p>
        </header>
        <div className="mt-6">
          <Card className="p-5">
            <PreviewAction
              label="Provision an account"
              detail="Unavailable in the local demo build, which has no database and no authentication. Configure a Supabase project and this becomes the real account portal for this school."
            />
          </Card>
        </div>
      </div>
    );
  }

  const directory = await loadDirectory(actor);

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Accounts</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          Provision student and teacher accounts for this school. Everyone signs
          in with the address you record here. Each one gets a one-time
          setup code to hand over, and chooses their own password with it — you
          never see or set a password, and nobody can register themselves.
        </p>
      </header>

      <div className="mt-5">
        <Banner title="Students and teachers, at this school only." tone="info">
          Site administrator, organization administrator, and curriculum author
          accounts are provisioned by an organization administrator. Every action
          on this page writes an audit event with your name, the time, and your
          reason.
        </Banner>
      </div>

      <section aria-labelledby="accounts" className="mt-8">
        <SectionHeading id="accounts" hint="Issued, waiting, and already claimed.">
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
    </div>
  );
}
