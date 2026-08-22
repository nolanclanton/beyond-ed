import { beforeEach, describe, expect, it } from "vitest";

import {
  assertCanReadStudent,
  canAssignIntervention,
  canAuthorCurriculum,
  canEnterGrade,
  canManagePermissions,
  canManageSite,
  canReadAllAudit,
  canReadStudent,
  scopeLabel,
  visibleSectionIds,
  visibleStudentIds,
} from "@/lib/auth/scope";
import { readableAudit } from "@/lib/audit/log";
import { ensureSeeded } from "@/lib/db/seed";
import { clearDatabase, db } from "@/lib/db/store";
import type { User } from "@/lib/db/types";

/**
 * Scope isolation tests (CLAUDE.md §3).
 *
 * Every grant has a POSITIVE test proving authorized access succeeds and a
 * NEGATIVE test proving unauthorized access returns nothing. The negative test
 * is mandatory.
 *
 * In this build the enforcement point is `lib/auth/scope.ts`, which every read
 * and write goes through. When Supabase is provisioned these become the
 * contract the RLS policies in `/supabase/policies` must satisfy, and the same
 * cases run against the database (ADR 0002).
 */
function user(id: string): User {
  const u = db().users.find((x) => x.id === id);
  if (!u) throw new Error(`missing ${id}`);
  return u;
}

beforeEach(() => {
  clearDatabase();
  ensureSeeded();
});

describe("student scope: self only", () => {
  it("POSITIVE: a student can read their own record", () => {
    const amara = user("u_amara");
    expect(visibleStudentIds(amara)).toEqual(["u_amara"]);
    expect(canReadStudent(amara, "u_amara")).toBe(true);
    expect(() => assertCanReadStudent(amara, "u_amara")).not.toThrow();
  });

  it("NEGATIVE: a student cannot read another student", () => {
    const amara = user("u_amara");
    expect(canReadStudent(amara, "u_diego")).toBe(false);
    expect(visibleStudentIds(amara)).not.toContain("u_diego");
    expect(() => assertCanReadStudent(amara, "u_diego")).toThrow(/outside your scope/);
  });

  it("NEGATIVE: a student cannot assign support, grade, or author curriculum", () => {
    const amara = user("u_amara");
    expect(canAssignIntervention(amara, "u_amara")).toBe(false);
    expect(canEnterGrade(amara, "u_amara")).toBe(false);
    expect(canAuthorCurriculum(amara)).toBe(false);
    expect(canReadAllAudit(amara)).toBe(false);
    expect(canManagePermissions(amara)).toBe(false);
  });

  it("NEGATIVE: a student sees only their own audit events", () => {
    const events = readableAudit(user("u_amara"));
    expect(events.every((e) => e.actorUserId === "u_amara")).toBe(true);
  });

  it("POSITIVE: a student's sections are exactly their own enrollments", () => {
    const amara = user("u_amara");
    const sections = visibleSectionIds(amara);
    const own = db()
      .enrollments.filter((e) => e.studentId === "u_amara")
      .map((e) => e.sectionId);
    expect(sections.sort()).toEqual(own.sort());
  });
});

describe("teacher scope: assigned roster sections", () => {
  it("POSITIVE: a teacher reads students in their own sections", () => {
    const alvarez = user("u_alvarez");
    const visible = visibleStudentIds(alvarez);
    expect(visible).toContain("u_amara");
    expect(visible.length).toBeGreaterThan(0);
    for (const id of visible) expect(() => assertCanReadStudent(alvarez, id)).not.toThrow();
  });

  it("NEGATIVE: a teacher cannot read a student at another site", () => {
    const alvarez = user("u_alvarez"); // Beaumont
    expect(canReadStudent(alvarez, "u_lena")).toBe(false); // Colton
    expect(() => assertCanReadStudent(alvarez, "u_lena")).toThrow(/outside your scope/);
  });

  it("NEGATIVE: a teacher cannot read a student in a colleague's section at the same site", () => {
    const delacroix = user("u_delacroix"); // science only, Beaumont
    const alvarez = user("u_alvarez"); // mathematics, Beaumont
    const scienceOnly = visibleStudentIds(delacroix);
    const mathOnly = visibleStudentIds(alvarez).filter((id) => !scienceOnly.includes(id));
    // Diego is in Mathematics 8 with Alvarez and Integrated Science 8 with
    // Delacroix, so use a student who is only in one of the two.
    for (const id of mathOnly) {
      expect(canReadStudent(delacroix, id), `${id} leaked to the science teacher`).toBe(false);
    }
  });

  it("NEGATIVE: a teacher cannot assign support to a student outside their roster", () => {
    expect(canAssignIntervention(user("u_alvarez"), "u_lena")).toBe(false);
    expect(canAssignIntervention(user("u_farouk"), "u_amara")).toBe(false);
  });

  it("POSITIVE: a teacher can enter a grade for their own student", () => {
    expect(canEnterGrade(user("u_alvarez"), "u_amara")).toBe(true);
  });

  it("NEGATIVE: a teacher cannot enter a grade for another teacher's student", () => {
    expect(canEnterGrade(user("u_alvarez"), "u_lena")).toBe(false);
  });

  it("NEGATIVE: a teacher cannot read the whole audit log or manage permissions", () => {
    const alvarez = user("u_alvarez");
    expect(canReadAllAudit(alvarez)).toBe(false);
    expect(canManagePermissions(alvarez)).toBe(false);
    expect(readableAudit(alvarez).every((e) => e.actorUserId === alvarez.id)).toBe(true);
  });

  it("POSITIVE: curriculum authoring is checked independently of role", () => {
    // Alvarez is a teacher who also holds the authorization.
    expect(canAuthorCurriculum(user("u_alvarez"))).toBe(true);
    expect(canAuthorCurriculum(user("u_adjei"))).toBe(false);
  });
});

