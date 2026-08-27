-- ============================================================================
-- 0024 — The asset library, and the record of every assisted operation
-- ============================================================================
--
-- Two tables that belong together because they are the two halves of the same
-- guarantee: nothing generated becomes curriculum without a person, and every
-- request is accounted for whether or not it did (ADR 0016; CLAUDE.md §10.2).
--
-- Forward-only. This adds tables and touches no existing one.

create type public.asset_kind as enum (
  'hero',
  'character',
  'environment',
  'diagram',
  'map',
  'mission_brief',
  'case_file',
  'artifact',
  'interface',
  'infographic',
  'chapter_cover',
  'background'
);

create type public.asset_status as enum ('candidate', 'accepted', 'rejected');

create type public.asset_source as enum ('url', 'generated');

create type public.ai_generation_status as enum (
  'proposed',
  'accepted',
  'accepted_edited',
  -- An advisory result a person read. A review, a misconception list, and a
  -- narrative summary commit nothing by design, so calling them 'rejected'
  -- would make the usage figures read as if designers were turning down work
  -- they had in fact acted on.
  'acknowledged',
  'rejected',
  'failed'
);

-- ---------------------------------------------------------------------------
-- The asset library
-- ---------------------------------------------------------------------------
--
-- A candidate is a proposal; an accepted asset is curriculum. Nothing renders a
-- candidate into a lesson, and the check constraint below is the reason that
-- split is trustworthy rather than a convention: an accepted asset without
-- alternative text cannot exist, because a picture without it is simply missing
-- for part of the class (CLAUDE.md §12).
--
-- Alternative text is NOT required to propose one. Demanding it before the
-- designer has seen the candidate would be asking them to describe an image
-- that does not exist yet.

create table public.narrative_assets (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id),
  -- Nullable: an asset that belongs to no narrative belongs to the lesson it
  -- was made for. Set null rather than cascading — losing a narrative must not
  -- silently remove artwork a published lesson places.
  narrative_id   uuid references public.narratives (id) on delete set null,
  -- Catalog lesson code, soft like every other reference to one.
  lesson_code    text,
  kind           public.asset_kind not null,
  title          text not null check (length(btrim(title)) > 0),
  -- What the picture must show. The designer's brief, never the model's.
  brief          text not null default '',
  alt            text not null default '',
  aspect_ratio   public.asset_aspect_ratio not null default '16:9',
  source         public.asset_source not null,
  -- Where it lives. A designer-supplied address, or a data URI until Supabase
  -- Storage is provisioned for generated images (ADR 0002).
  url            text not null check (length(btrim(url)) > 0),
  -- Set when the image was proposed by the assistant.
  generation_id  uuid,
  status         public.asset_status not null default 'candidate',
  -- Counted on the write that places it, never inferred from a page view: a
  -- usage count derived from reads would drift the moment two people opened the
  -- same lesson (CLAUDE.md §1).
  usage_count    integer not null default 0 check (usage_count >= 0),
  added_at       timestamptz not null default now(),
  added_by       uuid not null references public.users (id),

  -- The gate that makes "accepted" mean something.
  constraint accepted_assets_are_described
    check (status <> 'accepted' or length(btrim(alt)) > 0)
);
create index on public.narrative_assets (org_id, status);
create index on public.narrative_assets (narrative_id);
create index on public.narrative_assets (lesson_code);

-- A decision is made once. Re-deciding a candidate would let an accepted asset
-- silently become a rejected one under a lesson that already places it.
create or replace function public.reject_asset_redecision()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if old.status <> 'candidate' and new.status is distinct from old.status then
    raise exception
      'That candidate has already been decided (%). Its record stays as it is.',
      old.status;
  end if;
  return new;
end;
$$;

create trigger narrative_assets_decided_once
  before update on public.narrative_assets
  for each row execute function public.reject_asset_redecision();

-- ---------------------------------------------------------------------------
-- The AI generation record
-- ---------------------------------------------------------------------------
--
-- One row per bounded operation. Written when a person asks, and RESOLVED when
-- the same person accepts, edits, or rejects the proposal — so the history says
-- not only that the assistant was used, but what became of what it said.
--
-- What is deliberately NOT stored:
--
--   - the assembled context, only the NAMES of the parts that were assembled;
--   - the system instruction, which is a constant in source;
--   - the credential, obviously;
--   - the model's raw response. What matters is what a person did with it, and
--     if they accepted it the content is in the lesson where anyone can read it.
--
-- The designer's own instruction IS kept. It is their words, and a later reader
-- asking "why does this worked example use negative numbers" deserves to see
-- "the author asked for negative numbers".

create table public.ai_generations (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations (id),
  user_id            uuid not null references public.users (id),
  -- A name from the capability registry in lib/ai/capabilities.ts. Deliberately
  -- text rather than an enum: the registry is the authority, the server refuses
  -- anything not in it, and a database enum would need a migration every time a
  -- capability was added or removed.
  capability         text not null check (length(btrim(capability)) > 0),
  model              text not null,
  target_entity      text not null check (
    target_entity in ('authored_lesson', 'narrative', 'narrative_asset')
  ),
  target_id          text not null,
  course_version_id  uuid references public.course_versions (id),
  lesson_code        text,
  narrative_id       uuid references public.narratives (id) on delete set null,
  -- Which lesson stage or narrative element the request was about.
  section_id         text,
  -- Names of the context parts that were assembled. Not their contents.
  context_keys       text[] not null default '{}',
  -- The designer's own instruction, in their words.
  instructions       text not null default '',
  status             public.ai_generation_status not null default 'proposed',
  -- The audit event for the write, once a person accepted the proposal.
  resulting_audit_id uuid references public.audit_events (id),
  input_tokens       integer check (input_tokens >= 0),
  output_tokens      integer check (output_tokens >= 0),
  -- Written for a person to read. Never a stack trace, never a raw API error.
  failure_reason     text,
  requested_at       timestamptz not null default now(),
  resolved_at        timestamptz,

  -- A proposal nobody has decided about has no resolution time, and a decided
  -- one always has. The two fields cannot disagree.
  constraint resolution_is_consistent
    check ((status = 'proposed') = (resolved_at is null))
);
create index on public.ai_generations (org_id, requested_at desc);
create index on public.ai_generations (user_id);
create index on public.ai_generations (course_version_id, lesson_code);
create index on public.ai_generations (narrative_id);
create index on public.ai_generations (org_id, capability);

