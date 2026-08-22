-- audit_events — INSERT and SELECT only, and readable by very few
--
-- POSITIVE: an org admin reads every event in their organization; any actor
--           reads their own events; every authenticated actor may insert an
--           event attributed to themselves, because the audit write happens in
--           the same transaction as the action it records.
-- NEGATIVE: a student, teacher, site admin, or curriculum author reads no event
--           they did not perform; nobody inserts an event attributed to someone
--           else; NOBODY updates or deletes — audit is writable by no one after
--           the fact, including an administrator.

create policy audit_events_select_own
  on public.audit_events for select
  using (actor_user_id = auth.uid());

create policy audit_events_select_org_admin
  on public.audit_events for select
  using (
    public.current_role_name() = 'org_admin'
    and exists (
      select 1 from public.users u
      where u.id = audit_events.actor_user_id and u.org_id = public.current_org()
    )
  );

create policy audit_events_insert_self_attributed
  on public.audit_events for insert
  with check (actor_user_id = auth.uid() and length(trim(reason)) > 0);

-- Deliberately absent: any UPDATE or DELETE policy.
