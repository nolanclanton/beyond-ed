/**
 * Role and scope resolution (CLAUDE.md §3).
 *
 * These functions are the application-layer mirror of the row-level security
 * policies in `/supabase/policies`. The default is deny; every grant below is
 * explicit and narrow, and every one of them has a positive AND a negative test
 * in `/tests/policies`.
 *
 * Scope is hierarchical: organization -> site -> teacher -> roster section ->
 * student -> course -> curriculum authorization.
 */
import { db } from "@/lib/db/store";
import type { CurriculumGrant, Role, User } from "@/lib/db/types";

export class NotAuthorizedError extends Error {
  constructor(what: string) {
    super(`Not authorized: ${what}.`);
    this.name = "NotAuthorizedError";
  }
}

export type Actor = User;

/** Roster sections the actor owns or oversees. */
export function visibleSectionIds(actor: Actor): string[] {
  const d = db();
  switch (actor.role) {
    case "student": {
      // Withdrawn and archived enrollments stay readable — nothing in this
      // system is hard-deleted (CLAUDE.md §6).
      return d.enrollments
        .filter((e) => e.studentId === actor.id)
        .map((e) => e.sectionId);
    }
    case "teacher":
      return d.sections.filter((s) => s.teacherId === actor.id).map((s) => s.id);
    case "site_admin":
      return d.sections.filter((s) => s.siteId === actor.siteId).map((s) => s.id);
    case "org_admin": {
      const siteIds = new Set(
        d.sites.filter((s) => s.orgId === actor.orgId).map((s) => s.id),
      );
      return d.sections.filter((s) => siteIds.has(s.siteId)).map((s) => s.id);
    }
    case "curriculum_author":
      // Curriculum authorization grants curriculum access, not student access.
      return [];
  }
}

/** Student ids the actor may read. Empty for roles with no student scope. */
export function visibleStudentIds(actor: Actor): string[] {
  const d = db();
  if (actor.role === "student") return [actor.id];

  if (actor.role === "teacher") {
    const sectionIds = new Set(visibleSectionIds(actor));
    return unique(
      d.enrollments
        .filter((e) => sectionIds.has(e.sectionId))
        .map((e) => e.studentId),
    );
  }

  if (actor.role === "site_admin") {
    return d.users
      .filter((u) => u.role === "student" && u.siteId === actor.siteId)
      .map((u) => u.id);
  }

  if (actor.role === "org_admin") {
    return d.users
      .filter((u) => u.role === "student" && u.orgId === actor.orgId)
      .map((u) => u.id);
  }

  return [];
}

export function canReadStudent(actor: Actor, studentId: string): boolean {
  return visibleStudentIds(actor).includes(studentId);
}

export function assertCanReadStudent(actor: Actor, studentId: string): void {
  if (!canReadStudent(actor, studentId)) {
    throw new NotAuthorizedError("this student is outside your scope");
  }
}

/** Only a teacher who owns the section, or a site admin at that site. */
export function canAssignIntervention(
  actor: Actor,
  studentId: string,
): boolean {
  if (actor.role === "teacher") return canReadStudent(actor, studentId);
  if (actor.role === "site_admin") return canReadStudent(actor, studentId);
  return false;
}

export function assertCanAssignIntervention(
  actor: Actor,
  studentId: string,
): void {
  if (!canAssignIntervention(actor, studentId)) {
    throw new NotAuthorizedError("you cannot assign support to this student");
  }
}

/**
 * Grades are entered and changed by the teacher who owns the section. A site
 * or organization administrator does not silently change an official grade.
 */
export function canEnterGrade(actor: Actor, studentId: string): boolean {
  return actor.role === "teacher" && canReadStudent(actor, studentId);
}

export function assertCanEnterGrade(actor: Actor, studentId: string): void {
  if (!canEnterGrade(actor, studentId)) {
    throw new NotAuthorizedError("only the assigned teacher may enter a grade");
  }
}

/** Curriculum authoring is checked independently of role (CLAUDE.md §3). */
export function canAuthorCurriculum(actor: Actor): boolean {
  return actor.curriculumAuthor === true;
}

export function assertCanAuthorCurriculum(actor: Actor): void {
  if (!canAuthorCurriculum(actor)) {
    throw new NotAuthorizedError(
      "curriculum authoring is a separate authorization you do not hold",
    );
  }
}

/**
 * What a curriculum author may DO (vision §7).
 *
 * Resolved in exactly one place. An account that predates the design studio
 * carries no grant list, and the answer for it is `author` — the access it
 * already had, stated explicitly rather than inferred differently by each
 * caller. Someone who holds no authoring authorization at all holds no grants,
 * whatever their role: seniority is not a curriculum grant (CLAUDE.md §3).
 */
export function curriculumGrantsOf(actor: Actor): CurriculumGrant[] {
  if (!canAuthorCurriculum(actor)) return [];
  const granted = actor.curriculumGrants;
  if (!granted || granted.length === 0) return ["author"];
  return granted;
}

export function hasCurriculumGrant(actor: Actor, grant: CurriculumGrant): boolean {
  return curriculumGrantsOf(actor).includes(grant);
}

/**
 * Review a submitted narrative or lesson: comment, approve, return, reject.
 *
 * An administrator may review. An author may not review their own work, and
 * the reason is the whole point of having two grants — see
 * `assertCanReviewCurriculum`.
 */
export function canReviewCurriculum(actor: Actor): boolean {
  return (
    hasCurriculumGrant(actor, "reviewer") ||
    hasCurriculumGrant(actor, "administrator")
  );
}

export function assertCanReviewCurriculum(actor: Actor): void {
  if (!canReviewCurriculum(actor)) {
    throw new NotAuthorizedError(
      "reviewing curriculum needs the reviewer authorization, which you do not hold",
    );
  }
}

/**
 * Manage authoring itself: official templates, and which assistant
 * capabilities are available to the organization.
 *
 * The narrowest of the three, because it is the one that changes what everyone
 * else can do.
 */
export function canAdministerCurriculum(actor: Actor): boolean {
  return hasCurriculumGrant(actor, "administrator");
}

export function assertCanAdministerCurriculum(actor: Actor): void {
  if (!canAdministerCurriculum(actor)) {
    throw new NotAuthorizedError(
      "this is a curriculum administrator action and you do not hold that authorization",
    );
  }
}

/** Audit is readable by org_admin, and by any actor for their own actions. */
export function canReadAllAudit(actor: Actor): boolean {
  return actor.role === "org_admin";
}

export function canManagePermissions(actor: Actor): boolean {
  return actor.role === "org_admin";
}

export function canManageSite(actor: Actor, siteId: string): boolean {
  if (actor.role === "site_admin") return actor.siteId === siteId;
  if (actor.role === "org_admin") {
    return db().sites.some((s) => s.id === siteId && s.orgId === actor.orgId);
  }
  return false;
}

/** The scope string recorded on every audit event. */
export function scopeLabel(actor: Actor): string {
  const d = db();
  const site = d.sites.find((s) => s.id === actor.siteId);
  if (actor.role === "org_admin") {
    const org = d.organizations.find((o) => o.id === actor.orgId);
    return `org:${org?.name ?? actor.orgId}`;
  }
  return site ? `site:${site.shortName}` : `org:${actor.orgId}`;
}

export function roleOf(actor: Actor): Role {
  return actor.role;
}

function unique<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}
