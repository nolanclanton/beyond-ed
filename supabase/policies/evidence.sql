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
