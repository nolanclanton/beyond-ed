-- ============================================================================
-- 0010 — The material block
-- ============================================================================
--
-- Wires the `material` block kind that 0009 added to `lesson_block_kind` into
-- `lesson_blocks`, so a curriculum author can place a reading or a worksheet on
-- the canvas at the point in the lesson where the student needs it.
--
-- This is the video block's exact shape: the block holds a reference, and the
-- material it references must be attached to the SAME lesson, so what the
-- material is for and how else to get it always travel with it.
--
-- Not destructive. It adds a nullable column, and it replaces one CHECK
-- constraint with a strictly more permissive one — every row that satisfied the
-- old constraint satisfies the new one, so no data can fail the swap and none
-- is rewritten. No column is dropped, renamed, or retyped, and nothing here
-- touches evidence, audit events, or grade records (CLAUDE.md §2, §5, §6).
--
-- ---------------------------------------------------------------------------
-- Why this compares `kind::text` rather than the enum label
-- ---------------------------------------------------------------------------
--
-- 0009 added 'material' to `lesson_block_kind`. PostgreSQL refuses to USE an
-- enum label in the same transaction that added it, so a constraint written as
-- `case kind when 'material' …` would fail if a migration runner ever applied
-- 0009 and 0010 inside one transaction — which is exactly the kind of thing
-- that differs between `supabase db push`, `supabase start`, and a hand-run
-- psql session.
--
-- Casting the column to text makes every branch a plain string comparison, so
-- this file is correct whichever way it is applied, and the two migrations do
-- not have to be committed separately to be safe. The cast is not a
-- micro-optimisation to remove later: it is what makes the ordering guarantee
-- unnecessary.

-- ---------------------------------------------------------------------------
-- Column
-- ---------------------------------------------------------------------------

alter table public.lesson_blocks
  add column if not exists material_id uuid references public.lesson_materials (id);

-- ---------------------------------------------------------------------------
-- Shape
-- ---------------------------------------------------------------------------
--
-- Recreated rather than added to, because a CHECK cannot be extended in place.
--
-- The `else false` at the end is a correction, not a new rule. The 0007
-- constraint had no ELSE branch, so a `case` over an unhandled kind evaluated
-- to NULL — and a CHECK constraint that evaluates to NULL PASSES. Any block
-- kind added to the enum after 0007 would therefore have been accepted with no
-- shape requirement at all, silently. Adding 'material' in 0009 is the first
-- time that could have bitten; the ELSE closes it for every future kind too.

alter table public.lesson_blocks drop constraint lesson_blocks_shape;

alter table public.lesson_blocks add constraint lesson_blocks_shape check (
  case kind::text
    when 'heading'    then length(btrim(body)) > 0
    when 'text'       then length(btrim(body)) > 0
    when 'callout'    then length(btrim(body)) > 0 and tone is not null
    when 'list'       then array_length(items, 1) >= 1
    when 'definition' then length(btrim(term)) > 0 and length(btrim(meaning)) > 0
    when 'table'      then array_length(headers, 1) >= 1
                           and jsonb_array_length(rows) >= 1
    when 'image'      then url is not null and length(btrim(alt)) > 0
    when 'video'      then video_id is not null
    when 'material'   then material_id is not null
    else false
  end
);

-- ---------------------------------------------------------------------------
-- A material block references a material on its own lesson
-- ---------------------------------------------------------------------------
--
-- Same rule and same reasoning as `reject_foreign_lesson_video` in 0007: a
-- cross-lesson reference would put a file in front of a student that their
-- lesson never attached, without the purpose and access note that make it
-- usable.

create or replace function public.reject_foreign_lesson_material()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.kind::text = 'material' and not exists (
    select 1 from public.lesson_materials m
    where m.id = new.material_id and m.authored_lesson_id = new.authored_lesson_id
  ) then
    raise exception
      'A material block must reference a material attached to the same lesson.';
  end if;
  return new;
end;
$$;

create trigger lesson_blocks_own_material
  before insert or update on public.lesson_blocks
  for each row execute function public.reject_foreign_lesson_material();

-- ---------------------------------------------------------------------------
-- Detaching a material the canvas still places
-- ---------------------------------------------------------------------------
--
-- `lesson_materials.id` is referenced by `lesson_blocks.material_id`, so the
-- foreign key already refuses the delete — but it refuses it with a constraint
-- name, which tells an author nothing about what to do next. This says it in
-- the words the studio says it in.

create or replace function public.reject_placed_material_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  placements integer;
begin
  select count(*) into placements
  from public.lesson_blocks b
  where b.material_id = old.id;

  if placements > 0 then
    raise exception
      'The canvas places this material % time(s). Remove the block(s) first — detaching it here would leave the lesson pointing at something that is no longer there.',
      placements;
  end if;

  return old;
end;
$$;

create trigger lesson_materials_not_placed
  before delete on public.lesson_materials
  for each row execute function public.reject_placed_material_delete();

-- The same guard for video, which 0007 left to the foreign key alone.
create or replace function public.reject_placed_video_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  placements integer;
begin
  select count(*) into placements
  from public.lesson_blocks b
  where b.video_id = old.id;

  if placements > 0 then
    raise exception
      'The canvas places this video % time(s). Remove the block(s) first — detaching it here would leave the lesson with a gap where a student expects the video.',
      placements;
  end if;

  return old;
end;
$$;

create trigger lesson_videos_not_placed
  before delete on public.lesson_videos
  for each row execute function public.reject_placed_video_delete();

-- Policy helpers, not client endpoints. PostgREST exposes everything in
-- `public` as an RPC, so the HTTP-facing grants come off (see 0005).
revoke execute on function public.reject_foreign_lesson_material() from public, anon, authenticated;
revoke execute on function public.reject_placed_material_delete()  from public, anon, authenticated;
revoke execute on function public.reject_placed_video_delete()     from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--
-- Must return zero rows: a material block with no material, or one pointing at
-- a material attached to a different lesson.
--
--   select b.id, b.authored_lesson_id, b.material_id
--   from public.lesson_blocks b
--   left join public.lesson_materials m
--     on m.id = b.material_id and m.authored_lesson_id = b.authored_lesson_id
--   where b.kind = 'material' and m.id is null;
