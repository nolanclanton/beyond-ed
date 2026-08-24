/**
 * Read models for the student surfaces (blueprint §4).
 *
 * Reads only. Status comes from the canonical records — never inferred from
 * page visits, percentages, or stale local state (CLAUDE.md §1).
 */
import {
  courseLessons,
  findLesson,
  getCourse,
  instructionalSection,
  interventionId,
  interventionTarget,
  lessonTopic,
  primaryStandards,
  type CatalogCourse,
  type CatalogLesson,
  type CatalogUnit,
} from "@/lib/curriculum/catalog";
import { LESSON_STATUS_PRESENTATION, type LessonStatus } from "@/lib/curriculum/lesson-status";
import { db, lessonStatesFor } from "@/lib/db/store";
import { hasExitTicketFor } from "@/lib/curriculum/lesson-bank";
import type { Enrollment, Intervention, TeacherMessage, User } from "@/lib/db/types";
import { currentEvidence } from "@/lib/evidence/ledger";
import { INTERVENTION_STATUS_PRESENTATION } from "@/lib/intervention/status";
import { interventionsForStudent } from "@/lib/intervention/lifecycle";
import { focusForLesson } from "./learning-focus";

export type PathwayLocation = {
  enrollmentId: string;
  courseTitle: string;
  courseVersion: string;
  unit: CatalogUnit;
  lesson: CatalogLesson;
  instructionalSection: string;
  topic: string;
  status: LessonStatus;
  stage: number;
  standards: string[];
  interventionLessonId: string;
  interventionTarget: string;
  hasItems: boolean;
  href: string;
};

export type CourseProgress = {
  enrollment: Enrollment;
  course: CatalogCourse;
  courseVersion: string;
  current: PathwayLocation | null;
  completed: number;
  total: number;
  daysCompleted: number;
  daysTotal: number;
};

function versionLabel(courseVersionId: string): string {
  return db().courseVersions.find((v) => v.id === courseVersionId)?.version ?? "unknown";
}

export function locationFor(
  enrollment: Enrollment,
  lessonCode: string,
): PathwayLocation | null {
  const course = getCourse(enrollment.courseTitle);
  if (!course) return null;
  const found = findLesson(course, lessonCode);
  if (!found) return null;
  const state = db().lessonStates.find(
    (s) => s.enrollmentId === enrollment.id && s.lessonCode === lessonCode,
  );
  return {
    enrollmentId: enrollment.id,
    courseTitle: enrollment.courseTitle,
    courseVersion: versionLabel(enrollment.courseVersionId),
    unit: found.unit,
    lesson: found.lesson,
    instructionalSection: instructionalSection(found.lesson),
    topic: lessonTopic(found.lesson),
    status: state?.status ?? "locked",
    stage: state?.stage ?? 1,
    standards: primaryStandards(found.lesson),
    interventionLessonId: interventionId(found.lesson),
    interventionTarget: interventionTarget(found.lesson),
    hasItems: hasExitTicketFor(found.lesson.code, enrollment.courseVersionId),
    href: `/learn/${enrollment.id}/${found.lesson.code}`,
  };
}

/** The exact resume location for one enrollment. Never "the top of a unit". */
export function resumeLocation(enrollment: Enrollment): PathwayLocation | null {
  const course = getCourse(enrollment.courseTitle);
  if (!course) return null;
  const order = courseLessons(course).map((l) => l.code);
  const states = lessonStatesFor(enrollment.id)
    .sort((a, b) => order.indexOf(a.lessonCode) - order.indexOf(b.lessonCode));

  // Prefer a lesson that is actually open. A lesson sitting in "review
  // scheduled" is finished for now and must not pull the resume point
  // backwards past the lesson the student is on.
  const active =
    states.find(
      (s) =>
        s.status === "in_progress" ||
        s.status === "submitted" ||
        s.status === "available",
    ) ?? states.find((s) => s.status === "review_scheduled");
  return active ? locationFor(enrollment, active.lessonCode) : null;
}

export function coursesFor(student: User): CourseProgress[] {
  const d = db();
  return d.enrollments
    .filter((e) => e.studentId === student.id && e.status === "active")
    .map((enrollment) => {
      const course = getCourse(enrollment.courseTitle);
      if (!course) return null;
      const lessons = courseLessons(course);
      const states = lessonStatesFor(enrollment.id);
      const done = states.filter(
        (s) => s.status === "completed" || s.status === "review_scheduled" || s.status === "passed",
      );
      const doneCodes = new Set(done.map((s) => s.lessonCode));
      return {
        enrollment,
        course,
        courseVersion: versionLabel(enrollment.courseVersionId),
        current: resumeLocation(enrollment),
        completed: done.length,
        total: lessons.length,
        daysCompleted: lessons.filter((l) => doneCodes.has(l.code)).reduce((n, l) => n + l.days, 0),
        daysTotal: course.pathwayDays,
      } satisfies CourseProgress;
    })
    .filter((x): x is CourseProgress => x !== null)
    .sort((a, b) => a.course.subject.localeCompare(b.course.subject));
}

