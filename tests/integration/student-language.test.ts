import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { COURSES, primaryStandards, standardCode } from "@/lib/curriculum/catalog";
import { focusForLesson, focusForSkill, skillLabel } from "@/lib/views/learning-focus";

/**
 * Students see what they are learning, not the coverage record behind it.
 *
 * Standard codes, assessment ids, support ids, and rule versions are staff
 * vocabulary: a teacher needs them to trace coverage and an auditor needs them
 * to check it. Rendering them to a student makes ordinary learning look like
 * compliance paperwork (CLAUDE.md §13 — every student view answers what am I
 * doing, why, and what must I show next).
 */
function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...filesUnder(full));
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) out.push(full);
  }
  return out;
}

const STUDENT_FILES = filesUnder("app/(student)");

describe("the student surfaces speak plainly", () => {
  it("renders no standard code, assessment id, or support id", () => {
    // A `{...}` expression that PRINTS an identifier.
    //
    // The lookbehind excludes `prop={x}` and `${x}`, which pass a value along
    // rather than render it — routes and idempotency keys legitimately carry
    // lesson codes. Staying on one line excludes block bodies, where the same
    // field is read for logic (`{ const runnable = plan.targetStandard ...`)
    // rather than shown.
    const rendered = String.raw`(?<![=$])\{[^{}\n]*`;
    const rendersCode = [
      new RegExp(rendered + String.raw`\blesson\.code\s*\}`),
      new RegExp(rendered + String.raw`\.lessonCode\s*\}`),
      new RegExp(rendered + String.raw`\bassessmentId\(`),
      new RegExp(rendered + String.raw`\.interventionLessonId\s*\}`),
      new RegExp(rendered + String.raw`\.targetStandard\b`),
      new RegExp(rendered + String.raw`\bprimaryStandards\(`),
      new RegExp(rendered + String.raw`\bstandardCode\(`),
      new RegExp(rendered + String.raw`RULE_VERSIONS\.`),
      new RegExp(rendered + String.raw`\.courseVersion\s*\}`),
      new RegExp(rendered + String.raw`\.returnRuleVersion\s*\}`),
    ];
    for (const file of STUDENT_FILES) {
      const source = readFileSync(file, "utf8");
      for (const pattern of rendersCode) {
        const match = pattern.exec(source);
        expect(match?.[0], `${file} renders ${match?.[0]}`).toBeUndefined();
      }
    }
  });

  it("uses no monospace type, which is what makes a code look like a code", () => {
    for (const file of STUDENT_FILES) {
      const source = readFileSync(file, "utf8");
      expect(source.includes("font-mono"), `${file} uses font-mono`).toBe(false);
    }
  });
});

describe("learning focus", () => {
  it("resolves every primary standard in the catalog to a lesson title", () => {
    let checked = 0;
    for (const course of COURSES) {
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          for (const standard of primaryStandards(lesson)) {
            const focus = focusForSkill(standardCode(standard));
            expect(focus, `${standard} has no learning focus`).toBeDefined();
            expect(focus!.title.length).toBeGreaterThan(0);
            // The title must not simply repeat the code back.
            expect(focus!.title).not.toContain(standardCode(standard));
            checked += 1;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(1000);
  });

  it("resolves a readiness skill through its lesson", () => {
    const focus = focusForSkill("MATH-06-L001-readiness");
    expect(focus?.courseTitle).toBe("Mathematics 6");
    expect(focus?.title.length).toBeGreaterThan(0);
  });

  it("prefers an authored goal, which is already written to a student", () => {
    const focus = focusForLesson("MATH-06-L035");
    expect(focus?.description).toBe(
      "Find and use a unit rate to compare two quantities measured in different units.",
    );
    expect(focus?.position).toBe("Lesson 5 of 15");
  });

  it("falls back to the lesson's own description when nothing is authored", () => {
    const focus = focusForLesson("MATH-06-L005");
    expect(focus?.description.length).toBeGreaterThan(0);
    expect(focus?.description).not.toContain("6.NS");
  });

  it("never hands back a raw code as a label", () => {
    for (const skill of ["6.RP.2", "RL.9-10.2", "HSS.6.1.1", "MS-ETS1-2"]) {
      expect(skillLabel(skill)).not.toContain(skill);
      expect(skillLabel(skill).length).toBeGreaterThan(3);
    }
  });
});
