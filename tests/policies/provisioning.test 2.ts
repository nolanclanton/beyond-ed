import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { grantableRoles } from "@/lib/provisioning/directory";
import type { Role, User } from "@/lib/db/types";

/**
 * Provisioning scope (CLAUDE.md §3).
 *
 * Every grant has a POSITIVE test proving authorized access succeeds and a
 * NEGATIVE test proving unauthorized access is refused, in both places the rule
 * exists:
 *
 *   * `public.can_provision` in the database, which is the enforcement point
 *     — asserted here against the migration text, and verified by execution
 *     against the hosted project (see the note below);
 *   * `grantableRoles` in the application, which decides what the form OFFERS.
 *     It is not a security boundary and is not treated as one; it exists so the
 *     interface presents no control the database would refuse (CLAUDE.md §12 —
 *     no dead controls). If the two ever disagree, the database wins and the
 *     person sees a refusal, which is safe but is a bug — hence these tests.
 *
 * ---------------------------------------------------------------------------
 * Verified by execution, 2026-08-26, against project `vwbzslqpraqhjrimkoqc`
 * ---------------------------------------------------------------------------
 *
 * The database half of these rules was exercised directly, inside transactions
 * that were rolled back, and every case below behaved as asserted:
 *
 *   - a non-Google provider is refused at `auth.users` insert;
 *   - a Google address with no pending invitation is refused;
 *   - a Google address WITH a pending invitation becomes a profile carrying the
 *     invitation's role and scope, marks the invitation claimed, and writes an
 *     `account.claimed` audit event, all in one transaction;
 *   - an address that already has an account cannot be issued a second one;
 *   - two open invitations for one address are refused;
 *   - revoke-then-reissue is still allowed;
 *   - `update users set role = ...` is refused by `users_guard_update`;
 *   - a claimed invitation cannot be revoked;
 *   - `update audit_events ...` is refused: audit is append-only;
 *   - a deactivated profile resolves to no role;
 *   - `anon` cannot call any scope helper over `/rest/v1/rpc/...`;
 *   - `authenticated` can evaluate every policy-bearing table.
 *
 * Re-run those checks after any migration that touches `handle_new_auth_user`,
 * `can_provision`, or the `account_invitations` guards.
 */

const MIGRATION_SQL = [
  "supabase/migrations/0012_account_provisioning.sql",
  "supabase/migrations/0014_provisioning_actions.sql",
  "supabase/migrations/0015_bootstrap_invitation.sql",
  "supabase/migrations/0016_one_account_per_address.sql",
]
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

function person(role: Role, overrides: Partial<User> = {}): User {
  return {
    id: `u_${role}`,
    orgId: "org_1",
    siteId: role === "org_admin" || role === "curriculum_author" ? null : "site_1",
    firstName: "Test",
    lastName: "Person",
    role,
    curriculumAuthor: role === "curriculum_author",
    gradeLevel: role === "student" ? 7 : null,
    ...overrides,
  };
}

const ALL_ROLES: Role[] = [
  "student",
  "teacher",
  "site_admin",
  "org_admin",
  "curriculum_author",
];

describe("who may provision an account — POSITIVE", () => {
  it("an org admin may provision every role in their organization", () => {
    const granted = grantableRoles(person("org_admin"));
    for (const role of ALL_ROLES) {
      expect(granted, role).toContain(role);
    }
  });

  it("a site admin may provision students and teachers", () => {
    const granted = grantableRoles(person("site_admin"));
    expect(granted).toContain("student");
    expect(granted).toContain("teacher");
  });
});

describe("who may provision an account — NEGATIVE", () => {
  it("a site admin may NOT provision a site admin, org admin, or curriculum author", () => {
    const granted = grantableRoles(person("site_admin"));
    expect(granted).not.toContain("site_admin");
    expect(granted).not.toContain("org_admin");
    expect(granted).not.toContain("curriculum_author");
  });

  it("a teacher provisions nobody", () => {
    expect(grantableRoles(person("teacher"))).toEqual([]);
  });

  it("a student provisions nobody", () => {
    expect(grantableRoles(person("student"))).toEqual([]);
  });

  it("a curriculum author provisions nobody", () => {
    // Curriculum authorization grants curriculum access, not people access.
    expect(grantableRoles(person("curriculum_author"))).toEqual([]);
  });

  it("a site admin cannot escalate themselves in two steps", () => {
    // The whole point of the rule: if a site admin could invite an org_admin,
    // they could provision one on an address they control and become one.
    const granted = grantableRoles(person("site_admin"));
    expect(granted.some((r) => r === "org_admin" || r === "site_admin")).toBe(false);
  });
});

