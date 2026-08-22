-- ============================================================================
-- Beyond.Ed core schema
-- ============================================================================
--
-- Forward-only. To correct a mistake, add a new migration; never edit this one
-- once it has been applied anywhere beyond a local machine (CLAUDE.md §2).
--
-- This is the canonical schema. The beta runs the same record shapes against an
-- in-memory store (ADR 0002) because no Supabase project has been provisioned;
-- `lib/db/types.ts` mirrors the tables below one for one.
--
-- Naming note: these files are numbered rather than timestamped so they are
-- readable in order. Before they are applied to a hosted project a human should
-- create them through `supabase migration new` so they carry the CLI's
-- timestamps, or rename them accordingly.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Organization, sites, people
-- ---------------------------------------------------------------------------

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table public.sites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id),
  name        text not null,
  short_name  text not null,
  created_at  timestamptz not null default now()
);
create index on public.sites (org_id);

create type public.user_role as enum (
  'student', 'teacher', 'site_admin', 'org_admin', 'curriculum_author'
);

-- One row per authenticated person. `id` matches `auth.users.id`, so RLS can
-- compare against `auth.uid()` without a join.
create table public.users (
  id                 uuid primary key references auth.users (id) on delete restrict,
  org_id             uuid not null references public.organizations (id),
  -- Students, teachers, and site admins belong to one site. Org admins and
  -- curriculum authors do not.
  site_id            uuid references public.sites (id),
  first_name         text not null,
  last_name          text not null,
  role               public.user_role not null,
  -- Curriculum authoring is a SEPARATE authorization, not a hierarchy level
  -- (CLAUDE.md §3). A user may hold it alongside any role.
  curriculum_author  boolean not null default false,
  grade_level        smallint check (grade_level between 6 and 12),
  created_at         timestamptz not null default now()
);
create index on public.users (org_id);
create index on public.users (site_id);
create index on public.users (role);

-- ---------------------------------------------------------------------------
-- Curriculum
-- ---------------------------------------------------------------------------

create type public.curriculum_status as enum (
  'draft', 'in_review', 'approved', 'published', 'retired'
);

create table public.course_versions (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id),
  course_title  text not null,
  version       text not null,
  status        public.curriculum_status not null default 'draft',
  published_at  timestamptz,
  retired_at    timestamptz,
  notes         text not null default '',
  created_at    timestamptz not null default now(),
  unique (org_id, course_title, version)
);

create table public.roster_sections (
  id                 uuid primary key default gen_random_uuid(),
  site_id            uuid not null references public.sites (id),
  course_title       text not null,
  -- A roster section references exactly ONE approved course version.
  -- Publishing a successor does not move a running section.
  course_version_id  uuid not null references public.course_versions (id),
  teacher_id         uuid not null references public.users (id),
  period             text not null,
  cycle              smallint not null default 1 check (cycle between 1 and 10),
  day_in_cycle       smallint not null default 1,
  created_at         timestamptz not null default now()
);
create index on public.roster_sections (site_id);
create index on public.roster_sections (teacher_id);

-- ---------------------------------------------------------------------------
-- Enrollment
-- ---------------------------------------------------------------------------

create type public.enrollment_status as enum (
  'pending', 'active', 'transferred', 'withdrawn', 'archived'
);

create table public.enrollments (
  id                              uuid primary key default gen_random_uuid(),
  student_id                      uuid not null references public.users (id),
  section_id                      uuid not null references public.roster_sections (id),
  status                          public.enrollment_status not null default 'pending',
  course_title                    text not null,
  course_version_id               uuid not null references public.course_versions (id),
  started_at                      timestamptz not null default now(),
  -- Set when a transfer preserves pathway state across sites. There is never a
  -- duplicate active enrollment for the same student and course.
  transferred_from_enrollment_id  uuid references public.enrollments (id),
  created_at                      timestamptz not null default now()
);
create index on public.enrollments (student_id);
create index on public.enrollments (section_id);
create unique index enrollments_one_active_per_course
  on public.enrollments (student_id, course_title)
  where status in ('pending', 'active');

-- ---------------------------------------------------------------------------
-- Lesson state
-- ---------------------------------------------------------------------------

create type public.lesson_status as enum (
  'locked', 'available', 'in_progress', 'submitted',
  'passed', 'review_scheduled', 'completed'
);

create table public.lesson_states (
  id             uuid primary key default gen_random_uuid(),
  enrollment_id  uuid not null references public.enrollments (id),
  lesson_code    text not null,
  status         public.lesson_status not null default 'locked',
  stage          smallint not null default 1 check (stage between 1 and 10),
  attempts       smallint not null default 0,
  updated_at     timestamptz not null default now(),
  unique (enrollment_id, lesson_code)
);
create index on public.lesson_states (enrollment_id);

