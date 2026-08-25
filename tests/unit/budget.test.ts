import { describe, expect, it } from "vitest";

import { COURSES, type CatalogCourse } from "@/lib/curriculum/catalog";
import { PLANNING_CYCLES, validateCourseBudget } from "@/lib/curriculum/budget";
import { CAPACITY_CONTRACT, RULE_VERSIONS } from "@/lib/rules/versions";

/**
 * Blueprint §16 acceptance criterion: every grades 6-12 course in mathematics,
 * English, science, and social science validates 135 normal pathway days and 40
 * intervention-capacity days against a 175-day total.
 */
describe("annual capacity contract", () => {
  it("holds for every course in the catalog", () => {
    expect(COURSES.length).toBeGreaterThan(0);
    for (const course of COURSES) {
      const report = validateCourseBudget(course);
      expect(report.pathwayDays, course.title).toBe(135);
      expect(report.interventionDays, course.title).toBe(40);
      expect(report.totalDays, course.title).toBe(175);
      expect(report.valid, `${course.title}: ${JSON.stringify(report.findings)}`).toBe(true);
    }
  });

  it("covers all four subjects", () => {
    const subjects = new Set(COURSES.map((c) => c.subject));
    expect([...subjects].sort()).toEqual([
      "English Language Arts",
      "History-Social Science",
      "Mathematics",
      "Science",
    ]);
  });

  it("stores its rule version and inputs with the result", () => {
    const report = validateCourseBudget(COURSES[0]);
    expect(report.ruleVersion).toBe(RULE_VERSIONS.dayBudget);
    expect(report.inputs.unitDays.length).toBe(COURSES[0].units.length);
    expect(report.inputs.lessonDaysByUnit.length).toBe(COURSES[0].units.length);
  });

  it("rejects an over-allocated course with a clear message", () => {
    const base = COURSES[0];
    const overAllocated: CatalogCourse = {
      ...base,
      units: base.units.map((u, i) =>
        i === 0 ? { ...u, pathwayDays: u.pathwayDays + 7 } : u,
      ),
    };
    const report = validateCourseBudget(overAllocated);
    expect(report.valid).toBe(false);
    const error = report.findings.find((f) => f.severity === "error");
    expect(error?.message).toContain("Over-allocated by 7 pathway days");
    expect(error?.message).toContain("intervention reserve cannot absorb");
  });

  it("rejects an under-allocated course", () => {
    const base = COURSES[0];
    const under: CatalogCourse = {
      ...base,
      units: base.units.map((u, i) =>
        i === 0 ? { ...u, pathwayDays: u.pathwayDays - 3 } : u,
      ),
    };
    const report = validateCourseBudget(under);
    expect(report.valid).toBe(false);
    expect(report.findings.some((f) => f.message.includes("Under-allocated by 3"))).toBe(true);
  });

  it("does not let a course consume the intervention reserve", () => {
    // The reserve is a constant, never derived from the course.
    const base = COURSES[0];
    const greedy: CatalogCourse = {
      ...base,
      units: base.units.map((u, i) =>
        i === 0 ? { ...u, pathwayDays: u.pathwayDays + 40 } : u,
      ),
    };
    const report = validateCourseBudget(greedy);
    expect(report.interventionDays).toBe(40);
    expect(report.valid).toBe(false);
  });
});

describe("planning cycles", () => {
  it("is ten cycles totalling 135 + 40 = 175", () => {
    expect(PLANNING_CYCLES).toHaveLength(CAPACITY_CONTRACT.planningCycles);
    expect(PLANNING_CYCLES.reduce((n, c) => n + c.pathwayDays, 0)).toBe(135);
    expect(PLANNING_CYCLES.reduce((n, c) => n + c.interventionDays, 0)).toBe(40);
    expect(PLANNING_CYCLES.reduce((n, c) => n + c.total, 0)).toBe(175);
  });

  it("is five cycles of 14 pathway days and five of 13", () => {
    expect(PLANNING_CYCLES.filter((c) => c.pathwayDays === 14)).toHaveLength(5);
    expect(PLANNING_CYCLES.filter((c) => c.pathwayDays === 13)).toHaveLength(5);
    expect(PLANNING_CYCLES.every((c) => c.interventionDays === 4)).toBe(true);
  });
});
