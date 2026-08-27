import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The invariants that are easiest to break by accident, checked against the
 * source rather than against intent (CLAUDE.md §4, §8, §10).
 *
 * These duplicate the lint rules on purpose: lint can be disabled inline, and
 * these cannot.
 */
/** Import statements only — a doc comment naming a module is not an import. */
function importLines(source: string): string {
  return source
    .split("\n")
    .filter((l) => /^\s*import\s/.test(l) || /^\s*}\s*from\s/.test(l) || /^\s*[\w{},*\s]+from\s+["']/.test(l))
    .join("\n");
}

function filesUnder(dir: string, exts = [".ts", ".tsx"]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...filesUnder(full, exts));
    else if (exts.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

const ALL_SOURCE = [
  ...filesUnder("lib"),
  ...filesUnder("app"),
  ...filesUnder("tests"),
];

describe("grades and mastery stay separate (CLAUDE.md §4)", () => {
  it("no file in /lib/grades imports /lib/mastery", () => {
    for (const file of filesUnder("lib/grades")) {
      const imports = importLines(readFileSync(file, "utf8"));
      expect(imports, file).not.toMatch(/lib\/mastery/);
      expect(imports, file).not.toMatch(/\.\.\/mastery/);
    }
  });

  it("no file in /lib/mastery imports /lib/grades", () => {
    for (const file of filesUnder("lib/mastery")) {
      const imports = importLines(readFileSync(file, "utf8"));
      expect(imports, file).not.toMatch(/lib\/grades/);
      expect(imports, file).not.toMatch(/\.\.\/grades/);
    }
  });

  it("the student Grades page does not import mastery at all", () => {
    const imports = importLines(readFileSync("app/(student)/grades/page.tsx", "utf8"));
    expect(imports).not.toMatch(/lib\/mastery/);
  });
});

describe("the recommendation engine is pure (CLAUDE.md §8)", () => {
  const files = filesUnder("lib/recommend");

  it("performs no I/O", () => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      // Type-only imports are erased at build and add no runtime edge.
      const runtimeImports = importLines(source)
        .split("\n")
        .filter((l) => !/^import type /.test(l))
        .join("\n");
      expect(runtimeImports, file).not.toMatch(/lib\/db\/store/);
      expect(runtimeImports, file).not.toMatch(/lib\/evidence/);
      expect(runtimeImports, file).not.toMatch(/lib\/audit/);
      expect(runtimeImports, file).not.toMatch(/lib\/auth/);
      expect(runtimeImports, file).not.toMatch(/next\//);
      expect(runtimeImports, file).not.toMatch(/node:/);
    }
  });

  it("reads no clock and uses no randomness", () => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/Math\.random/);
      expect(source, file).not.toMatch(/Date\.now/);
      expect(source, file).not.toMatch(/new Date\(/);
      expect(source, file).not.toMatch(/lib\/clock/);
    }
  });
});