export type PriorityAction =
  | {
      kind: "intervention";
      id: string;
      title: string;
      reason: string;
      /** Written as a phrase, because a lesson and a support are sized differently. */
      effort: string;
      statusLabel: string;
      statusMeaning: string;
      returnTo: string;
      returnRule: string;
      href: string;
      plan: Intervention;
    }
  | {
      kind: "lesson";
      id: string;
      title: string;
      reason: string;
      effort: string;
      statusLabel: string;
      statusMeaning: string;
      href: string;
      location: PathwayLocation;
    };

/**
 * Today's prioritised actions. At most three (blueprint §4): required support
 * first, because finishing it is what unblocks the pathway lesson behind it.
 */
export function priorityActions(student: User): PriorityAction[] {
  const out: PriorityAction[] = [];

  for (const plan of interventionsForStudent(student.id)) {
    if (plan.status === "closed" || plan.status === "returned_to_pathway") continue;
    if (plan.status === "escalated") continue;
    const presentation = INTERVENTION_STATUS_PRESENTATION[plan.status];
    out.push({
      kind: "intervention",
      id: plan.id,
      title: `Short support: ${plan.targetStandard ?? plan.targetSkill}`,
      reason: plan.triggerSummary,
      effort: `About ${plan.estimatedMinutes} minutes`,
      statusLabel: presentation.label,
      statusMeaning: presentation.studentMeaning,
      returnTo: `${plan.returnLessonCode}, stage ${plan.returnStage}`,
      returnRule: `${plan.readinessMinPercent}% readiness check + ${plan.transferItemsRequired} transfer item`,
      href: `/review/${plan.id}`,
      plan,
    });
  }

  for (const progress of coursesFor(student)) {
    const location = progress.current;
    if (!location) continue;
    if (location.status === "review_scheduled") continue;
    const presentation = LESSON_STATUS_PRESENTATION[location.status];
    // Plain language, no standard codes: a student is told what they will
    // learn, not which coverage record it satisfies (CLAUDE.md §13).
    const focus = focusForLesson(location.lesson.code);
    out.push({
      kind: "lesson",
      id: `${location.enrollmentId}:${location.lesson.code}`,
      title: `${progress.course.title}: ${location.topic}`,
      reason:
        focus?.description ??
        `This is the next lesson in ${location.unit.name}.`,
      effort:
        location.lesson.days === 1
          ? "A single course day"
          : `Spans ${location.lesson.days} course days (days ${location.lesson.dayRange})`,
      statusLabel: presentation.label,
      statusMeaning: presentation.studentMeaning,
      href: location.href,
      location,
    });
  }

  return out.slice(0, 3);
}

export function messagesFor(student: User): TeacherMessage[] {
  return db()
    .messages.filter((m) => m.toStudentId === student.id)
    .slice()
    .reverse();
}

export type StudentAlert = {
  id: string;
  tone: "notice" | "urgent" | "info";
  title: string;
  detail: string;
  href?: string;
};

/** Supportive language only. No risk labels, no rankings (CLAUDE.md §13). */
export function alertsFor(student: User): StudentAlert[] {
  const alerts: StudentAlert[] = [];

  for (const plan of interventionsForStudent(student.id)) {
    if (plan.status === "escalated") {
      alerts.push({
        id: plan.id,
        tone: "notice",
        title: "Your teacher is setting up time with you",
        detail: `Two rounds on ${plan.targetStandard ?? plan.targetSkill} did not get there, so this is a conversation now rather than another retry.`,
      });
    }
  }

  for (const progress of coursesFor(student)) {
    const location = progress.current;
    if (location && location.status === "in_progress" && !location.hasItems) {
      alerts.push({
        id: `${location.enrollmentId}-unauthored`,
        tone: "info",
        title: `${progress.course.title}: this lesson has no assessment items yet`,
        detail:
          "The lesson is here, but its questions have not been written yet, so there is nothing to turn in.",
        href: location.href,
      });
    }
  }

  return alerts;
}

/** Evidence rows this student can see, newest first. */
export function evidenceFor(student: User, limit?: number) {
  const rows = currentEvidence({ studentId: student.id }).slice().reverse();
  return limit ? rows.slice(0, limit) : rows;
}
