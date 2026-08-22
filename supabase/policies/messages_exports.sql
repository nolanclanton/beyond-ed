-- teacher_messages, export_records, idempotency_keys
--
-- POSITIVE: a student reads messages addressed to them and sends a help
--           request; a teacher sends to students in their sections; an org
--           admin records a purpose-bound export.
-- NEGATIVE: a student reads no message addressed to another student and cannot
--           send to one; a teacher cannot message a student outside their
--           roster; a teacher or site admin cannot record an export; nobody
--           updates or deletes an export record.

create policy teacher_messages_select_own
  on public.teacher_messages for select
  using (to_student_id = auth.uid() or from_user_id = auth.uid()
         or public.can_read_student(to_student_id));

create policy teacher_messages_insert_help_request
  on public.teacher_messages for insert
  with check (
    from_user_id = auth.uid()
    and to_student_id = auth.uid()
    and is_help_request
  );

create policy teacher_messages_insert_by_teacher
  on public.teacher_messages for insert
  with check (
    from_user_id = auth.uid()
    and public.current_role_name() in ('teacher', 'site_admin')
    and public.can_read_student(to_student_id)
  );

create policy export_records_select_org_admin
  on public.export_records for select
  using (public.current_role_name() = 'org_admin');

create policy export_records_insert_org_admin
  on public.export_records for insert
  with check (
    public.current_role_name() = 'org_admin'
    and requested_by_user_id = auth.uid()
  );

create policy idempotency_keys_own
  on public.idempotency_keys for select
  using (actor_user_id = auth.uid());

create policy idempotency_keys_insert_own
  on public.idempotency_keys for insert
  with check (actor_user_id = auth.uid());
