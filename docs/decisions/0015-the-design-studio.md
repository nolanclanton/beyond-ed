# ADR 0015 — The design studio: laying a lesson out

**Status:** Accepted
**Date:** 2026-08-26

## Context

ADR 0010 gave the studio a way to *write* a lesson and ADR 0012 gave it a
canvas, but the canvas was one flat list belonging to a single stage. Every
element an author placed — paragraph, callout, table, image, video, material —
landed in stage 5, Instruction. There was nowhere to put a diagram in the worked
model or a photograph in the introduction, and nowhere to see the lesson as a
whole while arranging it.

The owner asked for a full design studio: click into the different parts of a
lesson, add text, video, and images, arrange them within each part, and change
their order — the way a slide editor lets you place objects into parts of a deck
and link them together.

## Decisions

### 1. An element names the part of the lesson it belongs to

`LessonBlock` gains `section`, one of seven values matching the writable stages
of the fixed ten-stage lesson:

| Section | Stage |
|---|---|
| `notes` | 1. Notes record |
| `relevance` | 3. Introduction and relevance |
| `goal` | 4. Goal and success criteria |
| `instruction` | 5. Instruction |
| `worked_model` | 6. Worked model |
| `guided_practice` | 7. Guided practice |
| `independent` | 8. Independent application |

**Stages 2, 9, and 10 are absent, deliberately.** Spiral Review, the Exit
Ticket, and the next-step decision are produced by rule from stored evidence and
authored items (CLAUDE.md §8). Free-form content composed into them would put an
advancement decision partly on material the recommendation engine cannot read.
They are built in the quiz, not laid out.

**Reading order stays lesson-wide.** One ordered list per lesson; a section's
order is that list filtered to the section. That is one ordering to keep
straight rather than seven, and it leaves the `unique (authored_lesson_id,
position)` constraint from migration 0007 exactly as it was. Migration 0026 adds
the column with a `'instruction'` default, which restates what every existing
row already meant rather than guessing at it. (It was written as 0021; the
hosted database already had a 0021 — `my_roles_only` — so it was renumbered
before being applied. See ADR 0016.)

Two consequences follow from the ordering choice, and both are enforced in the
domain rather than left to the UI:

- **Moving an element moves it within its own section.** The arrow finds the
  nearest neighbour *in the same section*, not the adjacent array index. One
  arrow press must never silently reorder two stages against each other.
- **Moving an element to another section re-places it at the end of that
  section.** Leaving it at its old index would drop it into the middle of a
  stage nobody chose, which is the kind of surprise that makes an author stop
  trusting the canvas.

### 2. Composed elements sit alongside the script, never replace it

The typed script keeps its fields. The worked model's steps carry reasoning, and
guided practice carries a prompt, a fading hint, and an answer — the product
reads all of it. A free-form replacement would be a lesson the engine cannot act
on.

So each stage renders its script contribution and then its composed elements
(instruction is the exception: it is composed in full, and the script's
vocabulary list follows). The studio shows the script contribution above the
canvas for the part being edited, so an author is laying out a whole stage
rather than half of one.

### 3. Selection lives in the URL, not in client state

`?part=<section>&el=<blockId>`. Choosing a part or an element is a link.

This is what makes the studio keyboard reachable and screen-reader legible
without building a focus-management layer, and it means a reload, a back button,
or a link sent to a colleague all land on the exact thing being discussed. An
unknown `part` falls back to instruction rather than 404-ing: a stale bookmark
should land somewhere useful.

### 4. The canvas is the student's renderer

Each element is drawn by `LessonBlocks` — the same component the lesson player
uses — inside a frame carrying its position, its kind, and its controls. There
is no design-time drawing of a lesson that can drift from what a class meets,
which is the same reason ADR 0010 gave for the original side-by-side preview.

### 5. Placing an asset links it; it does not copy it

A video or material block holds a reference to something already attached to the
lesson. The studio's library lists what is attached, how many times each is
placed, and places one into the current part in a click. The transcript on a
video and the purpose and access note on a material therefore travel with every
placement, and editing the asset once changes it everywhere.

The unplaced sweep on the student's lesson now reads every section rather than
only instruction — a video placed in the worked model is placed, and listing it
again as unreached would show the student the same thing twice.

### 6. Opening a draft version is its own page

`Open a new draft version` was a disclosure toggle on the studio home. It is now
a link to `/org/curriculum/build/new`, which states what opening a version does
before it does it — it starts empty, running sections are unaffected, it reaches
students only on publication, and it is audited — opens it, and links straight
into the version. Existing drafts are listed beside the form so someone who
meant to keep working does not open a second version by accident.

## Consequences

- A curriculum author lays a lesson out part by part, adds text, headings,
  images, video, materials, callouts, lists, tables, and key terms into any of
  the seven writable stages, and reorders them within a stage.
- The lesson workbench keeps the script, the media, and the quiz, and summarises
  the layout with a link into the studio. Laying out and writing are two jobs
  and now have two pages.
- Every studio write is the same validated, transactional, audited server action
  as before; the audit event records the section on both sides of a change.
- Migration 0026 (written as 0021) was **applied to the hosted database on
  2026-08-27**, with approval, alongside the design studio's own migrations.
- Not built: drag-and-drop reordering, and multi-element selection. Arrow moves
  are accessible and complete; pointer dragging would be an addition on top of a
  working keyboard path, not a replacement for it.
