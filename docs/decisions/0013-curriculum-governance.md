# ADR 0013 — Course structure and the foundation map are governed per version, not in the workbook

**Status:** Accepted
**Builds on:** [ADR 0011](0011-curriculum-architecture-workbook.md), [ADR 0010](0010-lesson-studio.md), [ADR 0012](0012-lesson-canvas.md)

## Context

ADR 0011 made the curriculum architecture workbook the source of truth for the
instructional structure, and `pnpm catalog` generates `lib/curriculum/data/` from
it. CLAUDE.md §7 is explicit that the generated files are never hand-edited: to
change the curriculum, change the workbook and regenerate.

That is right for the SPINE — the 38 courses, the 5,130 lessons, the standards
crosswalk, the day budget. It is wrong as the only mechanism for two things a
curriculum author has to be able to do:

1. **Adapt a course for a cohort.** Run the geometry unit before the ratio unit.
   Put the anchor task first in the unit. Re-frame a unit's title and essential
   question for the students actually taking it. None of this is a change to the
   workbook — the workbook is the district's plan, and the adaptation is one
   version of one course.

2. **Say how hard a dependency binds.** The workbook records that a lesson names
   six pieces of prior learning, and it records the ROLE of each — "immediate
   prior learning", "unit anchor or prior checkpoint", "foundational support:
   place value and magnitude". It does not record whether a student can start
   the lesson without one. That judgement comes from evidence and from teaching,
   it changes between cohorts, and it is exactly what a governor needs to be able
   to set.

Editing the workbook for either would be wrong twice over: it would apply the
change to every course version at once, including running classes, and it would
make an adaptation indistinguishable from the district's plan.

## Decision

**The workbook stays the immutable baseline. Adaptations are stored as overrides
scoped to one course version.**

One row per course version, in `courseStructures`:

| Field | What it holds |
|---|---|
| `unitOrder` | unit ids in the order this version runs them; `null` means unchanged |
| `lessonOrder` | unit id → lesson codes in order; an absent key means unchanged |
| `unitFraming` | a unit's title and essential question, re-written for this version |
| `foundationEdits` | per (lesson, target): importance 1–5, a note, and whether the link is retired |

`lib/curriculum/structure.ts` lays the override over the baseline and returns the
course as the version runs it. `lib/curriculum/foundations.ts` does the same for
the foundation map. The baseline is never copied in, so a course nobody has
adapted reads as exactly what was ingested, and a later `pnpm catalog` flows
straight through.

### Why version scope is the safety property

A roster section keeps the `courseVersionId` it was created with. Scoping the
override to the version therefore gives §7 for free: re-sequencing cannot reorder
a class already running, cannot alter prior evidence, and cannot change the
structure a historical calculation resolved against. Only a DRAFT is editable —
the same rule lesson content already follows (ADR 0010).

### Re-sequencing moves lessons; it never relocates them across units

A lesson moves within its own unit, and a unit moves within its own course.
Neither changes any unit's lesson count, so the 135 + 40 = 175 contract holds by
construction rather than by hope, and standards coverage is unchanged because the
same lessons claim the same standards. Moving a lesson into a different unit
would change two unit day budgets at once — a blueprint decision, not an
authoring one, which is the same line ADR 0010 draws at creating a new lesson.

`day`, `order`, `startDay`, and `endDay` are recomputed from position because
they describe a position. Lesson codes and unit ids never move (§7 — stable
identifiers). A lesson's TYPE follows its position in the fifteen-lesson arc, so
moving a lesson does change what kind of lesson it is; the surface says so rather
than hiding it.

### An ungoverned link reports no strength

The workbook does not record strength, so the product does not invent one. An
ungoverned foundation reads "Not yet governed — the workbook records the link,
not how hard it binds." Importance 4 and 5 are what the product means by
*foundational*; the wording is in `IMPORTANCE_MEANING` and is shown as a sentence,
never as a bare number or a colour (CLAUDE.md §12, §14).

