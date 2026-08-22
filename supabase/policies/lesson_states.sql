-- lesson_states
--
-- POSITIVE: a student reads and advances their own lesson state; staff in scope
--           read it.
-- NEGATIVE: a student reads or writes no other student's lesson state; a
--           teacher writes none at all — status changes go through the guarded
--           transition function on the server, never a direct client update.
--
-- The client may update its own row, but the guarded transition function is the
-- only code that computes the next status; a hand-crafted update that skipped a
-- state would still have to satisfy the enum and would produce no evidence, no
-- grade, and no audit event, so it cannot manufacture completion.

create policy lesson_states_select_in_scope
  on public.lesson_states for select
  using (
    exists (
      select 1 from public.enrollments e
      where e.id = lesson_states.enrollment_id
        and (e.student_id = auth.uid() or public.can_read_student(e.student_id))
    )
  );
