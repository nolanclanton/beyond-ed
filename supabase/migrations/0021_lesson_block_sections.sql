-- ============================================================================
-- 0021 — Which part of the lesson an element sits in
-- ============================================================================
--
-- 0007 gave a lesson a canvas, and every block on it was stage 5: instruction.
-- A lesson has seven parts a person actually writes, and an author needs a
-- diagram in the worked model and a photograph in the introduction, not
-- everything piled into one stage. This adds the column that says which.
--
-- Reading order stays lesson-wide. `position` remains dense and unique across
-- the whole lesson, and a section's order is that order filtered to the
-- section — one ordering to keep straight rather than seven, and no rewrite of
-- the unique constraint 0007 already established.
--
-- Not destructive. It adds one NOT NULL column with a default that is correct
-- for every existing row: before this migration a block could only ever be
-- instruction, so backfilling 'instruction' restates what the data already
-- meant rather than guessing at it. No column is dropped, renamed, or
-- retyped, and nothing here touches evidence, audit events, or grade records
-- (CLAUDE.md §2, §5, §6).
--
-- The enum covers stages 1, 3, 4, 5, 6, 7, and 8 only. Spiral Review (2), the
-- Exit Ticket (9), and the next-step decision (10) are produced by rule from
-- stored evidence and authored items (CLAUDE.md §8); composing free-form
-- content into them would put an advancement decision partly on material the
-- recommendation engine cannot read.

create type public.lesson_section as enum (
  'notes',
  'relevance',
  'goal',
  'instruction',
  'worked_model',
  'guided_practice',
  'independent'
);

alter table public.lesson_blocks
  add column if not exists section public.lesson_section
    not null default 'instruction';

-- The studio reads one section at a time, in order.
create index if not exists lesson_blocks_section_idx
  on public.lesson_blocks (authored_lesson_id, section, position);

comment on column public.lesson_blocks.section is
  'Which of the seven writable lesson stages this element is composed into. Reading order within a section is `position`, filtered to the section.';

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--
-- Every existing block keeps the meaning it had. Must return zero rows:
--
--   select id, section from public.lesson_blocks where section is null;
--
-- And the distribution after the backfill — every pre-existing row should be
-- 'instruction':
--
--   select section, count(*) from public.lesson_blocks group by section;
