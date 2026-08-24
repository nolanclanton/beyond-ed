/**
 * Completion and performance rollups for the student, site, and district
 * surfaces.
 *
 * Two DISTINCT measures, kept distinct everywhere they appear:
 *
 *   - **Completion** is how much of the work a learner has reached is finished.
 *     It says nothing about how well it went.
 *   - **Performance** is the official gradebook result. It says nothing about
 *     how far through the course anyone is.
 *
 * Neither is mixed with readiness, which lives in `/lib/mastery` and is never
 * imported here (CLAUDE.md §4). This module reads `/lib/grades` only.
 */
import { courseLessons, getCourse } from "@/lib/curriculum/catalog";
import { db, lessonStatesFor } from "@/lib/db/store";
import type { Enrollment, User } from "@/lib/db/types";
import { categoriesFor, courseGrade, currentGradeRecords } from "@/lib/grades/gradebook";
import { MIN_GROUP_SIZE } from "@/lib/rules/versions";

export type CourseMetrics = {
  enrollment: Enrollment;
  courseTitle: string;
  /** Lessons finished out of lessons reached. Null when nothing is reached. */
  completionPercent: number | null;
  lessonsComplete: number;
  lessonsReached: number;
  lessonsTotal: number;
  pathwayDaysComplete: number;
  pathwayDaysTotal: number;
  /** Official grade. Null when no graded work exists. */
  performancePercent: number | null;
  letter: string | null;
  /** Per-category official results, e.g. Knowledge checks / Assessments. */
  categories: { name: string; percent: number | null; weight: number }[];
};

export function courseMetrics(enrollment: Enrollment): CourseMetrics {
  const course = getCourse(enrollment.courseTitle);
  const lessons = course ? courseLessons(course) : [];
  const states = lessonStatesFor(enrollment.id);

  const completeCodes = new Set(
    states.filter((s) => s.status === "completed").map((s) => s.lessonCode),
  );
  // "Reached" is every lesson that is no longer locked — the work in front of
  // the student so far, not the whole course.
  const reached = states.filter((s) => s.status !== "locked");
  const grade = courseGrade(enrollment.id, enrollment.courseTitle);

  return {
    enrollment,
    courseTitle: enrollment.courseTitle,
    completionPercent:
      reached.length === 0
        ? null
        : Math.round((completeCodes.size / reached.length) * 1000) / 10,
    lessonsComplete: completeCodes.size,
    lessonsReached: reached.length,
    lessonsTotal: lessons.length,
    pathwayDaysComplete: lessons
      .filter((l) => completeCodes.has(l.code))
      .reduce((n, l) => n + l.days, 0),
    pathwayDaysTotal: course?.pathwayDays ?? 135,
    performancePercent: grade.percent,
    letter: grade.letter,
    categories: grade.categories.map((c) => ({
      name: c.category.name,
      percent: c.percent,
      weight: c.weight,
    })),
  };
}

export type StudentMetrics = {
  student: User;
  courses: CourseMetrics[];
  completionPercent: number | null;
  performancePercent: number | null;
  /** Minutes of meaningful activity across every course. */
  activeMinutes: number;
  /** How many lessons behind or ahead of the section's planned position. */
  positionOffset: number;
};

/**
 * The section's planned lesson index — where the class as a whole is meant to
 * be. Position is reported relative to this, so "behind" means behind the plan,
 * not behind another student.
 */
export function plannedLessonIndex(sectionId: string): number {
  const section = db().sections.find((s) => s.id === sectionId);
  if (!section) return 0;
  const course = getCourse(section.courseTitle);
  if (!course) return 0;
  const lessons = courseLessons(course);
  // Cycle and day map onto the pathway-day sequence; the planned lesson is the
  // one that day falls inside.
  const plannedDay =
    (section.cycle - 1) * 13.5 + section.dayInCycle;
  let elapsed = 0;
  for (let i = 0; i < lessons.length; i++) {
    elapsed += lessons[i].days;
    if (elapsed >= plannedDay) return i;
  }
  return Math.max(0, lessons.length - 1);
}

