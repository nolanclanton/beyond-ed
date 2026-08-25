import { beforeEach, describe, expect, it } from "vitest";

import { auditForTarget } from "@/lib/audit/log";
import { publicationGate } from "@/lib/curriculum/authoring";
import { validateCourseBudget } from "@/lib/curriculum/budget";
import { getCourse, lessonStage, locateLesson } from "@/lib/curriculum/catalog";
import {
  addFoundation,
  foundationConflicts,
  foundationsFor,
  governanceSummary,
  governedFoundations,
  setFoundationImportance,
  setFoundationRetired,
} from "@/lib/curriculum/foundations";
import { prerequisitesFor } from "@/lib/curriculum/prerequisites";
import { coverageReport } from "@/lib/curriculum/standards";
import {
  effectiveCourse,
  locateInCourse,
  moveLesson,
  moveUnit,
  resetSequence,
  setUnitFraming,
  structureChanges,
  structureFor,
  versionRecord,
} from "@/lib/curriculum/structure";
import { ensureSeeded } from "@/lib/db/seed";
import { clearDatabase, db } from "@/lib/db/store";
import type { User } from "@/lib/db/types";

function user(id: string): User {
  const u = db().users.find((x) => x.id === id);
  if (!u) throw new Error(`missing ${id}`);
  return u;
}

/** The seeded Mathematics 6 draft and its published predecessor. */
const DRAFT = "cv_Mathematics_6_2026_2";
const PUBLISHED = "cv_Mathematics_6_2026_1";

let author: User;
let admin: User;
let key = 0;
const nextKey = () => `gov-test-${(key += 1)}-${"x".repeat(8)}`;

beforeEach(() => {
  clearDatabase();
  ensureSeeded();
  author = user("u_haddad");
  admin = user("u_okonjo");
  key = 0;
});

