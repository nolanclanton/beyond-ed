# ADR 0005 — Assessment items and instruction are demo content, and say so

**Status:** Accepted
**Date:** 2026-08-21

## Context

The blueprint specifies the ten-stage lesson structure, the evidence each lesson
requires, and the Exit Ticket decision bands. It does not supply assessment
items or instructional text — reasonably, since those are the curriculum
author's work.

Without items there is no Exit Ticket, no evidence, no mastery estimate, no
recommendation, and no intervention loop: the beta would be a set of empty
frames. With unlabelled invented items, the build would be passing off
unreviewed content as curriculum, which CLAUDE.md §14 forbids.

## Decision

Demo content exists, is confined to two clearly-marked files, and is labelled
everywhere it is rendered.

1. **`lib/db/demo-items.ts`** holds 73 assessment items and
   **`lib/db/demo-lesson-content.ts`** holds instructional text for six lessons.
   Both open with a banner stating they are demonstration content that no
   curriculum author has reviewed or adopted.

2. **Items are aligned to real standard codes** taken from the generated
   catalog, and their error codes come from the blueprint's own error families
   (§9 for mathematics; the "typical trigger" column of Appendix E for English,
   science, and social science). The structure is real even though the content
   is not adopted.

3. **Every surface that renders it says so.** The lesson player shows a
   "Demonstration content" banner separating what comes from the curriculum
   record — standards, assessment id, linked support — from what was written for
   the demo.

4. **A lesson without a bank says that, and disables its Exit Ticket.** It does
   not fabricate a score, and it does not hide the stage. `submitExitTicket`
   refuses on the server as well, so the honesty is not merely a UI decision.
   This is the §12 "no dead controls" rule applied to missing content rather
   than to missing code.

5. **Seeded history uses assessment identifiers from the blueprint**, e.g.
   `A-M6-U1-L1#2`, rather than inventing item ids that look authored.

## Consequences

- The full loop — lesson, Spiral Review, Exit Ticket, band decision, evidence,
  recommendation, teacher decision, support, readiness check, transfer check,
  return — is reviewable end to end on six lessons across four subjects.
- Everywhere else, the reviewer sees the curriculum record and an explicit
  statement that instruction has not been authored. That is an accurate picture
  of where the product actually is.
- When real items arrive, they replace these files. Nothing in `/lib` outside
  `lib/db/` imports them, so the swap does not touch the domain logic.
