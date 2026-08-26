-- lesson_materials
--
-- The readings, worksheets, decks, data sets, reference sheets, and physical
-- objects a lesson hands a student.
--
-- POSITIVE: everyone in the organization READS materials — a student needs what
--           their section's published version tells them to open, and a teacher
--           needs to see what they are assigning. A curriculum author attaches
--           and detaches materials while the owning course version is a DRAFT.
-- NEGATIVE: an org admin without the curriculum_author authorization cannot
--           attach one. A curriculum author cannot attach one once the version
--           has left draft. Both reuse `lesson_is_editable`, so this can never
--           drift away from the rule the rest of a lesson's content follows
--           (CLAUDE.md §7).
--
-- Reading is not gated on the authorization: authoring is a separate permission
-- from seeing what was authored, and the material a student is told to open has
-- to be reachable by that student.
--
-- Deletes are permitted only on draft content, because a draft is working state
-- rather than a record of something a person did — and a material the canvas
-- still places cannot be detached at all (migration 0010). Every write produces
-- an audit event in the same transaction (CLAUDE.md §6).

create policy lesson_materials_select_own_org
  on public.lesson_materials for select
  using (
    exists (
      select 1 from public.authored_lessons l
      where l.id = authored_lesson_id and l.org_id = public.current_org()
    )
  );

create policy lesson_materials_write_author_draft
  on public.lesson_materials for all
  using (public.lesson_is_editable(authored_lesson_id))
  with check (public.lesson_is_editable(authored_lesson_id));
