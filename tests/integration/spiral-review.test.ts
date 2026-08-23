import { beforeEach, describe, expect, it } from "vitest";

import { subjectForLesson } from "@/lib/curriculum/catalog";
import { ALL_ITEMS, itemById } from "@/lib/db/demo-items";
import { ensureSeeded } from "@/lib/db/seed";
import { clearDatabase, db } from "@/lib/db/store";
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

/** Every lesson a seeded student currently has open. */
function openLessons() {
  const d = db();
  return d.enrollments
    .filter((e) => e.status === "active")
    .flatMap((enrollment) => {
      const state = d.lessonStates.find(
        (s) =>
          s.enrollmentId === enrollment.id &&
          (s.status === "available" || s.status === "in_progress"),
      );
      return state ? [{ enrollment, lessonCode: state.lessonCode }] : [];
    });
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
    // Guard against the assertion passing because nothing was selected.
    expect(checked).toBeGreaterThan(50);
  });

  it("never draws from the lesson being taught", () => {
    for (const { enrollment, lessonCode } of openLessons()) {
      const result = spiralReviewFor(enrollment.studentId, enrollment.id, lessonCode);
      for (const selected of result.items) {
        expect(itemById(selected.itemId)?.lessonCode).not.toBe(lessonCode);
      }
    }
  });

  it("gives the named demo students a usable set in every subject", () => {
    const named = ["u_amara", "u_priya", "u_jamal", "u_diego"];
    for (const { enrollment, lessonCode } of openLessons()) {
      if (!named.includes(enrollment.studentId)) continue;
      const result = spiralReviewFor(enrollment.studentId, enrollment.id, lessonCode);
      expect(
        result.items.length,
        `${enrollment.studentId} / ${enrollment.courseTitle} has no review items`,
      ).toBeGreaterThan(0);
      expect(result.items.length).toBeLessThanOrEqual(SPIRAL_REVIEW_MAX_ITEMS);
    }
  });

  it("reaches the full set in social science, which was the thinnest", () => {
    const enrollment = db().enrollments.find(
      (e) => e.id === "enr_amara_Grade_6_Ancient_World",
    );
    if (!enrollment) throw new Error("seed missing");
    const result = spiralReviewFor("u_amara", enrollment.id, "H6-U1-L2");
    expect(result.items.length).toBeGreaterThanOrEqual(5);
    for (const selected of result.items) {
      expect(subjectForLesson(itemById(selected.itemId)!.lessonCode)).toBe(
        "Social science",
      );
    }
  });

  it("draws on upcoming prerequisites, not only skills already assessed", () => {
    const enrollment = db().enrollments.find(
      (e) => e.id === "enr_amara_Mathematics_6",
    );
    if (!enrollment) throw new Error("seed missing");
    const result = spiralReviewFor("u_amara", enrollment.id, "M6-U1-L2");
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
    const first = spiralReviewFor("u_amara", enrollment.id, "H6-U1-L2");
    const second = spiralReviewFor("u_amara", enrollment.id, "H6-U1-L2");
    expect(second.items.map((i) => i.itemId)).toEqual(first.items.map((i) => i.itemId));
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
      "English",
      "Mathematics",
      "Science",
      "Social science",
    ]);
  });
});
