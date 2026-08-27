import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * No AI or LLM dependency, anywhere except `/lib/ai` (CLAUDE.md §10). Flat
 * config replaces a rule rather than merging it, so this pattern list is spread
 * into every `no-restricted-imports` block below instead of living in one
 * global block that a later block would silently override.
 *
 * `/lib/ai` is the ONE directory the ban lifts for, and it lifts only there:
 * the block for it appears after the global block and drops this pattern while
 * adding its own, tighter restrictions. Confining the SDK to a path is what
 * makes §10.2 checkable rather than a promise — a generative call cannot appear
 * on a student's lesson page without moving a file.
 */
const NO_LLM = {
  group: [
    "openai",
    "openai/*",
    "@anthropic-ai/*",
    "@google/generative-ai",
    "@google/genai",
    "langchain",
    "langchain/*",
    "@langchain/*",
    // Anchored with a leading slash. These patterns are matched with
    // gitignore semantics, where an unanchored "ai" matches ANY path segment
    // called `ai` — including this repository's own `/lib/ai`, which is the
    // one directory the rule is meant to permit.
    "/ai",
    "/ai/*",
    "@ai-sdk/*",
    "replicate",
    "cohere-ai",
    "ollama",
  ],
  message:
    "CLAUDE.md §10: the learning product contains no AI tutor, chatbot, copilot, or generative surface. An LLM SDK may be imported only from /lib/ai.",
};

/**
 * What the assistant may never reach (CLAUDE.md §10.2).
 *
 * `/lib/ai` builds a context object out of curriculum records and sends it to
 * Gemini. It has no business importing the modules that hold student work, and
 * an import here would be the first step toward a generative call that reads
 * one. The context builders take curriculum ids and return curriculum text;
 * everything a student did is on the other side of this line.
 */
const NO_STUDENT_RECORDS = {
  group: [
    "@/lib/grades/*",
    "@/lib/mastery/*",
    "@/lib/evidence/*",
    "@/lib/recommend/*",
    "@/lib/intervention/*",
    "@/lib/views/*",
    "@/lib/learning/*",
  ],
  message:
    "CLAUDE.md §10.2: /lib/ai must never read student records. Nothing generative may touch evidence, grades, mastery, recommendations, or intervention state.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: ["**/*.{ts,tsx,mts,mjs}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [NO_LLM] }],
    },
  },

  /**
   * The curriculum design assistant (CLAUDE.md §10.2). The LLM SDK is permitted
   * HERE and nowhere else; in exchange this directory may not import anything
   * that holds a student's work.
   */
  {
    files: ["lib/ai/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [NO_STUDENT_RECORDS] }],
    },
  },

  /**
   * Grades and mastery are separate systems (CLAUDE.md §4). The boundary is a
   * product guarantee, so it is enforced here as well as by review and by
   * `tests/unit/module-boundaries.test.ts`.
   */
  {
    files: ["lib/grades/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            NO_LLM,
            {
              group: ["@/lib/mastery/*", "../mastery/*", "./mastery/*"],
              message:
                "CLAUDE.md §4: /lib/grades must never import /lib/mastery. A grade is not derived from a mastery estimate.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/mastery/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            NO_LLM,
            {
              group: ["@/lib/grades/*", "../grades/*", "./grades/*"],
              message:
                "CLAUDE.md §4: /lib/mastery must never import /lib/grades. A mastery estimate is not derived from a grade.",
            },
          ],
        },
      ],
    },
  },

  /**
   * The recommendation engine is a pure function of stored evidence and a
   * versioned rule set (CLAUDE.md §8). It performs no I/O and reads no clock.
   */
  {
    files: ["lib/recommend/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            NO_LLM,
            {
              group: [
                "@/lib/db/store",
                "@/lib/db/seed",
                "@/lib/evidence/*",
                "@/lib/audit/*",
                "@/lib/auth/*",
                "@/lib/clock",
                "next/*",
                "node:*",
              ],
              message:
                "CLAUDE.md §8: /lib/recommend must be pure — no I/O, no clock, no store access. Pass what it needs as an argument.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "Date", message: "CLAUDE.md §8: /lib/recommend must not read the clock." },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "CLAUDE.md §8: recommendations are deterministic. No randomness.",
        },
        {
          object: "Date",
          property: "now",
          message: "CLAUDE.md §8: /lib/recommend must not read the clock.",
        },
      ],
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "lib/curriculum/data/**",
  ]),
]);

export default eslintConfig;