describe("re-sequencing a course version (CLAUDE.md §7)", () => {
  it("moves a unit, renumbers the days, and moves no identifier", () => {
    const before = effectiveCourse(versionRecord(DRAFT));
    const firstUnit = before.units[0];
    const secondUnit = before.units[1];

    moveUnit(
      author,
      { versionId: DRAFT, unitId: secondUnit.id, direction: "up", reason: "Pilot order." },
      nextKey(),
    );

    const after = effectiveCourse(versionRecord(DRAFT));
    expect(after.units[0].id).toBe(secondUnit.id);
    expect(after.units[1].id).toBe(firstUnit.id);
    // Days are a position and are recomputed; ids are not.
    expect(after.units[0].startDay).toBe(1);
    expect(after.units[0].lessons[0].code).toBe(secondUnit.lessons[0].code);
    expect(after.units[0].lessons[0].day).toBe(1);
    expect(after.units[1].startDay).toBe(secondUnit.lessons.length + 1);
    expect(after.units.map((u) => u.id).sort()).toEqual(
      before.units.map((u) => u.id).sort(),
    );
  });

  it("moves a lesson inside its unit without touching the day budget", () => {
    const before = effectiveCourse(versionRecord(DRAFT));
    const unit = before.units[0];
    const last = unit.lessons[unit.lessons.length - 1];

    moveLesson(
      author,
      {
        versionId: DRAFT,
        lessonCode: last.code,
        toPosition: 1,
        reason: "Students need the anchor task first.",
      },
      nextKey(),
    );

    const after = effectiveCourse(versionRecord(DRAFT));
    expect(after.units[0].lessons[0].code).toBe(last.code);
    expect(after.units[0].lessons[0].day).toBe(1);
    expect(after.units[0].lessons).toHaveLength(unit.lessons.length);

    const budget = validateCourseBudget(after);
    expect(budget.valid).toBe(true);
    expect(budget.pathwayDays).toBe(135);
    expect(budget.totalDays).toBe(175);
  });

  it("re-sequencing leaves standards coverage exactly where it was", () => {
    const baseline = getCourse("Mathematics 6");
    if (!baseline) throw new Error("missing course");
    const before = coverageReport(baseline);

    const unit = effectiveCourse(versionRecord(DRAFT)).units[0];
    moveLesson(
      author,
      {
        versionId: DRAFT,
        lessonCode: unit.lessons[4].code,
        toPosition: 2,
        reason: "Reordered for the pilot.",
      },
      nextKey(),
    );

    const after = coverageReport(effectiveCourse(versionRecord(DRAFT)));
    expect(after.assigned).toBe(before.assigned);
    expect(after.covered).toBe(before.covered);
    expect(after.gaps).toEqual(before.gaps);
  });

  it("a lesson's arc position follows the sequence, its code never does", () => {
    const unit = effectiveCourse(versionRecord(DRAFT)).units[0];
    const target = unit.lessons[11];
    const workbookStage = lessonStage(target);

    moveLesson(
      author,
      { versionId: DRAFT, lessonCode: target.code, toPosition: 1, reason: "Pilot." },
      nextKey(),
    );

    const moved = locateInCourse(effectiveCourse(versionRecord(DRAFT)), target.code);
    expect(moved?.lesson.code).toBe(target.code);
    expect(moved?.lesson.day).toBe(1);
    expect(lessonStage(moved!.lesson).type).not.toBe(workbookStage.type);
    // The workbook itself is untouched.
    expect(locateLesson(target.code)?.lesson.day).toBe(target.day);
  });

  it("refuses a position outside the unit, and says why", () => {
    const unit = effectiveCourse(versionRecord(DRAFT)).units[0];
    expect(() =>
      moveLesson(
        author,
        {
          versionId: DRAFT,
          lessonCode: unit.lessons[0].code,
          toPosition: 99,
          reason: "Into another unit.",
        },
        nextKey(),
      ),
    ).toThrow(/between 1 and 15/);
  });

  it("re-frames a unit for this version only, and audits it", () => {
    const unit = effectiveCourse(versionRecord(DRAFT)).units[0];
    setUnitFraming(
      author,
      {
        versionId: DRAFT,
        unitId: unit.id,
        title: "Ratios in the world we buy in",
        essentialQuestion: "Where do ratios already decide something for us?",
        reason: "Adapted for the pilot cohort.",
      },
      nextKey(),
    );

    const after = effectiveCourse(versionRecord(DRAFT));
    expect(after.units[0].title).toBe("Ratios in the world we buy in");
    // The workbook, and therefore every other version, is unchanged.
    expect(getCourse("Mathematics 6")?.units[0].title).toBe(unit.title);

    const events = auditForTarget("course_version", DRAFT);
    expect(events.some((e) => e.action === "curriculum.unit_reframed")).toBe(true);
  });

  it("reset returns the version to the workbook's own sequence", () => {
    const unit = effectiveCourse(versionRecord(DRAFT)).units[1];
    moveUnit(
      author,
      { versionId: DRAFT, unitId: unit.id, direction: "up", reason: "Pilot." },
      nextKey(),
    );
    expect(structureChanges(versionRecord(DRAFT))).not.toHaveLength(0);

    resetSequence(author, { versionId: DRAFT, reason: "Applied to the wrong version." }, nextKey());
    expect(structureChanges(versionRecord(DRAFT))).toHaveLength(0);
    expect(effectiveCourse(versionRecord(DRAFT)).units[0].id).toBe(
      getCourse("Mathematics 6")?.units[0].id,
    );
  });

  it("a retry with the same key re-sequences once, not twice", () => {
    const unit = effectiveCourse(versionRecord(DRAFT)).units[1];
    const stableKey = nextKey();
    moveUnit(author, { versionId: DRAFT, unitId: unit.id, direction: "up", reason: "Pilot." }, stableKey);
    moveUnit(author, { versionId: DRAFT, unitId: unit.id, direction: "up", reason: "Pilot." }, stableKey);

    const after = effectiveCourse(versionRecord(DRAFT));
    expect(after.units[0].id).toBe(unit.id);
    expect(
      auditForTarget("course_version", DRAFT).filter(
        (e) => e.action === "curriculum.unit_moved",
      ),
    ).toHaveLength(1);
  });

  it("nothing is editable on a published version", () => {
    const unit = effectiveCourse(versionRecord(PUBLISHED)).units[1];
    expect(() =>
      moveUnit(
        author,
        { versionId: PUBLISHED, unitId: unit.id, direction: "up", reason: "No." },
        nextKey(),
      ),
    ).toThrow(/draft/);
    expect(structureFor(PUBLISHED)).toBeUndefined();
  });
});

