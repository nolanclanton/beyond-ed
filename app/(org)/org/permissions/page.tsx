import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { ROLE_PRESENTATION } from "@/lib/auth/roles";
import { visibleStudentIds } from "@/lib/auth/scope";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  PreviewAction,
  ScrollX,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";

export const metadata: Metadata = {
  title: "Permissions · Beyond.Ed",
  description: "Roles, scope, and what each person can actually see.",
};

/**
 * Permissions (blueprint §6, CLAUDE.md §3).
 *
 * The scope column is not a description — it is computed by calling the same
 * `visibleStudentIds` the application uses on every read, so what is shown here
 * is what the person actually sees.
 */
export default async function PermissionsPage() {
  const actor = await requireUser();
  const d = db();
  const people = [...d.users].sort(
    (a, b) => a.role.localeCompare(b.role) || a.lastName.localeCompare(b.lastName),
  );

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Permissions</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          {people.length} people. Scope is enforced on every read and write, not
          only in the interface.
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

      <section aria-labelledby="roles" className="mt-8">
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

      <section aria-labelledby="people" className="mt-10">
        <SectionHeading
          id="people"
          hint="The student count is computed with the same scope resolver the application uses."
        >
          People
        </SectionHeading>
        <Card>
          <CardHeader title="Role assignments" hint={`${people.length} users`} />
          <ScrollX>
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Person</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Role</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Site</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Curriculum author</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Students in scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {people.map((u) => {
                  const site = d.sites.find((s) => s.id === u.siteId);
                  return (
                    <tr key={u.id}>
                      <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                        {u.firstName} {u.lastName}
                      </th>
                      <td className="px-5 py-2.5 text-xs text-ink-muted">
                        {ROLE_PRESENTATION[u.role].label}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-ink-muted">
                        {site?.shortName ?? "Organization"}
                      </td>
                      <td className="px-5 py-2.5">
                        {u.curriculumAuthor ? (
                          <StatusChip label="Authorized" tone="info" />
                        ) : (
                          <span className="text-xs text-ink-muted">No</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-ink-muted">
                        {visibleStudentIds(u).length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollX>
        </Card>
      </section>

      <section aria-labelledby="changes" className="mt-10">
        <SectionHeading
          id="changes"
          hint="Role changes are audited with actor, target, before, after, and reason."
        >
          Changing a role
        </SectionHeading>
        <Card className="p-5">
          <PreviewAction
            label="Change a role"
            detail="Not built. Role changes need a confirmation step, an audit event, and a re-check of every scope the person currently holds. Until that is real, this control does nothing rather than appearing to work."
          />
          <p className="mt-4 text-sm text-ink-muted">
            You are signed in as {actor.firstName} {actor.lastName}.
          </p>
        </Card>
      </section>
    </div>
  );
}
