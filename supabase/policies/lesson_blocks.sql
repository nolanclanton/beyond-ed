-- lesson_blocks
--
-- The lesson canvas: the ordered, typed blocks a curriculum author composes for
-- the instruction stage of a lesson.
--
-- POSITIVE: everyone in the organization READS blocks — a student needs the
--           lesson their section's version publishes, and a teacher needs to see
--           what they are teaching. A curriculum author writes, moves, and
--           removes blocks while the owning course version is a DRAFT.
-- NEGATIVE: an org admin without the curriculum_author authorization cannot
--           write. A curriculum author cannot write once the version has left
--           draft. Both are the same rule the rest of a lesson's content follows
--           (CLAUDE.md §7), reusing `lesson_is_editable` so the two can never
--           drift apart.
--
-- Deletes are permitted only on draft content, because a draft is working state
-- rather than a record of something a person did. Every write still produces an
-- audit event in the same transaction (CLAUDE.md §6).

create policy lesson_blocks_select_own_org
  on public.lesson_blocks for select
  using (
    exists (
      select 1 from public.authored_lessons l
      where l.id = authored_lesson_id and l.org_id = public.current_org()
    )
  );

create policy lesson_blocks_write_author_draft
  on public.lesson_blocks for all
  using (public.lesson_is_editable(authored_lesson_id))
  with check (public.lesson_is_editable(authored_lesson_id));
