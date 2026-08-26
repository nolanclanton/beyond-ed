-- ============================================================================
-- 0013 — Private storage for student uploads
-- ============================================================================
--
-- One private bucket. Every object lives under the uploader's own user id:
--
--     student-uploads/<user_id>/<enrollment_id>/<filename>
--
-- The first path segment IS the access rule. A student writes and reads only
-- beneath their own id; the staff who may already read that student's records
-- may read their files by the same scope helper that governs every other table,
-- so file access cannot drift away from record access.
--
-- The bucket is private. Nothing here is served from a public URL — reads go
-- through a short-lived signed URL minted server-side for a caller RLS has
-- already admitted.
--
-- **No update, no delete.** A student's uploaded work is evidence of what they
-- did, and evidence is append-only (CLAUDE.md §5). Replacing a file means
-- uploading another one; the earlier object stays. This is deliberate and it is
-- why the interface says "add a file" rather than "replace".

-- ---------------------------------------------------------------------------
-- 1. The bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-uploads',
  'student-uploads',
  false,
  26214400, -- 25 MiB
  array[
    'image/png', 'image/jpeg', 'image/webp', 'image/heic',
    'application/pdf',
    'text/plain', 'text/csv',
    'audio/mpeg', 'audio/mp4', 'audio/webm'
  ]
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 2. Whose file is this?
-- ---------------------------------------------------------------------------
--
-- Parses the owning user id out of the object path. Returns null rather than
-- raising when the first segment is not a uuid, so a malformed path fails
-- CLOSED — every policy below compares against a null and denies.

create or replace function public.storage_object_owner(object_name text)
returns uuid
language sql immutable set search_path = public
as $$
  select case
    when (storage.foldername(object_name))[1]
         ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    then ((storage.foldername(object_name))[1])::uuid
    else null
  end;
$$;

revoke execute on function public.storage_object_owner(text) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Policies
-- ---------------------------------------------------------------------------
--
-- POSITIVE: a student uploads into their own folder and lists it back; the
--           teacher of that student's section, their site admin, and their org
--           admin can read it.
-- NEGATIVE: a student cannot write into another student's folder, cannot read
--           one, and cannot write to a path whose first segment is not a uuid;
--           a curriculum author reads no student file at all; nobody updates or
--           deletes an object once written.

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

-- Staff read by the same rule that governs the student's records. A curriculum
-- author is excluded because `students_in_scope` returns nothing for them:
-- curriculum authorization grants curriculum access, not student access.
create policy student_uploads_select_in_scope
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'student-uploads'
    and public.storage_object_owner(name) is not null
    and public.can_read_student(public.storage_object_owner(name))
  );

-- There is deliberately no UPDATE and no DELETE policy on this bucket. RLS
-- denies by default, so both operations are refused for every role including
-- the administrators above.
