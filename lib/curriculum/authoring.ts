/**
 * Curriculum version authoring (CLAUDE.md §7).
 *
 * Only a holder of the `curriculum_author` authorization moves a version
 * forward — checked independently of role, so an org admin without it cannot
 * publish. Publication is GATED on day-budget validation: a course that does
 * not validate 135 + 40 = 175 cannot be published, and the failure message
 * names the over-allocation.
 *
 * Publishing a new version does NOT retroactively change a running section: a
 * roster section keeps the `courseVersionId` it was created with, and this
 * module never touches sections or enrollments.
 */
import { recordAudit, requestIdFor } from "@/lib/audit/log";
import { assertCanAuthorCurriculum } from "@/lib/auth/scope";
import { nextTimestamp } from "@/lib/clock";
import { db, transact, withIdempotency } from "@/lib/db/store";
import type { CourseVersion, User } from "@/lib/db/types";

import { getCourse } from "./catalog";
import { validateCourseBudget, type BudgetReport } from "./budget";
import { transitionCurriculum, type CurriculumStatus } from "./publication";

export class CurriculumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CurriculumError";
  }
}

export function versionById(id: string): CourseVersion | undefined {
  return db().courseVersions.find((v) => v.id === id);
}

export function versionsForCourse(courseTitle: string): CourseVersion[] {
  return db().courseVersions.filter((v) => v.courseTitle === courseTitle);
}

/** Sections still pinned to a version. Publishing a successor cannot move them. */
export function sectionsOnVersion(versionId: string): number {
  return db().sections.filter((s) => s.courseVersionId === versionId).length;
}

/** The publication gate. Read this before offering a publish control. */
export function publicationGate(versionId: string): {
  version: CourseVersion;
  report: BudgetReport;
  eligible: boolean;
  blockers: string[];
} {
  const version = versionById(versionId);
  if (!version) throw new CurriculumError("That course version does not exist.");
  const course = getCourse(version.courseTitle);
  if (!course) throw new CurriculumError("That course is not in the catalog.");

  const report = validateCourseBudget(course);
  const blockers: string[] = [];
  if (version.status !== "approved") {
    blockers.push(
      `Only an approved version can be published. This one is ${version.status.replace(/_/g, " ")}.`,
    );
  }
  for (const f of report.findings) {
    if (f.severity === "error") blockers.push(f.message);
  }

  return { version, report, eligible: blockers.length === 0, blockers };
}

function move(
  actor: User,
  versionId: string,
  to: CurriculumStatus,
  action: string,
  reason: string,
  idempotencyKey: string,
): CourseVersion {
  return transact(() =>
    withIdempotency(
      idempotencyKey,
      () => {
        assertCanAuthorCurriculum(actor);
        const version = versionById(versionId);
        if (!version) throw new CurriculumError("That course version does not exist.");
        if (reason.trim().length === 0) {
          throw new CurriculumError("A curriculum action requires a recorded reason.");
        }

        const before = version.status;
        version.status = transitionCurriculum(version.status, to);
        if (to === "published") version.publishedAt = nextTimestamp();
        if (to === "retired") version.retiredAt = nextTimestamp();

        recordAudit({
          actor,
          action,
          targetEntity: "course_version",
          targetId: version.id,
          before: { status: before },
          after: { status: version.status, version: version.version },
          reason: reason.trim(),
          idempotencyKey,
          requestId: requestIdFor(action, idempotencyKey),
        });

        return version;
      },
      (existingId) => {
        const version = versionById(existingId);
        if (!version) throw new CurriculumError("Duplicate write with no record.");
        return version;
      },
    ),
  );
}

export function submitForReview(actor: User, versionId: string, reason: string, key: string) {
  return move(actor, versionId, "in_review", "curriculum.submit_for_review", reason, key);
}

export function approveVersion(actor: User, versionId: string, reason: string, key: string) {
  return move(actor, versionId, "approved", "curriculum.approve", reason, key);
}

/** Publication. Fails with the over-allocation message if the budget is wrong. */
export function publishVersion(
  actor: User,
  versionId: string,
  reason: string,
  key: string,
): CourseVersion {
  const gate = publicationGate(versionId);
  if (!gate.eligible) {
    throw new CurriculumError(
      `Publication blocked. ${gate.blockers.join(" ")}`,
    );
  }
  return move(actor, versionId, "published", "curriculum.publish", reason, key);
}

export function retireVersion(actor: User, versionId: string, reason: string, key: string) {
  const version = versionById(versionId);
  if (version && sectionsOnVersion(version.id) > 0) {
    throw new CurriculumError(
      `${sectionsOnVersion(version.id)} roster section(s) still reference this version. Retiring it would leave them without an approved version.`,
    );
  }
  return move(actor, versionId, "retired", "curriculum.retire", reason, key);
}
