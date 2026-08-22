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

describe("no AI, LLM, or conversational surface (CLAUDE.md §10)", () => {
  const FORBIDDEN_PACKAGES = [
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

  it("declares no AI or LLM dependency", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const names = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];
    for (const name of names) {
      for (const forbidden of FORBIDDEN_PACKAGES) {
        expect(name.startsWith(forbidden), `${name} is an AI/LLM SDK`).toBe(false);
      }
    }
  });

  it("imports no AI or LLM SDK anywhere", () => {
    for (const file of ALL_SOURCE) {
      const imports = importLines(readFileSync(file, "utf8"));
      for (const forbidden of FORBIDDEN_PACKAGES) {
        expect(imports.includes(`"${forbidden}`), `${file} imports ${forbidden}`).toBe(false);
      }
    }
  });

  it("ships no chatbot, tutor, or assistant surface", () => {
    const banned = [
      /\bAI tutor\b/i,
      /\bchatbot\b/i,
      /\bcopilot\b/i,
      /\bask beyond\.?ed\b/i,
      /\bAI assistant\b/i,
    ];
    for (const file of filesUnder("app")) {
      const source = readFileSync(file, "utf8");
      for (const pattern of banned) {
        const matches = source.match(new RegExp(pattern, "gi")) ?? [];
        for (const match of matches) {
          // The only permitted mentions are the standing denials.
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
