/**
 * Day-budget validation — the publication gate (CLAUDE.md §7).
 *
 * Every full-year course must validate 135 pathway days + 40
 * intervention-capacity days = 175 total before it can be published. Ten
 * planning cycles, four intervention days each; five cycles of 14 pathway days
 * and five of 13. Publication fails, with a clear over-allocation message, if
 * the totals do not hold. Course authors cannot consume the 40-day reserve by
 * expanding lesson counts.
 *
 * Pure. No I/O, no clock.
 */
import { CAPACITY_CONTRACT, RULE_VERSIONS } from "@/lib/rules/versions";

import type { CatalogCourse } from "./catalog";

export type BudgetFinding = {
  severity: "error" | "warning";
  message: string;
};

export type BudgetReport = {
  ruleVersion: string;
  courseTitle: string;
  /** Inputs used, stored alongside the result (CLAUDE.md §7). */
  inputs: {
    unitDays: { unitId: string; unitName: string; pathwayDays: number }[];
    lessonDaysByUnit: { unitId: string; lessonDays: number }[];
  };
  pathwayDays: number;
  interventionDays: number;
  totalDays: number;
  valid: boolean;
  findings: BudgetFinding[];
};

/**
 * Validates a course against the annual capacity contract.
 * The intervention reserve is fixed at 40 and is never derived from the course,
 * which is what makes it impossible for a course to consume it.
 */
export function validateCourseBudget(course: CatalogCourse): BudgetReport {
  const unitDays = course.units.map((u) => ({
    unitId: u.id,
    unitName: u.title,
    pathwayDays: u.pathwayDays,
  }));
  const lessonDaysByUnit = course.units.map((u) => ({
    unitId: u.id,
    lessonDays: u.lessons.length,
  }));

  const pathwayDays = unitDays.reduce((n, u) => n + u.pathwayDays, 0);
  const interventionDays = CAPACITY_CONTRACT.interventionDays;
  const totalDays = pathwayDays + interventionDays;

  const findings: BudgetFinding[] = [];

  if (pathwayDays > CAPACITY_CONTRACT.pathwayDays) {
    findings.push({
      severity: "error",
      message: `Over-allocated by ${pathwayDays - CAPACITY_CONTRACT.pathwayDays} pathway ${
        pathwayDays - CAPACITY_CONTRACT.pathwayDays === 1 ? "day" : "days"
      }. Unit budgets total ${pathwayDays}; the contract allows ${CAPACITY_CONTRACT.pathwayDays}. The 40-day intervention reserve cannot absorb the difference.`,
    });
  } else if (pathwayDays < CAPACITY_CONTRACT.pathwayDays) {
    findings.push({
      severity: "error",
      message: `Under-allocated by ${CAPACITY_CONTRACT.pathwayDays - pathwayDays} pathway days. Unit budgets total ${pathwayDays}; the contract requires exactly ${CAPACITY_CONTRACT.pathwayDays}.`,
    });
  }

  for (const unit of course.units) {
    const lessonDays = unit.lessons.length;
    if (lessonDays > unit.pathwayDays) {
      findings.push({
        severity: "error",
        message: `Unit ${unit.id} (${unit.title}): lessons total ${lessonDays} days against a ${unit.pathwayDays}-day unit budget.`,
      });
    } else if (lessonDays < unit.pathwayDays) {
      findings.push({
        severity: "warning",
        message: `Unit ${unit.id} (${unit.title}): lessons total ${lessonDays} days against a ${unit.pathwayDays}-day unit budget. ${unit.pathwayDays - lessonDays} unassigned.`,
      });
    }
  }

  if (totalDays !== CAPACITY_CONTRACT.totalDays) {
    findings.push({
      severity: "error",
      message: `Annual total is ${totalDays} days; the available student work calendar is ${CAPACITY_CONTRACT.totalDays}.`,
    });
  }

  return {
    ruleVersion: RULE_VERSIONS.dayBudget,
    courseTitle: course.title,
    inputs: { unitDays, lessonDaysByUnit },
    pathwayDays,
    interventionDays,
    totalDays,
    valid: findings.every((f) => f.severity !== "error"),
    findings,
  };
}

/** The ten planning cycles that make up the year (blueprint §2). */
export const PLANNING_CYCLES = CAPACITY_CONTRACT.cycleShape.map(
  (pathwayDays, i) => ({
    cycle: i + 1,
    pathwayDays,
    interventionDays: CAPACITY_CONTRACT.interventionDaysPerCycle,
    total: pathwayDays + CAPACITY_CONTRACT.interventionDaysPerCycle,
    use: [
      "Launch, baseline evidence, and early routines",
      "Initial prerequisite repair and pathway return",
      "Core instruction with targeted review",
      "First cumulative transfer window",
      "Midyear readiness and recovery",
      "New-semester pathway launch",
      "Targeted repair before major dependencies",
      "Cumulative practice and performance evidence",
      "Late-year recovery or acceleration",
      "Mastery demonstration, transfer, and closure",
    ][i],
  }),
);
