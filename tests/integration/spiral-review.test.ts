import { beforeEach, describe, expect, it } from "vitest";

import { locateLesson, subjectForLesson } from "@/lib/curriculum/catalog";
import { ALL_ITEMS, itemById } from "@/lib/db/demo-items";
import { ensureSeeded } from "@/lib/db/seed";
import { clearDatabase, db, lessonStatesFor } from "@/lib/db/store";
import { currentEvidence } from "@/lib/evidence/ledger";
import { upcomingStandardsFor } from "@/lib/intervention/queue";
import { spiralReviewFor } from "@/lib/learning/lesson";
import { SPIRAL_REVIEW_MAX_ITEMS } from "@/lib/rules/versions";

/**
 * Spiral Review draws from the lesson's OWN subject.
 *
 * Retrieval practice inside a mathematics lesson is mathematics. A history item
 * in a mathematics lesson is not spaced review — it breaks the thread the
 * student is holding and measures a skill the lesson has no bearing on.
 */
beforeEach(() => {
  clearDatabase();
  ensureSeeded();
});

/**
 * One open lesson per course, plus every lesson the named demo students have
 * open.
 *
 * Cross-subject leakage is a property of the COURSE, not of the individual
 * student — the candidate pool is built from the course's subject and the
 * student's own evidence, and a leak would show on any student in that course.
 * Sweeping all 2,336 active enrollments would call `skillProfile` 2,336 times
 * for no extra coverage.
 */
const NAMED = ["u_amara", "u_priya", "u_jamal", "u_diego", "u_marcus", "u_sofia"];

function openLessons() {
  const d = db();
  const seenCourses = new Set<string>();
  const out: { enrollment: (typeof d.enrollments)[number]; lessonCode: string }[] = [];

  for (const enrollment of d.enrollments) {
    if (enrollment.status !== "active") continue;
    const named = NAMED.includes(enrollment.studentId);
    if (!named && seenCourses.has(enrollment.courseTitle)) continue;

    const state = lessonStatesFor(enrollment.id).find(
      (s) => s.status === "available" || s.status === "in_progress",
    );
    if (!state) continue;

    seenCourses.add(enrollment.courseTitle);
    out.push({ enrollment, lessonCode: state.lessonCode });
  }
  return out;
}

