/**
 * Builds the inputs the recommendation engine needs, and runs it.
 *
 * The I/O lives HERE, not in `/lib/recommend` — that directory must stay pure
 * (CLAUDE.md §1). This module reads the store, assembles a plain
 * `RecommendContext`, and hands it to `recommend()`.
 *
 * Nothing here writes. A recommendation is a proposal; the write side is
 * `lifecycle.ts`, and it always requires a human decision.
 */
import {
  courseLessons,
  findLesson,
  getCourse,
  primaryStandards,
  standardCode,
} from "@/lib/curriculum/catalog";
import { db, lessonStatesFor } from "@/lib/db/store";
import type { Enrollment, User } from "@/lib/db/types";
import { currentEvidence } from "@/lib/evidence/ledger";
import { skillProfile } from "@/lib/mastery/profile";
import {
  recommend,
  type InterventionOption,
  type RecommendContext,
  type Recommendation,
} from "@/lib/recommend/engine";
import { RULE_VERSIONS } from "@/lib/rules/versions";
import { visibleStudentIds } from "@/lib/auth/scope";

import { bestSupportFor, TYPICAL_MINUTES } from "./library";

/**
 * How far ahead the engine looks for upcoming prerequisite dependencies.
 *
 * Ten lessons, which is ten course days — about two school weeks, and close to
 * one planning cycle. The window is stated in lessons because every lesson in
 * the catalog is exactly one thirty-minute course day, so the two are the same
 * count.
 */
const LOOKAHEAD_LESSONS = 10;

export function currentLessonFor(enrollment: Enrollment): string | null {
  const states = lessonStatesFor(enrollment.id);
  const course = getCourse(enrollment.courseTitle);
  if (!course) return null;
  const order = courseLessons(course).map((l) => l.code);
  const active = states
    .filter((s) => s.status === "available" || s.status === "in_progress" || s.status === "submitted")
    .sort((a, b) => order.indexOf(a.lessonCode) - order.indexOf(b.lessonCode))[0];
  return active?.lessonCode ?? null;
}

export function upcomingStandardsFor(
  enrollment: Enrollment,
  fromLessonCode: string,
): string[] {
  const course = getCourse(enrollment.courseTitle);
  if (!course) return [];
  const lessons = courseLessons(course);
  const at = lessons.findIndex((l) => l.code === fromLessonCode);
  if (at < 0) return [];
  return lessons
    .slice(at, at + LOOKAHEAD_LESSONS)
    .flatMap((l) => primaryStandards(l).map(standardCode));
}

/** Assembles the context for one enrollment. Pure data, no engine logic. */
export function contextFor(enrollment: Enrollment): RecommendContext | null {
  const d = db();
  const course = getCourse(enrollment.courseTitle);
  if (!course) return null;

  const currentLessonCode = currentLessonFor(enrollment);
  if (!currentLessonCode) return null;

  const state = d.lessonStates.find(
    (s) => s.enrollmentId === enrollment.id && s.lessonCode === currentLessonCode,
  );

  const upcomingStandards = upcomingStandardsFor(enrollment, currentLessonCode);

  const evidence = currentEvidence({ enrollmentId: enrollment.id });
  const skills = [...new Set(evidence.map((e) => e.skill))];

  const options: Record<string, InterventionOption> = {};
  for (const skill of skills) {
    const support = bestSupportFor(skill, enrollment.courseTitle);
    if (!support) continue;
    options[skill] = {
      id: support.id,
      target: support.target,
      estimatedMinutes: support.estimatedMinutes,
      standard: skill,
      // The site has confirmed local resources for supports linked to the
      // course the student is actually enrolled in.
      approvedLocally: support.courseTitle === enrollment.courseTitle,
    };
  }

  const plans = d.interventions.filter((i) => i.enrollmentId === enrollment.id);
  const openPlans = plans.filter(
    (i) => i.status !== "closed" && i.status !== "returned_to_pathway",
  );

  /**
   * Duplicate protection (CLAUDE.md §8): "suppresses duplicate or
   * near-duplicate supports unless new evidence justifies reassignment".
   *
   * Two cases are settled, not open:
   *   - a proposal a human dismissed with a reason, and
   *   - a plan the student completed and returned from.
   *
   * Both stay off the queue until a NEW miss is recorded on that skill. Without
   * this, the historical misses that produced the plan keep re-triggering it
   * forever, and a student who has just demonstrated the skill is proposed the
   * same support again. "New" is measured against the moment the plan settled,
   * so it is a fact rather than a guess.
   */
  const settled = plans.filter(
    (i) =>
      i.status === "closed" ||
      i.status === "returned_to_pathway" ||
      i.status === "passed",
  );
  const suppressed = settled
    .filter((plan) => {
      const newMiss = currentEvidence({
        studentId: enrollment.studentId,
        skill: plan.targetSkill,
      }).some((e) => e.correct === false && e.recordedAt > plan.updatedAt);
      return !newMiss;
    })
    .map((i) => i.targetSkill);

  const priorCycles: Record<string, number> = {};
  const priorOutcome: Record<string, "passed" | "failed" | undefined> = {};
  for (const p of plans) {
    priorCycles[p.targetSkill] = Math.max(priorCycles[p.targetSkill] ?? 0, p.cycles);
    if (p.status === "returned_to_pathway" || p.status === "passed")
      priorOutcome[p.targetSkill] = "passed";
    else if (p.status === "escalated") priorOutcome[p.targetSkill] = "failed";
  }

  return {
    studentId: enrollment.studentId,
    enrollmentId: enrollment.id,
    courseTitle: enrollment.courseTitle,
    courseVersionId: enrollment.courseVersionId,
    currentLessonCode,
    currentStage: state?.stage ?? 1,
    upcomingStandards,
    options,
    activeSkills: [...openPlans.map((i) => i.targetSkill), ...suppressed],
    priorCycles,
    priorOutcome,
    currentWorkloadMinutes: openPlans.length * TYPICAL_MINUTES,
  };
}