### Two rules are enforced on write and re-checked at publication

- **A lesson's foundation runs before it.** This makes the map acyclic by
  construction rather than by a cycle check, and it couples the two features
  honestly: re-sequencing a unit can strand an existing link, and the gate
  reports the conflict rather than silently reordering the map to hide it.
- **A support's foundation can return the student into this course.** The bank
  records which courses each support returns into; a support that cannot return
  here would leave a student with nowhere to come back to.

`publicationGate` therefore runs four checks, all against the course as the
version runs it: the day budget, standards coverage, structural integrity, and
the foundation map.

### `lib/curriculum` imports the intervention bank, narrowly

`lib/curriculum/prerequisites.ts` deliberately does not resolve support names,
to keep the curriculum layer off the intervention layer for a label.
`foundations.ts` imports `supportById` and `returnsInto` anyway, because the
return rule is a fact about where a student ends up rather than a label. Support
names are still joined by the caller. There is no cycle: the bank imports only
generated data and a type.

### `courseLessons` is now cached per course object

An effective course carries the same stable `id` as the workbook's, so the old
id-keyed cache would have handed a re-sequenced course the baseline order and
never said so. The cache is a `WeakMap` keyed on the object.

## The schema

The in-memory store (ADR 0002) is what the product reads today, and the Postgres
schema is maintained alongside it so the two describe the same thing. Four
migrations carry this decision:

| Migration | What it adds |
|---|---|
| `0009_lesson_materials.sql` | `lesson_material_kind`, `lesson_materials`, the draft-only trigger, RLS; adds `'material'` to `lesson_block_kind` |
| `0010_material_blocks.sql` | `lesson_blocks.material_id`, the reworked shape constraint, the same-lesson trigger, and delete guards for placed materials AND placed videos |
| `0011_course_structures.sql` | `course_structures`, `course_structure_units`, `course_structure_foundations`, `structure_is_editable`, `reject_non_draft_structure`, RLS |

Three notes on the SQL, because each encodes a decision rather than a mechanism.

**Three tables, not one jsonb column.** The same reasoning migration 0007 gives
for the lesson canvas: the studio edits one thing at a time — move a unit,
reorder a unit's lessons, re-frame a unit, weight one link, retire one link.
Each is a row operation with its own audit event and its own draft check.

**`lesson_codes` is not a foreign key.** Lesson codes come from the workbook,
which the database does not hold — the catalog is generated into the
application. The check that a version's sequence still names the lesson set the
current workbook has is `structureIntegrity()`, which reports a divergence and
blocks publication rather than repairing it silently.

**The shape constraint in 0007 had no `ELSE`.** A `case` over an unhandled enum
label evaluates to NULL, and a CHECK that evaluates to NULL passes — so any
block kind added after 0007 would have been accepted with no shape requirement
at all. 0010 adds `else false`. It also compares `kind::text` rather than the
enum label, so the file is correct whether or not a migration runner applies
0009 and 0010 in the same transaction.

## Consequences

- A curriculum author can adapt a course without touching the workbook, and every
  adaptation is visible as a difference from the baseline.
- Every governance write is transactional, idempotent, requires a recorded
  reason, and produces an audit event in the same transaction (§6).
- The lesson studio now builds in the version's own order, so what an author sees
  is what a student will meet.
- Materials — readings, worksheets, data sets, reference sheets — are attached to
  a lesson once and placed on the canvas by reference, exactly as video is, with
  a required purpose and a required access note (§12).
- A structure override written against an older catalog can diverge from a
  regenerated workbook. `structureIntegrity` reports it and blocks publication
  rather than silently dropping or inventing a lesson.
- The migrations and policies are written and reviewed but have NOT been
  executed: neither the Supabase CLI nor Docker is available on the development
  machine, and applying them to the hosted project needs human approval
  (CLAUDE.md §2). They are canonical, not yet applied — the same status the rest
  of `supabase/` has carried since ADR 0002.
