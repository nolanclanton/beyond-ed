/**
 * Curriculum version authoring (CLAUDE.md §7).
 *
 * Only a holder of the `curriculum_author` authorization moves a version
 * forward — checked independently of role, so an org admin without it cannot
 * publish. Publication is GATED four times: on day-budget validation, so a
 * course that does not validate 135 + 40 = 175 cannot be published; on
 * standards coverage, so a course cannot be published with an assigned standard
 * no lesson claims; on structural integrity, so a version cannot run a sequence
 * the current catalog no longer supports; and on the foundation map, so no
 * lesson depends on something the version runs afterwards. Each failure message
 * names what is wrong rather than hiding it.
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

import type { CatalogCourse } from "./catalog";
import { validateCourseBudget, type BudgetReport } from "./budget";
import { foundationConflicts, governanceSummary } from "./foundations";
import { coverageReport, type CoverageReport } from "./standards";
import { effectiveCourse, structureChanges, structureIntegrity } from "./structure";
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

/**
 * The publication gate. Read this before offering a publish control.
 *
 * Every check runs against the course as THIS VERSION runs it, not against the
 * workbook — a version that re-sequenced its units is published as re-sequenced,
 * so that is what has to validate. Four gates, and each one names what is wrong
 * rather than hiding it:
 *
 *   1. the day budget, 135 + 40 = 175;
 *   2. standards coverage, recomputed from the lesson spine;
 *   3. structural integrity, so an override written against an older catalog
 *      cannot quietly shorten a course;
 *   4. the foundation map, so no lesson depends on something this version runs
 *      afterwards or on a support that cannot return a student into it.
 */
export function publicationGate(versionId: string): {
  version: CourseVersion;
  course: CatalogCourse;
  report: BudgetReport;
  coverage: CoverageReport;
  eligible: boolean;
  blockers: string[];
} {
  const version = versionById(versionId);
  if (!version) throw new CurriculumError("That course version does not exist.");
  const course = effectiveCourse(version);

  const report = validateCourseBudget(course);
  const coverage = coverageReport(course);
  const blockers: string[] = [];
  if (version.status !== "approved") {
    blockers.push(
      `Only an approved version can be published. This one is ${version.status.replace(/_/g, " ")}.`,
    );
  }
  for (const f of report.findings) {
    if (f.severity === "error") blockers.push(f.message);
  }

  // Standards coverage is the second publication gate. A course that leaves an
  // assigned standard unscheduled has a hole in it, and the hole is invisible
  // once it is published — nobody notices a standard nobody was taught.
  if (coverage.gaps.length > 0) {
    blockers.push(
      `${coverage.gaps.length} assigned ${coverage.gaps.length === 1 ? "standard is" : "standards are"} not claimed by any lesson: ${coverage.gaps.slice(0, 6).join(", ")}${coverage.gaps.length > 6 ? ", …" : ""}.`,
    );
  }
  if (coverage.orphanLessons.length > 0) {
    blockers.push(
      `${coverage.orphanLessons.length} lessons claim a standard this course is not responsible for, starting with ${coverage.orphanLessons[0]}.`,
    );
  }

  for (const finding of structureIntegrity(version)) {
    if (finding.severity === "error") blockers.push(finding.message);
  }

  // A foundation that runs after the lesson depending on it is not a missing
  // label — it is a student sent back to something they have not met yet.
  const conflicts = foundationConflicts(version).filter((f) => f.severity === "error");
  if (conflicts.length > 0) {
    blockers.push(
      `${conflicts.length} foundation ${conflicts.length === 1 ? "link does" : "links do"} not hold in this version's sequence: ${conflicts.slice(0, 3).map((c) => c.message).join(" ")}${conflicts.length > 3 ? ` …and ${conflicts.length - 3} more.` : ""}`,
    );
  }

  return { version, course, report, coverage, eligible: blockers.length === 0, blockers };
}

/** What a version changed about its course, for the surfaces that summarise it. */
export function versionAdaptationSummary(versionId: string) {
  const version = versionById(versionId);
  if (!version) throw new CurriculumError("That course version does not exist.");
  return {
    structure: structureChanges(version),
    governance: governanceSummary(version.id),
  };
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
