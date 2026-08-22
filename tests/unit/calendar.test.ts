import { describe, expect, it } from "vitest";

import {
  LEARNING_PERIODS,
  monthForUnitStart,
  periodFor,
  periodLabel,
  weekOfCycle,
} from "@/lib/calendar/periods";
import { CAPACITY_CONTRACT } from "@/lib/rules/versions";

/**
 * The blueprint fixes the ten cycles and their day counts; mapping them to
 * months is a LOCAL calendar decision. These tests hold the contract, not the
 * calendar.
 */
describe("learning periods", () => {
  it("is ten periods that still total 135 + 40 = 175", () => {
    expect(LEARNING_PERIODS).toHaveLength(CAPACITY_CONTRACT.planningCycles);
    expect(LEARNING_PERIODS.reduce((n, p) => n + p.pathwayDays, 0)).toBe(135);
    expect(LEARNING_PERIODS.reduce((n, p) => n + p.interventionDays, 0)).toBe(40);
    expect(LEARNING_PERIODS.reduce((n, p) => n + p.totalDays, 0)).toBe(175);
  });

  it("runs September to June with no repeated month", () => {
    const months = LEARNING_PERIODS.map((p) => p.month);
    expect(months[0]).toBe("September");
    expect(months[months.length - 1]).toBe("June");
    expect(new Set(months).size).toBe(months.length);
  });

  it("clamps a cycle outside 1-10 rather than returning undefined", () => {
    expect(periodFor(0).cycle).toBe(1);
    expect(periodFor(99).cycle).toBe(10);
  });

  it("counts weeks as five student days", () => {
    expect(weekOfCycle(1)).toBe(1);
    expect(weekOfCycle(5)).toBe(1);
    expect(weekOfCycle(6)).toBe(2);
    expect(weekOfCycle(11)).toBe(3);
    // A day of zero or less is still week one, not week zero.
    expect(weekOfCycle(0)).toBe(1);
  });

  it("labels a position in words", () => {
    expect(periodLabel(2, 5)).toBe("Learning period 2, week 1 · October");
  });

  it("maps a unit's start day onto the month it falls in", () => {
    expect(monthForUnitStart(0)).toBe("September");
    // 14 pathway days elapsed puts the next unit in the second cycle.
    expect(monthForUnitStart(14)).toBe("October");
    expect(monthForUnitStart(134)).toBe("June");
    // Past the end of the year, the last month is reported rather than crashing.
    expect(monthForUnitStart(500)).toBe("June");
  });
});
