-- ============================================================================
-- 0004 — Apply the row-level security policies
-- ============================================================================
--
-- Migrations 0001-0003 created the schema, the append-only triggers, and the
-- scope helpers, and enabled RLS on every table. They did NOT create the
-- policies, which left every table correctly denying everything and doing
-- nothing useful.
--
-- This applies the policy set defined in `/supabase/policies`. Those files stay
-- the readable, per-table source with the positive and negative cases each one
-- must satisfy; this migration is what is actually applied, and the two must be
-- changed together.
--
-- It also sets `security_invoker` on the two `_current` views. Without it they
-- run as their creator and bypass RLS entirely, which the database linter flags
-- as an ERROR — a definer view over `evidence` would hand every row to any
-- caller.


-- ---------------------------------------------------------------------------
-- from policies/enable_rls.sql
-- ---------------------------------------------------------------------------
-- ============================================================================
-- Enable row-level security on EVERY table (CLAUDE.md §3)
-- ============================================================================
--
-- A table without RLS is a defect and must fail CI. Enabling RLS with no policy
-- denies everything, which is the correct default: each table's grants are
-- added in its own file.

alter table public.organizations     enable row level security;
alter table public.sites             enable row level security;
alter table public.users             enable row level security;
alter table public.course_versions   enable row level security;
alter table public.roster_sections   enable row level security;
alter table public.enrollments       enable row level security;
alter table public.lesson_states     enable row level security;
alter table public.evidence          enable row level security;
alter table public.grade_categories  enable row level security;
alter table public.gradebook_configs enable row level security;
alter table public.grade_records     enable row level security;
alter table public.skill_profiles    enable row level security;
alter table public.mastery_estimates enable row level security;
alter table public.mastery_confidence enable row level security;
alter table public.interventions     enable row level security;
alter table public.teacher_messages  enable row level security;
alter table public.export_records    enable row level security;
alter table public.audit_events      enable row level security;
alter table public.idempotency_keys  enable row level security;

-- Views inherit the policies of their base tables when created with
-- security_invoker, which is what makes `evidence_current` safe to read.
alter view public.evidence_current       set (security_invoker = on);
alter view public.grade_records_current  set (security_invoker = on);

-- ---------------------------------------------------------------------------
-- from policies/users.sql
-- ---------------------------------------------------------------------------
-- users
--
-- POSITIVE: a person reads their own row; staff read the people in their scope.
-- NEGATIVE: a student reads no other user row; a teacher reads no student
--           outside their roster sections; a site admin reads no one at another
--           site; a curriculum author reads no student at all.
--
-- No role may write this table from the client. Role changes are an org-admin
-- action performed through an audited server path, never a direct update.

create policy users_select_self
  on public.users for select
  using (id = auth.uid());

create policy users_select_students_in_scope
  on public.users for select
  using (role = 'student' and public.can_read_student(id));

-- Staff need to see the colleagues they work with: teachers of their students,
-- and administrators at their own site.
create policy users_select_staff_same_site
  on public.users for select
  using (
    role <> 'student'
    and public.current_role_name() in ('teacher', 'site_admin', 'org_admin')
    and (
      site_id = public.current_site()
      or (public.current_role_name() = 'org_admin' and org_id = public.current_org())
    )
  );

-- ---------------------------------------------------------------------------
-- from policies/organizations_sites.sql
-- ---------------------------------------------------------------------------
-- organizations, sites
--
-- POSITIVE: any signed-in person reads their own organization and the sites in
--           it, so navigation and labels resolve.
-- NEGATIVE: nobody reads another organization or its sites; nobody writes
--           either table from the client.

create policy organizations_select_own
  on public.organizations for select
  using (id = public.current_org());

create policy sites_select_own_org
  on public.sites for select
  using (org_id = public.current_org());