alter table public.narrative_assets
  add constraint narrative_assets_generation_fk
  foreign key (generation_id) references public.ai_generations (id);

-- A generated asset came from somewhere, and a supplied one did not.
alter table public.narrative_assets
  add constraint generated_assets_cite_their_generation
  check (
    (source = 'generated' and generation_id is not null)
    or (source = 'url' and generation_id is null)
  );

-- A decision is made once here too. A generation that could be re-resolved
-- would let "accepted" become "rejected" after the content was written, which
-- is the one thing this table exists to make impossible.
create or replace function public.reject_generation_reresolution()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if old.status <> 'proposed' and new.status is distinct from old.status then
    raise exception 'That proposal has already been decided (%).', old.status;
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'A generation record cannot change hands.';
  end if;
  return new;
end;
$$;

create trigger ai_generations_decided_once
  before update on public.ai_generations
  for each row execute function public.reject_generation_reresolution();

-- Nothing deletes a generation record. A request that was made was made, and a
-- proposal that was rejected is exactly the case worth keeping.
create trigger ai_generations_no_delete
  before delete on public.ai_generations
  for each row execute function public.reject_mutation();

revoke execute on function public.reject_asset_redecision()        from public, anon, authenticated;
revoke execute on function public.reject_generation_reresolution() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security (from policies/narrative_assets.sql, policies/ai_generations.sql)
-- ---------------------------------------------------------------------------

alter table public.narrative_assets enable row level security;
alter table public.ai_generations   enable row level security;

-- Everyone in the organization reads accepted artwork: a student needs the
-- image their lesson places, and a teacher needs to see what they are teaching.
-- Candidates and rejects are working state, visible to curriculum authors only.
create policy narrative_assets_select_accepted
  on public.narrative_assets for select
  using (
    org_id = public.current_org()
    and (status = 'accepted' or public.is_curriculum_author())
  );

create policy narrative_assets_write_author
  on public.narrative_assets for all
  using (
    org_id = public.current_org()
    and public.is_curriculum_author()
    and (narrative_id is null or public.narrative_is_editable(narrative_id))
  )
  with check (
    org_id = public.current_org()
    and public.is_curriculum_author()
    and (narrative_id is null or public.narrative_is_editable(narrative_id))
  );

-- A generation record is readable by the person who made the request, by a
-- curriculum reviewer inspecting what the assistant contributed to work they
-- are reviewing, and by an organization administrator reading the audit. It is
-- readable by nobody else, and by no student ever.
create policy ai_generations_select_scoped
  on public.ai_generations for select
  using (
    org_id = public.current_org()
    and (
      user_id = auth.uid()
      or public.is_curriculum_reviewer()
      or public.current_role_name() = 'org_admin'
    )
  );

-- A person opens their own record and resolves their own record. Nobody
-- resolves somebody else's proposal: deciding what to do with a suggestion is
-- the job of the person who asked for it.
create policy ai_generations_insert_own
  on public.ai_generations for insert
  with check (
    org_id = public.current_org()
    and public.is_curriculum_author()
    and user_id = auth.uid()
    and status = 'proposed'
    and resulting_audit_id is null
  );

create policy ai_generations_update_own
  on public.ai_generations for update
  using (org_id = public.current_org() and user_id = auth.uid())
  with check (org_id = public.current_org() and user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--
-- Must return zero rows: an accepted asset nobody described.
--
--   select id, title from public.narrative_assets
--   where status = 'accepted' and length(btrim(alt)) = 0;
--
-- Zero rows: a generated asset with no generation behind it, or a supplied one
-- claiming a generation.
--
--   select id, source, generation_id from public.narrative_assets
--   where (source = 'generated') <> (generation_id is not null);
--
-- Zero rows: a decided proposal with no resolution time, or the reverse.
--
--   select id, status, resolved_at from public.ai_generations
--   where (status = 'proposed') <> (resolved_at is null);
--
-- Zero rows: a generation citing a capability that is not in the registry.
-- Run this after any change to lib/ai/capabilities.ts, with the current list:
--
--   select distinct capability from public.ai_generations
--   where capability not in (
--     'brainstorm_narrative_hooks', 'continue_narrative',
--     'summarize_narrative_state', 'create_character_variations',
--     'rewrite_selected_section', 'generate_worked_example',
--     'generate_guided_practice', 'identify_misconceptions',
--     'draft_exit_ticket', 'check_lesson_alignment', 'generate_visual_asset'
--   );
--
-- And the acceptance rate per capability, which is the number worth watching:
-- many requests and few acceptances is a capability that is not working.
--
--   select capability,
--          count(*) as requests,
--          count(*) filter (where status in ('accepted', 'accepted_edited')) as accepted
--   from public.ai_generations
--   group by capability
--   order by requests desc;
