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
