-- skill_profiles, mastery_estimates, mastery_confidence
--
-- POSITIVE: a student reads their own readiness estimates and their confidence;
--           staff in scope read them.
-- NEGATIVE: a student reads no other student's estimates; nobody writes from
--           the client — estimates are computed server-side from evidence and
--           stored with their rule version and inputs.
--
-- Confidence lives in its own table so a query cannot accidentally return an
-- estimate without it (CLAUDE.md §4). Nothing here joins to grade_records.

create policy skill_profiles_select_in_scope
  on public.skill_profiles for select
  using (student_id = auth.uid() or public.can_read_student(student_id));

create policy mastery_estimates_select_in_scope
  on public.mastery_estimates for select
  using (
    exists (
      select 1 from public.skill_profiles p
      where p.id = mastery_estimates.skill_profile_id
        and (p.student_id = auth.uid() or public.can_read_student(p.student_id))
    )
  );

create policy mastery_confidence_select_in_scope
  on public.mastery_confidence for select
  using (
    exists (
      select 1
      from public.mastery_estimates m
      join public.skill_profiles p on p.id = m.skill_profile_id
      where m.id = mastery_confidence.mastery_estimate_id
        and (p.student_id = auth.uid() or public.can_read_student(p.student_id))
    )
  );
