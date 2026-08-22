-- ============================================================================
-- 0005 — Security hardening for the scope helpers and the append-only trigger
-- ============================================================================
--
-- Three findings from the database linter after 0001-0004, all real:
--
-- 1. `reject_mutation` had a mutable `search_path`. A SECURITY DEFINER-adjacent
--    function without a pinned search_path can be redirected by a caller's
--    schema, which is the standard Postgres privilege-escalation shape.
--
-- 2. The scope helpers are SECURITY DEFINER by necessity — a policy on `users`
--    cannot itself read `users` without recursing — but PostgREST exposes every
--    function in `public` as an RPC endpoint. That let `anon` call
--    `/rest/v1/rpc/can_read_student` and probe the scope graph directly. Only
--    the POLICIES need to call these; nobody needs to call them over HTTP.
--
-- 3. `rls_auto_enable` is created by the platform, not by this schema, so it is
--    left alone.
--
-- Forward-only: this corrects 0002 and 0003 by adding, never by editing them.

-- --- 1. Pin the search path on the append-only trigger function -------------
create or replace function public.reject_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception
    '% is append-only. % is not permitted. Append a new row that supersedes the original instead.',
    tg_table_name, tg_op
    using errcode = 'restrict_violation';
end;
$$;

-- --- 2. Take the scope helpers off the public API ---------------------------
-- They remain callable from inside policy expressions, which run as the
-- definer; revoking EXECUTE only closes the HTTP RPC surface.
revoke execute on function public.current_role_name()        from anon, authenticated;
revoke execute on function public.current_org()              from anon, authenticated;
revoke execute on function public.current_site()             from anon, authenticated;
revoke execute on function public.is_curriculum_author()     from anon, authenticated;
revoke execute on function public.students_in_scope()        from anon, authenticated;
revoke execute on function public.can_read_student(uuid)     from anon, authenticated;
revoke execute on function public.can_assign_intervention(uuid) from anon, authenticated;
revoke execute on function public.can_enter_grade(uuid)      from anon, authenticated;

-- --- 3. Pin the search path on the scope helpers too ------------------------
-- They already set `search_path = public`; making it explicit and empty-safe
-- keeps them consistent with the trigger function above.
alter function public.current_role_name()            set search_path = public;
alter function public.current_org()                  set search_path = public;
alter function public.current_site()                 set search_path = public;
alter function public.is_curriculum_author()         set search_path = public;
alter function public.students_in_scope()            set search_path = public;
alter function public.can_read_student(uuid)         set search_path = public;
alter function public.can_assign_intervention(uuid)  set search_path = public;
alter function public.can_enter_grade(uuid)          set search_path = public;
