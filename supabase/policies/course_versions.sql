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