-- ---------------------------------------------------------------------------
-- from policies/course_versions.sql
-- ---------------------------------------------------------------------------
-- course_versions
--
-- POSITIVE: everyone in the organization reads course versions — curriculum is
--           not secret, and students need the version their section is pinned
--           to. A curriculum author inserts and updates versions.
-- NEGATIVE: an org admin WITHOUT the curriculum_author authorization cannot
--           insert or update a version. Nobody deletes one: retirement is a
--           state transition, not a delete.
--
-- Publication is additionally gated on day-budget validation in
-- `lib/curriculum/authoring.ts`; the gate is application logic because it reads
-- the catalog, and it is covered by tests in /tests/integration.

create policy course_versions_select_own_org
  on public.course_versions for select
  using (org_id = public.current_org());

create policy course_versions_insert_author
  on public.course_versions for insert
  with check (org_id = public.current_org() and public.is_curriculum_author());

create policy course_versions_update_author
  on public.course_versions for update
  using (org_id = public.current_org() and public.is_curriculum_author())
  with check (org_id = public.current_org() and public.is_curriculum_author());

-- ---------------------------------------------------------------------------
-- from policies/roster_sections_enrollments.sql
-- ---------------------------------------------------------------------------
-- roster_sections, enrollments
--
-- POSITIVE: a student reads their own enrollments and their sections; a teacher
--           reads the sections they own; a site admin reads their site; an org
--           admin reads the organization.
-- NEGATIVE: a student reads no other student's enrollment; a teacher reads no
--           section they do not own; a site admin reads nothing at another
--           site. No client writes: enrollment and placement go through audited
--           server paths.
--
-- Deleting an enrollment is blocked by a trigger as well as by policy — removal
-- is a state transition to withdrawn or archived (CLAUDE.md §6).

create policy roster_sections_select_in_scope
  on public.roster_sections for select
  using (
    teacher_id = auth.uid()
    or site_id = public.current_site()
    or exists (
      select 1 from public.enrollments e
      where e.section_id = roster_sections.id and e.student_id = auth.uid()
    )
    or (public.current_role_name() = 'org_admin'
        and exists (select 1 from public.sites s
                    where s.id = roster_sections.site_id and s.org_id = public.current_org()))
  );

create policy enrollments_select_in_scope
  on public.enrollments for select
  using (student_id = auth.uid() or public.can_read_student(student_id));

-- ---------------------------------------------------------------------------
-- from policies/lesson_states.sql
-- ---------------------------------------------------------------------------
-- lesson_states
--
-- POSITIVE: a student reads and advances their own lesson state; staff in scope
--           read it.
-- NEGATIVE: a student reads or writes no other student's lesson state; a
--           teacher writes none at all — status changes go through the guarded
--           transition function on the server, never a direct client update.
--
-- The client may update its own row, but the guarded transition function is the
-- only code that computes the next status; a hand-crafted update that skipped a
-- state would still have to satisfy the enum and would produce no evidence, no
-- grade, and no audit event, so it cannot manufacture completion.

create policy lesson_states_select_in_scope
  on public.lesson_states for select
  using (
    exists (
      select 1 from public.enrollments e
      where e.id = lesson_states.enrollment_id
        and (e.student_id = auth.uid() or public.can_read_student(e.student_id))
    )
  );

-- ---------------------------------------------------------------------------
-- from policies/evidence.sql
-- ---------------------------------------------------------------------------
-- evidence  — INSERT and SELECT only (CLAUDE.md §5)
--
-- POSITIVE: a student reads their own evidence and inserts their own responses;
--           a teacher reads the evidence of students in their sections and
--           appends observations for them.
-- NEGATIVE: a student reads no other student's evidence and cannot insert a row
--           attributed to someone else; a teacher reads no student outside
--           their roster; NOBODY updates or deletes — there is no update policy
--           and no delete policy on this table, and the triggers in
--           0002_append_only.sql raise even for the table owner.

create policy evidence_select_in_scope
  on public.evidence for select
  using (student_id = auth.uid() or public.can_read_student(student_id));

