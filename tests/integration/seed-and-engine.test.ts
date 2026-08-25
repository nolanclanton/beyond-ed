import { describe, expect, it, beforeEach } from "vitest";

import { clearDatabase, db } from "@/lib/db/store";
import { ensureSeeded } from "@/lib/db/seed";
import { skillProfile } from "@/lib/mastery/profile";
import { actionQueue, recommendationsForStudent } from "@/lib/intervention/queue";

describe("seeded store", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  it("seeds the demo district", () => {
    const d = db();
    expect(d.organizations).toHaveLength(1);
    expect(d.sites).toHaveLength(5);
    expect(d.users.filter((u) => u.role === "student")).toHaveLength(584);
    expect(d.users.filter((u) => u.role === "teacher")).toHaveLength(37);
    // Exactly one site administrator per site.
    expect(d.users.filter((u) => u.role === "site_admin")).toHaveLength(5);
    expect(d.enrollments.length).toBeGreaterThan(2000);
    expect(d.evidence.length).toBeGreaterThan(1000);
    expect(d.gradeRecords.length).toBeGreaterThan(1000);
  });

  it("gives every student a placement and every section a teacher", () => {
    const d = db();
    const teacherIds = new Set(d.users.filter((u) => u.role === "teacher").map((u) => u.id));
    for (const section of d.sections) {
      expect(teacherIds.has(section.teacherId), section.id).toBe(true);
    }
    for (const student of d.users.filter((u) => u.role === "student")) {
      expect(
        d.enrollments.some((e) => e.studentId === student.id),
        `${student.id} has no placement`,
      ).toBe(true);
    }
  });

  it("produces a skill profile with separate confidence", () => {
    const profile = skillProfile("u_amara");
    expect(profile.length).toBeGreaterThan(0);
    for (const m of profile) {
      expect(m.ruleVersion).toBe("mastery@2026.08.1");
      expect(m.confidence).toBeTruthy();
    }
  });

  it("produces recommendations that cite trigger evidence", () => {
    const recs = recommendationsForStudent("u_amara");
    for (const r of recs) {
      expect(r.triggerEvidenceIds.length).toBeGreaterThan(0);
      expect(r.returnLessonCode).toBeTruthy();
    }
    expect(recs.length).toBeGreaterThan(0);
  });

  it("gives each teacher a scoped action queue", () => {
    const teacher = db().users.find((u) => u.id === "u_alvarez");
    if (!teacher) throw new Error("seed missing");
    const queue = actionQueue(teacher);
    expect(queue.length).toBeGreaterThan(0);
    for (const item of queue) {
      expect(["Mathematics 6", "Mathematics 7", "Mathematics 8", "Math 1", "Math 2", "Math 3"]).toContain(
        item.courseTitle,
      );
    }
  });

  it("is deterministic: the same seed produces the same recommendations", () => {
    const first = recommendationsForStudent("u_diego").map((r) => r.id);
    clearDatabase();
    ensureSeeded();
    const second = recommendationsForStudent("u_diego").map((r) => r.id);
    expect(second).toEqual(first);
  });
});