-- ---------------------------------------------------------------------------
-- Evidence ledger — APPEND ONLY (CLAUDE.md §5)
-- ---------------------------------------------------------------------------

create type public.evidence_source as enum (
  'pathway_lesson', 'exit_ticket', 'spiral_review', 'intervention',
  'readiness_check', 'transfer_check', 'teacher_observation', 'proctored'
);

create table public.evidence (
  id                       uuid primary key default gen_random_uuid(),
  student_id               uuid not null references public.users (id),
  enrollment_id            uuid not null references public.enrollments (id),
  -- The version in force when the work happened. Never re-pointed, so a
  -- published curriculum edit cannot alter prior evidence.
  course_version_id        uuid not null references public.course_versions (id),
  lesson_code              text not null,
  stage                    text not null,
  standard                 text,
  skill                    text not null,
  item_id                  text not null,
  correct                  boolean,
  response                 text not null default '',
  error_code               text,
  attempt                  smallint not null default 1,
  hints_used               smallint not null default 0,
  -- Minutes of substantive interaction, not page-open time (CLAUDE.md §5).
  meaningful_minutes       numeric(6,2) not null default 0,
  support_used             text,
  source                   public.evidence_source not null,
  -- Corrections are NEW rows linked to the original, which stays readable.
  supersedes_evidence_id   uuid references public.evidence (id),
  recorded_by_user_id      uuid not null references public.users (id),
  recorded_at              timestamptz not null default now()
);
create index on public.evidence (student_id);
create index on public.evidence (enrollment_id);
create index on public.evidence (skill);
create index on public.evidence (supersedes_evidence_id);

-- The view every read must use. A row is current when no later row supersedes
-- it. Reads resolve supersession EXPLICITLY — never by assuming the latest row
-- wins by accident.
create view public.evidence_current as
select e.*
from public.evidence e
where not exists (
  select 1 from public.evidence s where s.supersedes_evidence_id = e.id
);

-- ---------------------------------------------------------------------------
-- Official gradebook — APPEND ONLY (CLAUDE.md §2, §4)
-- ---------------------------------------------------------------------------
--
-- NEVER derived from, joined to, or blended with mastery. A grade change is a
-- new row that supersedes the previous one; the original stays readable.

create table public.grade_categories (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id),
  course_title  text not null,
  name          text not null,
  weight        numeric(4,3) not null check (weight >= 0 and weight <= 1)
);

create table public.gradebook_configs (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id),
  course_title  text not null,
  rule_version  text not null,
  scale         jsonb not null
);

create table public.grade_records (
  id                    uuid primary key default gen_random_uuid(),
  student_id            uuid not null references public.users (id),
  enrollment_id         uuid not null references public.enrollments (id),
  category_id           uuid not null references public.grade_categories (id),
  assessment_id         text not null,
  lesson_code           text not null,
  points_earned         numeric(8,2) not null check (points_earned >= 0),
  points_possible       numeric(8,2) not null check (points_possible > 0),
  -- Every calculation stores the rule version it used (CLAUDE.md §7).
  rule_version          text not null,
  supersedes_grade_id   uuid references public.grade_records (id),
  entered_by_user_id    uuid not null references public.users (id),
  reason                text not null,
  recorded_at           timestamptz not null default now(),
  check (points_earned <= points_possible)
);
create index on public.grade_records (enrollment_id);
create index on public.grade_records (student_id);

create view public.grade_records_current as
select g.*
from public.grade_records g
where not exists (
  select 1 from public.grade_records s where s.supersedes_grade_id = g.id
);

-- ---------------------------------------------------------------------------
-- Mastery — SEPARATE TABLES FROM GRADES (CLAUDE.md §4)
-- ---------------------------------------------------------------------------
--
-- Confidence is stored separately from the estimate so thin evidence is never
-- presented as a precise score. No view in this schema joins a mastery value to
-- a grade.

create type public.readiness_band as enum (
  'not_started', 'needs_support', 'developing', 'secure', 'strong'
);
create type public.confidence_band as enum (
  'insufficient', 'low', 'moderate', 'high'
);

create table public.skill_profiles (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.users (id),
  skill        text not null,
  standard     text,
  updated_at   timestamptz not null default now(),
  unique (student_id, skill)
);

