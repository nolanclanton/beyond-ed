/**
 * The standards crosswalk (CLAUDE.md §7).
 *
 * Every standard a course is responsible for, which lesson first schedules it,
 * and how many lessons touch it. Generated from the workbook's own crosswalk
 * sheet, which formula-checks that no assigned standard is left uncovered.
 *
 * Coverage is a publication concern, not a reporting one: a course version with
 * an uncovered standard has a hole in it, and the gate says so before anyone
 * publishes it. See `coverageReport`.
 */
import rawStandards from "./data/standards.json";
import { pushInto } from "@/lib/collections";

import { COURSES, courseLessons, type CatalogCourse } from "./catalog";

export type StandardRecord = {
  courseId: string;
  code: string;
  /** e.g. `Mathematics Content`, `CA NGSS`, `ELA/Literacy`. */
  group: string;
  description: string;
  /** The published source this code comes from. See `SOURCES`. */
  sourceId: string;
  firstLessonCode: string;
  /** How many lessons in the course claim it, as primary or supporting. */
  coverageCount: number;
  status: string;
};

export type StandardsSource = {
  id: string;
  title: string;
  domain: string;
  url: string;
  scope: string;
  authority: string;
  notes: string;
};

const data = rawStandards as unknown as {
  standards: StandardRecord[];
  sources: StandardsSource[];
};

export const STANDARDS: readonly StandardRecord[] = data.standards;
export const SOURCES: readonly StandardsSource[] = data.sources;

const byCourse = new Map<string, StandardRecord[]>();
const byCourseAndCode = new Map<string, StandardRecord>();
/**
 * First record per bare code, for `describeStandard`.
 *
 * Grade-band codes such as `RL.9-10.1` appear in several courses with the same
 * text, so the first is the description. Indexed rather than scanned because a
 * unit page asks for fifteen of these and a course page for a hundred and
 * thirty-five — a linear search over 1,907 records is the difference between a
 * page that renders and one that stalls.
 */
const byCode = new Map<string, StandardRecord>();
for (const record of STANDARDS) {
  pushInto(byCourse, record.courseId, record);
  byCourseAndCode.set(`${record.courseId}::${record.code}`, record);
  if (!byCode.has(record.code)) byCode.set(record.code, record);
}

const sourceById = new Map(SOURCES.map((s) => [s.id, s]));

export function standardsForCourse(courseId: string): StandardRecord[] {
  return byCourse.get(courseId) ?? [];
}

export function standardRecord(
  courseId: string,
  code: string,
): StandardRecord | undefined {
  return byCourseAndCode.get(`${courseId}::${code}`);
}

/** A standard's plain-language description, from whichever course defines it. */
export function describeStandard(code: string): StandardRecord | undefined {
  return byCode.get(code);
}

export function sourceFor(sourceId: string): StandardsSource | undefined {
  return sourceById.get(sourceId);
}

/** Standards grouped by their standards group, in the crosswalk's own order. */
export function standardGroupsForCourse(
  courseId: string,
): { group: string; standards: StandardRecord[] }[] {
  const groups: { group: string; standards: StandardRecord[] }[] = [];
  for (const record of standardsForCourse(courseId)) {
    const existing = groups.find((g) => g.group === record.group);
    if (existing) existing.standards.push(record);
    else groups.push({ group: record.group, standards: [record] });
  }
  return groups;
}

export type CoverageReport = {
  courseId: string;
  courseTitle: string;
  assigned: number;
  covered: number;
  /** Standards the crosswalk assigns that no lesson in the course claims. */
  gaps: string[];
  /** Lessons whose primary standard is not in the course's crosswalk. */
  orphanLessons: string[];
  valid: boolean;
};

/**
 * Recomputes coverage from the lesson spine rather than trusting the stored
 * count — a course version is published against the lessons, so the lessons are
 * what has to hold up.
 */
export function coverageReport(course: CatalogCourse): CoverageReport {
  const assigned = standardsForCourse(course.id);
  const assignedCodes = new Set(assigned.map((s) => s.code));

  const claimed = new Set<string>();
  const orphanLessons: string[] = [];
  for (const lesson of courseLessons(course)) {
    for (const code of [lesson.primaryStandard, ...lesson.supportingStandards]) {
      if (!code) continue;
      if (assignedCodes.has(code)) claimed.add(code);
      else if (code === lesson.primaryStandard) orphanLessons.push(lesson.code);
    }
  }

  const gaps = assigned.map((s) => s.code).filter((code) => !claimed.has(code));
  return {
    courseId: course.id,
    courseTitle: course.title,
    assigned: assigned.length,
    covered: claimed.size,
    gaps,
    orphanLessons,
    valid: gaps.length === 0 && orphanLessons.length === 0,
  };
}

/** Every course whose standards coverage does not hold. Empty is the norm. */
export function coverageGaps(): CoverageReport[] {
  return COURSES.map(coverageReport).filter((r) => !r.valid);
}

/** Lessons in a course that claim a standard, primary coverage first. */
export function lessonsForStandard(
  course: CatalogCourse,
  code: string,
): { code: string; day: number; title: string; primary: boolean }[] {
  return courseLessons(course)
    .filter((l) => l.primaryStandard === code || l.supportingStandards.includes(code))
    .map((l) => ({
      code: l.code,
      day: l.day,
      title: l.title,
      primary: l.primaryStandard === code,
    }))
    .sort((a, b) => Number(b.primary) - Number(a.primary) || a.day - b.day);
}
