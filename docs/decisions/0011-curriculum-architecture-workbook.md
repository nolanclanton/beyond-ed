# ADR 0011 — The curriculum architecture workbook is the curriculum's source of truth

**Status:** Accepted
**Supersedes:** [ADR 0004](0004-generated-curriculum-catalog.md)

## Context

`docs/blueprint.md` defines the PRODUCT: the ten-stage lesson, the Exit Ticket
bands, the intervention lifecycle, the annual capacity contract, and the roles.
Its appendices also carried an alignment matrix, and ADR 0004 generated the
catalog from it — 30 courses, 249 units, 741 identified lessons, each spanning
several days.

That matrix was a sketch of a course, not a course. A lesson with a day range of
`4-8` says nothing about what happens on day 5, a course with 24 identified
lessons cannot be taught from, and neither a teacher nor an administrator can
plan against it.

The owner supplied a curriculum architecture workbook that resolves all of it:
the exact 38-course taxonomy, nine units per course, fifteen thirty-minute
lessons per unit, a standards crosswalk with coverage counts, a reusable
intervention bank, a per-lesson prerequisite map, a concept dependency graph, and
the course-to-course pathways. Every standard is traced to a published
California source.

## Decision

**The workbook at `docs/curriculum/curriculum-architecture.xlsx` is the source of
truth for the instructional structure.** `docs/blueprint.md` remains the source
of truth for the product, and `CLAUDE.md` continues to govern how the software is
built. Where the workbook and the blueprint describe the same thing — the
135 + 40 = 175 contract — they agree.

`scripts/build-catalog.mjs` generates six files into `lib/curriculum/data/`:

| File | What it holds |
|---|---|
| `catalog.json` | 38 courses → 342 units → 5,130 lessons |
| `standards.json` | 1,907 standards with their first-taught lesson and coverage count, plus the 18 published sources |
| `interventions.json` | the 160-support bank |
| `prerequisites.json` | six prior lessons or supports per lesson — 30,780 links |
| `concepts.json` | 1,672 concept dependency edges with strength 1–5 |
| `pathways.json` | 39 course-to-course pathway edges |

### The reader is dependency-free

An `.xlsx` is a ZIP of XML parts, and Node ships both halves already:
`zlib.inflateRawSync` and enough string handling for machine-written XML.
`scripts/xlsx.mjs` is about 200 lines and reads cell values and nothing else.
CLAUDE.md §1 keeps the dependency list closed, and a curriculum build is not a
reason to open it.

### The build validates before it writes

The script exits non-zero, naming every problem, if any of these fail:

- 38 courses, each with 9 units, 135 lessons, and days 1–135 unique;
- every lesson's primary and supporting standards present in that course's
  crosswalk;
- every crosswalk standard covered by at least one lesson;
- exactly six prerequisites per lesson, each resolving to a lesson or a support;
- every pathway endpoint, concept-edge example lesson, and support return
  destination resolving to something real;
- the fifteen-lesson arc identical in every unit of every course.

A workbook that does not hold together cannot become a build. This is the same
posture as the publication gate, applied one layer earlier.

### Three things are shaped rather than copied

Nothing here authors curriculum (CLAUDE.md §14). What the generator adds is
shape, and each addition is validated against the workbook:

1. **The fifteen-lesson arc is stored once.** A lesson's TYPE (`Guided practice`)
   and the EVIDENCE it produces (`four-item guided practice set`) are a function
   of its position in its unit, identically in all 342 units. Storing them 5,130
   times would be storing the same fact 342 times over; the build fails if any
   lesson departs from the arc.
2. **The prerequisite reasons are interned**, and a link's kind is derived from
   its id rather than stored — an intervention id contains `-INT-` and a lesson
   id does not — so the two cannot drift apart.
3. **A lesson's assessment record id is derived** as `A-<lesson id>`. The
   workbook says what evidence a lesson produces; it does not name the row that
   stores the result. That is a system identifier, not curriculum.

## Consequences

- Course titles and lesson codes changed. `Integrated Math 1` is `Math 1`,
  `Living Earth` is `Biology`, and `M6-U1-L2` is now a specific course day such
  as `MATH-06-L035`. Nothing in the store survived from an earlier build, so
  there is no evidence to re-point; the seed, the demo bank, and the tests moved
  with the codes.
- The generated data is 3.4 MB. It is imported by server modules only and is
  parsed once per process. Splitting it by concern means a page pays for the
  standards crosswalk only if it reads the standards crosswalk.
- **Standards coverage became a second publication gate.** A course version
  cannot be published with an assigned standard no lesson claims — a hole that
  is invisible once published, because nobody notices a standard nobody was
  taught. `lib/curriculum/standards.ts` recomputes coverage from the lesson
  spine rather than trusting the workbook's stored count.
- **A support is now what the curriculum says it is.** Previously each pathway
  lesson named one linked intervention. Now the prerequisite map names the
  supports a lesson rests on, and the bank says which courses each support can
  return into. `bestSupportFor(standard, course)` reads both, so the support a
  teacher is offered is the one the curriculum itself names as the prerequisite
  for the lesson the student is stuck on.
- **Discipline-literacy codes moved.** `RST.6-8.1`, `WHST.6-8.1`, and
  `RH.6-8.1` are carried in each lesson's practice column rather than as
  claimable standards in mathematics and science. Demo items that claimed them
  were removed rather than re-pointed at a standard they do not measure.
- **The lookahead window is now stated in days.** Every lesson is one course day,
  so the recommendation engine's five-lesson lookahead had silently become five
  days. It is ten, which is about two school weeks and close to one planning
  cycle.

## To change the curriculum

Change the workbook, then:

```bash
pnpm catalog
```

Never edit `lib/curriculum/data/`. It is generated, and the next build overwrites
it.
