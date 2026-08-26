-- ============================================================================
-- 0011 — Course structure: sequence, framing, and the foundation map
-- ============================================================================
--
-- What a curriculum author adapts about a COURSE, as opposed to what they write
-- inside a lesson (ADR 0013).
--
-- The curriculum architecture workbook is the baseline and stays immutable:
-- `pnpm catalog` ingests it into `lib/curriculum/data/` and nothing writes back
-- (CLAUDE.md §7, §14). These tables hold only the DIFFERENCE — the order a
-- version runs its units and lessons in, the framing a unit is taught under,
-- and how hard each foundation link binds. A version nobody has adapted has no
-- row here at all, so a later catalog rebuild flows straight through.
--
-- Scoping the override to a course version is the safety property. A roster
-- section keeps the `course_version_id` it was created with, so re-sequencing
-- cannot reorder a class already running, and cannot change the structure a
-- historical calculation resolved against.
--
-- Three tables rather than jsonb on one, for the reason migration 0007 gives
-- for the lesson canvas: the studio edits ONE thing at a time — move a unit,
-- reorder a unit's lessons, re-frame a unit, weight one link, retire one link.
-- Each is a row operation with its own audit event, and each is subject to the
-- same draft rule.
--
-- Forward-only. This adds tables and touches no existing one.

-- ---------------------------------------------------------------------------
-- The override row
-- ---------------------------------------------------------------------------

create table public.course_structures (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations (id),
  course_version_id  uuid not null references public.course_versions (id),
  -- The catalog's stable course identifier, e.g. 'MATH-06'. Never derived from
  -- the title, and never regenerated.
  course_id          text not null check (length(btrim(course_id)) > 0),
  -- Unit ids in the order this version runs them. NULL means "unchanged from
  -- the workbook" — the baseline is never copied in.
  unit_order         text[],

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  updated_by         uuid not null references public.users (id),

  -- One override per version. Two would be two answers to the same question.
  unique (course_version_id)
);
create index on public.course_structures (org_id);

-- ---------------------------------------------------------------------------
-- Per-unit overrides: lesson order, and framing
-- ---------------------------------------------------------------------------
--
-- Both are facts about one unit inside one version, edited a unit at a time, so
-- they share a row. Each is independently nullable: a unit may be re-sequenced
-- without being re-framed, and the other way round.
--
-- `lesson_codes` is deliberately not a foreign key. Lesson codes come from the
-- workbook, which the database does not hold — the catalog is generated into
-- the application, and the integrity check that a version's sequence still
-- names the same lesson set as the current workbook is
-- `structureIntegrity()` in `lib/curriculum/structure.ts`, which reports a
-- divergence and blocks publication rather than repairing it silently.

create table public.course_structure_units (
  id                    uuid primary key default gen_random_uuid(),
  course_structure_id   uuid not null references public.course_structures (id) on delete cascade,
  -- The catalog's stable unit identifier. Never regenerated on edit.
  unit_id               text not null check (length(btrim(unit_id)) > 0),

  -- Lesson codes in the order this version runs them within the unit. NULL
  -- means unchanged. A lesson moves only WITHIN its unit, so a unit keeps its
  -- lesson count and the 135 + 40 = 175 contract cannot drift (ADR 0013).
  lesson_codes          text[],

  -- The framing this version teaches the unit under. NULL means unchanged.
  title                 text check (title is null or length(btrim(title)) >= 3),
  essential_question    text check (essential_question is null
                                    or length(btrim(essential_question)) >= 8),

  changed_at            timestamptz not null default now(),
  changed_by            uuid not null references public.users (id),

  unique (course_structure_id, unit_id),

  -- A row that overrides nothing is not an override.
  constraint course_structure_units_says_something check (
    lesson_codes is not null
    or title is not null
    or essential_question is not null
  ),

  -- Framing is one statement: a title with no question, or a question with no
  -- title, is half a change and students see the other half from the workbook.
  constraint course_structure_units_framing_is_whole check (
    (title is null) = (essential_question is null)
  )
);
create index on public.course_structure_units (course_structure_id);

-- ---------------------------------------------------------------------------
-- The foundation map
-- ---------------------------------------------------------------------------
--
-- The workbook already records that a lesson names six pieces of prior
-- learning, and what ROLE each plays. What it does not record is how hard each
-- one binds — whether a student can start the lesson without it. That is a
-- judgement from evidence and teaching, it changes between cohorts, and it is
-- the only thing stored here.
--
-- `importance` is NULL until a governor sets it, and NULL means exactly what it
-- says: not yet governed. The product never shows an invented number in its
-- place (CLAUDE.md §14).
--
-- `removed` retires a workbook link for this version; it does not delete one.
-- The baseline stays readable and the reason is on the audit event, which is
-- what removal means everywhere in this system (CLAUDE.md §6).

