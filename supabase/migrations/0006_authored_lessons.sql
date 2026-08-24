-- ============================================================================
-- 0006 — Authored lesson content: script, video, and quiz items
-- ============================================================================
--
-- What a curriculum author builds in the studio, stored against a course
-- VERSION. That relationship is the whole design: a roster section keeps the
-- version it was created with, so publishing new content cannot change what a
-- running class is being taught and cannot alter prior evidence (CLAUDE.md §7).
--
-- `lesson_code` is the catalog's stable identifier. Nothing here creates a
-- lesson or changes a day allocation, so the 135 + 40 = 175 contract is
-- untouched by authoring.
--
-- Content is writable only while its version is a draft. That is enforced in
-- two places on purpose: the RLS policies in `/supabase/policies` express it,
-- and a trigger raises regardless of how the write arrives.
--
-- Forward-only, as always: this adds tables and never edits an applied
-- migration.

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------

create type public.item_purpose as enum (
  'exit_ticket', 'spiral_review', 'readiness_check', 'transfer_check'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.authored_lessons (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations (id),
  course_version_id  uuid not null references public.course_versions (id),
  -- Stable catalog identifier, e.g. 'M6-U1-L2'. Never regenerated on edit.
  lesson_code        text not null,

  relevance          text not null default '',
  goal               text not null default '',
  success_criteria   text[] not null default '{}',
  instruction        text[] not null default '{}',
  vocabulary         jsonb not null default '[]'::jsonb,
  worked_model       jsonb not null default '[]'::jsonb,
  guided_practice    jsonb not null default '[]'::jsonb,
  independent_task   text not null default '',
  notes_outline      text[] not null default '{}',

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  updated_by         uuid not null references public.users (id),

  unique (course_version_id, lesson_code)
);
create index on public.authored_lessons (course_version_id);

create table public.lesson_videos (
  id                  uuid primary key default gen_random_uuid(),
  authored_lesson_id  uuid not null references public.authored_lessons (id),
  title               text not null check (length(btrim(title)) > 0),
  -- Only 'url' today: file storage is not provisioned in this build, so the
  -- lesson holds the address of a video rather than the file. The column exists
  -- so a storage-backed source can be added without a rewrite.
  source              text not null default 'url' check (source in ('url')),
  url                 text not null check (url ~ '^https?://'),
  minutes             smallint check (minutes is null or minutes between 0 and 600),
  -- Required. A video without a transcript is a lesson some students cannot
  -- take (CLAUDE.md §12).
  transcript          text not null check (length(btrim(transcript)) > 0),
  captions_url        text check (captions_url is null or captions_url ~ '^https?://'),
  added_at            timestamptz not null default now(),
  added_by            uuid not null references public.users (id)
);
create index on public.lesson_videos (authored_lesson_id);

create table public.lesson_items (
  id                  uuid primary key default gen_random_uuid(),
  authored_lesson_id  uuid not null references public.authored_lessons (id),
  purpose             public.item_purpose not null,
  -- Must be primary coverage for the lesson. The catalog is the authority on
  -- which standards those are, so the check lives in
  -- `lib/curriculum/lesson-authoring.ts` and is covered by tests.
  standard            text not null check (length(btrim(standard)) > 0),
  skill               text not null check (length(btrim(skill)) > 0),
  stem                text not null check (length(btrim(stem)) >= 8),
  -- [{ id, text, error_code }] — error_code is null on the correct choice and
  -- required on every other, so a wrong answer is a diagnosis, not a mark.
  choices             jsonb not null
                        check (jsonb_array_length(choices) between 2 and 6),
  correct_choice_id   text not null,
  rationale           text not null check (length(btrim(rationale)) > 0),
  added_at            timestamptz not null default now(),
  added_by            uuid not null references public.users (id)
);
create index on public.lesson_items (authored_lesson_id);

-- ---------------------------------------------------------------------------
-- The draft rule, as functions the policies and the trigger both use
-- ---------------------------------------------------------------------------

create or replace function public.version_is_draft(version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.course_versions v
    where v.id = version_id and v.status = 'draft'
  );
$$;

create or replace function public.lesson_is_editable(lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.authored_lessons l
    join public.course_versions v on v.id = l.course_version_id
    where l.id = lesson_id
      and l.org_id = public.current_org()
      and v.status = 'draft'
  ) and public.is_curriculum_author();
$$;

-- These are called by policies, not by clients. PostgREST exposes everything in
-- `public` as an RPC endpoint, so revoke the HTTP-facing grants (see 0005).
revoke execute on function public.version_is_draft(uuid) from public, anon, authenticated;
revoke execute on function public.lesson_is_editable(uuid) from public, anon, authenticated;

/**
 * The draft rule, enforced regardless of how a write arrives.
 *
 * The policies already express it, but a service-role job or a future trigger
 * would bypass RLS. Content that can be edited after publication would break
 * the guarantee that a historical result reproduces from the curriculum in
 * force at the time, so this raises instead.
 */
create or replace function public.reject_non_draft_content()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_version uuid;
  version_status public.curriculum_status;
begin
  if tg_table_name = 'authored_lessons' then
    target_version := coalesce(new.course_version_id, old.course_version_id);
  else
    select l.course_version_id into target_version
    from public.authored_lessons l
    where l.id = coalesce(new.authored_lesson_id, old.authored_lesson_id);
  end if;

  select v.status into version_status
  from public.course_versions v
  where v.id = target_version;

  if version_status is distinct from 'draft' then
    raise exception
      'Lesson content is editable only while its course version is a draft (version is %).',
      coalesce(version_status::text, 'missing');
  end if;

  return coalesce(new, old);
end;
$$;

create trigger authored_lessons_draft_only
  before insert or update or delete on public.authored_lessons
  for each row execute function public.reject_non_draft_content();

create trigger lesson_videos_draft_only
  before insert or update or delete on public.lesson_videos
  for each row execute function public.reject_non_draft_content();

create trigger lesson_items_draft_only
  before insert or update or delete on public.lesson_items
  for each row execute function public.reject_non_draft_content();

-- ---------------------------------------------------------------------------
-- Row-level security (from policies/authored_lessons.sql)
-- ---------------------------------------------------------------------------

alter table public.authored_lessons enable row level security;
alter table public.lesson_videos    enable row level security;
alter table public.lesson_items     enable row level security;

create policy authored_lessons_select_own_org
  on public.authored_lessons for select
  using (org_id = public.current_org());

create policy lesson_videos_select_own_org
  on public.lesson_videos for select
  using (
    exists (
      select 1 from public.authored_lessons l
      where l.id = authored_lesson_id and l.org_id = public.current_org()
    )
  );

create policy lesson_items_select_own_org
  on public.lesson_items for select
  using (
    exists (
      select 1 from public.authored_lessons l
      where l.id = authored_lesson_id and l.org_id = public.current_org()
    )
  );

create policy authored_lessons_write_author_draft
  on public.authored_lessons for all
  using (
    org_id = public.current_org()
    and public.is_curriculum_author()
    and public.version_is_draft(course_version_id)
  )
  with check (
    org_id = public.current_org()
    and public.is_curriculum_author()
    and public.version_is_draft(course_version_id)
  );

create policy lesson_videos_write_author_draft
  on public.lesson_videos for all
  using (public.lesson_is_editable(authored_lesson_id))
  with check (public.lesson_is_editable(authored_lesson_id));

create policy lesson_items_write_author_draft
  on public.lesson_items for all
  using (public.lesson_is_editable(authored_lesson_id))
  with check (public.lesson_is_editable(authored_lesson_id));