describe("governing the foundation map (CLAUDE.md §8)", () => {
  const LESSON = "MATH-06-L041";

  it("an ungoverned link reports no strength rather than an invented one", () => {
    const foundations = foundationsFor(DRAFT, LESSON);
    expect(foundations).toHaveLength(prerequisitesFor(LESSON).length);
    expect(foundations.every((f) => f.importance === null)).toBe(true);
    expect(foundations.every((f) => f.source === "workbook")).toBe(true);
  });

  it("records how hard a link binds, and audits the change", () => {
    const target = prerequisitesFor(LESSON)[0];
    setFoundationImportance(
      author,
      {
        versionId: DRAFT,
        lessonCode: LESSON,
        targetId: target.id,
        importance: 5,
        note: "Students who miss this stall here every year.",
        reason: "Three years of Exit Ticket evidence.",
      },
      nextKey(),
    );

    const saved = foundationsFor(DRAFT, LESSON).find((f) => f.targetId === target.id);
    expect(saved?.importance).toBe(5);
    expect(governanceSummary(DRAFT).foundational).toBe(1);
    // Governance belongs to this version alone.
    expect(
      foundationsFor(PUBLISHED, LESSON).find((f) => f.targetId === target.id)?.importance,
    ).toBeNull();

    const events = auditForTarget("course_version", DRAFT);
    expect(events.some((e) => e.action === "curriculum.foundation_weighted")).toBe(true);
  });

  it("adds a foundation only from earlier in this version's own sequence", () => {
    const course = effectiveCourse(versionRecord(DRAFT));
    const here = locateInCourse(course, LESSON);
    if (!here) throw new Error("missing lesson");
    const earlier = course.units.flatMap((u) => u.lessons)[here.index - 5];
    const later = course.units.flatMap((u) => u.lessons)[here.index + 5];

    addFoundation(
      author,
      {
        versionId: DRAFT,
        lessonCode: LESSON,
        targetId: earlier.code,
        importance: 4,
        note: "",
        reason: "The pilot cohort needs the earlier model.",
      },
      nextKey(),
    );
    expect(
      foundationsFor(DRAFT, LESSON).some((f) => f.targetId === earlier.code),
    ).toBe(true);

    expect(() =>
      addFoundation(
        author,
        {
          versionId: DRAFT,
          lessonCode: LESSON,
          targetId: later.code,
          importance: 4,
          note: "",
          reason: "Should not be allowed.",
        },
        nextKey(),
      ),
    ).toThrow(/has to come first/);

    expect(() =>
      addFoundation(
        author,
        {
          versionId: DRAFT,
          lessonCode: LESSON,
          targetId: LESSON,
          importance: 4,
          note: "",
          reason: "Should not be allowed.",
        },
        nextKey(),
      ),
    ).toThrow(/its own foundation/);
  });

  it("refuses a support that cannot return a student into this course", () => {
    // An English support cannot return a student into Mathematics 6.
    expect(() =>
      addFoundation(
        author,
        {
          versionId: DRAFT,
          lessonCode: LESSON,
          targetId: "ELA-INT-001",
          importance: 3,
          note: "",
          reason: "Should not be allowed.",
        },
        nextKey(),
      ),
    ).toThrow(/return a student into/);
  });

  it("retiring a link keeps the workbook record readable", () => {
    const target = prerequisitesFor(LESSON)[0];
    setFoundationRetired(
      author,
      {
        versionId: DRAFT,
        lessonCode: LESSON,
        targetId: target.id,
        retired: true,
        reason: "This course now teaches the skill directly in unit 1.",
      },
      nextKey(),
    );

    expect(foundationsFor(DRAFT, LESSON).some((f) => f.targetId === target.id)).toBe(
      false,
    );
    const governed = governedFoundations(DRAFT, LESSON).find(
      (f) => f.targetId === target.id,
    );
    expect(governed?.retired).toBe(true);
    expect(governed?.role).toBe(target.reason);
    // The workbook itself never changed.
    expect(prerequisitesFor(LESSON).some((p) => p.id === target.id)).toBe(true);
  });
});