create table public.mastery_estimates (
  id                 uuid primary key default gen_random_uuid(),
  skill_profile_id   uuid not null references public.skill_profiles (id),
  estimate           smallint not null check (estimate between 0 and 100),
  band               public.readiness_band not null,
  rule_version       text not null,
  -- The exact inputs used, so the estimate recomputes exactly.
  inputs             jsonb not null,
  computed_at        timestamptz not null default now()
);
create index on public.mastery_estimates (skill_profile_id);

create table public.mastery_confidence (
  id                    uuid primary key default gen_random_uuid(),
  mastery_estimate_id   uuid not null references public.mastery_estimates (id),
  band                  public.confidence_band not null,
  reason                text not null
);

-- ---------------------------------------------------------------------------
-- Intervention
-- ---------------------------------------------------------------------------

create type public.intervention_status as enum (
  'recommended', 'teacher_reviewed', 'assigned', 'in_progress',
  'readiness_check', 'passed', 'returned_to_pathway', 'escalated', 'closed'
);
create type public.intervention_severity as enum (
  'immediate', 'targeted', 'spaced', 'teacher_review'
);

create table public.interventions (
  id                          uuid primary key default gen_random_uuid(),
  student_id                  uuid not null references public.users (id),
  enrollment_id               uuid not null references public.enrollments (id),
  status                      public.intervention_status not null default 'recommended',
  intervention_lesson_id      text not null,
  target_skill                text not null,
  target_standard             text,
  severity                    public.intervention_severity not null,
  -- Every recommendation cites its trigger evidence. Never empty once assigned.
  trigger_evidence_ids        uuid[] not null default '{}',
  trigger_summary             text not null,
  estimated_minutes           smallint not null,
  -- Stored at assignment time so the student returns to the EXACT location.
  return_lesson_code          text not null,
  return_stage                smallint not null check (return_stage between 1 and 10),
  return_rule_version         text not null,
  readiness_min_percent       smallint not null default 80,
  transfer_items_required     smallint not null default 1,
  readiness_percent           numeric(5,2),
  transfer_passed             boolean,
  cycles                      smallint not null default 0,
  recommended_by_rule_version text not null,
  evidence_count_at_decision  integer not null default 0,
  decided_by_user_id          uuid references public.users (id),
  decision_reason             text,
  due_expectation             text not null default '',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index on public.interventions (student_id);
create index on public.interventions (enrollment_id);
create index on public.interventions (status);

-- A dismissal and a site-admin assignment both require a recorded reason.
alter table public.interventions
  add constraint interventions_decision_needs_reason
  check (decided_by_user_id is null or coalesce(length(trim(decision_reason)), 0) > 0);

-- ---------------------------------------------------------------------------
-- Messages and exports
-- ---------------------------------------------------------------------------

create table public.teacher_messages (
  id               uuid primary key default gen_random_uuid(),
  from_user_id     uuid not null references public.users (id),
  to_student_id    uuid not null references public.users (id),
  subject          text not null,
  body             text not null,
  is_help_request  boolean not null default false,
  resolved_at      timestamptz,
  sent_at          timestamptz not null default now()
);
create index on public.teacher_messages (to_student_id);

-- Exports are purpose-bound: requester, purpose, scope, row count, timestamp.
create table public.export_records (
  id                     uuid primary key default gen_random_uuid(),
  requested_by_user_id   uuid not null references public.users (id),
  purpose                text not null check (length(trim(purpose)) > 0),
  scope                  text not null,
  row_count              integer not null,
  requested_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit — APPEND ONLY (CLAUDE.md §6)
-- ---------------------------------------------------------------------------

create table public.audit_events (
  id                uuid primary key default gen_random_uuid(),
  actor_user_id     uuid not null references public.users (id),
  actor_role        public.user_role not null,
  scope             text not null,
  action            text not null,
  target_entity     text not null,
  target_id         text not null,
  before_state      jsonb,
  after_state       jsonb,
  -- A dismissal requires a reason. So does a site-admin assignment over an
  -- unresolved teacher queue item.
  reason            text not null check (length(trim(reason)) > 0),
  idempotency_key   text not null,
  request_id        text not null,
  recorded_at       timestamptz not null default now()
);
create index on public.audit_events (actor_user_id);
create index on public.audit_events (target_entity, target_id);
create index on public.audit_events (recorded_at desc);

-- ---------------------------------------------------------------------------
-- Idempotency (CLAUDE.md §1 — a retry must never create a duplicate)
-- ---------------------------------------------------------------------------

create table public.idempotency_keys (
  key            text primary key,
  action         text not null,
  result_id      text not null,
  actor_user_id  uuid not null references public.users (id),
  created_at     timestamptz not null default now()
);
