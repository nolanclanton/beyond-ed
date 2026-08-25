# ADR 0012 — The lesson canvas: typed blocks, one renderer

**Status:** Accepted
**Extends:** [ADR 0010](0010-lesson-studio.md)

## Context

The studio's instruction stage was a textarea, one paragraph per line. That is
enough to prove the versioning and authorization rules, and not enough to build a
lesson with. A teacher designing a lesson needs to place a worked comparison in a
table, mark the one sentence that comes back later, define a term where a student
can find it again, put a diagram beside the paragraph that explains it, and drop
the video in at the moment it helps rather than at the bottom of the stage.

The obvious move — a rich-text field — is the wrong one. Arbitrary HTML from an
author is a sanitisation problem, an accessibility problem, and a consistency
problem: two authors produce two different-looking lessons, and neither is
required to supply the alternative text or the transcript that makes the lesson
reachable by the whole class.

## Decision

**The instruction stage is an ordered list of typed blocks.** Eight kinds:
`heading`, `text`, `callout`, `list`, `definition`, `table`, `image`, `video`.
An author places, edits, reorders, and removes them one at a time; each operation
is a transactional, idempotent, audited write like every other consequential
write in the product.

### Each kind carries what stops it excluding a reader

Validation is the product here, not paperwork.

- An **image** cannot be saved without alternative text. An image without it is
  simply missing for part of the class.
- A **video** block references a video already attached to the lesson, so the
  transcript that was required at attach time travels with it. It cannot
  reference another lesson's video — enforced in the domain and by a trigger.
- A **table** is squared against its own headings on write, so a row can never
  have more cells than there are columns to read them under.
- A **callout** has four tones, and only one is warm. `memory` means what amber
  means everywhere else in Beyond.Ed: something to hold on to and retrieve later
  (CLAUDE.md §13). It renders with the words "Remember this — it comes back", so
  the tone reinforces the label rather than carrying it.

### One renderer, two audiences

`lib/design/lesson-blocks.tsx` draws the canvas for the student's lesson and for
the author's preview. The studio shows the two side by side: the block list on
the left, what the student reads on the right. Neither is a mock-up, and there is
no second styling of the same content to drift out of step.

### Blocks replaced `instruction`; they did not join it

`AuthoredLesson.instruction: string[]` became `AuthoredLesson.blocks:
LessonBlock[]`, and `LessonContent.instruction` is now `LessonBlock[]`. Keeping
both would mean two places a paragraph could live and two chances for a lesson to
render half of itself. The six demo lessons were converted; two of them use the
richer kinds so the canvas is exercised by the demo rather than only described.

In Postgres this is `lesson_blocks` (migration 0007) rather than another `jsonb`
column, because the studio edits one block at a time and each edit is a row
operation with its own audit event. It reuses `lesson_is_editable`, so the
draft-only rule cannot drift apart from the rest of a lesson's content.

`authored_lessons.instruction` is left in place. Dropping a column is a
destructive change and needs its own approved expand-migrate-contract plan
(CLAUDE.md §2). Nothing reads it.

## Consequences

- A lesson is readiness-complete only once its canvas has blocks, and only once
  every image on it has alternative text. Both appear in the studio's checklist
  as results, not as rules to remember.
- A video attached but not placed still renders below the canvas in the student's
  lesson. A video a student cannot reach is a lesson they were not given.
- Reordering is idempotent per position: the move's key includes where the block
  currently sits, so a double click moves it once and a deliberate second move
  moves it again.
- The block kinds are a closed set. Adding one means a migration, a renderer
  case, a studio field group, and a validation rule — which is the cost of every
  block kind rendering the same way everywhere it appears.
