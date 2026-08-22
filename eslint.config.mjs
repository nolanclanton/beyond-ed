import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * No AI or LLM dependency, anywhere (CLAUDE.md §10). Flat config replaces a
 * rule rather than merging it, so this pattern list is spread into every
 * `no-restricted-imports` block below instead of living in one global block
 * that a later block would silently override.
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
    "ai",
    "ai/*",
    "@ai-sdk/*",
    "replicate",
    "cohere-ai",
    "ollama",
  ],
  message:
    "CLAUDE.md §10: Beyond.Ed contains no AI tutor, chatbot, copilot, or generative surface. No LLM SDK may be imported.",
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
