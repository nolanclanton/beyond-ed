-- storage.objects — bucket `student-uploads`
--
-- Files a student adds to their work. The bucket is private; every object is
-- keyed by the uploader's user id as the first path segment:
--
--     student-uploads/<user_id>/<enrollment_id>/<filename>
--
-- POSITIVE: a student uploads into their own folder and lists it back; the
--           teacher of that student's section, their site admin, and their org
--           admin read it through the same scope helper that governs the
--           student's records.
-- NEGATIVE: a student cannot write into or read another student's folder; a
--           path whose first segment is not a uuid is denied to everyone,
--           because `storage_object_owner` returns null and every comparison
--           fails closed; a curriculum author reads no student file at all; no
--           role updates or deletes an object once it is written.
--
-- Applied by migration 0013. The absence of an UPDATE and a DELETE policy is
-- the point, not an omission: uploaded work is evidence, and evidence is
-- append-only (CLAUDE.md §5). A replacement is a new object.

create policy student_uploads_insert_own
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'student-uploads'
    and public.storage_object_owner(name) = auth.uid()
  );

create policy student_uploads_select_own
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'student-uploads'
    and public.storage_object_owner(name) = auth.uid()
  );

create policy student_uploads_select_in_scope
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'student-uploads'
    and public.storage_object_owner(name) is not null
    and public.can_read_student(public.storage_object_owner(name))
  );