create policy evidence_insert_own
  on public.evidence for insert
  with check (
    student_id = auth.uid()
    and recorded_by_user_id = auth.uid()
    and source <> 'teacher_observation'
    and source <> 'proctored'
  );

create policy evidence_insert_teacher_observation
  on public.evidence for insert
  with check (
    public.current_role_name() = 'teacher'
    and public.can_read_student(student_id)
    and recorded_by_user_id = auth.uid()
    and source in ('teacher_observation', 'proctored')
  );

-- Deliberately absent: any UPDATE or DELETE policy. Corrections are new rows
-- linked by supersedes_evidence_id.

-- ---------------------------------------------------------------------------
-- from policies/grades.sql
-- ---------------------------------------------------------------------------
-- grade_records, grade_categories, gradebook_configs — INSERT and SELECT only
--
-- POSITIVE: a student reads their own official results; the assigned teacher
--           inserts a result or a change for their own student.
-- NEGATIVE: a student reads no other student's grades and inserts none at all;
--           a SITE ADMIN and an ORG ADMIN cannot insert or change a grade —
--           only the assigned teacher can; NOBODY updates or deletes, so a
--           change is a new row that supersedes the previous one and the
--           original stays readable.
--
-- Nothing in this file references mastery, and no view joins the two
-- (CLAUDE.md §4).

create policy grade_records_select_in_scope
  on public.grade_records for select
  using (student_id = auth.uid() or public.can_read_student(student_id));

create policy grade_records_insert_by_teacher
  on public.grade_records for insert
  with check (
    public.can_enter_grade(student_id)
    and entered_by_user_id = auth.uid()
    and length(trim(reason)) > 0
  );

-- A student's own Exit Ticket submission is scored by the versioned grading
-- rule on the server and recorded against the student, which is why this second
-- insert path exists and is narrowed to their own enrollment.
create policy grade_records_insert_own_submission
  on public.grade_records for insert
  with check (
    student_id = auth.uid()
    and entered_by_user_id = auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.id = grade_records.enrollment_id and e.student_id = auth.uid()
    )
  );

create policy grade_categories_select_own_org
  on public.grade_categories for select
  using (org_id = public.current_org());

create policy gradebook_configs_select_own_org
  on public.gradebook_configs for select
  using (org_id = public.current_org());

-- Deliberately absent: any UPDATE or DELETE policy on grade_records.

-- ---------------------------------------------------------------------------
-- from policies/mastery.sql
-- ---------------------------------------------------------------------------
-- skill_profiles, mastery_estimates, mastery_confidence
--
-- POSITIVE: a student reads their own readiness estimates and their confidence;
--           staff in scope read them.
-- NEGATIVE: a student reads no other student's estimates; nobody writes from
--           the client — estimates are computed server-side from evidence and
--           stored with their rule version and inputs.
--
-- Confidence lives in its own table so a query cannot accidentally return an
-- estimate without it (CLAUDE.md §4). Nothing here joins to grade_records.

create policy skill_profiles_select_in_scope
  on public.skill_profiles for select
  using (student_id = auth.uid() or public.can_read_student(student_id));

create policy mastery_estimates_select_in_scope
  on public.mastery_estimates for select
  using (
    exists (
      select 1 from public.skill_profiles p
      where p.id = mastery_estimates.skill_profile_id
        and (p.student_id = auth.uid() or public.can_read_student(p.student_id))
    )
  );

create policy mastery_confidence_select_in_scope
  on public.mastery_confidence for select
  using (
    exists (
      select 1
      from public.mastery_estimates m
      join public.skill_profiles p on p.id = m.skill_profile_id
      where m.id = mastery_confidence.mastery_estimate_id
        and (p.student_id = auth.uid() or public.can_read_student(p.student_id))
    )
  );

