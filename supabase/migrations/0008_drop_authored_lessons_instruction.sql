-- ============================================================================
-- 0008 — Contract: drop authored_lessons.instruction
-- ============================================================================
--
-- DESTRUCTIVE. Approved by the repository owner on 2026-08-24, after the lesson
-- canvas in migration 0007 replaced this column (ADR 0012). CLAUDE.md §2
-- requires a written plan, an approval, a reversible expand-migrate-contract
-- sequence, and a verification query. All four are below.
--
-- ---------------------------------------------------------------------------
-- The plan
-- ---------------------------------------------------------------------------
--
--   EXPAND   0007 added `lesson_blocks`, with its own RLS policies, its own
--            draft-only trigger, and a shape that can hold everything the old
--            column held (a paragraph is a block of kind 'text').
--
--   MIGRATE  This migration copies any remaining `instruction` text into
--            `lesson_blocks` BEFORE dropping anything, appending after whatever
--            blocks a lesson already has so nothing is overwritten and the
--            reading order of existing content does not move. It is idempotent:
--            re-running it copies nothing, because the column is gone.
--
--   CONTRACT This migration then drops the column.
--
-- What is affected: `public.authored_lessons.instruction`, a `text[]` on draft
-- lesson content. Rows affected in this project: zero — migrations 0006 and
-- 0007 define the authoring tables and have not been applied to the hosted
-- project, and the beta runs on an in-memory store (ADR 0002). The copy step is
-- written anyway, because a migration that only works on an empty table is not
-- a migration.
--
-- Reversibility: adding the column back is one statement, but the ARRAY it held
-- is not reconstructible from blocks once an author has edited them. The copy
-- step is what makes the content survivable; the column shape does not.
--
-- No evidence, audit event, or grade record is touched. Nothing in this file
-- reads or writes an append-only table.
--
-- ---------------------------------------------------------------------------
-- Migrate
-- ---------------------------------------------------------------------------

do $$
declare
  moved integer;
begin
  -- Skip cleanly if an earlier run already contracted the column.
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'authored_lessons'
      and column_name = 'instruction'
  ) then
    raise notice '0008: authored_lessons.instruction is already gone; nothing to move.';
    return;
  end if;

  with existing as (
    select authored_lesson_id, coalesce(max(position), -1) as last_position
    from public.lesson_blocks
    group by authored_lesson_id
  ),
  paragraphs as (
    select
      l.id                                          as authored_lesson_id,
      coalesce(e.last_position, -1) + p.ordinality  as position,
      p.paragraph                                   as body,
      l.updated_by                                  as added_by
    from public.authored_lessons l
    left join existing e on e.authored_lesson_id = l.id
    cross join lateral unnest(l.instruction) with ordinality as p(paragraph, ordinality)
    where btrim(p.paragraph) <> ''
  )
  insert into public.lesson_blocks
    (authored_lesson_id, position, kind, body, added_by)
  select authored_lesson_id, position::smallint, 'text', body, added_by
  from paragraphs;

  get diagnostics moved = row_count;
  raise notice '0008: moved % instruction paragraphs onto the lesson canvas.', moved;
end
$$;

-- ---------------------------------------------------------------------------
-- Verify — must return zero rows before the drop below is allowed to stand
-- ---------------------------------------------------------------------------
--
--   select l.id, array_length(l.instruction, 1) as paragraphs,
--          count(b.id) filter (where b.kind = 'text') as text_blocks
--   from public.authored_lessons l
--   left join public.lesson_blocks b on b.authored_lesson_id = l.id
--   where array_length(l.instruction, 1) > 0
--   group by l.id, l.instruction
--   having count(b.id) filter (where b.kind = 'text') < array_length(l.instruction, 1);
--
-- Run it after the `do` block and before committing. Any row it returns is a
-- lesson whose paragraphs did not all arrive on the canvas.

-- ---------------------------------------------------------------------------
-- Contract
-- ---------------------------------------------------------------------------

alter table public.authored_lessons drop column if exists instruction;