describe("publication is gated on what the version actually runs (CLAUDE.md §7)", () => {
  const LESSON = "MATH-06-L041";

  it("a clean draft has no structural or foundation blockers", () => {
    const gate = publicationGate(DRAFT);
    expect(foundationConflicts(versionRecord(DRAFT))).toHaveLength(0);
    // The only blocker on a fresh draft is its lifecycle status.
    expect(gate.blockers).toHaveLength(1);
    expect(gate.blockers[0]).toMatch(/approved/);
  });

  it("moving a lesson in front of what depends on it blocks publication", () => {
    const course = effectiveCourse(versionRecord(DRAFT));
    const here = locateInCourse(course, LESSON);
    if (!here) throw new Error("missing lesson");
    // Its immediate prior lesson, which the workbook names as a foundation.
    const foundation = prerequisitesFor(LESSON).find((p) => p.kind === "lesson");
    if (!foundation) throw new Error("no lesson foundation");

    const at = locateInCourse(course, foundation.id);
    if (!at) throw new Error("foundation not in course");
    // Push the foundation to the end of its own unit, past the lesson that
    // depends on it.
    moveLesson(
      author,
      {
        versionId: DRAFT,
        lessonCode: foundation.id,
        toPosition: at.unit.lessons.length,
        reason: "Deliberately breaking the order for the test.",
      },
      nextKey(),
    );

    const conflicts = foundationConflicts(versionRecord(DRAFT));
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].message).toMatch(/has to come first/);
    expect(publicationGate(DRAFT).blockers.some((b) => /do not hold|does not hold/.test(b))).toBe(
      true,
    );
  });
});

describe("governance is an authorization, not a role (CLAUDE.md §3)", () => {
  it("NEGATIVE: an org admin without the authorization changes nothing", () => {
    const unit = effectiveCourse(versionRecord(DRAFT)).units[1];
    expect(admin.curriculumAuthor).toBeFalsy();

    expect(() =>
      moveUnit(
        admin,
        { versionId: DRAFT, unitId: unit.id, direction: "up", reason: "No." },
        nextKey(),
      ),
    ).toThrow();
    expect(() =>
      setFoundationImportance(
        admin,
        {
          versionId: DRAFT,
          lessonCode: "MATH-06-L041",
          targetId: prerequisitesFor("MATH-06-L041")[0].id,
          importance: 5,
          note: "",
          reason: "No.",
        },
        nextKey(),
      ),
    ).toThrow();

    expect(structureFor(DRAFT)).toBeUndefined();
    expect(effectiveCourse(versionRecord(DRAFT)).units[0].id).toBe(
      getCourse("Mathematics 6")?.units[0].id,
    );
  });

  it("NEGATIVE: a failed write leaves no partial structure behind", () => {
    const unit = effectiveCourse(versionRecord(DRAFT)).units[0];
    expect(() =>
      moveUnit(
        author,
        { versionId: DRAFT, unitId: unit.id, direction: "up", reason: "Already first." },
        nextKey(),
      ),
    ).toThrow(/already runs first/);
    // `upsertStructure` ran before the throw; the transaction rolled it back.
    expect(structureFor(DRAFT)).toBeUndefined();
  });

  it("every governance change requires a recorded reason", () => {
    const unit = effectiveCourse(versionRecord(DRAFT)).units[1];
    expect(() =>
      moveUnit(author, { versionId: DRAFT, unitId: unit.id, direction: "up", reason: "  " }, nextKey()),
    ).toThrow(/recorded reason/);
  });
});
