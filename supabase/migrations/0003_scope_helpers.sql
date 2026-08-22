-- ============================================================================
-- Scope helpers for row-level security (CLAUDE.md §3)
-- ============================================================================
--
-- Scope is hierarchical: organization -> site -> teacher -> roster section ->
-- student -> course -> curriculum authorization. These functions are the single
-- definition of that hierarchy, so every policy in /supabase/policies expresses
-- one rule rather than repeating a join.
--
-- They are SECURITY DEFINER so a policy can read `public.users` without the
-- caller needing a policy on it, and they are marked STABLE so the planner can
-- cache them within a statement.

create or replace function public.current_role_name()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.current_org()
returns uuid
language sql stable security definer set search_path = public
as $$
  select org_id from public.users where id = auth.uid();
$$;

create or replace function public.current_site()
returns uuid
language sql stable security definer set search_path = public
as $$
  select site_id from public.users where id = auth.uid();
$$;

create or replace function public.is_curriculum_author()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select curriculum_author from public.users where id = auth.uid()), false);
$$;

-- The set of students the caller may read. Empty for a curriculum author:
-- curriculum authorization grants curriculum access, not student access.
create or replace function public.students_in_scope()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select u.id
  from public.users u
  where u.role = 'student'
    and case public.current_role_name()
      when 'student' then u.id = auth.uid()
      when 'teacher' then exists (
        select 1
        from public.enrollments e
        join public.roster_sections s on s.id = e.section_id
        where e.student_id = u.id and s.teacher_id = auth.uid()
      )
      when 'site_admin' then u.site_id = public.current_site()
      when 'org_admin'  then u.org_id  = public.current_org()
      else false
    end;
$$;

create or replace function public.can_read_student(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.students_in_scope() s where s = target);
$$;

-- Only the teacher who owns the section, or a site admin at that site, may
-- assign support. An org admin may not.
create or replace function public.can_assign_intervention(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.current_role_name() in ('teacher', 'site_admin')
     and public.can_read_student(target);
$$;

-- Grades are entered and changed by the assigned teacher only.
create or replace function public.can_enter_grade(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.current_role_name() = 'teacher' and public.can_read_student(target);
$$;
