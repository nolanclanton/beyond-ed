/**
 * The official gradebook (CLAUDE.md §4).
 *
 * A GRADE IS NOT A MASTERY ESTIMATE. This module summarises official
 * performance. It must never import from `/lib/mastery`, and `/lib/mastery`
 * must never import from here — the boundary is enforced by lint
 * (`eslint.config.mjs`) and by a test in
 * `/tests/unit/module-boundaries.test.ts`.
 *
 * There is no blended score, no "mastery grade", and no readiness percentage in
 * the gradebook. A grade is computed from `grade_records` alone.
 *
 * `grade_records` is append-only: a teacher's change writes a NEW row that
 * supersedes the previous one, so the original result stays readable
 * (CLAUDE.md §2 forbids `UPDATE grade_records`). The system never changes a
 * grade on its own — only a teacher does, and every change is audited.
 */
import { locateLesson, lessonPosition } from "@/lib/curriculum/catalog";
import { db } from "@/lib/db/store";
import { RULE_VERSIONS } from "@/lib/rules/versions";
import type { GradeCategory, GradeRecord } from "@/lib/db/types";

/**
 * The two gradebook categories, and which lessons land in each.
 *
 * Every unit runs the same fifteen-lesson arc, and two of its positions are
 * where a result is judged rather than checked: the formative checkpoint at 8
 * and the performance task at 15. Everything else is a knowledge check taken
 * along the way. Basing the split on the arc rather than on a lesson-code
 * pattern means it holds for every course in the catalog, and it moves only if
 * the curriculum itself moves.
 *
 * The weights are a demo default, not an adopted grading policy.
 */
export const GRADED_ARC_POSITIONS = [8, 15] as const;

export const GRADE_CATEGORY_SHAPE = [
  { suffix: "KC", name: "Knowledge checks", weight: 0.4 },
  { suffix: "AS", name: "Checkpoints and performance tasks", weight: 0.6 },
] as const;

/** The category suffix a lesson's result belongs under. */
export function categorySuffixFor(lessonCode: string): "KC" | "AS" {
  const at = locateLesson(lessonCode);
  if (!at) return "KC";
  return GRADED_ARC_POSITIONS.includes(
    lessonPosition(at.lesson) as (typeof GRADED_ARC_POSITIONS)[number],
  )
    ? "AS"
    : "KC";
}

/** A course's grade-category id for a lesson. One place builds this string. */
export function categoryIdFor(courseTitle: string, lessonCode: string): string {
  return `gc_${courseTitle.replace(/[^A-Za-z0-9]+/g, "_")}_${categorySuffixFor(lessonCode)}`;
}

export const DEFAULT_SCALE = [
  { min: 90, letter: "A" },
  { min: 80, letter: "B" },
  { min: 70, letter: "C" },
  { min: 60, letter: "D" },
  { min: 0, letter: "F" },
] as const;

export type CategoryResult = {
  category: GradeCategory;
  pointsEarned: number;
  pointsPossible: number;
  percent: number | null;
  weight: number;
  records: GradeRecord[];
};

export type CourseGrade = {
  enrollmentId: string;
  courseTitle: string;
  ruleVersion: string;
  categories: CategoryResult[];
  /** Weighted percentage across categories that have recorded points. */
  percent: number | null;
  letter: string | null;
  /** Assessments with a recorded expectation and no result yet. */
  missingCount: number;
  /** Plain-language account of exactly how the number above was produced. */
  explanation: string[];
};

/** Current rows only: a superseded grade record no longer contributes. */
export function currentGradeRecords(enrollmentId: string): GradeRecord[] {
  const d = db();
  const all = d.gradesByEnrollment.get(enrollmentId) ?? [];
  return all.filter((r) => !d.supersededGradeIds.has(r.id));
}

/** Every row for an enrollment, superseded ones included. */
export function gradeHistory(enrollmentId: string): GradeRecord[] {
  return [...(db().gradesByEnrollment.get(enrollmentId) ?? [])];
}

export function categoriesFor(courseTitle: string): GradeCategory[] {
  return db().gradeCategories.filter((c) => c.courseTitle === courseTitle);
}

export function letterFor(percent: number): string {
  return DEFAULT_SCALE.find((s) => percent >= s.min)?.letter ?? "F";
}

/**
 * Computes one course grade. Stores its rule version and shows its work: the
 * blueprint requires calculation explanations on the student Grades page.
 */
export function courseGrade(
  enrollmentId: string,
  courseTitle: string,
  missingCount = 0,
): CourseGrade {
  const records = currentGradeRecords(enrollmentId);
  const categories = categoriesFor(courseTitle).map((category) => {
    const rows = records.filter((r) => r.categoryId === category.id);
    const pointsEarned = rows.reduce((n, r) => n + r.pointsEarned, 0);
    const pointsPossible = rows.reduce((n, r) => n + r.pointsPossible, 0);
    return {
      category,
      pointsEarned,
      pointsPossible,
      percent:
        pointsPossible === 0
          ? null
          : Math.round((pointsEarned / pointsPossible) * 1000) / 10,
      weight: category.weight,
      records: rows,
    };
  });

  const contributing = categories.filter((c) => c.percent !== null);
  const weightSum = contributing.reduce((n, c) => n + c.weight, 0);

  const explanation: string[] = [];
  let percent: number | null = null;

  if (contributing.length === 0) {
    explanation.push("No graded work has been recorded in this course yet.");
  } else {
    const parts = contributing.map(
      (c) =>
        `${c.category.name}: ${c.pointsEarned} of ${c.pointsPossible} points = ${c.percent}%, weighted ${Math.round((c.weight / weightSum) * 100)}%`,
    );
    explanation.push(...parts);
    if (weightSum !== 1) {
      explanation.push(
        `Categories with no recorded work are left out, so the remaining weights are rescaled to total 100%.`,
      );
    }
    const weighted = contributing.reduce(
      (n, c) => n + (c.percent as number) * (c.weight / weightSum),
      0,
    );
    percent = Math.round(weighted * 10) / 10;
    explanation.push(`Weighted total: ${percent}%.`);
    if (missingCount > 0) {
      explanation.push(
        `${missingCount} assessment${missingCount === 1 ? "" : "s"} not yet turned in. Missing work is shown separately and is not counted as a zero.`,
      );
    }
  }

  return {
    enrollmentId,
    courseTitle,
    ruleVersion: RULE_VERSIONS.grading,
    categories,
    percent,
    letter: percent === null ? null : letterFor(percent),
    missingCount,
    explanation,
  };
}

/** The evidence rows a grade record was entered against, for the "why" link. */
export function contributingLessonCodes(enrollmentId: string): string[] {
  return [...new Set(currentGradeRecords(enrollmentId).map((r) => r.lessonCode))];
}
