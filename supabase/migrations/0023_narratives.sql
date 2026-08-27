-- ============================================================================
-- 0023 — Narratives: the story world a unit is taught inside
-- ============================================================================
--
-- A designer builds the world ONCE and then writes many lessons in it without
-- restating the characters, the aesthetic, the prior events, or the rules every
-- time (ADR 0016, vision §4).
--
-- ---------------------------------------------------------------------------
-- Why this does not hang off a course version
-- ---------------------------------------------------------------------------
--
-- Every other authoring table in this schema references `course_versions`,
-- because lesson content belongs to the version it will be published in. A
-- narrative does not. It is reusable across courses and DUPLICATED rather than
-- shared, so binding it to a version would make the Narrative Bank impossible
-- and would drag story edits into the publication lifecycle of a course that
-- merely references it.
--
-- What joins the two is a beat naming a catalog `lesson_code` — a soft
-- reference, deliberately not a foreign key, for the same reason
-- `course_structure_units.lesson_codes` is not one: lesson codes come from the
-- curriculum architecture workbook, which the database does not hold.
-- Re-sequencing a course moves the lesson without breaking the story, and a
-- narrative reused in another course simply has beats that match nothing there
-- yet.
--
-- ---------------------------------------------------------------------------
-- Normalised, not jsonb
-- ---------------------------------------------------------------------------
--
-- Same reason migration 0007 gives for the lesson canvas: the studio edits ONE
-- thing at a time — a character, a location, a chapter, a beat, a thread — and
-- each edit is a row operation with its own audit event. A jsonb column would
-- make every one of those a whole-document rewrite, and two people editing two
-- different characters would overwrite each other.
--
-- Forward-only. This adds tables and touches no existing one.

create type public.narrative_status as enum (
  'draft',
  'in_review',
  'approved_template',
  'published',
  'archived'
);

create type public.story_arc_stage as enum (
  'opening',
  'rising_action',
  'turning_point',
  'complication',
  'climax',
  'resolution'
);

create type public.plot_thread_kind as enum (
  'question',
  'clue',
  'objective',
  'conflict',
  'reveal'
);

create type public.asset_aspect_ratio as enum (
  '1:1', '3:2', '4:3', '16:9', '9:16', '21:9'
);

-- ---------------------------------------------------------------------------
-- The narrative itself
-- ---------------------------------------------------------------------------

create table public.narratives (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations (id),
  status            public.narrative_status not null default 'draft',

  -- An official Beyond.Ed template, as opposed to one a district or a person
  -- made. Only a curriculum administrator sets it, so the label means something
  -- in the bank.
  official          boolean not null default false,

  title             text not null check (length(btrim(title)) > 0),
  premise           text not null default '',
  subject           text not null default '',
  -- The catalog's stable course identifier, e.g. 'MATH-06'. Nullable: a
  -- narrative reused across courses belongs to none of them.
  course_id         text,
  unit_ids          text[] not null default '{}',
  genre             text not null default '',
  tone              text not null default '',
  grade_band        text not null default '',
  audience          text not null default '',
  keywords          text[] not null default '{}',

  -- World
  world_place            text not null default '',
  world_period           text not null default '',
  world_technology_level text not null default '',
  world_rules            text[] not null default '{}',
  world_constraints      text[] not null default '{}',

  -- Central problem
  problem_challenge     text not null default '',
  problem_stakes        text not null default '',
  problem_objective     text not null default '',
  problem_student_role  text not null default '',

  -- Narrative state. Canon: nothing generated may change it, and a proposal
  -- that contradicts it is surfaced as a conflict rather than applied.
  state_happened         text[] not null default '{}',
  state_students_know    text[] not null default '{}',
  state_clues_revealed   text[] not null default '{}',
  state_current_objective text not null default '',
  -- Reveals that must NOT appear yet. Sent to the assistant as a hold-back list.
  state_future_reveals   text[] not null default '{}',

  -- Visual bible: the constraints an image must satisfy to belong to this unit.
  visual_art_direction       text not null default '',
  visual_tone                text not null default '',
  visual_palette             text not null default '',
  visual_interface_treatment text not null default '',
  visual_recurring_props     text[] not null default '{}',
  visual_motifs              text[] not null default '{}',
  visual_symbols             text[] not null default '{}',
  visual_default_ratio       public.asset_aspect_ratio not null default '16:9',
  visual_text_in_images      text not null default '',
  visual_accessibility_rules text[] not null default '{}',
  visual_age_appropriateness text not null default '',

  -- Content boundaries. A constraint the assistant is never told about is a
  -- constraint it will break.
  bound_must_stay_consistent text[] not null default '{}',
  bound_avoid                text[] not null default '{}',
  bound_required_framing     text[] not null default '{}',

  -- Duplication provenance (vision §17). Set once, at creation, and never
  -- changed: the copy records where it came from, and neither record can reach
  -- the other afterwards. ON DELETE is absent on purpose — nothing in this
  -- system is hard-deleted, so a source cannot disappear from under a copy.
  based_on_narrative_id uuid references public.narratives (id),
  reuse_count           integer not null default 0 check (reuse_count >= 0),

  owner_user_id     uuid not null references public.users (id),

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by        uuid not null references public.users (id),

  -- A narrative cannot be based on itself.
  check (based_on_narrative_id is distinct from id)
);
create index on public.narratives (org_id);
create index on public.narratives (owner_user_id);
create index on public.narratives (based_on_narrative_id);

