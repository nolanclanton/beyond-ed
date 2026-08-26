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

import type { Role, User } from "@/lib/db/types";

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
  "id, org_id, site_id, first_name, last_name, role, curriculum_author, grade_level, deactivated_at";

export function toUser(row: ProfileRow): User {
  return {
    id: row.id,
    orgId: row.org_id,
    siteId: row.site_id,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    curriculumAuthor: row.curriculum_author,
    gradeLevel: row.grade_level,
  };
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
  return { kind: "ok", user: toUser(data) };
}
