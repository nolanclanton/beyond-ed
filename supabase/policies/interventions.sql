-- interventions
--
-- POSITIVE: a student reads their own plans and advances their own through the
--           lifecycle; a teacher reads and assigns for students in their
--           sections; a SITE ADMIN may assign at their own site when a teacher
--           queue item is unresolved.
-- NEGATIVE: a student reads no other student's plan and cannot create one — a
--           recommendation is a proposal and only a human with authority turns
--           it into a plan; a teacher cannot assign outside their roster; an
--           ORG ADMIN cannot assign at all; nobody deletes a plan.
--
-- The decision reason is required by a table constraint as well as by policy.

create policy interventions_select_in_scope
  on public.interventions for select
  using (student_id = auth.uid() or public.can_read_student(student_id));

create policy interventions_insert_by_decider
  on public.interventions for insert
  with check (
    public.can_assign_intervention(student_id)
    and decided_by_user_id = auth.uid()
    and length(trim(coalesce(decision_reason, ''))) > 0
  );

create policy interventions_update_by_decider
  on public.interventions for update
  using (public.can_assign_intervention(student_id))
  with check (public.can_assign_intervention(student_id));

-- A student moves their own plan through start, readiness check, and transfer
-- check. They cannot change its target, its return destination, or its rule.
create policy interventions_update_own_progress
  on public.interventions for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());