-- The Narrative Bank filters on these, so they are indexed rather than scanned.
create index narratives_bank_idx on public.narratives (org_id, status, subject, genre);
create index narratives_course_idx on public.narratives (org_id, course_id);
create index narratives_updated_idx on public.narratives (org_id, updated_at desc);

-- Free-text search over the fields the bank searches. A trigram index rather
-- than full text: a designer typing "cyber" wants every narrative with that
-- substring, in a stable order, and a relevance model that returned a different
-- set on Tuesday would make the bank untrustworthy.
create extension if not exists pg_trgm;
create index narratives_search_idx on public.narratives
  using gin ((title || ' ' || premise || ' ' || subject || ' ' || genre) gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Sharing: edit access, never ownership
-- ---------------------------------------------------------------------------
--
-- Only the owner writes rows here — enforced in the domain and by the policy
-- below — because a sharer who could re-share would make the owner's list grow
-- without the owner deciding.

create table public.narrative_shares (
  narrative_id uuid not null references public.narratives (id) on delete cascade,
  user_id      uuid not null references public.users (id),
  granted_at   timestamptz not null default now(),
  primary key (narrative_id, user_id)
);
create index on public.narrative_shares (user_id);

-- ---------------------------------------------------------------------------
-- Characters
-- ---------------------------------------------------------------------------
--
-- `knows` is the field that makes continuity work: a character who has not been
-- told something cannot mention it, and a scene written without that fact in
-- front of the designer is the scene that breaks the story.

create table public.narrative_characters (
  id            uuid primary key default gen_random_uuid(),
  narrative_id  uuid not null references public.narratives (id) on delete cascade,
  name          text not null check (length(btrim(name)) > 0),
  role          text not null default '',
  personality   text not null default '',
  motivation    text not null default '',
  relationships text not null default '',
  appearance    text not null default '',
  knows         text not null default '',
  arc           text not null default '',
  -- Reference artwork, once a person has accepted some. Set null rather than
  -- cascading: losing the portrait must not lose the character.
  asset_id      uuid,
  created_at    timestamptz not null default now()
);
create index on public.narrative_characters (narrative_id);

-- ---------------------------------------------------------------------------
-- Locations
-- ---------------------------------------------------------------------------

create table public.narrative_locations (
  id               uuid primary key default gen_random_uuid(),
  narrative_id     uuid not null references public.narratives (id) on delete cascade,
  name             text not null check (length(btrim(name)) > 0),
  description      text not null default '',
  significance     text not null default '',
  -- Light, materials, scale, mood — what an image of it must get right.
  visual_reference text not null default '',
  created_at       timestamptz not null default now()
);
create index on public.narrative_locations (narrative_id);

-- ---------------------------------------------------------------------------
-- Story arc
-- ---------------------------------------------------------------------------

create table public.narrative_arc_moments (
  id           uuid primary key default gen_random_uuid(),
  narrative_id uuid not null references public.narratives (id) on delete cascade,
  stage        public.story_arc_stage not null,
  summary      text not null check (length(btrim(summary)) > 0),
  position     integer not null,
  created_at   timestamptz not null default now(),
  unique (narrative_id, position)
);
create index on public.narrative_arc_moments (narrative_id, position);

-- ---------------------------------------------------------------------------
-- Chapters and beats
-- ---------------------------------------------------------------------------

create table public.narrative_chapters (
  id           uuid primary key default gen_random_uuid(),
  narrative_id uuid not null references public.narratives (id) on delete cascade,
  title        text not null check (length(btrim(title)) > 0),
  summary      text not null default '',
  -- The catalog unit this chapter runs alongside. Soft, like lesson_code below.
  unit_id      text,
  position     integer not null,
  created_at   timestamptz not null default now(),
  unique (narrative_id, position)
);
create index on public.narrative_chapters (narrative_id, position);

-- One lesson's place in the story.
--
-- The three text fields sit side by side on purpose. `academic_objective` is
-- what the student learns; `narrative_event` is what happens in the story;
-- `learning_unlock` is the sentence that joins them — what learning the
-- objective lets the student DO. A beat with an empty unlock is a story bolted
-- onto a lesson rather than one that needs it, and the studio says so rather
-- than pretending otherwise.
create table public.narrative_beats (
  id                 uuid primary key default gen_random_uuid(),
  chapter_id         uuid not null references public.narrative_chapters (id) on delete cascade,
  -- Catalog lesson code. NOT a foreign key: the catalog is generated into the
  -- application from the workbook, not held here.
  lesson_code        text,
  academic_objective text not null default '',
  narrative_event    text not null check (length(btrim(narrative_event)) > 0),
  learning_unlock    text not null default '',
  position           integer not null,
  created_at         timestamptz not null default now(),
  unique (chapter_id, position)
);
create index on public.narrative_beats (chapter_id, position);
create index on public.narrative_beats (lesson_code);

-- One lesson sits at ONE point in the story. Two beats on the same lesson would
-- make the lesson workshop show one of two stories, chosen by whichever row
-- came back first.
create or replace function public.narrative_of_chapter(chapter uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select narrative_id from public.narrative_chapters where id = chapter;
$$;

create unique index narrative_beats_one_per_lesson_idx
  on public.narrative_beats (public.narrative_of_chapter(chapter_id), lesson_code)
  where lesson_code is not null;

-- ---------------------------------------------------------------------------
-- Plot threads
-- ---------------------------------------------------------------------------

create table public.narrative_plot_threads (
  id                     uuid primary key default gen_random_uuid(),
  narrative_id           uuid not null references public.narratives (id) on delete cascade,
  kind                   public.plot_thread_kind not null,
  summary                text not null check (length(btrim(summary)) > 0),
  -- Set null when the chapter goes: a thread that pointed at a removed chapter
  -- is open again, not broken.
  opened_in_chapter_id   uuid references public.narrative_chapters (id) on delete set null,
  resolved_in_chapter_id uuid references public.narrative_chapters (id) on delete set null,
  resolved               boolean not null default false,
  note                   text not null default '',
  created_at             timestamptz not null default now(),

  -- A thread resolved nowhere is still open. "Resolved" with no chapter is a
  -- claim nobody can check against the story.
  check (resolved = false or resolved_in_chapter_id is not null)
);
create index on public.narrative_plot_threads (narrative_id, resolved);

-- ---------------------------------------------------------------------------
-- Versions: deliberate checkpoints, not autosaves
-- ---------------------------------------------------------------------------
--
-- Ordinary edits are already recorded in `audit_events`. A VERSION is a person
-- saying "keep this one, I can come back to it", and it carries whether the
-- assistant was involved in producing what is being kept (vision §21).
--
-- The snapshot IS jsonb here, unlike the live tables — a version is read whole
-- and never edited a field at a time, which is the exact opposite of the
-- working record and so wants the opposite shape.

create table public.narrative_versions (
  id           uuid primary key default gen_random_uuid(),
  narrative_id uuid not null references public.narratives (id) on delete cascade,
  label        text not null check (length(btrim(label)) > 0),
  note         text not null default '',
  snapshot     jsonb not null,
  ai_assisted  boolean not null default false,
  created_at   timestamptz not null default now(),
  created_by   uuid not null references public.users (id)
);
create index on public.narrative_versions (narrative_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Only a draft is editable
-- ---------------------------------------------------------------------------
--
-- A narrative in review must read the same on the reviewer's screen as it did
-- when it was sent, and a narrative other people have duplicated must not change
-- out from under the provenance those copies state.
--
-- Enforced twice, as with lesson content in 0006: in the policy, and by a
-- trigger, so a write that arrives another way still meets it.

create or replace function public.narrative_is_editable(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.narratives n
    where n.id = target
      and n.org_id = public.current_org()
      and n.status = 'draft'
      and public.is_curriculum_author()
      and (
        n.owner_user_id = auth.uid()
        or exists (
          select 1 from public.narrative_shares s
          where s.narrative_id = n.id and s.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.reject_non_draft_narrative()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  target uuid;
  narrative_status public.narrative_status;
begin
  target := case tg_table_name
    when 'narrative_beats' then
      public.narrative_of_chapter(coalesce(new.chapter_id, old.chapter_id))
    else coalesce(new.narrative_id, old.narrative_id)
  end;

  select n.status into narrative_status
  from public.narratives n
  where n.id = target;

  if narrative_status is distinct from 'draft' then
    raise exception
      'A narrative is editable only while it is a draft (it is %).',
      coalesce(narrative_status::text, 'missing');
  end if;

  return coalesce(new, old);
end;
$$;

create trigger narrative_characters_draft_only
  before insert or update or delete on public.narrative_characters
  for each row execute function public.reject_non_draft_narrative();

create trigger narrative_locations_draft_only
  before insert or update or delete on public.narrative_locations
  for each row execute function public.reject_non_draft_narrative();

create trigger narrative_arc_moments_draft_only
  before insert or update or delete on public.narrative_arc_moments
  for each row execute function public.reject_non_draft_narrative();

create trigger narrative_chapters_draft_only
  before insert or update or delete on public.narrative_chapters
  for each row execute function public.reject_non_draft_narrative();

create trigger narrative_beats_draft_only
  before insert or update or delete on public.narrative_beats
  for each row execute function public.reject_non_draft_narrative();

create trigger narrative_plot_threads_draft_only
  before insert or update or delete on public.narrative_plot_threads
  for each row execute function public.reject_non_draft_narrative();

-- Provenance is written once and never changed. A copy that could be re-pointed
-- at a different source would be a copy whose stated history is a guess.
create or replace function public.reject_provenance_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.based_on_narrative_id is distinct from old.based_on_narrative_id then
    raise exception
      'A narrative''s provenance is set when it is created and never changed.';
  end if;
  return new;
end;
$$;

create trigger narratives_provenance_immutable
  before update on public.narratives
  for each row execute function public.reject_provenance_change();

-- Policy helpers, not client endpoints (see 0005, 0018).
revoke execute on function public.narrative_is_editable(uuid)      from public, anon, authenticated;
revoke execute on function public.narrative_of_chapter(uuid)       from public, anon, authenticated;
revoke execute on function public.reject_non_draft_narrative()     from public, anon, authenticated;
revoke execute on function public.reject_provenance_change()       from public, anon, authenticated;

grant execute on function public.narrative_is_editable(uuid) to authenticated;
grant execute on function public.narrative_of_chapter(uuid)  to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security (from policies/narratives.sql)
-- ---------------------------------------------------------------------------

alter table public.narratives             enable row level security;
alter table public.narrative_shares       enable row level security;
alter table public.narrative_characters   enable row level security;
alter table public.narrative_locations    enable row level security;
alter table public.narrative_arc_moments  enable row level security;
alter table public.narrative_chapters     enable row level security;
alter table public.narrative_beats        enable row level security;
alter table public.narrative_plot_threads enable row level security;
alter table public.narrative_versions     enable row level security;

-- READS. Organization-wide by design: a bank nobody can browse is not a bank,
-- and narratives carry no student data, so reading one exposes nothing about a
-- person. Drafts are the exception — an unfinished story is working state,
-- visible to its owner and to whoever it was shared with.
create or replace function public.narrative_is_readable(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.narratives n
    where n.id = target
      and n.org_id = public.current_org()
      and (
        n.status <> 'draft'
        or n.owner_user_id = auth.uid()
        or exists (
          select 1 from public.narrative_shares s
          where s.narrative_id = n.id and s.user_id = auth.uid()
        )
      )
  );
$$;
revoke execute on function public.narrative_is_readable(uuid) from public, anon, authenticated;
grant execute on function public.narrative_is_readable(uuid) to authenticated;

create policy narratives_select_readable
  on public.narratives for select
  using (public.narrative_is_readable(id));

create policy narratives_insert_author
  on public.narratives for insert
  with check (
    org_id = public.current_org()
    and public.is_curriculum_author()
    and owner_user_id = auth.uid()
    and status = 'draft'
    and official = false
  );

-- Updating covers both editing a draft and moving the status. The domain
-- decides which transitions are legal and who may make them; the policy's job
-- is that only somebody with a stake in this narrative can attempt one at all.
create policy narratives_update_stakeholder
  on public.narratives for all
  using (
    org_id = public.current_org()
    and public.is_curriculum_author()
    and (
      owner_user_id = auth.uid()
      or public.is_curriculum_reviewer()
      or exists (
        select 1 from public.narrative_shares s
        where s.narrative_id = id and s.user_id = auth.uid()
      )
    )
  )
  with check (
    org_id = public.current_org()
    and public.is_curriculum_author()
    -- Only an administrator marks something official, whatever else they hold.
    and (official = false or public.is_curriculum_administrator())
  );

-- Sharing is the owner's alone. A sharer who could re-share would make the
-- owner's list grow without the owner deciding.
create policy narrative_shares_select_own_org
  on public.narrative_shares for select
  using (public.narrative_is_readable(narrative_id));

create policy narrative_shares_write_owner
  on public.narrative_shares for all
  using (
    exists (
      select 1 from public.narratives n
      where n.id = narrative_id
        and n.org_id = public.current_org()
        and n.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.narratives n
      where n.id = narrative_id
        and n.org_id = public.current_org()
        and n.owner_user_id = auth.uid()
    )
    -- Sharing with somebody who cannot author curriculum would give them a page
    -- they cannot use.
    and coalesce((select curriculum_author from public.users u where u.id = user_id), false)
  );

-- Nested records read with the narrative and write only while it is a draft.
create policy narrative_characters_select
  on public.narrative_characters for select
  using (public.narrative_is_readable(narrative_id));
create policy narrative_characters_write
  on public.narrative_characters for all
  using (public.narrative_is_editable(narrative_id))
  with check (public.narrative_is_editable(narrative_id));

create policy narrative_locations_select
  on public.narrative_locations for select
  using (public.narrative_is_readable(narrative_id));
create policy narrative_locations_write
  on public.narrative_locations for all
  using (public.narrative_is_editable(narrative_id))
  with check (public.narrative_is_editable(narrative_id));

create policy narrative_arc_moments_select
  on public.narrative_arc_moments for select
  using (public.narrative_is_readable(narrative_id));
create policy narrative_arc_moments_write
  on public.narrative_arc_moments for all
  using (public.narrative_is_editable(narrative_id))
  with check (public.narrative_is_editable(narrative_id));

create policy narrative_chapters_select
  on public.narrative_chapters for select
  using (public.narrative_is_readable(narrative_id));
create policy narrative_chapters_write
  on public.narrative_chapters for all
  using (public.narrative_is_editable(narrative_id))
  with check (public.narrative_is_editable(narrative_id));

create policy narrative_beats_select
  on public.narrative_beats for select
  using (public.narrative_is_readable(public.narrative_of_chapter(chapter_id)));
create policy narrative_beats_write
  on public.narrative_beats for all
  using (public.narrative_is_editable(public.narrative_of_chapter(chapter_id)))
  with check (public.narrative_is_editable(public.narrative_of_chapter(chapter_id)));

create policy narrative_plot_threads_select
  on public.narrative_plot_threads for select
  using (public.narrative_is_readable(narrative_id));
create policy narrative_plot_threads_write
  on public.narrative_plot_threads for all
  using (public.narrative_is_editable(narrative_id))
  with check (public.narrative_is_editable(narrative_id));

-- A saved version is a record of a moment. It is written by whoever may edit
-- the narrative, read by whoever may read it, and never updated: rewriting a
-- checkpoint would make the history it exists to preserve unreliable.
create policy narrative_versions_select
  on public.narrative_versions for select
  using (public.narrative_is_readable(narrative_id));

create policy narrative_versions_insert
  on public.narrative_versions for insert
  with check (
    public.narrative_is_editable(narrative_id) and created_by = auth.uid()
  );

create trigger narrative_versions_immutable
  before update or delete on public.narrative_versions
  for each row execute function public.reject_mutation();

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--
-- Must return zero rows: a narrative based on itself.
--
--   select id from public.narratives where based_on_narrative_id = id;
--
-- Zero rows: two beats claiming the same lesson in the same narrative.
--
--   select public.narrative_of_chapter(b.chapter_id) as narrative_id,
--          b.lesson_code, count(*)
--   from public.narrative_beats b
--   where b.lesson_code is not null
--   group by 1, 2
--   having count(*) > 1;
--
-- Zero rows: a thread marked resolved with no chapter resolving it.
--
--   select id from public.narrative_plot_threads
--   where resolved = true and resolved_in_chapter_id is null;
--
-- Zero rows: an official template that is still a draft.
--
--   select id, title from public.narratives
--   where official = true and status = 'draft';
--
-- Zero rows: a share granted to somebody who cannot author curriculum.
--
--   select s.narrative_id, s.user_id
--   from public.narrative_shares s
--   join public.users u on u.id = s.user_id
--   where u.curriculum_author = false;