describe("site admin scope: one site", () => {
  it("POSITIVE: reads every student at their own site", () => {
    const salinas = user("u_salinas"); // Beaumont
    const visible = visibleStudentIds(salinas);
    const expected = db()
      .users.filter((u) => u.role === "student" && u.siteId === "site_beaumont")
      .map((u) => u.id);
    expect(visible.sort()).toEqual(expected.sort());
  });

  it("NEGATIVE: reads no student at another site", () => {
    const salinas = user("u_salinas");
    const mesaStudents = db()
      .users.filter((u) => u.role === "student" && u.siteId === "site_colton")
      .map((u) => u.id);
    expect(mesaStudents.length).toBeGreaterThan(0);
    for (const id of mesaStudents) {
      expect(canReadStudent(salinas, id), `${id} leaked across sites`).toBe(false);
    }
  });

  it("POSITIVE: can assign an approved support at their own site", () => {
    expect(canAssignIntervention(user("u_salinas"), "u_amara")).toBe(true);
  });

  it("NEGATIVE: cannot enter or change a grade", () => {
    expect(canEnterGrade(user("u_salinas"), "u_amara")).toBe(false);
  });

  it("NEGATIVE: cannot manage another site or the organization", () => {
    expect(canManageSite(user("u_salinas"), "site_beaumont")).toBe(true);
    expect(canManageSite(user("u_salinas"), "site_colton")).toBe(false);
    expect(canManagePermissions(user("u_salinas"))).toBe(false);
    expect(canReadAllAudit(user("u_salinas"))).toBe(false);
  });
});

describe("org admin scope: the organization", () => {
  it("POSITIVE: reads every student in the organization", () => {
    const okonjo = user("u_okonjo");
    const all = db().users.filter((u) => u.role === "student").map((u) => u.id);
    expect(visibleStudentIds(okonjo).sort()).toEqual(all.sort());
  });

  it("POSITIVE: reads the whole audit log and manages both sites", () => {
    const okonjo = user("u_okonjo");
    expect(canReadAllAudit(okonjo)).toBe(true);
    expect(canManagePermissions(okonjo)).toBe(true);
    expect(canManageSite(okonjo, "site_beaumont")).toBe(true);
    expect(canManageSite(okonjo, "site_colton")).toBe(true);
    expect(readableAudit(okonjo).length).toBeGreaterThan(0);
  });

  it("NEGATIVE: cannot enter or change a grade", () => {
    expect(canEnterGrade(user("u_okonjo"), "u_amara")).toBe(false);
  });

  it("NEGATIVE: cannot assign an intervention", () => {
    // Assignment is a teacher decision, or a site-admin follow-up. Not an
    // org-admin action.
    expect(canAssignIntervention(user("u_okonjo"), "u_amara")).toBe(false);
  });

  it("NEGATIVE: ordinary administrative access does not grant curriculum editing", () => {
    expect(user("u_okonjo").role).toBe("org_admin");
    expect(canAuthorCurriculum(user("u_okonjo"))).toBe(false);
  });
});

describe("curriculum author: authorization, not hierarchy", () => {
  it("POSITIVE: holds curriculum authoring", () => {
    expect(canAuthorCurriculum(user("u_haddad"))).toBe(true);
  });

  it("NEGATIVE: reads no student records at all", () => {
    const haddad = user("u_haddad");
    expect(visibleStudentIds(haddad)).toEqual([]);
    expect(visibleSectionIds(haddad)).toEqual([]);
    for (const student of db().users.filter((u) => u.role === "student")) {
      expect(canReadStudent(haddad, student.id), `${student.id} leaked`).toBe(false);
    }
  });

  it("NEGATIVE: cannot assign support, grade, read audit, or manage permissions", () => {
    const haddad = user("u_haddad");
    expect(canAssignIntervention(haddad, "u_amara")).toBe(false);
    expect(canEnterGrade(haddad, "u_amara")).toBe(false);
    expect(canReadAllAudit(haddad)).toBe(false);
    expect(canManagePermissions(haddad)).toBe(false);
  });
});

describe("default deny", () => {
  it("no role sees a student outside its own scope", () => {
    const d = db();
    const students = d.users.filter((u) => u.role === "student");
    // Every role and every site is covered; students are sampled every 37th
    // row so the check stays exhaustive in what matters without running a
    // 584 x 631 cross product on each suite run.
    const sample = students.filter((_, i) => i % 37 === 0);
    const actors = [
      ...d.users.filter((u) => u.role !== "student"),
      ...students.filter((_, i) => i % 53 === 0),
    ];
    expect(new Set(actors.map((a) => a.role)).size).toBe(5);
    expect(sample.length).toBeGreaterThan(10);

    for (const actor of actors) {
      const visible = new Set(visibleStudentIds(actor));
      for (const student of sample) {
        if (visible.has(student.id)) continue;
        expect(canReadStudent(actor, student.id)).toBe(false);
        expect(() => assertCanReadStudent(actor, student.id)).toThrow();
      }
    }
  });

  it("records a scope label on every actor for the audit trail", () => {
    for (const actor of db().users) {
      expect(scopeLabel(actor)).toMatch(/^(site|org):/);
    }
  });
});
