-- ============================================================================
-- 0009 — Lesson materials
-- ============================================================================
--
-- The things a student opens alongside the lesson: a reading, a worksheet, a
-- deck, a data set, a reference sheet, a physical object to fetch.
--
-- The same shape as `lesson_videos` (migration 0006), and for the same reasons.
-- A material is attached to the lesson ONCE and then placed on the canvas by
-- reference, so the same file is never described twice and its two descriptions
-- cannot drift apart. The address is stored rather than the file, because
-- storage is not provisioned in this build (ADR 0002); `source` exists so a
-- storage-backed origin can be added without a rewrite.
--
-- Two columns are required that a naive schema would leave optional, and both
-- are the product rather than paperwork:
--
--   `purpose`     what the student DOES with it. A link with no task attached
--                 is noise on a page someone is trying to work through.
--   `access_note` the format, and the way in for a student who cannot open that
--                 format. This is the same rule that makes `alt` required on an
--                 image block: a material in one format only is a lesson some
--                 students cannot take (CLAUDE.md §12).
--
-- Forward-only. This adds a table and one enum value; it edits nothing applied.

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------

create type public.lesson_material_kind as enum (
  'reading', 'worksheet', 'slides', 'dataset', 'reference', 'manipulative'
);

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table public.lesson_materials (
  id                  uuid primary key default gen_random_uuid(),
  authored_lesson_id  uuid not null references public.authored_lessons (id),
  kind                public.lesson_material_kind not null,
  title               text not null check (length(btrim(title)) > 0),
  -- Only 'url' today, exactly as lesson_videos.source.
  source              text not null default 'url' check (source in ('url')),
  url                 text not null check (url ~ '^https?://'),
  -- Required: what the student does with it.
  purpose             text not null check (length(btrim(purpose)) > 0),
  -- Required: the format, and how a student who cannot open it gets the same
  -- content.
  access_note         text not null check (length(btrim(access_note)) > 0),
  minutes             smallint check (minutes is null or minutes between 0 and 600),
  added_at            timestamptz not null default now(),
  added_by            uuid not null references public.users (id),

  -- The studio refuses a second copy of the same address on one lesson; the
  -- constraint is here so a write that skips the studio meets the same rule.
  unique (authored_lesson_id, url)
);
create index on public.lesson_materials (authored_lesson_id);

-- The draft rule, same as the rest of a lesson's content (migration 0006).
-- `reject_non_draft_content` resolves the version through `authored_lesson_id`,
-- which this table has, so it needs no new function.
create trigger lesson_materials_draft_only
  before insert or update or delete on public.lesson_materials
  for each row execute function public.reject_non_draft_content();

-- ---------------------------------------------------------------------------
-- Row-level security (from policies/lesson_materials.sql)
-- ---------------------------------------------------------------------------

alter table public.lesson_materials enable row level security;

create policy lesson_materials_select_own_org
  on public.lesson_materials for select
  using (
    exists (
      select 1 from public.authored_lessons l
      where l.id = authored_lesson_id and l.org_id = public.current_org()
    )
  );

create policy lesson_materials_write_author_draft
  on public.lesson_materials for all
  using (public.lesson_is_editable(authored_lesson_id))
  with check (public.lesson_is_editable(authored_lesson_id));

-- ---------------------------------------------------------------------------
-- The canvas gains a material block — declared here, wired in 0010
-- ---------------------------------------------------------------------------
--
-- `alter type … add value` may run inside a transaction on PostgreSQL 12 and
-- later, but the new label cannot be USED in the same transaction that adds it.
-- The block column, its shape constraint, and its same-lesson trigger all
-- belong with the label, so they live in migration 0010 — and 0010 compares
-- `kind::text` rather than the enum label, so it stays correct even if a runner
-- applies both files in one transaction. Two files for readability; the cast is
-- what makes the ordering safe.

alter type public.lesson_block_kind add value if not exists 'material';
