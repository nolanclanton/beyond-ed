import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The authentication invariants, checked against the source rather than
 * against intent.
 *
 * Two rules govern who can be in this product at all:
 *
 *   1. Accounts are created by a district administrator. There is no sign-up.
 *   2. Claiming one takes the setup code that was issued with it, so being able
 *      to GUESS an invited address is not enough to become that person.
 *
 * Both are enforced in the database, by `handle_new_auth_user` — introduced in
 * migration 0012 and rewritten by 0019, which is the version that runs. These
 * tests exist because that is exactly the kind of enforcement someone removes
 * while debugging and forgets to restore, and because deleting it would not
 * fail a type check, a lint rule, or any other test in this suite — it would
 * simply let strangers in.
 */

function filesUnder(dir: string, exts = [".ts", ".tsx"]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...filesUnder(full, exts));
    else if (exts.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

const MIGRATIONS = readdirSync("supabase/migrations")
  .filter((f) => f.endsWith(".sql"))
  .sort();

const MIGRATION_SQL = MIGRATIONS.map((f) =>
  readFileSync(join("supabase/migrations", f), "utf8"),
).join("\n");

/**
 * The claim trigger as it stands after every migration that redefines it.
 * 0012 created it, 0015 amended the audit reason, 0019 replaced the provider
 * rule with the setup code. 0019 is what is actually installed.
 */
const CLAIM_TRIGGER = readFileSync(
  "supabase/migrations/0019_claim_code_sign_up.sql",
  "utf8",
);

const APP_SOURCE = [...filesUnder("lib"), ...filesUnder("app")];

describe("a setup code is required to claim an account (CLAUDE.md §3)", () => {
  it("an email sign-up must present a code matching its invitation", () => {
    expect(CLAIM_TRIGGER).toMatch(
      /provider = 'email' and offered_code <> invite\.claim_code/,
    );
    expect(CLAIM_TRIGGER).toMatch(/raise exception/);
  });

  it("only the providers Beyond.Ed accepts get past the first check", () => {
    expect(CLAIM_TRIGGER).toMatch(/provider not in \('email', 'google'\)/);
  });

  it("the provider is read from auth metadata, not from user input", () => {
    // `raw_user_meta_data` is writable by the client during sign-up.
    // `raw_app_meta_data` is not — it is what the Auth server asserts.
    expect(CLAIM_TRIGGER).toMatch(/raw_app_meta_data\s*->>\s*'provider'/);
    expect(CLAIM_TRIGGER).not.toMatch(/raw_user_meta_data\s*->>\s*'provider'/);
  });

  it("the code is compared after normalising case and separators", () => {
    // People retype these off a slip of paper. The comparison must forgive
    // spacing and case without forgiving a wrong code.
    expect(CLAIM_TRIGGER).toMatch(/upper\(regexp_replace\(/);
    expect(CLAIM_TRIGGER).toMatch(/raw_user_meta_data ->> 'claim_code'/);
  });

  it("the generated code avoids characters that are misread aloud", () => {
    const migration = readFileSync(
      "supabase/migrations/0019_claim_code_sign_up.sql",
      "utf8",
    );
    const alphabet = migration.match(/substr\('([A-Z0-9]+)'/)?.[1] ?? "";
    expect(alphabet.length).toBeGreaterThan(20);
    for (const ambiguous of ["0", "O", "1", "I", "L"]) {
      expect(alphabet, ambiguous).not.toContain(ambiguous);
    }
  });

  it("the code is fixed once the invitation is issued", () => {
    const guard = CLAIM_TRIGGER.slice(
      CLAIM_TRIGGER.indexOf("function public.guard_invitation_update"),
    );
    expect(guard.slice(0, guard.indexOf("$$;"))).toMatch(
      /new\.claim_code is distinct from old\.claim_code/,
    );
  });

  it("only the claim action creates an account, and always with a code", () => {
    for (const file of APP_SOURCE) {
      const source = readFileSync(file, "utf8");
      if (!/\.auth\.signUp\b/.test(source)) continue;
      expect(file).toBe("lib/actions/session.ts");
      // Every signUp call site passes the code through to the trigger.
      expect(source).toMatch(/claim_code:\s*parsed\.data\.claimCode/);
    }
  });

  it("a failed claim does not reveal whether the address was provisioned", () => {
    // Distinguishing "no such invitation" from "wrong code" would turn this
    // form into an oracle for which addresses have accounts waiting, which is
    // the enumeration the code exists to prevent.
    const session = readFileSync("lib/actions/session.ts", "utf8");
    const at = session.indexOf("export async function claimAccountAction");
    const body = session.slice(at, session.indexOf("export async function signInAction"));
    expect(body).toMatch(/do not match an account waiting to be set up/);
    expect(body).not.toMatch(/no account is provisioned/i);
    expect(body).not.toMatch(/wrong code/i);
  });

  it("a password reset never reveals whether the address has an account", () => {
    const session = readFileSync("lib/actions/session.ts", "utf8");
    const at = session.indexOf("export async function requestPasswordResetAction");
    const body = session.slice(at, session.indexOf("const NewPassword"));
    expect(body).toMatch(/If that address has a Beyond\.Ed account/);
  });

  it("no password is ever logged, stored, or echoed by this application", () => {
    for (const file of APP_SOURCE) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/console\.(log|warn|error|info)\([^)]*password/i);
    }
    // Passwords live in `auth.users`, managed by Supabase. Nothing in this
    // schema has a password column of its own.
    expect(MIGRATION_SQL).not.toMatch(/password\s+text/i);
  });
});

describe("accounts are created only by a district administrator (CLAUDE.md §3)", () => {
  it("an address with no pending invitation is refused, code or no code", () => {
    expect(CLAIM_TRIGGER).toMatch(/from public\.account_invitations/);
    expect(CLAIM_TRIGGER).toMatch(/status\s*=\s*'pending'/);
    expect(CLAIM_TRIGGER).toMatch(/if not found then/);
    expect(CLAIM_TRIGGER).toMatch(/No Beyond\.Ed account is provisioned/);
  });

  it("the profile takes its role and scope from the invitation, never from the sign-in", () => {
    const insert = CLAIM_TRIGGER.slice(
      CLAIM_TRIGGER.indexOf("insert into public.users"),
    );
    // Every scope-bearing value comes off the invitation row.
    expect(insert).toMatch(/invite\.org_id/);
    expect(insert).toMatch(/invite\.site_id/);
    expect(insert).toMatch(/invite\.role/);
    expect(insert).toMatch(/invite\.curriculum_author/);
    expect(insert).toMatch(/invite\.grade_level/);
    // Only the identity itself comes from the sign-up.
    expect(insert).toMatch(/new\.id/);
  });

  it("claiming an invitation writes an audit event in the same transaction", () => {
    expect(CLAIM_TRIGGER).toMatch(/insert into public\.audit_events/);
    expect(CLAIM_TRIGGER).toMatch(/'account\.claimed'/);
  });

  it("only an org_admin invitation may exist without an inviter", () => {
    const bootstrap = readFileSync(
      "supabase/migrations/0015_bootstrap_invitation.sql",
      "utf8",
    );
    expect(bootstrap).toMatch(
      /check \(invited_by_user_id is not null or role = 'org_admin'\)/,
    );
  });

  it("one address can never hold two accounts", () => {
    const guard = readFileSync(
      "supabase/migrations/0016_one_account_per_address.sql",
      "utf8",
    );
    expect(guard).toMatch(/status = 'claimed'/);
    expect(guard).toMatch(/before insert on public\.account_invitations/);
    expect(MIGRATION_SQL).toMatch(/account_invitations_one_pending_per_email/);
  });

  it("a site admin cannot grant a role above their own", () => {
    // `can_provision` is the single definition of who may provision whom.
    const sql = MIGRATION_SQL.slice(
      MIGRATION_SQL.indexOf("function public.can_provision"),
    );
    const body = sql.slice(0, sql.indexOf("$$;"));
    expect(body).toMatch(/when 'site_admin' then/);
    expect(body).toMatch(/target_role in \('student', 'teacher'\)/);
    expect(body).toMatch(/else false/);
  });
});

describe("role and scope cannot be changed in place (CLAUDE.md §3, §6)", () => {
  it("a profile update may touch only the deactivation columns", () => {
    const guard = MIGRATION_SQL.slice(
      MIGRATION_SQL.indexOf("function public.guard_user_update"),
    );
    const body = guard.slice(0, guard.indexOf("$$;"));
    for (const column of [
      "org_id",
      "site_id",
      "role",
      "curriculum_author",
      "grade_level",
    ]) {
      expect(body, column).toMatch(
        new RegExp(`new\\.${column} is distinct from old\\.${column}`),
      );
    }
  });

  it("an invitation's identity, role, and scope are fixed once issued", () => {
    const guard = MIGRATION_SQL.slice(
      MIGRATION_SQL.indexOf("function public.guard_invitation_update"),
    );
    const body = guard.slice(0, guard.indexOf("$$;"));
    for (const column of ["email", "org_id", "site_id", "role", "grade_level"]) {
      expect(body, column).toMatch(
        new RegExp(`new\\.${column} is distinct from old\\.${column}`),
      );
    }
  });

  it("an invitation moves only Pending -> Claimed or Pending -> Revoked", () => {
    const guard = MIGRATION_SQL.slice(
      MIGRATION_SQL.indexOf("function public.guard_invitation_update"),
    );
    const body = guard.slice(0, guard.indexOf("$$;"));
    expect(body).toMatch(
      /old\.status = 'pending' and new\.status in \('claimed', 'revoked'\)/,
    );
    expect(body).toMatch(/Illegal invitation transition/);
  });

  it("nothing is hard-deleted: users and invitations refuse DELETE", () => {
    expect(MIGRATION_SQL).toMatch(
      /create trigger users_no_delete[\s\S]{0,120}reject_mutation/,
    );
    expect(MIGRATION_SQL).toMatch(
      /create trigger account_invitations_no_delete[\s\S]{0,140}reject_mutation/,
    );
  });

  it("a deactivated profile resolves to no role, so every policy denies it", () => {
    const provisioning = readFileSync(
      "supabase/migrations/0012_account_provisioning.sql",
      "utf8",
    );
    for (const fn of [
      "current_role_name",
      "current_org",
      "current_site",
      "is_curriculum_author",
    ]) {
      const at = provisioning.indexOf(`function public.${fn}`);
      expect(at, fn).toBeGreaterThan(-1);
      expect(provisioning.slice(at, at + 400), fn).toMatch(
        /deactivated_at is null/,
      );
    }
  });
});

describe("no service-role key exists in this codebase (CLAUDE.md §3)", () => {
  it("nothing in the application reads a service-role or secret key", () => {
    for (const file of APP_SOURCE) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/SERVICE_ROLE/);
      expect(source, file).not.toMatch(/service_role/);
      expect(source, file).not.toMatch(/SUPABASE_SECRET/);
    }
  });

  it("only the publishable key and the project URL are read from the environment", () => {
    const env = readFileSync("lib/supabase/env.ts", "utf8");
    const referenced = [...env.matchAll(/process\.env\.([A-Z0-9_]+)/g)].map(
      (m) => m[1],
    );
    expect(new Set(referenced)).toEqual(
      new Set(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]),
    );
  });
});

