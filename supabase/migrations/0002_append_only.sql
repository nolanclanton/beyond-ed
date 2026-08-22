-- ============================================================================
-- Append-only enforcement (CLAUDE.md §5, §6)
-- ============================================================================
--
-- `evidence`, `audit_events`, and `grade_records` are insert-only. This is
-- enforced in the database, not only in application code, so no future feature,
-- migration, or console session can quietly rewrite history.
--
-- Corrections are new rows: `supersedes_evidence_id` on evidence,
-- `supersedes_grade_id` on grade records. The original stays readable forever.

create or replace function public.reject_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception
    '% is append-only. % is not permitted. Append a new row that supersedes the original instead.',
    tg_table_name, tg_op
    using errcode = 'restrict_violation';
end;
$$;

create trigger evidence_no_update
  before update on public.evidence
  for each row execute function public.reject_mutation();

create trigger evidence_no_delete
  before delete on public.evidence
  for each row execute function public.reject_mutation();

create trigger audit_events_no_update
  before update on public.audit_events
  for each row execute function public.reject_mutation();

create trigger audit_events_no_delete
  before delete on public.audit_events
  for each row execute function public.reject_mutation();

create trigger grade_records_no_update
  before update on public.grade_records
  for each row execute function public.reject_mutation();

create trigger grade_records_no_delete
  before delete on public.grade_records
  for each row execute function public.reject_mutation();

-- Nothing in this system is hard-deleted. Removal is a state transition plus an
-- audit event (CLAUDE.md §6), so enrollments cannot be deleted either.
create trigger enrollments_no_delete
  before delete on public.enrollments
  for each row execute function public.reject_mutation();

create trigger export_records_no_update
  before update on public.export_records
  for each row execute function public.reject_mutation();

create trigger export_records_no_delete
  before delete on public.export_records
  for each row execute function public.reject_mutation();