/** Recommendations for one enrollment. Deterministic. */
export function recommendationsForEnrollment(
  enrollment: Enrollment,
): Recommendation[] {
  const context = contextFor(enrollment);
  if (!context) return [];
  return recommend(
    currentEvidence({ enrollmentId: enrollment.id }),
    skillProfile(enrollment.studentId).filter((m) =>
      Object.keys(context.options).includes(m.skill),
    ),
    context,
    RULE_VERSIONS.recommend,
  );
}

export function recommendationsForStudent(studentId: string): Recommendation[] {
  return db()
    .enrollments.filter((e) => e.studentId === studentId && e.status === "active")
    .flatMap(recommendationsForEnrollment);
}

export type QueueItem = {
  recommendation: Recommendation;
  student: User;
  courseTitle: string;
  lessonTitle: string;
  unitName: string;
};

/**
 * The teacher action queue: every open recommendation across the actor's
 * scope, most urgent first. Scope-checked, so a teacher never sees a student
 * outside their roster sections.
 */
export function actionQueue(actor: User): QueueItem[] {
  const d = db();
  const allowed = new Set(visibleStudentIds(actor));
  const sectionIds = new Set(
    actor.role === "teacher"
      ? d.sections.filter((s) => s.teacherId === actor.id).map((s) => s.id)
      : d.sections
          .filter((s) =>
            actor.role === "site_admin"
              ? s.siteId === actor.siteId
              : d.sites.some((x) => x.id === s.siteId && x.orgId === actor.orgId),
          )
          .map((s) => s.id),
  );

  const items: QueueItem[] = [];
  for (const enrollment of d.enrollments) {
    if (!allowed.has(enrollment.studentId)) continue;
    if (!sectionIds.has(enrollment.sectionId)) continue;
    if (enrollment.status !== "active") continue;

    const student = d.users.find((u) => u.id === enrollment.studentId);
    const course = getCourse(enrollment.courseTitle);
    if (!student || !course) continue;

    for (const recommendation of recommendationsForEnrollment(enrollment)) {
      const found = findLesson(course, recommendation.currentLessonCode);
      items.push({
        recommendation,
        student,
        courseTitle: enrollment.courseTitle,
        lessonTitle: found?.lesson.title ?? recommendation.currentLessonCode,
        unitName: found?.unit.title ?? "",
      });
    }
  }

  const severityOrder = { immediate: 0, teacher_review: 1, targeted: 2, spaced: 3 };
  return items.sort(
    (a, b) =>
      severityOrder[a.recommendation.severity] - severityOrder[b.recommendation.severity] ||
      b.recommendation.ranking.score - a.recommendation.ranking.score ||
      a.recommendation.id.localeCompare(b.recommendation.id),
  );
}
