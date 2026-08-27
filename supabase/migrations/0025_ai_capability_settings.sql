-- ============================================================================
-- 0025 — Which assistance capabilities an organization has turned on
-- ============================================================================
--
-- Two separate questions, deliberately kept apart (ADR 0016, vision §7, §20):
--
--   Does this capability exist at all?   lib/ai/capabilities.ts. Decided in
--                                        source, changed by a deploy and a code
--                                        review.
--   Has this organization allowed it?    This table. Decided by a curriculum
--                                        administrator, changed by a form and an
--                                        audit event.
--
-- The separation is what keeps the prohibited list prohibited. Publishing,
-- approving, assigning students, running queries — none of them has a registry
-- entry, so none of them can be named by a row here. The domain refuses any
-- capability name that is not already a registry key, and the check constraint
-- below refuses the obvious ones a second time, at the database, where a bug in
-- the application cannot reach.
--
-- ABSENCE IS MEANINGFUL. No row means "whatever the registry defaults to",
-- which is how a newly shipped capability arrives switched on without anybody
-- having to enable it, and how an organization that has never opened the page
-- behaves sensibly rather than having everything off. Nothing is seeded here on
-- purpose.
--
-- Forward-only. This adds one table and touches no existing one.

create table public.ai_capability_settings (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id),
  -- A name from the capability registry. Text rather than an enum for the same
  -- reason `ai_generations.capability` is: the registry is the authority, and a
  -- database enum would need a migration every time a capability was added.
  capability  text not null check (length(btrim(capability)) > 0),
  enabled     boolean not null,
  -- Required. Turning a capability off changes what every author in the
  -- organization can do, and a colleague reading this in six months needs to
  -- know why the control went away.
  reason      text not null check (length(btrim(reason)) >= 4),
  changed_at  timestamptz not null default now(),
  changed_by  uuid not null references public.users (id),

  -- One answer per organization per capability. Two would be two answers to the
  -- same question, and whichever came back first would win.
  unique (org_id, capability),

  -- Defence in depth. The application refuses anything not in the registry;
  -- this refuses the actions that must never become settings even if the
  -- application is wrong. It is a denylist rather than an allowlist ON PURPOSE:
  -- an allowlist would have to be migrated every time a capability shipped, and
  -- a migration nobody remembered would silently block a legitimate one. The
  -- registry is the allowlist; this is the floor beneath it.
  constraint prohibited_actions_are_not_settings
    check (capability not in (
      'publish_lesson',
      'approve_curriculum',
      'delete_curriculum',
      'change_course_sequence',
      'modify_standards',
      'modify_prerequisite_rules',
      'assign_students',
      'message_students',
      'change_permissions',
      'manage_users',
      'run_database_query',
      'generate_whole_course',
      'autonomous_curriculum_design'
    ))
);
create index on public.ai_capability_settings (org_id);

comment on table public.ai_capability_settings is
  'Per-organization decisions about design-assistance capabilities. Absence means "the shipped default". Cannot name a capability the registry does not define.';

-- ---------------------------------------------------------------------------
-- Row-level security (from policies/ai_capability_settings.sql)
-- ---------------------------------------------------------------------------

alter table public.ai_capability_settings enable row level security;

-- Everyone holding curriculum authoring READS these: an author needs to know
-- why a control is not on their panel, and "ask an administrator" is a worse
-- answer than showing them.
create policy ai_capability_settings_select_authors
  on public.ai_capability_settings for select
  using (org_id = public.current_org() and public.is_curriculum_author());

-- Only a curriculum administrator writes. Not an org admin by seniority, and
-- not an author who happens to be senior — the grant is the thing being checked
-- (CLAUDE.md §3).
create policy ai_capability_settings_write_administrator
  on public.ai_capability_settings for all
  using (
    org_id = public.current_org()
    and public.is_curriculum_administrator()
  )
  with check (
    org_id = public.current_org()
    and public.is_curriculum_administrator()
    and changed_by = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--
-- Must return zero rows: a setting naming something that is not a capability.
-- Run this with the current registry list after any change to
-- lib/ai/capabilities.ts.
--
--   select org_id, capability from public.ai_capability_settings
--   where capability not in (
--     'brainstorm_narrative_hooks', 'continue_narrative',
--     'summarize_narrative_state', 'create_character_variations',
--     'rewrite_selected_section', 'generate_worked_example',
--     'generate_guided_practice', 'identify_misconceptions',
--     'draft_exit_ticket', 'check_lesson_alignment', 'generate_visual_asset'
--   );
--
-- Zero rows: two answers to the same question.
--
--   select org_id, capability, count(*)
--   from public.ai_capability_settings
--   group by 1, 2 having count(*) > 1;
--
-- And what each organization has actually decided, which should be short — most
-- organizations should be following the defaults:
--
--   select o.name, s.capability, s.enabled, s.reason, s.changed_at
--   from public.ai_capability_settings s
--   join public.organizations o on o.id = s.org_id
--   order by o.name, s.capability;
