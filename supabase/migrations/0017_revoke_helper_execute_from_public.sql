-- ============================================================================
-- 0017 — Actually close the scope-helper RPC surface
-- ============================================================================
--
-- Migration 0005 set out to take the scope helpers off the public HTTP API, and
-- did not succeed. It revoked EXECUTE from `anon` and `authenticated`, which
-- looks complete and is not: PostgreSQL grants EXECUTE on every new function to
-- the pseudo-role `PUBLIC` by default, and `anon` and `authenticated` inherit it
-- from there. Revoking a privilege a role never held directly changes nothing.
--
-- The database linter confirmed it after 0005-0016 were applied: `anon` could
-- still reach `/rest/v1/rpc/can_read_student`, `/rest/v1/rpc/students_in_scope`,
-- `/rest/v1/rpc/current_org`, and the rest — the exact probe of the scope graph
-- 0005's own comment describes as the thing to prevent.
--
-- The tell was in the same report: NONE of the helpers added by 0006, 0010, and
-- 0011 were flagged, because those files wrote `from public, anon, authenticated`.
-- The three-role form is the one that works.
--
-- Revoking EXECUTE does not affect how these functions are actually used. They
-- are called from inside RLS policy expressions and from trigger firings,
-- neither of which checks the caller's EXECUTE privilege — verified directly
-- against this database rather than assumed.
--
-- Forward-only: this corrects 0005 by adding, never by editing it.
--
-- `public.rls_auto_enable()` is deliberately left alone. It is created by the
-- platform, not by this schema, and 0005 says so for the same reason.

-- --- The scope helpers (0003, redefined in 0012) -----------------------------
revoke execute on function public.current_role_name()            from public, anon, authenticated;
revoke execute on function public.current_org()                  from public, anon, authenticated;
revoke execute on function public.current_site()                 from public, anon, authenticated;
revoke execute on function public.is_curriculum_author()         from public, anon, authenticated;
revoke execute on function public.students_in_scope()            from public, anon, authenticated;
revoke execute on function public.can_read_student(uuid)         from public, anon, authenticated;
revoke execute on function public.can_assign_intervention(uuid)  from public, anon, authenticated;
revoke execute on function public.can_enter_grade(uuid)          from public, anon, authenticated;

-- --- Provisioning scope (0012) ----------------------------------------------
revoke execute on function public.can_provision(public.user_role, uuid, uuid)
  from public, anon, authenticated;

-- --- Trigger functions ------------------------------------------------------
--
-- A trigger function called directly over HTTP has no trigger context and would
-- error, so this closes a surface rather than a hole. `handle_new_auth_user` is
-- the one that matters: it is SECURITY DEFINER and it writes `public.users`.
revoke execute on function public.handle_new_auth_user()               from public, anon, authenticated;
revoke execute on function public.reject_mutation()                    from public, anon, authenticated;
revoke execute on function public.reject_non_draft_content()           from public, anon, authenticated;
revoke execute on function public.reject_foreign_lesson_video()        from public, anon, authenticated;
revoke execute on function public.guard_invitation_update()            from public, anon, authenticated;
revoke execute on function public.guard_user_update()                  from public, anon, authenticated;
revoke execute on function public.reject_second_account_for_address()  from public, anon, authenticated;

-- --- Storage path parsing (0013) --------------------------------------------
revoke execute on function public.storage_object_owner(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- What stays callable, and why
-- ---------------------------------------------------------------------------
--
-- `issue_invitation`, `revoke_invitation`, and `set_profile_active` keep their
-- grant to `authenticated`: they are the district administrator's three actions
-- and the application calls them over exactly this API. They are SECURITY
-- INVOKER, so calling one grants nothing a caller's own policies would not
-- already allow. `anon` was revoked from all three in 0014.
