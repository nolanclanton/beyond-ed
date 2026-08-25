/**
 * The concept dependency graph.
 *
 * Within each unit, the workbook records which concept enables which, how
 * strongly, and the lesson where the dependency first bites. This is the layer
 * beneath the standards: standards say what a course is responsible for,
 * concept edges say what has to be understood before what.
 *
 * Strength is 1 to 5 — 1 contextual, 5 a required progression. It is a ranking
 * input for recommendations and it is inspectable, which is the requirement
 * (CLAUDE.md §8).
 */
import rawConcepts from "./data/concepts.json";
import { pushInto } from "@/lib/collections";

import { unitById } from "./catalog";

export type ConceptEdge = {
  courseId: string;
  unitId: string;
  from: string;
  to: string;
  /** e.g. `enables`. */
  relationship: string;
  /** 1 contextual … 5 required progression. */
  strength: number;
  exampleLessonCode: string;
};

const data = rawConcepts as unknown as { edges: ConceptEdge[] };

export const CONCEPT_EDGES: readonly ConceptEdge[] = data.edges;

const byUnit = new Map<string, ConceptEdge[]>();
for (const edge of CONCEPT_EDGES) {
  pushInto(byUnit, edge.unitId, edge);
}

export function conceptEdgesForUnit(unitId: string): ConceptEdge[] {
  return byUnit.get(unitId) ?? [];
}

export function conceptEdgesForCourse(courseId: string): ConceptEdge[] {
  return CONCEPT_EDGES.filter((e) => e.courseId === courseId);
}

/** The concepts a unit teaches, in the order the graph puts them. */
export function conceptChain(unitId: string): string[] {
  const unit = unitById(unitId)?.unit;
  if (!unit) return [];
  return unit.concepts;
}

/** What a concept enables inside its unit, strongest dependency first. */
export function enabledBy(unitId: string, concept: string): ConceptEdge[] {
  return conceptEdgesForUnit(unitId)
    .filter((e) => e.from === concept)
    .sort((a, b) => b.strength - a.strength);
}

/** What has to come before a concept inside its unit. */
export function dependsOn(unitId: string, concept: string): ConceptEdge[] {
  return conceptEdgesForUnit(unitId)
    .filter((e) => e.to === concept)
    .sort((a, b) => b.strength - a.strength);
}

/** How the strength number reads in words. Status is never colour alone. */
export const STRENGTH_MEANING: Record<number, string> = {
  1: "Contextual — useful background",
  2: "Supporting — helps but does not block",
  3: "Substantial — most students need it first",
  4: "Strong — the next concept is hard without it",
  5: "Required progression — this must come first",
};

export function strengthMeaning(strength: number): string {
  return STRENGTH_MEANING[strength] ?? `Strength ${strength}`;
}
