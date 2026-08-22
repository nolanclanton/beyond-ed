import { describe, expect, it } from "vitest";

import {
  LESSON_TRANSITIONS,
  canTransitionLesson,
  transitionLesson,
} from "@/lib/curriculum/transitions";
import { LESSON_STATUSES } from "@/lib/curriculum/lesson-status";
import {
  INTERVENTION_TRANSITIONS,
  transitionIntervention,
} from "@/lib/intervention/transitions";
import { INTERVENTION_STATUSES } from "@/lib/intervention/status";
import { ENROLLMENT_STATUSES, transitionEnrollment } from "@/lib/enrollment/status";
import {
  CURRICULUM_STATUSES,
  transitionCurriculum,
} from "@/lib/curriculum/publication";

/**
 * CLAUDE.md §9: explicit transition tables with a single guarded transition
 * function per entity. Illegal transitions raise. Status is never set by direct
 * assignment.
 */
describe("guarded state machines", () => {
  it("walks the canonical lesson path", () => {
    let s = transitionLesson("locked", "available");
    s = transitionLesson(s, "in_progress");
    s = transitionLesson(s, "submitted");
    s = transitionLesson(s, "passed");
    s = transitionLesson(s, "review_scheduled");
    s = transitionLesson(s, "completed");
    expect(s).toBe("completed");
  });

  it("raises on an illegal lesson transition", () => {
    expect(() => transitionLesson("locked", "completed")).toThrow(/Illegal lesson transition/);
    expect(() => transitionLesson("completed", "available")).toThrow(/Illegal/);
    expect(() => transitionLesson("available", "passed")).toThrow(/Illegal/);
  });

  it("allows a submitted lesson back to in progress for the supported retry", () => {
    expect(canTransitionLesson("submitted", "in_progress")).toBe(true);
  });

  it("names the allowed transitions in the error", () => {
    try {
      transitionLesson("available", "completed");
      throw new Error("should have raised");
    } catch (error) {
      expect((error as Error).message).toContain("Allowed from available: in_progress");
    }
  });

  it("walks the canonical intervention path", () => {
    let s = transitionIntervention("recommended", "teacher_reviewed");
    s = transitionIntervention(s, "assigned");
    s = transitionIntervention(s, "in_progress");
    s = transitionIntervention(s, "readiness_check");
    s = transitionIntervention(s, "passed");
    s = transitionIntervention(s, "returned_to_pathway");
    s = transitionIntervention(s, "closed");
    expect(s).toBe("closed");
  });

  it("raises on an illegal intervention transition", () => {
    expect(() => transitionIntervention("recommended", "assigned")).toThrow(/Illegal/);
    expect(() => transitionIntervention("closed", "assigned")).toThrow(/Illegal/);
    expect(() => transitionIntervention("in_progress", "passed")).toThrow(/Illegal/);
  });

  it("walks the enrollment and curriculum paths", () => {
    let e = transitionEnrollment("pending", "active");
    e = transitionEnrollment(e, "transferred");
    e = transitionEnrollment(e, "active");
    expect(e).toBe("active");
    expect(() => transitionEnrollment("archived", "active")).toThrow(/Illegal/);

    let c = transitionCurriculum("draft", "in_review");
    c = transitionCurriculum(c, "approved");
    c = transitionCurriculum(c, "published");
    c = transitionCurriculum(c, "retired");
    expect(c).toBe("retired");
    expect(() => transitionCurriculum("draft", "published")).toThrow(/Illegal/);
  });

  it("defines a transition list for every declared status", () => {
    for (const s of LESSON_STATUSES) expect(LESSON_TRANSITIONS[s]).toBeDefined();
    for (const s of INTERVENTION_STATUSES) expect(INTERVENTION_TRANSITIONS[s]).toBeDefined();
    expect(ENROLLMENT_STATUSES).toHaveLength(5);
    expect(CURRICULUM_STATUSES).toHaveLength(5);
  });
});
