/**
 * The teacher caseload view: where each student sits against the section's
 * plan, how their official results look, and how much meaningful work they have
 * actually done.
 *
 * Three separate readings, deliberately not combined into one score. A student
 * can be behind and performing well, or on pace and performing poorly, and a
 * single number would hide exactly the case a teacher needs to see.
 *
 * Every band carries a written label as well as a colour (CLAUDE.md §12 —
 * status is conveyed by text as well as by colour).
 */
import { db } from "@/lib/db/store";
import type { User } from "@/lib/db/types";
import type { Tone } from "@/lib/design/tokens";
import { studentMetrics, type StudentMetrics } from "./metrics";

export type Band = {
  id: string;
  label: string;
  tone: Tone;
};

/** Position against the section plan. Negative offsets are behind. */
export const POSITION_BANDS: Band[] = [
  { id: "ahead", label: "2 or more ahead", tone: "positive" },
  { id: "on_pace", label: "2 or fewer behind", tone: "info" },
  { id: "behind_3_6", label: "3-6 behind", tone: "attention" },
  { id: "behind_7", label: "7 or more behind", tone: "attention" },
];

export function positionBand(offset: number): Band {
  if (offset >= 2) return POSITION_BANDS[0];
  if (offset >= -2) return POSITION_BANDS[1];
  if (offset >= -6) return POSITION_BANDS[2];
  return POSITION_BANDS[3];
}

export const PERFORMANCE_BANDS: Band[] = [
  { id: "under_60", label: "Under 60%", tone: "attention" },
  { id: "60_79", label: "60-79%", tone: "info" },
  { id: "80_plus", label: "80% or above", tone: "positive" },
];

export function performanceBand(percent: number | null): Band | null {
  if (percent === null) return null;
  if (percent < 60) return PERFORMANCE_BANDS[0];
  if (percent < 80) return PERFORMANCE_BANDS[1];
  return PERFORMANCE_BANDS[2];
}

export const MINUTES_BANDS: Band[] = [
  { id: "lte_60", label: "60 or fewer", tone: "attention" },
  { id: "61_120", label: "61-120", tone: "info" },
  { id: "121_160", label: "121-160", tone: "info" },
  { id: "gt_160", label: "More than 160", tone: "positive" },
];

export function minutesBand(minutes: number): Band {
  if (minutes <= 60) return MINUTES_BANDS[0];
  if (minutes <= 120) return MINUTES_BANDS[1];
  if (minutes <= 160) return MINUTES_BANDS[2];
  return MINUTES_BANDS[3];
}

export type CaseloadRow = {
  student: User;
  metrics: StudentMetrics;
  position: Band;
  performance: Band | null;
  minutes: Band;
  openPlans: number;
  queueItems: number;
};

export type CaseloadFilters = {
  position?: string;
  performance?: string;
  minutes?: string;
  sort?: "name" | "position" | "performance" | "minutes";
  section?: string;
};

/**
 * Builds the caseload for a teacher, scoped to their own sections. Students
 * outside those sections are not in the result — the same scope rule every
 * other read uses (CLAUDE.md §3).
 */
export function caseload(teacher: User, filters: CaseloadFilters = {}): CaseloadRow[] {
  const d = db();
  const sections = d.sections.filter(
    (s) => s.teacherId === teacher.id && (!filters.section || s.id === filters.section),
  );
  const sectionIds = new Set(sections.map((s) => s.id));
  const studentIds = [
    ...new Set(
      d.enrollments
        .filter((e) => sectionIds.has(e.sectionId))
        .map((e) => e.studentId),
    ),
  ];

  const openPlansByStudent = new Map<string, number>();
  for (const plan of d.interventions) {
    if (plan.status === "closed" || plan.status === "returned_to_pathway") continue;
    openPlansByStudent.set(
      plan.studentId,
      (openPlansByStudent.get(plan.studentId) ?? 0) + 1,
    );
  }

  let rows: CaseloadRow[] = studentIds
    .map((id) => d.users.find((u) => u.id === id))
    .filter((u): u is User => u !== undefined)
    .map((student) => {
      const metrics = studentMetrics(student);
      return {
        student,
        metrics,
        position: positionBand(metrics.positionOffset),
        performance: performanceBand(metrics.performancePercent),
        minutes: minutesBand(metrics.activeMinutes),
        openPlans: openPlansByStudent.get(student.id) ?? 0,
        queueItems: 0,
      };
    });

  if (filters.position) rows = rows.filter((r) => r.position.id === filters.position);
  if (filters.performance) {
    rows = rows.filter((r) => r.performance?.id === filters.performance);
  }
  if (filters.minutes) rows = rows.filter((r) => r.minutes.id === filters.minutes);

  const sort = filters.sort ?? "name";
  rows.sort((a, b) => {
    switch (sort) {
      case "position":
        return a.metrics.positionOffset - b.metrics.positionOffset;
      case "performance":
        return (
          (a.metrics.performancePercent ?? 999) - (b.metrics.performancePercent ?? 999)
        );
      case "minutes":
        return a.metrics.activeMinutes - b.metrics.activeMinutes;
      default:
        return (
          a.student.lastName.localeCompare(b.student.lastName) ||
          a.student.firstName.localeCompare(b.student.firstName)
        );
    }
  });

  return rows;
}

/** "Planned: Unit 3 · Lesson 2" — where the section as a whole should be. */
export function plannedPosition(sectionId: string): string {
  const d = db();
  const section = d.sections.find((s) => s.id === sectionId);
  if (!section) return "";
  return `Cycle ${section.cycle} · day ${section.dayInCycle}`;
}
