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

-- Deactivation (migration 0012)
--
-- POSITIVE: an org admin withdraws access for anyone in their organization; a
--           site admin does so for students and teachers at their own site.
-- NEGATIVE: a site admin cannot deactivate another site admin, an org admin, or
--           anyone at another site; a teacher or student deactivates nobody;
--           no role may change a profile's identity, role, or scope through
--           this path — the `users_guard_update` trigger confines an update to
--           `deactivated_at` and `deactivated_reason`, so a role change has to
--           be a new, audited invitation.

create policy users_update_deactivation_org_admin
  on public.users for update
  using (public.current_role_name() = 'org_admin' and org_id = public.current_org())
  with check (public.current_role_name() = 'org_admin' and org_id = public.current_org());

create policy users_update_deactivation_site_admin
  on public.users for update
  using (
    public.current_role_name() = 'site_admin'
    and site_id = public.current_site()
    and role in ('student', 'teacher')
  )
  with check (
    public.current_role_name() = 'site_admin'
    and site_id = public.current_site()
    and role in ('student', 'teacher')
  );
