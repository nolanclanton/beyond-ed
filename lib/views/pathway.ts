/**
 * The unit-by-unit view of a course pathway.
 *
 * The blueprint's unit budgets are in pathway days, so progress through a unit
 * is measured in days completed rather than lessons counted — a 7-day lesson is
 * not the same step as a 1-day lesson, and counting lessons would overstate a
 * student who has finished three short ones.
 */
import {
  courseLessons,
  getCourse,
  type CatalogCourse,
  type CatalogUnit,
} from "@/lib/curriculum/catalog";
import { monthForUnitStart } from "@/lib/calendar/periods";
import { lessonStatesFor } from "@/lib/db/store";
import type { Enrollment } from "@/lib/db/types";

export type UnitProgress = {
  unit: CatalogUnit;
  /** Month this unit starts in, from the local calendar mapping. */
  month: string;
  percent: number;
  daysComplete: number;
  daysTotal: number;
  lessonsComplete: number;
  lessonsTotal: number;
  state: "complete" | "current" | "not_started";
};

export function unitProgress(enrollment: Enrollment): UnitProgress[] {
  const course = getCourse(enrollment.courseTitle);
  if (!course) return [];

  const states = new Map(
    lessonStatesFor(enrollment.id).map((s) => [s.lessonCode, s.status]),
  );

  let daysBefore = 0;
  let currentSeen = false;

  return course.units.map((unit) => {
    const month = monthForUnitStart(daysBefore);
    daysBefore += unit.pathwayDays;

    const daysComplete = unit.lessons
      .filter((l) => states.get(l.code) === "completed")
      .reduce((n, l) => n + l.days, 0);
    const lessonsComplete = unit.lessons.filter(
      (l) => states.get(l.code) === "completed",
    ).length;
    const daysTotal = unit.lessons.reduce((n, l) => n + l.days, 0) || unit.pathwayDays;

    const touched = unit.lessons.some((l) => {
      const status = states.get(l.code);
      return status !== undefined && status !== "locked";
    });
    const finished = lessonsComplete === unit.lessons.length && unit.lessons.length > 0;

    let state: UnitProgress["state"] = "not_started";
    if (finished) state = "complete";
    else if (touched && !currentSeen) {
      state = "current";
      currentSeen = true;
    }

    return {
      unit,
      month,
      percent: daysTotal === 0 ? 0 : Math.round((daysComplete / daysTotal) * 100),
      daysComplete,
      daysTotal,
      lessonsComplete,
      lessonsTotal: unit.lessons.length,
      state,
    };
  });
}

/** "Lesson 3 of 9 in this unit" — the line a student reads on the dashboard. */
export function lessonPositionInUnit(
  enrollment: Enrollment,
  lessonCode: string,
): { index: number; total: number; unit: CatalogUnit } | null {
  const course = getCourse(enrollment.courseTitle);
  if (!course) return null;
  for (const unit of course.units) {
    const index = unit.lessons.findIndex((l) => l.code === lessonCode);
    if (index >= 0) {
      return { index: index + 1, total: unit.lessons.length, unit };
    }
  }
  return null;
}

/** Total pathway days finished across a course. */
export function pathwayDaysComplete(enrollment: Enrollment, course: CatalogCourse): number {
  const done = new Set(
    lessonStatesFor(enrollment.id)
      .filter((s) => s.status === "completed")
      .map((s) => s.lessonCode),
  );
  return courseLessons(course)
    .filter((l) => done.has(l.code))
    .reduce((n, l) => n + l.days, 0);
}