describe("Spiral Review subject scoping", () => {
  it("never draws an item from another subject", () => {
    let checked = 0;
    for (const { enrollment, lessonCode } of openLessons()) {
      const expected = subjectForLesson(lessonCode);
      const result = spiralReviewFor(enrollment.studentId, enrollment.id, lessonCode);
      for (const selected of result.items) {
        const item = itemById(selected.itemId);
        expect(item, `${selected.itemId} is not in the bank`).toBeDefined();
        expect(
          subjectForLesson(item!.lessonCode),
          `${lessonCode} (${expected}) drew ${selected.itemId} from ${subjectForLesson(item!.lessonCode)}`,
        ).toBe(expected);
        checked += 1;
      }
    }
    // Guard against the assertion passing because nothing was selected, and
    // against the sweep quietly narrowing to a handful of courses.
    expect(checked).toBeGreaterThan(20);
    expect(new Set(openLessons().map((l) => l.enrollment.courseTitle)).size)
      .toBeGreaterThanOrEqual(20);
  });

  it("never draws from the lesson being taught", () => {
    for (const { enrollment, lessonCode } of openLessons()) {
      const result = spiralReviewFor(enrollment.studentId, enrollment.id, lessonCode);
      for (const selected of result.items) {
        expect(itemById(selected.itemId)?.lessonCode).not.toBe(lessonCode);
      }
    }
  });

  /**
   * The demo item bank covers the courses the worked-through demo runs in, not
   * all 38 — a course whose items nobody has written yet correctly offers no
   * review, and says so rather than inventing questions. These are the courses
   * a reviewer clicks through, so these are the ones asserted.
   */
  const WORKED_THROUGH: [string, string][] = [
    ["u_amara", "Mathematics 6"],
    ["u_amara", "English 6"],
    ["u_amara", "Integrated Science 6"],
    ["u_amara", "Grade 6 Ancient World"],
    ["u_priya", "Math 1"],
    ["u_priya", "English 9"],
    ["u_jamal", "Math 1"],
    ["u_jamal", "English 9"],
    ["u_diego", "Mathematics 8"],
    ["u_diego", "English 8"],
  ];

  it("gives the worked-through demo courses a usable set", () => {
    for (const { enrollment, lessonCode } of openLessons()) {
      const worked = WORKED_THROUGH.some(
        ([student, course]) =>
          student === enrollment.studentId && course === enrollment.courseTitle,
      );
      if (!worked) continue;
      const result = spiralReviewFor(enrollment.studentId, enrollment.id, lessonCode);
      expect(
        result.items.length,
        `${enrollment.studentId} / ${enrollment.courseTitle} has no review items`,
      ).toBeGreaterThan(0);
      expect(result.items.length).toBeLessThanOrEqual(SPIRAL_REVIEW_MAX_ITEMS);
    }
  });

  it("never offers a skill the student has neither met nor is about to meet", () => {
    // The pool is weak skills, upcoming prerequisites, and cumulative skills.
    // An item outside that set would be a question from the same subject picked
    // for no reason the student could be told.
    let checked = 0;
    for (const { enrollment, lessonCode } of openLessons()) {
      const seen = new Set(
        currentEvidence({ studentId: enrollment.studentId }).map((e) => e.skill),
      );
      const upcoming = new Set(upcomingStandardsFor(enrollment, lessonCode));
      const result = spiralReviewFor(enrollment.studentId, enrollment.id, lessonCode);
      for (const selected of result.items) {
        const skill = itemById(selected.itemId)!.skill;
        expect(
          seen.has(skill) || upcoming.has(skill),
          `${lessonCode} offered ${skill}, which is neither met nor upcoming`,
        ).toBe(true);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });

  it("reaches the full set in social science, which was the thinnest", () => {
    const enrollment = db().enrollments.find(
      (e) => e.id === "enr_amara_Grade_6_Ancient_World",
    );
    if (!enrollment) throw new Error("seed missing");
    const result = spiralReviewFor("u_amara", enrollment.id, "HSS-06-L001");
    expect(result.items.length).toBeGreaterThanOrEqual(5);
    for (const selected of result.items) {
      expect(subjectForLesson(itemById(selected.itemId)!.lessonCode)).toBe(
        "History-Social Science",
      );
    }
  });

  it("draws on upcoming prerequisites, not only skills already assessed", () => {
    const enrollment = db().enrollments.find(
      (e) => e.id === "enr_amara_Mathematics_6",
    );
    if (!enrollment) throw new Error("seed missing");
    const result = spiralReviewFor("u_amara", enrollment.id, "MATH-06-L035");
    // The blueprint's pool is weak skills, upcoming prerequisites, and
    // cumulative skills. Restricting to assessed skills would make the middle
    // one unreachable, because an upcoming standard has not been met yet.
    expect(result.items.some((i) => i.pool === "upcoming_prerequisite")).toBe(true);
    expect(result.items.some((i) => i.pool === "cumulative")).toBe(true);
  });

  it("is deterministic", () => {
    const enrollment = db().enrollments.find(
      (e) => e.id === "enr_amara_Grade_6_Ancient_World",
    );
    if (!enrollment) throw new Error("seed missing");
    const first = spiralReviewFor("u_amara", enrollment.id, "HSS-06-L001");
    const second = spiralReviewFor("u_amara", enrollment.id, "HSS-06-L001");
    expect(second.items.map((i) => i.itemId)).toEqual(first.items.map((i) => i.itemId));
  });

  it("keeps every demo item on a lesson that actually claims its standard", () => {
    // An item aligned to a standard its lesson does not carry produces evidence
    // pointing at the wrong place, which is worse than no item at all. The
    // studio enforces this for authored items; this is the same rule for the
    // demo bank (CLAUDE.md §8).
    for (const i of ALL_ITEMS) {
      const at = locateLesson(i.lessonCode);
      expect(at, `${i.id} points at ${i.lessonCode}, which is not a lesson`).toBeDefined();
      expect(
        at!.lesson.primaryStandard,
        `${i.id} claims ${i.standard}, but ${i.lessonCode} carries ${at!.lesson.primaryStandard}`,
      ).toBe(i.standard);
    }
  });

  it("keeps every authored item pointing at a real catalog lesson", () => {
    // A typo in an item's lesson code would silently drop it out of every
    // subject: `subjectForLesson` returns undefined, the filter rejects it, and
    // the item is never selected again without an error anywhere.
    expect(ALL_ITEMS.length).toBeGreaterThan(90);
    for (const item of ALL_ITEMS) {
      expect(
        subjectForLesson(item.lessonCode),
        `${item.id} points at ${item.lessonCode}, which is not in the catalog`,
      ).toBeDefined();
    }
  });

  it("carries recall items in all four subjects", () => {
    const subjects = new Set(
      ALL_ITEMS.filter((i) => i.purpose === "spiral_review").map((i) =>
        subjectForLesson(i.lessonCode),
      ),
    );
    expect([...subjects].sort()).toEqual([
      "English Language Arts",
      "History-Social Science",
      "Mathematics",
      "Science",
    ]);
  });
});