export function studentMetrics(student: User): StudentMetrics {
  const d = db();
  const enrollments = d.enrollments.filter(
    (e) => e.studentId === student.id && e.status === "active",
  );
  const courses = enrollments.map(courseMetrics);

  const completions = courses
    .map((c) => c.completionPercent)
    .filter((p): p is number => p !== null);
  const performances = courses
    .map((c) => c.performancePercent)
    .filter((p): p is number => p !== null);

  const activeMinutes = Math.round(
    (d.evidenceByStudent.get(student.id) ?? []).reduce(
      (n, e) => n + e.meaningfulMinutes,
      0,
    ),
  );

  // Position is measured against the course the student is furthest behind in,
  // because that is the one that needs attention.
  let positionOffset = 0;
  for (const enrollment of enrollments) {
    const course = getCourse(enrollment.courseTitle);
    if (!course) continue;
    const lessons = courseLessons(course);
    const states = lessonStatesFor(enrollment.id);
    const currentCode = states.find(
      (s) => s.status !== "locked" && s.status !== "completed",
    )?.lessonCode;
    const at = currentCode ? lessons.findIndex((l) => l.code === currentCode) : lessons.length;
    const offset = at - plannedLessonIndex(enrollment.sectionId);
    if (offset < positionOffset) positionOffset = offset;
  }

  return {
    student,
    courses,
    completionPercent: mean(completions),
    performancePercent: mean(performances),
    activeMinutes,
    positionOffset,
  };
}

export type SiteRollup = {
  siteId: string;
  shortName: string;
  students: number;
  teachers: number;
  enrollments: number;
  completionPercent: number | null;
  performancePercent: number | null;
  /** True when the group is too small to report without exposing a person. */
  suppressed: boolean;
};

/**
 * Site-level rollup. A site below the minimum group size reports its counts but
 * SUPPRESSES its completion and performance, because at that size an aggregate
 * identifies individuals (CLAUDE.md §3).
 */
export function siteRollup(siteId: string): SiteRollup {
  const d = db();
  const site = d.sites.find((s) => s.id === siteId);
  const students = d.users.filter((u) => u.role === "student" && u.siteId === siteId);
  const teachers = d.users.filter((u) => u.role === "teacher" && u.siteId === siteId);
  const studentIds = new Set(students.map((s) => s.id));
  const enrollments = d.enrollments.filter((e) => studentIds.has(e.studentId));

  const suppressed = students.length > 0 && students.length < MIN_GROUP_SIZE;

  const completions: number[] = [];
  const performances: number[] = [];
  if (!suppressed) {
    for (const enrollment of enrollments) {
      const m = courseMetrics(enrollment);
      if (m.completionPercent !== null) completions.push(m.completionPercent);
      if (m.performancePercent !== null) performances.push(m.performancePercent);
    }
  }

  return {
    siteId,
    shortName: site?.shortName ?? siteId,
    students: students.length,
    teachers: teachers.length,
    enrollments: enrollments.length,
    completionPercent: suppressed ? null : mean(completions),
    performancePercent: suppressed ? null : mean(performances),
    suppressed,
  };
}

export function districtRollup(orgId: string) {
  const d = db();
  const sites = d.sites.filter((s) => s.orgId === orgId).map((s) => siteRollup(s.id));
  const students = sites.reduce((n, s) => n + s.students, 0);
  const teachers = sites.reduce((n, s) => n + s.teachers, 0);
  const enrollments = sites.reduce((n, s) => n + s.enrollments, 0);
  return {
    sites,
    students,
    teachers,
    enrollments,
    completionPercent: mean(
      sites.map((s) => s.completionPercent).filter((p): p is number => p !== null),
    ),
    performancePercent: mean(
      sites.map((s) => s.performancePercent).filter((p): p is number => p !== null),
    ),
  };
}

/**
 * Completion and performance for one course at one site — the slice most likely
 * to fall under the minimum group size, and therefore the one where
 * suppression actually bites.
 */
export function courseAtSite(siteId: string, courseTitle: string) {
  const d = db();
  const studentIds = new Set(
    d.users.filter((u) => u.role === "student" && u.siteId === siteId).map((u) => u.id),
  );
  const enrollments = d.enrollments.filter(
    (e) => studentIds.has(e.studentId) && e.courseTitle === courseTitle,
  );
  const suppressed = enrollments.length > 0 && enrollments.length < MIN_GROUP_SIZE;
  const metrics = suppressed ? [] : enrollments.map(courseMetrics);
  return {
    courseTitle,
    siteId,
    enrollments: enrollments.length,
    suppressed,
    completionPercent: mean(
      metrics.map((m) => m.completionPercent).filter((p): p is number => p !== null),
    ),
    performancePercent: mean(
      metrics.map((m) => m.performancePercent).filter((p): p is number => p !== null),
    ),
  };
}

export function categoryNames(courseTitle: string): string[] {
  return categoriesFor(courseTitle).map((c) => c.name);
}

export function hasGradedWork(enrollmentId: string): boolean {
  return currentGradeRecords(enrollmentId).length > 0;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((n, v) => n + v, 0) / values.length) * 10) / 10;
}