describe("no AI in the learning product (CLAUDE.md §10)", () => {
  const LLM_PACKAGES = [
    "openai",
    "@anthropic-ai/",
    "@google/generative-ai",
    "@google/genai",
    "langchain",
    "@ai-sdk/",
    "replicate",
    "cohere-ai",
    "ollama",
  ];

  /** The one directory §10.2 lifts the ban for. */
  const AI_DIR = "lib/ai/";

  /**
   * Surfaces a student, a teacher, or a site administrator actually reaches.
   * Nothing generative may run in any of them, and none of them may so much as
   * import the module that can.
   */
  const LEARNER_SURFACES = [
    "app/(student)",
    "app/(teacher)",
    "app/(site)",
    "lib/grades",
    "lib/mastery",
    "lib/recommend",
    "lib/evidence",
    "lib/intervention",
    "lib/learning",
    "lib/views",
    "lib/audit",
  ];

  it("declares exactly one AI dependency, and it is the approved one", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const names = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];
    for (const name of names) {
      for (const forbidden of LLM_PACKAGES) {
        if (forbidden === "@google/genai") continue;
        expect(name.startsWith(forbidden), `${name} is a forbidden AI/LLM SDK`).toBe(
          false,
        );
      }
    }
  });

  it("imports an LLM SDK nowhere but /lib/ai", () => {
    for (const file of ALL_SOURCE) {
      if (file.startsWith(AI_DIR)) continue;
      const imports = importLines(readFileSync(file, "utf8"));
      for (const forbidden of LLM_PACKAGES) {
        expect(
          imports.includes(`"${forbidden}`),
          `${file} imports ${forbidden} outside /lib/ai`,
        ).toBe(false);
      }
    }
  });

  it("keeps the assistant away from student records", () => {
    for (const file of filesUnder("lib/ai")) {
      const imports = importLines(readFileSync(file, "utf8"));
      for (const banned of [
        "lib/grades",
        "lib/mastery",
        "lib/evidence",
        "lib/recommend",
        "lib/intervention",
        "lib/views",
        "lib/learning",
      ]) {
        expect(imports, `${file} imports ${banned}`).not.toMatch(
          new RegExp(banned.replace("/", "\\/")),
        );
      }
    }
  });

  it("is not reachable from any learner, teacher, or site surface", () => {
    for (const dir of LEARNER_SURFACES) {
      for (const file of filesUnder(dir)) {
        const imports = importLines(readFileSync(file, "utf8"));
        expect(imports, `${file} imports the assistant`).not.toMatch(/lib\/ai\//);
      }
    }
  });

  it("never puts the Gemini key within reach of a browser", () => {
    for (const file of ALL_SOURCE) {
      // This file necessarily spells out the strings it forbids.
      if (file.endsWith("module-boundaries.test.ts")) continue;
      const source = readFileSync(file, "utf8");
      expect(source, `${file} names a public Gemini variable`).not.toMatch(
        /NEXT_PUBLIC_GEMINI/,
      );
      // A literal Google API key, in any file, is a credential to rotate.
      expect(source, `${file} contains a literal Google API key`).not.toMatch(
        /["']AIza[0-9A-Za-z\-_]{30,}["']/,
      );
      // The variable itself: shipped code outside /lib/ai must never read it.
      // A test may set it to a fake value — that is how the unconfigured and
      // configured paths get exercised at all, and the assistance tests assert
      // the fake never reaches the model.
      if (file.startsWith(AI_DIR) || file.startsWith("tests/")) continue;
      expect(source, `${file} reads GEMINI_API_KEY outside /lib/ai`).not.toMatch(
        /GEMINI_API_KEY/,
      );
    }
  });

  it("refuses to construct the Gemini client anywhere but the server", () => {
    const source = readFileSync("lib/ai/client.ts", "utf8");
    expect(source, "lib/ai/client.ts has no browser guard").toMatch(
      /typeof window/,
    );
  });

  it("is never imported by a Client Component", () => {
    for (const file of ALL_SOURCE) {
      const source = readFileSync(file, "utf8");
      if (!/^\s*["']use client["']/m.test(source)) continue;
      expect(
        importLines(source),
        `${file} is a Client Component and imports the assistant`,
      ).not.toMatch(/lib\/ai\//);
    }
  });

  it("ships no chatbot, tutor, or assistant surface to a student or a teacher", () => {
    const banned = [
      /\bAI tutor\b/i,
      /\bchatbot\b/i,
      /\bcopilot\b/i,
      /\bask beyond\.?ed\b/i,
      /\bAI agent\b/i,
    ];
    for (const file of filesUnder("app")) {
      const source = readFileSync(file, "utf8");
      for (const pattern of banned) {
        const matches = source.match(new RegExp(pattern, "gi")) ?? [];
        for (const match of matches) {
          const line =
            source
              .split("\n")
              .find((l) => l.toLowerCase().includes(match.toLowerCase())) ?? "";
          // The only permitted mentions are denials: the word must sit in a
          // sentence that says the thing does not exist.
          expect(
            /\b(no|not|never|without|forbidden|prohibited)\b/i.test(line),
            `${file}: "${line.trim()}"`,
          ).toBe(true);
        }
      }
    }
  });

  it("mentions design assistance only on the curriculum authoring screens", () => {
    for (const file of filesUnder("app")) {
      if (file.startsWith("app/(org)/org/curriculum")) continue;
      const source = readFileSync(file, "utf8");
      for (const match of source.match(/\bGemini\b|\bAI assistance\b/gi) ?? []) {
        const line =
          source
            .split("\n")
            .find((l) => l.toLowerCase().includes(match.toLowerCase())) ?? "";
        expect(
          /\b(no|not|never|without|forbidden|prohibited)\b/i.test(line),
          `${file}: "${line.trim()}"`,
        ).toBe(true);
      }
    }
  });
});

describe("append-only records (CLAUDE.md §5, §6)", () => {
  it("nothing mutates or deletes evidence, audit events, or grade records", () => {
    for (const file of [...filesUnder("lib"), ...filesUnder("app")]) {
      const source = readFileSync(file, "utf8");
      for (const table of ["evidence", "auditEvents", "gradeRecords"]) {
        for (const mutator of ["splice", "pop", "shift", "sort", "reverse"]) {
          // `.slice().reverse()` is fine — it copies first. Mutating the stored
          // array is not.
          expect(source, `${file} calls ${table}.${mutator}()`).not.toMatch(
            new RegExp(`(?<!slice\\(\\))\\.${table}\\.${mutator}\\(`),
          );
        }
        // Reassigning the table itself would drop rows.
        expect(source, `${file} reassigns ${table}`).not.toMatch(
          new RegExp(`(d|db\\(\\))\\.${table}\\s*=[^=]`),
        );
      }
    }
  });

  it("only the store's append helpers push to those tables", () => {
    for (const file of [...filesUnder("lib"), ...filesUnder("app")]) {
      if (file.endsWith("lib/db/store.ts")) continue;
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/\.evidence\s*(as [^)]*)?\)?\.push/);
      expect(source, file).not.toMatch(/\.auditEvents\s*(as [^)]*)?\)?\.push/);
      expect(source, file).not.toMatch(/\.gradeRecords\s*(as [^)]*)?\)?\.push/);
    }
  });
});
