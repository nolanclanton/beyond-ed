import { beforeEach, describe, expect, it } from "vitest";

import { ensureSeeded } from "@/lib/db/seed";
import { clearDatabase, db } from "@/lib/db/store";
import { visibleStudentIds } from "@/lib/auth/scope";
import { currentEvidence } from "@/lib/evidence/ledger";
import { courseGrade } from "@/lib/grades/gradebook";
import { skillProfile } from "@/lib/mastery/profile";
import { interventionsForStudent } from "@/lib/intervention/lifecycle";

/**
 * Blueprint §16: a transfer between sites preserves pathway state, evidence,
 * mastery, grades, interventions, and audit continuity without duplicate
 * enrollment.
 */
describe("transfer continuity", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  const transferred = () => {
    const u = db().users.find((x) => x.id === "u_jamal");
    if (!u) throw new Error("seed missing");
    return u;
  };

  it("marks the enrollment as carried over from a prior one", () => {
    const enrollments = db().enrollments.filter((e) => e.studentId === "u_jamal");
    expect(enrollments.length).toBeGreaterThan(0);
    expect(enrollments.every((e) => e.transferredFromEnrollmentId !== null)).toBe(true);
  });

  it("creates no duplicate enrollment for the same course", () => {
    const enrollments = db().enrollments.filter((e) => e.studentId === "u_jamal");
    const titles = enrollments.map((e) => e.courseTitle);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("keeps pathway state, evidence, mastery, grades, and plans intact", () => {
    const student = transferred();
    expect(db().lessonStates.filter((s) =>
      db().enrollments.some((e) => e.id === s.enrollmentId && e.studentId === student.id),
    ).length).toBeGreaterThan(0);
    expect(currentEvidence({ studentId: student.id }).length).toBeGreaterThan(0);
    expect(skillProfile(student.id).length).toBeGreaterThan(0);
    expect(interventionsForStudent(student.id).length).toBeGreaterThan(0);

    const enrollment = db().enrollments.find((e) => e.studentId === student.id);
    if (!enrollment) throw new Error("missing");
    expect(courseGrade(enrollment.id, enrollment.courseTitle).percent).not.toBeNull();
  });

  it("places the student in exactly one site's scope after the transfer", () => {
    const student = transferred();
    expect(student.siteId).toBe("site_northfield");
    const northfield = db().users.find((u) => u.id === "u_salinas");
    const riverside = db().users.find((u) => u.id === "u_petrova");
    if (!northfield || !riverside) throw new Error("seed missing");
    expect(visibleStudentIds(northfield)).toContain(student.id);
    expect(visibleStudentIds(riverside)).not.toContain(student.id);
  });
});
