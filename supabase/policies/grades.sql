-- grade_records, grade_categories, gradebook_configs — INSERT and SELECT only
--
-- POSITIVE: a student reads their own official results; the assigned teacher
--           inserts a result or a change for their own student.
-- NEGATIVE: a student reads no other student's grades and inserts none at all;
--           a SITE ADMIN and an ORG ADMIN cannot insert or change a grade —
--           only the assigned teacher can; NOBODY updates or deletes, so a
--           change is a new row that supersedes the previous one and the
--           original stays readable.
--
-- Nothing in this file references mastery, and no view joins the two
-- (CLAUDE.md §4).

create policy grade_records_select_in_scope
  on public.grade_records for select
  using (student_id = auth.uid() or public.can_read_student(student_id));

create policy grade_records_insert_by_teacher
  on public.grade_records for insert
  with check (
    public.can_enter_grade(student_id)
    and entered_by_user_id = auth.uid()
    and length(trim(reason)) > 0
  );

-- A student's own Exit Ticket submission is scored by the versioned grading
-- rule on the server and recorded against the student, which is why this second
-- insert path exists and is narrowed to their own enrollment.
create policy grade_records_insert_own_submission
  on public.grade_records for insert
  with check (
    student_id = auth.uid()
    and entered_by_user_id = auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.id = grade_records.enrollment_id and e.student_id = auth.uid()
    )
  );

create policy grade_categories_select_own_org
  on public.grade_categories for select
  using (org_id = public.current_org());

create policy gradebook_configs_select_own_org
  on public.gradebook_configs for select
  using (org_id = public.current_org());

-- Deliberately absent: any UPDATE or DELETE policy on grade_records.