-- ---------------------------------------------------------------------------
-- from policies/interventions.sql
-- ---------------------------------------------------------------------------
-- interventions
--
-- POSITIVE: a student reads their own plans and advances their own through the
--           lifecycle; a teacher reads and assigns for students in their
--           sections; a SITE ADMIN may assign at their own site when a teacher
--           queue item is unresolved.
-- NEGATIVE: a student reads no other student's plan and cannot create one — a
--           recommendation is a proposal and only a human with authority turns
--           it into a plan; a teacher cannot assign outside their roster; an
--           ORG ADMIN cannot assign at all; nobody deletes a plan.
--
-- The decision reason is required by a table constraint as well as by policy.

create policy interventions_select_in_scope
  on public.interventions for select
  using (student_id = auth.uid() or public.can_read_student(student_id));

create policy interventions_insert_by_decider
  on public.interventions for insert
  with check (
    public.can_assign_intervention(student_id)
    and decided_by_user_id = auth.uid()
    and length(trim(coalesce(decision_reason, ''))) > 0
  );

create policy interventions_update_by_decider
  on public.interventions for update
  using (public.can_assign_intervention(student_id))
  with check (public.can_assign_intervention(student_id));

-- A student moves their own plan through start, readiness check, and transfer
-- check. They cannot change its target, its return destination, or its rule.
create policy interventions_update_own_progress
  on public.interventions for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- ---------------------------------------------------------------------------
-- from policies/audit_events.sql
-- ---------------------------------------------------------------------------
-- audit_events — INSERT and SELECT only, and readable by very few
--
-- POSITIVE: an org admin reads every event in their organization; any actor
--           reads their own events; every authenticated actor may insert an
--           event attributed to themselves, because the audit write happens in
--           the same transaction as the action it records.
-- NEGATIVE: a student, teacher, site admin, or curriculum author reads no event
--           they did not perform; nobody inserts an event attributed to someone
--           else; NOBODY updates or deletes — audit is writable by no one after
--           the fact, including an administrator.

create policy audit_events_select_own
  on public.audit_events for select
  using (actor_user_id = auth.uid());

create policy audit_events_select_org_admin
  on public.audit_events for select
  using (
    public.current_role_name() = 'org_admin'
    and exists (
      select 1 from public.users u
      where u.id = audit_events.actor_user_id and u.org_id = public.current_org()
    )
  );

create policy audit_events_insert_self_attributed
  on public.audit_events for insert
  with check (actor_user_id = auth.uid() and length(trim(reason)) > 0);

-- Deliberately absent: any UPDATE or DELETE policy.

-- ---------------------------------------------------------------------------
-- from policies/messages_exports.sql
-- ---------------------------------------------------------------------------
-- teacher_messages, export_records, idempotency_keys
--
-- POSITIVE: a student reads messages addressed to them and sends a help
--           request; a teacher sends to students in their sections; an org
--           admin records a purpose-bound export.
-- NEGATIVE: a student reads no message addressed to another student and cannot
--           send to one; a teacher cannot message a student outside their
--           roster; a teacher or site admin cannot record an export; nobody
--           updates or deletes an export record.

create policy teacher_messages_select_own
  on public.teacher_messages for select
  using (to_student_id = auth.uid() or from_user_id = auth.uid()
         or public.can_read_student(to_student_id));

create policy teacher_messages_insert_help_request
  on public.teacher_messages for insert
  with check (
    from_user_id = auth.uid()
    and to_student_id = auth.uid()
    and is_help_request
  );

create policy teacher_messages_insert_by_teacher
  on public.teacher_messages for insert
  with check (
    from_user_id = auth.uid()
    and public.current_role_name() in ('teacher', 'site_admin')
    and public.can_read_student(to_student_id)
  );

create policy export_records_select_org_admin
  on public.export_records for select
  using (public.current_role_name() = 'org_admin');

create policy export_records_insert_org_admin
  on public.export_records for insert
  with check (
    public.current_role_name() = 'org_admin'
    and requested_by_user_id = auth.uid()
  );

create policy idempotency_keys_own
  on public.idempotency_keys for select
  using (actor_user_id = auth.uid());

create policy idempotency_keys_insert_own
  on public.idempotency_keys for insert
  with check (actor_user_id = auth.uid());