describe("the browser client cannot write consequential state (CLAUDE.md §1)", () => {
  it("the browser client never reads or writes a table", () => {
    const client = readFileSync("lib/supabase/client.ts", "utf8");
    // No table access from the browser: reads are RLS-scoped server reads, and
    // writes go through server actions that audit in the same transaction.
    expect(client).not.toMatch(/\.from\(/);
    expect(client).not.toMatch(/\.rpc\(/);
  });

  it("no Client Component imports the browser client to read or write tables", () => {
    for (const file of APP_SOURCE) {
      const source = readFileSync(file, "utf8");
      if (!source.includes("lib/supabase/client")) continue;
      expect(source, file).not.toMatch(/\.from\(["'][a-z_]+["']\)/);
    }
  });

  it("the server client is server-only by construction", () => {
    // Importing `next/headers` from a Client Component is a build error, which
    // is a stronger guarantee than any runtime check.
    expect(readFileSync("lib/supabase/server.ts", "utf8")).toMatch(
      /from "next\/headers"/,
    );
  });
});

describe("the demo identity mode is gone, not merely disabled", () => {
  it("no seeded-identity action exists anywhere", () => {
    // These were the whole demo surface: pick a seeded person, become them,
    // rebuild the store. A disabled version of them would still be a second
    // way to hold a session, so they are removed rather than guarded.
    for (const file of APP_SOURCE) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/export async function signInAs\b/);
      expect(source, file).not.toMatch(/export async function resetDemoData\b/);
    }
  });

  it("nothing sets or reads a demo session cookie", () => {
    for (const file of APP_SOURCE) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/beyond_ed_demo_user/);
    }
  });

  it("the portal picker and its data are deleted, not orphaned", () => {
    expect(existsSync("lib/auth/portals.ts")).toBe(false);
  });

  it("identity comes only from a revalidated Supabase token", () => {
    const session = readFileSync("lib/auth/session.ts", "utf8");
    expect(session).toMatch(/supabase\.auth\.getUser\(\)/);

    // The cookie jar IS still touched, to keep every identity-dependent page
    // out of the static prerender — but nothing is read from it. What matters
    // is that no cookie NAMES a person and no seeded record is consulted:
    // those were the two ways the demo mode handed out a session.
    expect(session).not.toMatch(/jar\.get\(/);
    expect(session).not.toMatch(/cookies\(\)\)?\.get/);
    expect(session).not.toMatch(/db\(\)/);
    expect(session).not.toMatch(/ensureSeeded/);
  });

  it("an unconfigured deployment resolves to no session at all", () => {
    // Not to a default user, and not to a fallback mode — there is no longer
    // one to fall back to.
    const session = readFileSync("lib/auth/session.ts", "utf8");
    expect(session).toMatch(/if \(!isSupabaseConfigured\(\)\) return \{ kind: "unconfigured" \}/);
  });
});

describe("student uploads are private and scoped by user id (CLAUDE.md §5)", () => {
  const bucket = readFileSync(
    "supabase/migrations/0013_student_uploads_bucket.sql",
    "utf8",
  );

  it("the bucket is not public", () => {
    expect(bucket).toMatch(/'student-uploads',\s*\n?\s*'student-uploads',\s*\n?\s*false/);
  });

  it("a student may write only beneath their own user id", () => {
    expect(bucket).toMatch(
      /student_uploads_insert_own[\s\S]{0,300}storage_object_owner\(name\) = auth\.uid\(\)/,
    );
  });

  it("staff read by the same scope helper that governs the student's records", () => {
    expect(bucket).toMatch(
      /student_uploads_select_in_scope[\s\S]{0,400}can_read_student\(/,
    );
  });

  it("uploaded work is append-only: no update or delete policy exists", () => {
    expect(bucket).not.toMatch(/on storage\.objects for update/);
    expect(bucket).not.toMatch(/on storage\.objects for delete/);
  });

  it("a path whose first segment is not a uuid fails closed", () => {
    // `storage_object_owner` returns NULL, and every policy compares against
    // it, so a malformed path matches nobody.
    expect(bucket).toMatch(/else null/);
  });
});

describe("every provisioning write is atomic, audited, and idempotent (CLAUDE.md §1, §6)", () => {
  const actions = readFileSync(
    "supabase/migrations/0014_provisioning_actions.sql",
    "utf8",
  );

  for (const fn of ["issue_invitation", "revoke_invitation", "set_profile_active"]) {
    it(`${fn} writes an audit event and consumes an idempotency key`, () => {
      const at = actions.indexOf(`function public.${fn}`);
      expect(at, fn).toBeGreaterThan(-1);
      const body = actions.slice(at, actions.indexOf("$$;", at));
      expect(body, fn).toMatch(/insert into public\.audit_events/);
      expect(body, fn).toMatch(/insert into public\.idempotency_keys/);
      expect(body, fn).toMatch(/p_idempotency_key/);
      // A reason is required on every one of them.
      expect(body, fn).toMatch(/trim\(p_reason\)/);
      // SECURITY INVOKER, so the caller's own policies apply.
      expect(body, fn).toMatch(/security invoker/);
    });
  }

  it("nobody may withdraw their own access", () => {
    const at = actions.indexOf("function public.set_profile_active");
    const body = actions.slice(at, actions.indexOf("$$;", at));
    expect(body).toMatch(/p_user_id = auth\.uid\(\)/);
  });
});
