/**
 * Learning periods, weeks, and the school-year calendar.
 *
 * The blueprint fixes the annual capacity contract as ten planning cycles
 * totalling 135 pathway + 40 intervention = 175 days (§2). It deliberately does
 * NOT bind those cycles to dates: "Local calendars map the cycles to actual
 * dates and nonstudent days."
 *
 * This module is that mapping, and it is the only place a month or a week
 * number is derived. Cycle -> month is a local calendar decision, not a
 * curriculum fact, so nothing here is treated as authored curriculum.
 */
import { CAPACITY_CONTRACT, PLANNING_CYCLES_LABEL } from "@/lib/rules/versions";

/** Ten cycles across a September-to-June school year. */
const CYCLE_MONTHS = [
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
] as const;

export type LearningPeriod = {
  /** 1-10. The blueprint's planning cycle. */
  cycle: number;
  month: (typeof CYCLE_MONTHS)[number];
  pathwayDays: number;
  interventionDays: number;
  totalDays: number;
  /** Weeks are five student days; the last week of a cycle may be short. */
  weeks: number;
  use: string;
};

const CYCLE_USE = [
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
];

export const LEARNING_PERIODS: readonly LearningPeriod[] =
  CAPACITY_CONTRACT.cycleShape.map((pathwayDays, i) => {
    const totalDays = pathwayDays + CAPACITY_CONTRACT.interventionDaysPerCycle;
    return {
      cycle: i + 1,
      month: CYCLE_MONTHS[i],
      pathwayDays,
      interventionDays: CAPACITY_CONTRACT.interventionDaysPerCycle,
      totalDays,
      weeks: Math.ceil(totalDays / 5),
      use: CYCLE_USE[i],
    };
  });

export function periodFor(cycle: number): LearningPeriod {
  return LEARNING_PERIODS[Math.max(0, Math.min(LEARNING_PERIODS.length - 1, cycle - 1))];
}

/** The week within a cycle, from the day-in-cycle. Five student days a week. */
export function weekOfCycle(dayInCycle: number): number {
  return Math.max(1, Math.ceil(dayInCycle / 5));
}

/** "Learning period 2, week 1 · October" — the line a student reads. */
export function periodLabel(cycle: number, dayInCycle: number): string {
  const period = periodFor(cycle);
  return `Learning period ${period.cycle}, week ${weekOfCycle(dayInCycle)} · ${period.month}`;
}

/**
 * The month a unit falls in, derived from where its pathway days sit in the
 * 135-day sequence. A unit that straddles two cycles reports the one it starts
 * in, which is what a pacing calendar shows.
 */
export function monthForUnitStart(daysBefore: number): string {
  let remaining = daysBefore;
  for (const period of LEARNING_PERIODS) {
    if (remaining < period.pathwayDays) return period.month;
    remaining -= period.pathwayDays;
  }
  return CYCLE_MONTHS[CYCLE_MONTHS.length - 1];
}

export { CYCLE_MONTHS, PLANNING_CYCLES_LABEL };
