/**
 * Reading the district directory: who has an account, and who has been invited
 * to one.
 *
 * Every query here is an ordinary RLS-scoped select. There is no filter in this
 * file deciding who an administrator may see — `invitations_select_org_admin`,
 * `invitations_select_site_admin`, and the `users` policies decide that in the
 * database, and these functions would return the same rows if the `where`
 * clauses were removed. That is the point: the interface cannot widen scope by
 * asking differently.
 */
import type { Role, User } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";

export type InvitationStatus = "pending" | "claimed" | "revoked";

export type Invitation = {
  id: string;
  email: string;
  role: Role;
  curriculumAuthor: boolean;
  firstName: string;
  lastName: string;
  gradeLevel: number | null;
  status: InvitationStatus;
  siteId: string | null;
  /**
   * The one-time code the administrator reads out to the person. Visible only
   * to administrators whose policies already admit this invitation, and useless
   * once `status` leaves `pending`.
   */
  claimCode: string;
  createdAt: string;
  claimedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
};

export type DirectoryPerson = {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  siteId: string | null;
  curriculumAuthor: boolean;
  gradeLevel: number | null;
  deactivatedAt: string | null;
  deactivatedReason: string | null;
};

export type DistrictSite = { id: string; name: string; shortName: string };

/** See the note in `lib/auth/profile.ts` — widened to switch off column-literal inference. */
const INVITATION_COLUMNS: string =
  "id, email, role, curriculum_author, first_name, last_name, grade_level, status, site_id, claim_code, created_at, claimed_at, revoked_at, revoked_reason";
const PERSON_COLUMNS: string =
  "id, first_name, last_name, role, site_id, curriculum_author, grade_level, deactivated_at, deactivated_reason";
const SITE_COLUMNS: string = "id, name, short_name";

type InvitationRow = {
  id: string;
  email: string;
  role: Role;
  curriculum_author: boolean;
  first_name: string;
  last_name: string;
  grade_level: number | null;
  status: InvitationStatus;
  site_id: string | null;
  claim_code: string;
  created_at: string;
  claimed_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
};

type PersonRow = {
  id: string;
  first_name: string;
  last_name: string;
  role: Role;
  site_id: string | null;
  curriculum_author: boolean;
  grade_level: number | null;
  deactivated_at: string | null;
  deactivated_reason: string | null;
};

type SiteRow = { id: string; name: string; short_name: string };

export type Directory = {
  invitations: Invitation[];
  people: DirectoryPerson[];
  sites: DistrictSite[];
  /** Set when a read failed, so the page can say so instead of showing zero. */
  error: string | null;
};

const EMPTY: Directory = {
  invitations: [],
  people: [],
  sites: [],
  error: null,
};

/**
 * Everything the provisioning surfaces render.
 *
 * Loaded in one pass rather than per panel so a page cannot show an invitation
 * list from one moment beside a people list from another.
 *
 * A failure returns empty lists AND an error string. Returning zero rows with
 * no explanation would let a transient outage read as "your district has no
 * accounts", which is the one thing an administrator must never be told
 * incorrectly.
 */
export async function loadDirectory(actor: User): Promise<Directory> {
  if (actor.role !== "org_admin" && actor.role !== "site_admin") {
    return EMPTY;
  }

  try {
    const supabase = await createClient();

    const [invitations, people, sites] = await Promise.all([
      supabase
        .from("account_invitations")
        .select(INVITATION_COLUMNS)
        .order("created_at", { ascending: false })
        .returns<InvitationRow[]>(),
      supabase
        .from("users")
        .select(PERSON_COLUMNS)
        .order("last_name", { ascending: true })
        .returns<PersonRow[]>(),
      supabase.from("sites").select(SITE_COLUMNS).returns<SiteRow[]>(),
    ]);

    const firstError =
      invitations.error?.message ?? people.error?.message ?? sites.error?.message;
    if (firstError) return { ...EMPTY, error: firstError };

    return {
      invitations: (invitations.data ?? []).map(toInvitation),
      people: (people.data ?? []).map(toPerson),
      sites: (sites.data ?? []).map(toSite),
      error: null,
    };
  } catch (error) {
    return {
      ...EMPTY,
      error: error instanceof Error ? error.message : "The directory could not be read.",
    };
  }
}

function toInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    curriculumAuthor: row.curriculum_author,
    firstName: row.first_name,
    lastName: row.last_name,
    gradeLevel: row.grade_level,
    status: row.status,
    siteId: row.site_id,
    claimCode: row.claim_code,
    createdAt: row.created_at,
    claimedAt: row.claimed_at,
    revokedAt: row.revoked_at,
    revokedReason: row.revoked_reason,
  };
}

function toPerson(row: PersonRow): DirectoryPerson {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    siteId: row.site_id,
    curriculumAuthor: row.curriculum_author,
    gradeLevel: row.grade_level,
    deactivatedAt: row.deactivated_at,
    deactivatedReason: row.deactivated_reason,
  };
}

function toSite(row: SiteRow): DistrictSite {
  return { id: row.id, name: row.name, shortName: row.short_name };
}

/**
 * The roles this actor may actually grant.
 *
 * Mirrors `public.can_provision` so the form does not offer a choice the
 * database will refuse. The database remains the enforcement point — this is
 * about not presenting a dead control (CLAUDE.md §12).
 */
export function grantableRoles(actor: User): Role[] {
  if (actor.role === "org_admin") {
    return ["student", "teacher", "site_admin", "org_admin", "curriculum_author"];
  }
  if (actor.role === "site_admin") return ["student", "teacher"];
  return [];
}
