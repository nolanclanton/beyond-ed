/**
 * Course-to-course pathways.
 *
 * The catalog says what a course contains; this says what a course leads to.
 * Each edge names the capstone lesson a student finishes and the entry lesson
 * they arrive at, plus the handoff rule — prior capstone evidence informs the
 * entry diagnostic and any support assigned at the start of the next course.
 *
 * The graph branches: Mathematics 8 leads either into Math 1 or into the
 * two-course Math 1A/1B sequence, and Biology opens four elective branches.
 * Placement is a human decision; the graph records what the legal moves are.
 */
import rawPathways from "./data/pathways.json";
import { pushInto } from "@/lib/collections";

import {
  COURSES,
  getCourseById,
  type CatalogCourse,
  type Subject,
} from "./catalog";

export type PathwayEdge = {
  subject: Subject;
  fromCourseId: string;
  toCourseId: string;
  /** e.g. `Grade-level progression`, `Life-science elective branch`. */
  relationship: string;
  fromCapstoneLessonCode: string;
  toEntryLessonCode: string;
  handoffRule: string;
};

const data = rawPathways as unknown as { pathways: PathwayEdge[] };

export const PATHWAY_EDGES: readonly PathwayEdge[] = data.pathways;

const outgoing = new Map<string, PathwayEdge[]>();
const incoming = new Map<string, PathwayEdge[]>();
for (const edge of PATHWAY_EDGES) {
  pushInto(outgoing, edge.fromCourseId, edge);
  pushInto(incoming, edge.toCourseId, edge);
}

/** Courses this one leads into. */
export function leadsTo(courseId: string): PathwayEdge[] {
  return outgoing.get(courseId) ?? [];
}

/** Courses that lead into this one. */
export function leadsFrom(courseId: string): PathwayEdge[] {
  return incoming.get(courseId) ?? [];
}

export function pathwaysForSubject(subject: Subject): PathwayEdge[] {
  return PATHWAY_EDGES.filter((e) => e.subject === subject);
}

/** True when nothing in the catalog leads into this course. */
export function isEntryCourse(courseId: string): boolean {
  return leadsFrom(courseId).length === 0;
}

/** True when this course leads nowhere further in its subject. */
export function isTerminalCourse(courseId: string): boolean {
  return leadsTo(courseId).length === 0;
}

export type PathwayNeighbour = {
  course: CatalogCourse;
  edge: PathwayEdge;
};

function resolve(edges: PathwayEdge[], side: "fromCourseId" | "toCourseId"): PathwayNeighbour[] {
  const out: PathwayNeighbour[] = [];
  for (const edge of edges) {
    const course = getCourseById(edge[side]);
    if (course) out.push({ course, edge });
  }
  return out.sort((a, b) => a.course.order - b.course.order);
}

export function nextCourses(courseId: string): PathwayNeighbour[] {
  return resolve(leadsTo(courseId), "toCourseId");
}

export function priorCourses(courseId: string): PathwayNeighbour[] {
  return resolve(leadsFrom(courseId), "fromCourseId");
}

/**
 * A subject's courses arranged in pathway order with their branch structure —
 * the shape a course-planning conversation actually needs.
 */
export type SubjectPathway = {
  subject: Subject;
  courses: {
    course: CatalogCourse;
    entry: boolean;
    terminal: boolean;
    next: PathwayNeighbour[];
    prior: PathwayNeighbour[];
  }[];
};

export function subjectPathway(subject: Subject): SubjectPathway {
  return {
    subject,
    courses: COURSES.filter((c) => c.subject === subject)
      .sort((a, b) => a.order - b.order)
      .map((course) => ({
        course,
        entry: isEntryCourse(course.id),
        terminal: isTerminalCourse(course.id),
        next: nextCourses(course.id),
        prior: priorCourses(course.id),
      })),
  };
}
