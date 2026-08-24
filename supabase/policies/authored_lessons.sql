-- authored_lessons, lesson_videos, lesson_items
--
-- Lesson content built in the studio: the script a student reads, the video
-- that carries it, and the items that produce evidence.
--
-- POSITIVE: everyone in the organization READS lesson content — a student needs
--           the lesson their section's version publishes, and a teacher needs to
--           see what they are teaching. A curriculum author writes content while
--           the owning course version is a DRAFT.
-- NEGATIVE: an org admin without the curriculum_author authorization cannot
--           write. A curriculum author cannot write once the version has left
--           draft — not in review, not approved, and not published. That is what
--           keeps a published lesson from changing under a running class
--           (CLAUDE.md §7), and it is enforced twice: in the policy, and by a
--           trigger, so a write that arrives another way still meets it.
--
-- Deletes are permitted ONLY on draft content, because a draft is working state
-- rather than a record of something a person did. Evidence and audit remain
-- append-only and are untouched by any of this; every write here still produces
-- an audit event in the same transaction (CLAUDE.md §6).

-- --- Reads -----------------------------------------------------------------

create policy authored_lessons_select_own_org
  on public.authored_lessons for select
  using (org_id = public.current_org());

create policy lesson_videos_select_own_org
  on public.lesson_videos for select
  using (
    exists (
      select 1 from public.authored_lessons l
      where l.id = authored_lesson_id and l.org_id = public.current_org()
    )
  );

create policy lesson_items_select_own_org
  on public.lesson_items for select
  using (
    exists (
      select 1 from public.authored_lessons l
      where l.id = authored_lesson_id and l.org_id = public.current_org()
    )
  );

-- --- Writes: curriculum author, draft version only --------------------------

create policy authored_lessons_write_author_draft
  on public.authored_lessons for all
  using (
    org_id = public.current_org()
    and public.is_curriculum_author()
    and public.version_is_draft(course_version_id)
  )
  with check (
    org_id = public.current_org()
    and public.is_curriculum_author()
    and public.version_is_draft(course_version_id)
  );

create policy lesson_videos_write_author_draft
  on public.lesson_videos for all
  using (public.lesson_is_editable(authored_lesson_id))
  with check (public.lesson_is_editable(authored_lesson_id));

create policy lesson_items_write_author_draft
  on public.lesson_items for all
  using (public.lesson_is_editable(authored_lesson_id))
  with check (public.lesson_is_editable(authored_lesson_id));
