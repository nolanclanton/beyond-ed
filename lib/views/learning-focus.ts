/**
 * Plain-language names for what a student is learning.
 *
 * Students do not see standard codes. `6.RP.2` and `HSS-6.1.1` are staff
 * vocabulary: they exist so a teacher can trace coverage, an administrator can
 * audit it, and a curriculum author can publish against it. To a student they
 * are noise at best, and at worst they make ordinary learning look like
 * compliance paperwork (CLAUDE.md §13 — every student view answers what am I
 * doing, why, and what must I show next).
 *
 * Nothing here invents a description. Each code resolves to the LESSON that
 * claims it as primary coverage, and that lesson's title and learning objective
 * come from the curriculum workbook (CLAUDE.md §14). Where a lesson also has an
 * authored goal, that is preferred, because it is already written to a student.
 */
import {
  COURSES,
  primaryStandards,
  standardCode,
  type CatalogLesson,
} from "@/lib/curriculum/catalog";
import { lessonContent } from "@/lib/db/demo-lesson-content";

export type LearningFocus = {
  /** What the student is learning, e.g. "Ratios, rates, and comparison". */
  title: string;
  /** One line a student can read, never a standard's official text. */
  description: string;
  courseTitle: string;
  lessonCode: string;
  /** "Lesson 2 of 3" within its unit. */
  position: string;
  unitName: string;
};

/**
 * Both indexes are built once, at module load, over the whole catalog.
 *
 * The focus itself is precomputed rather than derived per call: resolving a
 * lesson's unit and position by searching the course is O(units x lessons), and
 * these are read once per row in tables that run to hundreds of rows.
 *
 * `byStandard` maps a standard code to the lesson that claims it. The alignment
 * matrix assigns each standard once as primary coverage, so the first match is
 * the right one.
 */
const byLessonCode = new Map<string, LearningFocus>();
const byStandard = new Map<string, LearningFocus>();

function build(course: (typeof COURSES)[number], lesson: CatalogLesson, unitIndex: number) {
  const unit = course.units[unitIndex];
  const index = unit.lessons.findIndex((l) => l.code === lesson.code) + 1;
  const authored = lessonContent(lesson.code);
  return {
    title: lesson.title,
    // The unit's essential question, not the lesson's learning objective: the
    // objective is written to staff ("Students will…"), the essential question
    // is written to the reader, and it is the "why" a student needs here.
    description: authored ? authored.goal : unit.essentialQuestion,
    courseTitle: course.title,
    lessonCode: lesson.code,
    position: `Lesson ${index} of ${unit.lessons.length}`,
    unitName: unit.title,
  } satisfies LearningFocus;
}

for (const course of COURSES) {
  course.units.forEach((unit, unitIndex) => {
    for (const lesson of unit.lessons) {
      const focus = build(course, lesson, unitIndex);
      byLessonCode.set(lesson.code, focus);
      for (const standard of primaryStandards(lesson)) {
        const code = standardCode(standard);
        if (!byStandard.has(code)) byStandard.set(code, focus);
      }
    }
  });
}

export function focusForLesson(lessonCode: string): LearningFocus | undefined {
  return byLessonCode.get(lessonCode);
}

/**
 * The learning focus behind a skill.
 *
 * A skill is usually a standard code. Launch and diagnostic lessons carry no new
 * standard, so their evidence uses a `<lesson>-readiness` skill; those resolve
 * through the lesson code embedded in them.
 */
export function focusForSkill(skill: string): LearningFocus | undefined {
  const direct = byStandard.get(standardCode(skill));
  if (direct) return direct;

  const readiness = /^(.*)-readiness$/.exec(skill);
  if (readiness) return focusForLesson(readiness[1]);

  return undefined;
}

/** What a student is told they are working on. Never a code. */
export function skillLabel(skill: string): string {
  return focusForSkill(skill)?.title ?? "This skill";
}

/**
 * The title of the lesson behind a code, for a student. Falls back to a neutral
 * phrase, never to the code itself — a code on a student page is the thing this
 * module exists to prevent.
 */
export function lessonLabel(lessonCode: string): string {
  return byLessonCode.get(lessonCode)?.title ?? "This lesson";
}

/** A fuller student-facing line: the focus plus the course it sits in. */
export function skillLabelWithCourse(skill: string): string {
  const focus = focusForSkill(skill);
  if (!focus) return "This skill";
  return focus.courseTitle ? `${focus.title} · ${focus.courseTitle}` : focus.title;
}
