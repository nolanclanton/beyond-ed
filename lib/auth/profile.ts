/**
 * Loading the signed-in person's profile from Postgres.
 *
 * `auth.users` holds the credential. `public.users` holds who that person
 * IS to Beyond.Ed — their organization, their site, their role, their grade —
 * and it is written once, by the `handle_new_auth_user` trigger, from the
 * invitation a district administrator issued (migration 0012). Nothing the
 * browser sends is consulted: the token proves which account is calling,
 * and the profile row decides what that account is allowed to be.
 *
 * A profile with `deactivated_at` set is not a session. The scope helpers in
 * the database already treat that person as having no role, so every policy
 * denies them; resolving them to `null` here means the interface says so
 * plainly instead of rendering an empty workspace they cannot explain.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { CurriculumGrant, Role, User } from "@/lib/db/types";

/** The shape `public.users` returns. Snake case, as Postgres stores it. */
type ProfileRow = {
  id: string;
  org_id: string;
  site_id: string | null;
  first_name: string;
  last_name: string;
  role: Role;
  curriculum_author: boolean;
  grade_level: number | null;
  deactivated_at: string | null;
  /** The hat currently on. Null means the primary `role`. */
  active_role: Role | null;
};

/**
 * Annotated `string` rather than left as a literal on purpose. supabase-js
 * parses a literal column list at the type level to infer the row shape, and
 * without a generated `Database` type that inference recurses until the
 * compiler gives up ("type instantiation is excessively deep"). Widening the
 * constant turns the parser off; `ProfileRow` above is the shape instead, and
 * `tests/unit/supabase-contract.test.ts` checks it against the migration.
 */
const PROFILE_COLUMNS: string =
  "id, org_id, site_id, first_name, last_name, role, curriculum_author, grade_level, deactivated_at, active_role";

/**
 * The profile the application reasons in.
 *
 * `role` is the ACTIVE role, not the primary one — which is the whole seam that
 * made multiple roles possible without touching forty pages. Every layout and
 * every function in `lib/auth/scope.ts` switches on `user.role`, and the
 * database's `current_role_name()` resolves the same way, so the interface and
 * the policies always agree about which hat is on.
 *
 * `primaryRole` is kept for display: it is what the person was provisioned as,
 * and it is the one hat that cannot be taken away without deactivating them.
 */
export function toUser(
  row: ProfileRow,
  heldRoles: Role[] = [],
  curriculumGrants?: CurriculumGrant[],
): User {
  return {
    id: row.id,
    orgId: row.org_id,
    siteId: row.site_id,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.active_role ?? row.role,
    primaryRole: row.role,
    heldRoles: heldRoles.length > 0 ? heldRoles : [row.role],
    curriculumAuthor: row.curriculum_author,
    // Undefined means "whatever `curriculumAuthor` alone implies", which
    // `curriculumGrantsOf` resolves to `author`. That is deliberately the same
    // answer an account provisioned before the grants existed gets.
    curriculumGrants,
    gradeLevel: row.grade_level,
  };
}

/**
 * The caller's curriculum grants, read separately and allowed to fail.
 *
 * A separate query rather than another column on `PROFILE_COLUMNS`, for one
 * reason that matters more than tidiness: **code is deployed and migrations are
 * applied at different moments.** Adding `curriculum_grants` to the main select
 * would mean that deploying this build before migration 0022 had run turned
 * every sign-in into "column does not exist" — the whole product down, for
 * everybody, because of a curriculum authoring feature.
 *
 * So it is asked for on its own and a failure is swallowed. The fallback is
 * `undefined`, which resolves to `author` — the access the account already had.
 * That is the narrower outcome and the safe one, which is the same reasoning
 * `my_roles()` below is treated with.
 */
async function loadCurriculumGrants(
  supabase: SupabaseClient,
  userId: string,
): Promise<CurriculumGrant[] | undefined> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("curriculum_grants")
      .eq("id", userId)
      .maybeSingle<{ curriculum_grants: CurriculumGrant[] | null }>();

    if (error || !data || data.curriculum_grants === null) return undefined;
    return Array.isArray(data.curriculum_grants) ? data.curriculum_grants : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Why there is no session, when there is a signed-in account but no workspace.
 *
 * These are separate states because they need separate sentences. Someone whose
 * account was withdrawn should not be told their account does not exist, and
 * someone who signed in with an unprovisioned address should not be told to
 * contact an administrator about a suspension that never happened.
 */
export type ProfileOutcome =
  | { kind: "ok"; user: User }
  | { kind: "no_profile" }
  | { kind: "deactivated"; reason: string };

/**
 * Reads the caller's own profile.
 *
 * The query is `id = <uid>` and the `users_select_self` policy independently
 * restricts it to the same row, so this cannot read anyone else's profile even
 * if the filter were wrong.
 */
export async function loadProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileOutcome> {
  const { data, error } = await supabase
    .from("users")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(`Could not load your Beyond.Ed profile: ${error.message}`);
  }
  if (!data) return { kind: "no_profile" };
  if (data.deactivated_at) {
    return { kind: "deactivated", reason: data.deactivated_at };
  }

  // `my_roles()` takes no argument and can only answer about `auth.uid()`, so
  // this cannot be pointed at anybody else. A failure here is not fatal: the
  // person falls back to the one role their profile names, which is the
  // narrower outcome and the safe one.
  const { data: roles } = await supabase.rpc("my_roles");
  const heldRoles = Array.isArray(roles)
    ? (roles as Role[]).filter((r): r is Role => typeof r === "string")
    : [];

  const curriculumGrants = await loadCurriculumGrants(supabase, userId);

  return { kind: "ok", user: toUser(data, heldRoles, curriculumGrants) };
}