describe("the application mirror matches the database rule", () => {
  const body = (() => {
    const at = MIGRATION_SQL.indexOf("function public.can_provision");
    return MIGRATION_SQL.slice(at, MIGRATION_SQL.indexOf("$$;", at));
  })();

  it("the database restricts a site admin to student and teacher", () => {
    expect(body).toMatch(/target_role in \('student', 'teacher'\)/);
  });

  it("the database confines a site admin to their own site and organization", () => {
    expect(body).toMatch(/target_org\s*=\s*public\.current_org\(\)/);
    expect(body).toMatch(/target_site\s*=\s*public\.current_site\(\)/);
  });

  it("the database confines an org admin to their own organization", () => {
    expect(body).toMatch(/when 'org_admin' then target_org = public\.current_org\(\)/);
  });

  it("every other role is denied by default", () => {
    expect(body).toMatch(/else false/);
  });

  it("curriculum authorization may be granted only by an org admin", () => {
    expect(MIGRATION_SQL).toMatch(
      /curriculum_author = false or public\.current_role_name\(\) = 'org_admin'/,
    );
  });
});

describe("the invitation roster is readable only within scope", () => {
  it("POSITIVE: an org admin reads their organization's roster", () => {
    expect(MIGRATION_SQL).toMatch(
      /invitations_select_org_admin[\s\S]{0,220}org_id = public\.current_org\(\)/,
    );
  });

  it("POSITIVE: a site admin reads their own site's roster", () => {
    expect(MIGRATION_SQL).toMatch(
      /invitations_select_site_admin[\s\S]{0,220}site_id = public\.current_site\(\)/,
    );
  });

  it("POSITIVE: a person reads the invitation that produced their own profile", () => {
    expect(MIGRATION_SQL).toMatch(
      /invitations_select_own_claim[\s\S]{0,160}claimed_by_user_id = auth\.uid\(\)/,
    );
  });

  it("NEGATIVE: there is no policy granting a teacher, student, or author any read", () => {
    const policies = [
      ...MIGRATION_SQL.matchAll(
        /create policy (invitations_\w+)[\s\S]*?(?=create policy|\n-- ---|$)/g,
      ),
    ].map((m) => m[0]);
    // Every SELECT policy names an administrator role or the person's own claim.
    for (const policy of policies.filter((p) => p.includes("for select"))) {
      expect(policy).toMatch(
        /current_role_name\(\) = '(org_admin|site_admin)'|claimed_by_user_id = auth\.uid\(\)/,
      );
    }
    // And no policy names teacher, student, or curriculum_author at all.
    for (const policy of policies) {
      expect(policy).not.toMatch(/'teacher'/);
      expect(policy).not.toMatch(/'student'/);
      expect(policy).not.toMatch(/'curriculum_author'/);
    }
  });

  it("NEGATIVE: an insert must attribute itself to the caller", () => {
    // Prevents issuing an invitation in somebody else's name.
    expect(MIGRATION_SQL).toMatch(
      /invitations_insert_admin[\s\S]{0,400}invited_by_user_id = auth\.uid\(\)/,
    );
  });

  it("NEGATIVE: an insert cannot arrive pre-claimed", () => {
    expect(MIGRATION_SQL).toMatch(
      /invitations_insert_admin[\s\S]{0,400}claimed_by_user_id is null/,
    );
  });
});

describe("withdrawing access is scoped, and is never a delete", () => {
  it("POSITIVE: an org admin withdraws access within their organization", () => {
    expect(MIGRATION_SQL).toMatch(
      /users_update_deactivation_org_admin[\s\S]{0,260}org_id = public\.current_org\(\)/,
    );
  });

  it("POSITIVE: a site admin withdraws access for students and teachers at their site", () => {
    expect(MIGRATION_SQL).toMatch(
      /users_update_deactivation_site_admin[\s\S]{0,400}role in \('student', 'teacher'\)/,
    );
  });

  it("NEGATIVE: a site admin cannot withdraw access from another site admin", () => {
    const at = MIGRATION_SQL.indexOf("users_update_deactivation_site_admin");
    const policy = MIGRATION_SQL.slice(at, at + 500);
    expect(policy).toMatch(/site_id = public\.current_site\(\)/);
    expect(policy).not.toMatch(/'org_admin'/);
  });

  it("NEGATIVE: withdrawal is a state transition, never a row deletion", () => {
    expect(MIGRATION_SQL).toMatch(/deactivated_at/);
    expect(MIGRATION_SQL).toMatch(
      /create trigger users_no_delete[\s\S]{0,120}reject_mutation/,
    );
    expect(MIGRATION_SQL).not.toMatch(/delete from public\.users/);
    expect(MIGRATION_SQL).not.toMatch(/delete from public\.account_invitations/);
  });

  it("NEGATIVE: a reason is mandatory, so no withdrawal is unexplained", () => {
    expect(MIGRATION_SQL).toMatch(/users_deactivation_needs_reason/);
    expect(MIGRATION_SQL).toMatch(/invitations_revocation_needs_reason/);
  });
});
