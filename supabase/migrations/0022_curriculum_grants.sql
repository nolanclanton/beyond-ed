-- ============================================================================
-- 0022 — What a curriculum author may DO
-- ============================================================================
--
-- `users.curriculum_author` says a person may build curriculum at all. It does
-- not say whether they may approve someone else's work, publish it, or decide
-- which design-assistance capabilities the organization has. Before the design
-- studio those were the same question; they are not the same question any more
-- (ADR 0016, vision §7).
--
-- Three grants, checked independently of role and independently of each other:
--
--   author         create and edit drafts, duplicate narratives, use approved
--                  assistance, submit work for review
--   reviewer       approve, return, and publish work SOMEBODY ELSE wrote
--   administrator  official templates, and which capabilities exist
--
-- The separation is the product. A teacher may hold `author` without becoming a
-- site administrator, and an organization administrator holds none of these
-- unless somebody granted them: seniority is not a curriculum grant
-- (CLAUDE.md §3).
--
-- NOT DESTRUCTIVE. One nullable column is added and nothing is dropped,
-- renamed, or retyped. NULL is meaningful and is the whole compatibility story:
-- it means "whatever `curriculum_author` alone implied", which is `author`. An
-- account provisioned before this migration keeps exactly the access it had,
-- and `curriculumGrantsOf()` in `lib/auth/scope.ts` resolves it in one place so
-- the application and the policies cannot disagree.
--
-- Forward-only. No backfill is needed or wanted: writing 'author' into every
-- existing row would claim somebody decided that, and nobody did.

create type public.curriculum_grant as enum (
  'author',
  'reviewer',
  'administrator'
);

alter table public.users
  add column if not exists curriculum_grants public.curriculum_grant[];

comment on column public.users.curriculum_grants is
  'What this person may do with curriculum. NULL means "whatever curriculum_author alone implied", which is {author}. Empty is read the same way, never as "everything".';

-- A grant list on somebody who cannot author curriculum at all is a
-- contradiction: it would read as authority nobody actually holds.
alter table public.users
  add constraint users_grants_need_authoring
  check (curriculum_grants is null or curriculum_author = true);

-- ---------------------------------------------------------------------------
-- Policy helpers
-- ---------------------------------------------------------------------------
--
-- The application-layer mirror of these is `lib/auth/scope.ts`. Both resolve
-- NULL the same way, in one place each, so an account that predates this
-- migration is treated identically by the database and by the interface.

create or replace function public.curriculum_grants_of(target uuid)
returns public.curriculum_grant[]
language sql stable security definer set search_path = public
as $$
  select case
    when not coalesce((select curriculum_author from public.users where id = target), false)
      then '{}'::public.curriculum_grant[]
    when coalesce(
      array_length((select curriculum_grants from public.users where id = target), 1),
      0
    ) = 0
      then array['author']::public.curriculum_grant[]
    else (select curriculum_grants from public.users where id = target)
  end;
$$;

create or replace function public.is_curriculum_reviewer()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.curriculum_grants_of(auth.uid())
         && array['reviewer', 'administrator']::public.curriculum_grant[];
$$;

create or replace function public.is_curriculum_administrator()
returns boolean
language sql stable security definer set search_path = public
as $$
  select 'administrator'::public.curriculum_grant
         = any (public.curriculum_grants_of(auth.uid()));
$$;

-- Policy helpers, not client endpoints (see 0005). `authenticated` needs
-- EXECUTE because the policies below run as the caller (see 0018); `public` and
-- `anon` do not.
revoke execute on function public.curriculum_grants_of(uuid)   from public, anon, authenticated;
revoke execute on function public.is_curriculum_reviewer()     from public, anon, authenticated;
revoke execute on function public.is_curriculum_administrator() from public, anon, authenticated;

grant execute on function public.curriculum_grants_of(uuid)    to authenticated;
grant execute on function public.is_curriculum_reviewer()      to authenticated;
grant execute on function public.is_curriculum_administrator() to authenticated;

-- NOTE: the grant on `curriculum_grants_of(uuid)` above was a mistake and is
-- revoked by migration 0027. It is left here because this migration has been
-- applied and migrations are forward-only (CLAUDE.md §2) — the file records what
-- ran, and the correction is its own migration.

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--
-- Must return zero rows: a grant list on somebody who cannot author.
--
--   select id, curriculum_author, curriculum_grants
--   from public.users
--   where curriculum_grants is not null and curriculum_author = false;
--
-- And the distribution afterwards. Every pre-existing author should be NULL,
-- which reads as {author}:
--
--   select curriculum_grants, count(*)
--   from public.users
--   where curriculum_author = true
--   group by curriculum_grants;
--
-- And the resolver agrees with the application for every author:
--
--   select id, curriculum_grants, public.curriculum_grants_of(id)
--   from public.users
--   where curriculum_author = true;
