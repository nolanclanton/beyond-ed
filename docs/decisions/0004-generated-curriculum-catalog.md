# ADR 0004 — The curriculum catalog is generated from the blueprint

**Status:** Superseded by [ADR 0011](0011-curriculum-architecture-workbook.md)
**Date:** 2026-08-21

> The principle below still holds — the catalog is generated, never authored in
> code — but its source changed. The blueprint appendices gave 30 courses of
> multi-day identified lessons; the curriculum architecture workbook gives the
> full 38-course, 5,130-lesson spine, and is now what `pnpm catalog` reads.

## Context

CLAUDE.md §14 forbids inventing curriculum data: "If a standard code, a skill
ID, a prerequisite link, or a day budget is not in the blueprint or the
database, say it is missing. Do not invent curriculum data."

The blueprint's appendices carry the real thing — 30 courses with unit-level day
budgets, and a standards-to-lesson alignment matrix giving every lesson an
identifier, a day range, a primary standards assignment, an assessment record,
and a linked intervention lesson. Transcribing that by hand would introduce
exactly the errors the rule exists to prevent.

## Decision

`scripts/build-catalog.mjs` parses `docs/blueprint.md` and emits
`lib/curriculum/data/catalog.json`, which is committed. Nothing in application
code authors curriculum; `lib/curriculum/catalog.ts` only reads the generated
file.

The generator validates as it runs. It currently produces:

- 30 courses across mathematics, English, science, and social science
- 249 units
- 741 identified lessons with day ranges, primary standards, assessment ids, and
  linked intervention lessons
- 30 named starter intervention lessons (Appendix E)
- 28 intervention families totalling 280 lessons (§13)
- **every course totalling exactly 135 pathway days**

That last line is checked by the generator and again by
`tests/unit/budget.test.ts` across all 30 courses.

## Consequences

- To change the catalog, change the blueprint and re-run `pnpm catalog`. There
  is no second source of truth to drift.
- Standard-code alignment tags (`[CA]`, `[*]`, `[+]`, `[LOCAL]`) survive the
  parse and are shown with their meanings from the appendix legend, so a
  California addition is never silently presented as a base standard.
- What the blueprint does not supply is not invented: prerequisite links, skill
  identifiers separate from standard codes, and per-lesson time estimates do not
  exist here. Where the product needs one anyway — the estimated minutes on a
  support — the interface prints the blueprint's stated 10–25 minute range and
  says the per-lesson value has not been authored.
