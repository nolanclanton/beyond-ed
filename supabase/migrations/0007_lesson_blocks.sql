-- ============================================================================
-- 0007 — The lesson canvas
-- ============================================================================
--
-- What a curriculum author composes for the instruction stage: an ordered list
-- of typed blocks — paragraphs, headings, callouts, lists, key terms, tables,
-- images, and placements of a video already attached to the lesson.
--
-- A table rather than another jsonb column on `authored_lessons`, because the
-- studio edits ONE block at a time: add, replace, move, remove. Each of those
-- is a row operation with its own audit event, and each is subject to the same
-- draft rule as the rest of a lesson's content.
--
-- Forward-only. `authored_lessons.instruction` is superseded by this table and
-- is left in place: dropping a column is a destructive change and needs its own
-- approved expand-migrate-contract plan (CLAUDE.md §2). New content is written
-- here; nothing reads the old column any more.

create type public.lesson_block_kind as enum (
  'heading', 'text', 'callout', 'list', 'definition', 'table', 'image', 'video'
);

create type public.callout_tone as enum (
  'note', 'important', 'example', 'memory'
);

create table public.lesson_blocks (
  id                  uuid primary key default gen_random_uuid(),
  authored_lesson_id  uuid not null references public.authored_lessons (id),
  -- Reading order within the lesson. Dense and zero-based; a move rewrites the
  -- two rows it swaps.
  position            smallint not null check (position >= 0),
  kind                public.lesson_block_kind not null,

  -- Text-bearing kinds: heading, text, callout.
  body                text not null default '',
  title               text not null default '',
  -- Callout only. 'memory' is the one warm tone, and it means what amber means
  -- everywhere else in the product: something to retrieve later (CLAUDE.md §13).
  tone                public.callout_tone,

  -- list
  ordered             boolean not null default false,
  items               text[] not null default '{}',

  -- definition
  term                text not null default '',
  meaning             text not null default '',

  -- table and image
  caption             text not null default '',
  headers             text[] not null default '{}',
  -- [[cell, …], …] — every row the width of `headers`, enforced on write.
  rows                jsonb not null default '[]'::jsonb,

  -- image
  url                 text default null check (url is null or url ~ '^https?://'),
  -- Required on an image. An image without it is simply missing for part of the
  -- class (CLAUDE.md §12).
  alt                 text not null default '',

  -- video: a video already attached to this same lesson, so its transcript
  -- travels with it.
  video_id            uuid references public.lesson_videos (id),

  added_at            timestamptz not null default now(),
  added_by            uuid not null references public.users (id),

  unique (authored_lesson_id, position) deferrable initially deferred,

  constraint lesson_blocks_shape check (
    case kind
      when 'heading'    then length(btrim(body)) > 0
      when 'text'       then length(btrim(body)) > 0
      when 'callout'    then length(btrim(body)) > 0 and tone is not null
      when 'list'       then array_length(items, 1) >= 1
      when 'definition' then length(btrim(term)) > 0 and length(btrim(meaning)) > 0
      when 'table'      then array_length(headers, 1) >= 1
                             and jsonb_array_length(rows) >= 1
      when 'image'      then url is not null and length(btrim(alt)) > 0
      when 'video'      then video_id is not null
    end
  )
);
create index on public.lesson_blocks (authored_lesson_id, position);

-- A video block may only reference a video on the SAME lesson. A reference
-- across lessons would show a student media their lesson never attached, with
-- no transcript beside it.
create or replace function public.reject_foreign_lesson_video()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.kind = 'video' and not exists (
    select 1 from public.lesson_videos v
    where v.id = new.video_id and v.authored_lesson_id = new.authored_lesson_id
  ) then
    raise exception
      'A video block must reference a video attached to the same lesson.';
  end if;
  return new;
end;
$$;

create trigger lesson_blocks_own_video
  before insert or update on public.lesson_blocks
  for each row execute function public.reject_foreign_lesson_video();

-- The draft rule, same as the rest of a lesson's content (migration 0006).
create trigger lesson_blocks_draft_only
  before insert or update or delete on public.lesson_blocks
  for each row execute function public.reject_non_draft_content();

-- ---------------------------------------------------------------------------
-- Row-level security (from policies/lesson_blocks.sql)
-- ---------------------------------------------------------------------------

alter table public.lesson_blocks enable row level security;

create policy lesson_blocks_select_own_org
  on public.lesson_blocks for select
  using (
    exists (
      select 1 from public.authored_lessons l
      where l.id = authored_lesson_id and l.org_id = public.current_org()
    )
  );

create policy lesson_blocks_write_author_draft
  on public.lesson_blocks for all
  using (public.lesson_is_editable(authored_lesson_id))
  with check (public.lesson_is_editable(authored_lesson_id));
