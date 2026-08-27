import { beforeEach, describe, expect, it } from "vitest";

import {
  assertCanAdministerCurriculum,
  assertCanReadStudent,
  assertCanReviewCurriculum,
  canAdministerCurriculum,
  canAssignIntervention,
  canAuthorCurriculum,
  canReviewCurriculum,
  curriculumGrantsOf,
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
import {
  approveVersion,
  publishVersion,
  submitForReview,
} from "@/lib/curriculum/authoring";
import {
  addLessonMaterial,
  authoredLesson,
  authoringGate,
  saveLessonBlock,
  saveLessonScript,
} from "@/lib/curriculum/lesson-authoring";
import {
  addFoundation,
  foundationsFor,
  governedFoundations,
  setFoundationImportance,
  setFoundationRetired,
} from "@/lib/curriculum/foundations";
import { prerequisitesFor } from "@/lib/curriculum/prerequisites";
import {
  effectiveCourse,
  moveUnit,
  setUnitFraming,
  structureChanges,
  structureFor,
  structureGate,
  versionRecord,
} from "@/lib/curriculum/structure";
import { resolveLessonContent } from "@/lib/curriculum/lesson-bank";
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
    const alvarez = user("u_alvarez"); // Northfield Central
    expect(canReadStudent(alvarez, "u_lena")).toBe(false); // Riverside
    expect(() => assertCanReadStudent(alvarez, "u_lena")).toThrow(/outside your scope/);
  });

  it("NEGATIVE: a teacher cannot read a student in a colleague's section at the same site", () => {
    const delacroix = user("u_delacroix"); // science only, Northfield Central
    const alvarez = user("u_alvarez"); // mathematics, Northfield Central
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
    const salinas = user("u_salinas"); // Northfield Central
    const visible = visibleStudentIds(salinas);
    const expected = db()
      .users.filter((u) => u.role === "student" && u.siteId === "site_northfield")
      .map((u) => u.id);
    expect(visible.sort()).toEqual(expected.sort());
  });

  it("NEGATIVE: reads no student at another site", () => {
    const salinas = user("u_salinas");
    const mesaStudents = db()
      .users.filter((u) => u.role === "student" && u.siteId === "site_riverside")
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
    expect(canManageSite(user("u_salinas"), "site_northfield")).toBe(true);
    expect(canManageSite(user("u_salinas"), "site_riverside")).toBe(false);
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
    expect(canManageSite(okonjo, "site_northfield")).toBe(true);
    expect(canManageSite(okonjo, "site_riverside")).toBe(true);
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

/**
 * Authored lesson content — the contract `supabase/policies/authored_lessons.sql`
 * and `supabase/policies/lesson_blocks.sql` must satisfy (migrations 0006, 0007).
 *
 * Two grants, each with its negative: the curriculum-author authorization, and
 * the draft-only rule that keeps a published lesson from changing under a
 * running class. In the database these are one policy plus a trigger; here the
 * enforcement point is `authoringGate` / `saveLessonScript`, which every write
 * goes through.
 */
describe("authored lesson content: author authorization and the draft rule", () => {
  const DRAFT = "cv_Mathematics_6_2026_2";
  const PUBLISHED = "cv_Mathematics_6_2026_1";
  const LESSON = "MATH-06-L035";

  const script = (versionId: string) => ({
    versionId,
    lessonCode: LESSON,
    relevance: "",
    goal: "Find and use a unit rate.",
    successCriteria: [],
    vocabulary: [],
    workedModel: [],
    guidedPractice: [],
    independentTask: "",
    notesOutline: [],
    reason: "Policy test.",
  });

  const canvasBlock = (versionId: string) => ({
    versionId,
    lessonCode: LESSON,
    blockId: null,
    section: "instruction" as const,
    kind: "text" as const,
    text: "A rate compares two quantities with different units.",
    title: "",
    tone: "note" as const,
    ordered: false,
    items: [],
    term: "",
    meaning: "",
    caption: "",
    headers: [],
    rows: [],
    url: "",
    alt: "",
    videoId: "",
    materialId: "",
    reason: "Policy test.",
  });

  it("POSITIVE: a curriculum author writes content into a draft version", () => {
    const written = saveLessonScript(user("u_haddad"), script(DRAFT), "pol-1");
    expect(written.goal).toBe("Find and use a unit rate.");
    expect(authoringGate(user("u_haddad"), DRAFT).editable).toBe(true);
  });

  it("NEGATIVE: an administrator without the authorization writes nothing", () => {
    expect(canAuthorCurriculum(user("u_okonjo"))).toBe(false);
    expect(() => saveLessonScript(user("u_okonjo"), script(DRAFT), "pol-2")).toThrow();
    expect(authoredLesson(DRAFT, LESSON)).toBeUndefined();
    expect(authoringGate(user("u_okonjo"), DRAFT).editable).toBe(false);
  });

  it("NEGATIVE: not even an author writes into a published version", () => {
    expect(() => saveLessonScript(user("u_haddad"), script(PUBLISHED), "pol-3")).toThrow(
      /draft/,
    );
    expect(authoredLesson(PUBLISHED, LESSON)).toBeUndefined();
    expect(authoringGate(user("u_haddad"), PUBLISHED).editable).toBe(false);
  });

  it("POSITIVE: an author composes the canvas inside a draft", () => {
    const placed = saveLessonBlock(
      user("u_haddad"),
      canvasBlock(DRAFT),
      "pol-block-1",
    );
    expect(placed.kind).toBe("text");
    expect(authoredLesson(DRAFT, LESSON)?.blocks).toHaveLength(1);
  });

  it("NEGATIVE: an administrator without the authorization composes nothing", () => {
    expect(() =>
      saveLessonBlock(user("u_okonjo"), canvasBlock(DRAFT), "pol-block-2"),
    ).toThrow();
    expect(authoredLesson(DRAFT, LESSON)).toBeUndefined();
  });

  it("NEGATIVE: the canvas of a published version is closed to everyone", () => {
    expect(() =>
      saveLessonBlock(user("u_haddad"), canvasBlock(PUBLISHED), "pol-block-3"),
    ).toThrow(/draft/);
  });

  it("POSITIVE: everyone in the organization can read published content", () => {
    saveLessonScript(user("u_haddad"), script(DRAFT), "pol-4");
    submitForReview(user("u_haddad"), DRAFT, "Ready.", "pol-5");
    approveVersion(user("u_haddad"), DRAFT, "Approved.", "pol-6");
    publishVersion(user("u_haddad"), DRAFT, "Published.", "pol-7");

    // Reading is not gated on the authorization: a student needs the lesson
    // their section's version publishes.
    expect(resolveLessonContent(DRAFT, LESSON).source).toBe("authored");
  });
});

/**
 * Curriculum governance — re-sequencing a course and weighting its foundation
 * map — is the SAME authorization as lesson authoring, checked independently of
 * role (CLAUDE.md §3). Both are changes to what a class will be taught, so both
 * carry positive and negative tests.
 */
describe("curriculum governance is an authorization, not a hierarchy level", () => {
  const DRAFT = "cv_Mathematics_6_2026_2";
  const PUBLISHED = "cv_Mathematics_6_2026_1";
  const LESSON = "MATH-06-L035";
  const GOVERNED_LESSON = "MATH-06-L041";

  function firstFoundation() {
    const p = prerequisitesFor(GOVERNED_LESSON)[0];
    if (!p) throw new Error("the workbook names no foundation for this lesson");
    return p.id;
  }

  it("POSITIVE: an author re-sequences a draft and weights its foundations", () => {
    const unit = effectiveCourse(versionRecord(DRAFT)).units[1];
    moveUnit(
      user("u_haddad"),
      { versionId: DRAFT, unitId: unit.id, direction: "up", reason: "Pilot order." },
      "pol-gov-1",
    );
    expect(effectiveCourse(versionRecord(DRAFT)).units[0].id).toBe(unit.id);

    setFoundationImportance(
      user("u_haddad"),
      {
        versionId: DRAFT,
        lessonCode: GOVERNED_LESSON,
        targetId: firstFoundation(),
        importance: 5,
        note: "",
        reason: "Evidence shows students stall here without it.",
      },
      "pol-gov-2",
    );
    expect(
      foundationsFor(DRAFT, GOVERNED_LESSON).find((f) => f.targetId === firstFoundation())
        ?.importance,
    ).toBe(5);
    expect(structureGate(user("u_haddad"), DRAFT).editable).toBe(true);
  });

  it("NEGATIVE: an org admin without the authorization changes no structure", () => {
    const unit = effectiveCourse(versionRecord(DRAFT)).units[1];
    expect(canAuthorCurriculum(user("u_okonjo"))).toBe(false);

    expect(() =>
      moveUnit(
        user("u_okonjo"),
        { versionId: DRAFT, unitId: unit.id, direction: "up", reason: "No." },
        "pol-gov-3",
      ),
    ).toThrow();
    expect(() =>
      addFoundation(
        user("u_okonjo"),
        {
          versionId: DRAFT,
          lessonCode: GOVERNED_LESSON,
          targetId: firstFoundation(),
          importance: 4,
          note: "",
          reason: "No.",
        },
        "pol-gov-4",
      ),
    ).toThrow();

    expect(structureFor(DRAFT)).toBeUndefined();
    expect(structureGate(user("u_okonjo"), DRAFT).editable).toBe(false);
  });

  it("NEGATIVE: not even an author re-sequences a published version", () => {
    const unit = effectiveCourse(versionRecord(PUBLISHED)).units[1];
    expect(() =>
      moveUnit(
        user("u_haddad"),
        { versionId: PUBLISHED, unitId: unit.id, direction: "up", reason: "No." },
        "pol-gov-5",
      ),
    ).toThrow(/draft/);
    expect(structureGate(user("u_haddad"), PUBLISHED).editable).toBe(false);
  });

  it("NEGATIVE: an administrator without the authorization attaches no material", () => {
    expect(() =>
      addLessonMaterial(
        user("u_okonjo"),
        {
          versionId: DRAFT,
          lessonCode: LESSON,
          kind: "reading",
          title: "Unit price comparison",
          url: "https://materials.example.org/unit-price.pdf",
          purpose: "Compare the two package sizes.",
          accessNote: "Tagged PDF; a large-print copy is in the classroom folder.",
          minutes: 10,
          reason: "No.",
        },
        "pol-gov-6",
      ),
    ).toThrow();
    expect(authoredLesson(DRAFT, LESSON)).toBeUndefined();
  });

  it("POSITIVE: an author re-frames a unit for this version only", () => {
    const unit = effectiveCourse(versionRecord(DRAFT)).units[0];
    setUnitFraming(
      user("u_haddad"),
      {
        versionId: DRAFT,
        unitId: unit.id,
        title: "Ratios in the world we buy in",
        essentialQuestion: "Where do ratios already decide something for us?",
        reason: "Adapted for the pilot cohort.",
      },
      "pol-gov-7",
    );
    expect(effectiveCourse(versionRecord(DRAFT)).units[0].title).toBe(
      "Ratios in the world we buy in",
    );
    // The workbook, and therefore every other version, is untouched.
    expect(effectiveCourse(versionRecord(PUBLISHED)).units[0].title).toBe(unit.title);
  });

  it("NEGATIVE: an org admin without the authorization re-frames nothing", () => {
    const unit = effectiveCourse(versionRecord(DRAFT)).units[0];
    expect(() =>
      setUnitFraming(
        user("u_okonjo"),
        {
          versionId: DRAFT,
          unitId: unit.id,
          title: "Something else entirely",
          essentialQuestion: "Should this have been allowed?",
          reason: "No.",
        },
        "pol-gov-8",
      ),
    ).toThrow();
    expect(structureFor(DRAFT)).toBeUndefined();
  });

  it("NEGATIVE: an org admin without the authorization retires no foundation", () => {
    expect(() =>
      setFoundationRetired(
        user("u_okonjo"),
        {
          versionId: DRAFT,
          lessonCode: GOVERNED_LESSON,
          targetId: firstFoundation(),
          retired: true,
          reason: "No.",
        },
        "pol-gov-9",
      ),
    ).toThrow();
    expect(
      governedFoundations(DRAFT, GOVERNED_LESSON).find(
        (f) => f.targetId === firstFoundation(),
      )?.retired,
    ).toBe(false);
  });

  it("POSITIVE: everyone in the organization READS the structure an author set", () => {
    const unit = effectiveCourse(versionRecord(DRAFT)).units[1];
    moveUnit(
      user("u_haddad"),
      { versionId: DRAFT, unitId: unit.id, direction: "up", reason: "Pilot order." },
      "pol-gov-10",
    );
    setFoundationImportance(
      user("u_haddad"),
      {
        versionId: DRAFT,
        lessonCode: GOVERNED_LESSON,
        targetId: firstFoundation(),
        importance: 4,
        note: "",
        reason: "Evidence from the pilot.",
      },
      "pol-gov-11",
    );

    // Reading is not gated on the authorization. The sequence is the order a
    // student's own course runs in, and a teacher plans against the same
    // answer — so an org admin who cannot WRITE any of it still sees all of it.
    expect(canAuthorCurriculum(user("u_okonjo"))).toBe(false);
    expect(effectiveCourse(versionRecord(DRAFT)).units[0].id).toBe(unit.id);
    expect(structureChanges(versionRecord(DRAFT))).not.toHaveLength(0);
    expect(
      foundationsFor(DRAFT, GOVERNED_LESSON).find((f) => f.targetId === firstFoundation())
        ?.importance,
    ).toBe(4);
  });
});

/**
 * Materials follow the rest of a lesson's content: written only by a curriculum
 * author into a draft, read by everyone in the organization once published
 * (supabase/policies/lesson_materials.sql).
 */
describe("lesson materials: author authorization and the draft rule", () => {
  const DRAFT = "cv_Mathematics_6_2026_2";
  const PUBLISHED = "cv_Mathematics_6_2026_1";
  const LESSON = "MATH-06-L035";

  /** Enough script for `resolveLessonContent` to treat the lesson as authored. */
  const script = (versionId: string) => ({
    versionId,
    lessonCode: LESSON,
    relevance: "",
    goal: "Find and use a unit rate.",
    successCriteria: [],
    vocabulary: [],
    workedModel: [],
    guidedPractice: [],
    independentTask: "",
    notesOutline: [],
    reason: "Policy test.",
  });

  function material(versionId: string) {
    return {
      versionId,
      lessonCode: LESSON,
      kind: "worksheet" as const,
      title: "Unit-price comparison sheet",
      url: "https://materials.example.org/unit-price.pdf",
      purpose: "Fill in the price per ounce, then decide which is the better buy.",
      accessNote: "Tagged PDF; a large-print copy is in the classroom folder.",
      minutes: 10,
      reason: "Added the comparison sheet the pilot classes asked for.",
    };
  }

  it("POSITIVE: an author attaches a material inside a draft", () => {
    const saved = addLessonMaterial(user("u_haddad"), material(DRAFT), "pol-mat-1");
    expect(saved.kind).toBe("worksheet");
    expect(authoredLesson(DRAFT, LESSON)?.materials).toHaveLength(1);
  });

  it("NEGATIVE: not even an author attaches one to a published version", () => {
    expect(() =>
      addLessonMaterial(user("u_haddad"), material(PUBLISHED), "pol-mat-2"),
    ).toThrow(/draft/);
    expect(authoredLesson(PUBLISHED, LESSON)).toBeUndefined();
  });

  it("POSITIVE: everyone in the organization reads materials once published", () => {
    addLessonMaterial(user("u_haddad"), material(DRAFT), "pol-mat-3");
    saveLessonScript(user("u_haddad"), script(DRAFT), "pol-mat-4");

    // Not before publication: a draft is working state, not something a student
    // is told to open.
    expect(resolveLessonContent(DRAFT, LESSON).materials).toHaveLength(0);

    submitForReview(user("u_haddad"), DRAFT, "Ready.", "pol-mat-5");
    approveVersion(user("u_haddad"), DRAFT, "Approved.", "pol-mat-6");
    publishVersion(user("u_haddad"), DRAFT, "Published.", "pol-mat-7");

    const resolved = resolveLessonContent(DRAFT, LESSON);
    expect(resolved.materials).toHaveLength(1);
    // The access note travels with it, or the material excludes someone.
    expect(resolved.materials[0].accessNote.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Curriculum grants (vision §7, CLAUDE.md §3)
// ---------------------------------------------------------------------------

describe("curriculum grants are checked independently of role", () => {
  it("POSITIVE: a teacher may hold `author` without any administrative access", () => {
    const teacherAuthor = user("u_alvarez");
    expect(teacherAuthor.role).toBe("teacher");
    expect(canAuthorCurriculum(teacherAuthor)).toBe(true);
    expect(curriculumGrantsOf(teacherAuthor)).toEqual(["author"]);

    // Authoring, and nothing beyond it.
    expect(canReviewCurriculum(teacherAuthor)).toBe(false);
    expect(canAdministerCurriculum(teacherAuthor)).toBe(false);
    expect(canManagePermissions(teacherAuthor)).toBe(false);
    expect(canReadAllAudit(teacherAuthor)).toBe(false);
  });

  it("NEGATIVE: an organization administrator holds no curriculum grant by seniority", () => {
    const orgAdmin = user("u_okonjo");
    expect(orgAdmin.role).toBe("org_admin");
    expect(canAuthorCurriculum(orgAdmin)).toBe(false);
    expect(curriculumGrantsOf(orgAdmin)).toEqual([]);
    expect(canReviewCurriculum(orgAdmin)).toBe(false);
    expect(canAdministerCurriculum(orgAdmin)).toBe(false);

    expect(() => assertCanReviewCurriculum(orgAdmin)).toThrow(/reviewer/i);
    expect(() => assertCanAdministerCurriculum(orgAdmin)).toThrow(/administrator/i);
  });

  it("POSITIVE: the curriculum lead holds all three", () => {
    const lead = user("u_haddad");
    expect(curriculumGrantsOf(lead)).toEqual(["author", "reviewer", "administrator"]);
    expect(canReviewCurriculum(lead)).toBe(true);
    expect(canAdministerCurriculum(lead)).toBe(true);
  });

  it("NEGATIVE: a student holds nothing, whatever the grant list says", () => {
    const student = user("u_amara");
    expect(canAuthorCurriculum(student)).toBe(false);
    expect(curriculumGrantsOf(student)).toEqual([]);
    expect(canReviewCurriculum(student)).toBe(false);
    expect(canAdministerCurriculum(student)).toBe(false);
  });

  it("POSITIVE: an account with no grant list falls back to `author`", () => {
    // An account provisioned before the design studio existed carries no list.
    // It keeps exactly the access it had, stated rather than inferred.
    const legacy = { ...user("u_alvarez"), curriculumGrants: undefined };
    expect(curriculumGrantsOf(legacy)).toEqual(["author"]);
    expect(canReviewCurriculum(legacy)).toBe(false);
  });

  it("NEGATIVE: an empty grant list is read the same way, never as everything", () => {
    const empty = { ...user("u_alvarez"), curriculumGrants: [] };
    expect(curriculumGrantsOf(empty)).toEqual(["author"]);
    expect(canAdministerCurriculum(empty)).toBe(false);
  });
});