create table public.course_structure_foundations (
  id                   uuid primary key default gen_random_uuid(),
  course_structure_id  uuid not null references public.course_structures (id) on delete cascade,
  -- The lesson that depends on something.
  lesson_code          text not null check (length(btrim(lesson_code)) > 0),
  -- A lesson code in the same course, or an intervention support id.
  target_id            text not null check (length(btrim(target_id)) > 0),

  removed              boolean not null default false,
  -- 1 helpful background … 5 required progression. 4 and above is what the
  -- product means by "foundational".
  importance           smallint check (importance is null or importance between 1 and 5),
  note                 text not null default '',

  changed_at           timestamptz not null default now(),
  changed_by           uuid not null references public.users (id),

  unique (course_structure_id, lesson_code, target_id),

  -- A lesson is not its own prior learning. The two rules that actually matter
  -- — a foundation runs BEFORE the lesson that needs it, and a support can
  -- return a student INTO this course — are checked in
  -- `lib/curriculum/foundations.ts`, because both need the catalog and the
  -- intervention bank, which live in the application. Both are re-checked as a
  -- publication gate, and both have tests.
  constraint course_structure_foundations_not_self check (target_id <> lesson_code)
);
create index on public.course_structure_foundations (course_structure_id, lesson_code);

-- ---------------------------------------------------------------------------
-- The draft rule
-- ---------------------------------------------------------------------------

create or replace function public.structure_is_editable(structure_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.course_structures s
    join public.course_versions v on v.id = s.course_version_id
    where s.id = structure_id
      and s.org_id = public.current_org()
      and v.status = 'draft'
  ) and public.is_curriculum_author();
$$;

/**
 * The draft rule, enforced regardless of how a write arrives.
 *
 * The policies express it, but a service-role job bypasses RLS. A sequence that
 * could change after publication would break the guarantee that a historical
 * result reproduces from the curriculum in force at the time, so this raises.
 */
create or replace function public.reject_non_draft_structure()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_version uuid;
  version_status public.curriculum_status;
begin
  if tg_table_name = 'course_structures' then
    target_version := coalesce(new.course_version_id, old.course_version_id);
  else
    select s.course_version_id into target_version
    from public.course_structures s
    where s.id = coalesce(new.course_structure_id, old.course_structure_id);
  end if;

  select v.status into version_status
  from public.course_versions v
  where v.id = target_version;

  if version_status is distinct from 'draft' then
    raise exception
      'A course''s structure is editable only while its version is a draft (version is %).',
      coalesce(version_status::text, 'missing');
  end if;

  return coalesce(new, old);
end;
$$;

create trigger course_structures_draft_only
  before insert or update or delete on public.course_structures
  for each row execute function public.reject_non_draft_structure();

create trigger course_structure_units_draft_only
  before insert or update or delete on public.course_structure_units
  for each row execute function public.reject_non_draft_structure();

create trigger course_structure_foundations_draft_only
  before insert or update or delete on public.course_structure_foundations
  for each row execute function public.reject_non_draft_structure();

-- Policy helpers, not client endpoints (see 0005).
revoke execute on function public.structure_is_editable(uuid)     from public, anon, authenticated;
revoke execute on function public.reject_non_draft_structure()    from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security (from policies/course_structures.sql)
-- ---------------------------------------------------------------------------

alter table public.course_structures            enable row level security;
alter table public.course_structure_units       enable row level security;
alter table public.course_structure_foundations enable row level security;

create policy course_structures_select_own_org
  on public.course_structures for select
  using (org_id = public.current_org());

create policy course_structure_units_select_own_org
  on public.course_structure_units for select
  using (
    exists (
      select 1 from public.course_structures s
      where s.id = course_structure_id and s.org_id = public.current_org()
    )
  );

create policy course_structure_foundations_select_own_org
  on public.course_structure_foundations for select
  using (
    exists (
      select 1 from public.course_structures s
      where s.id = course_structure_id and s.org_id = public.current_org()
    )
  );

create policy course_structures_write_author_draft
  on public.course_structures for all
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

create policy course_structure_units_write_author_draft
  on public.course_structure_units for all
  using (public.structure_is_editable(course_structure_id))
  with check (public.structure_is_editable(course_structure_id));

create policy course_structure_foundations_write_author_draft
  on public.course_structure_foundations for all
  using (public.structure_is_editable(course_structure_id))
  with check (public.structure_is_editable(course_structure_id));

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--
-- Must return zero rows: an override attached to a version that is not a draft.
--
--   select s.id, v.course_title, v.version, v.status
--   from public.course_structures s
--   join public.course_versions v on v.id = s.course_version_id
--   where v.status <> 'draft';
--
-- And zero rows: a foundation weighted outside 1–5, or a retired link that also
-- carries a weight nobody can act on.
--
--   select f.id, f.lesson_code, f.target_id, f.importance, f.removed
--   from public.course_structure_foundations f
--   where f.importance is not null and f.importance not between 1 and 5;
