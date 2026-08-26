-- ============================================================================
-- 0018 — Close the RPC surface to `anon` WITHOUT breaking the policies
-- ============================================================================
--
-- 0017 revoked EXECUTE on the scope helpers from `PUBLIC`, which is what
-- actually removes the privilege. It also broke every policy that calls one.
--
-- The correction, and the thing 0005 and 0017 both had wrong:
--
--   **A function referenced by an RLS policy IS permission-checked against the
--   role running the query.** A signed-in caller evaluating a policy that calls
--   `current_role_name()` needs EXECUTE on it. Without it the query does not
--   silently return nothing — it raises `permission denied for function`, and
--   every page that reads that table fails.
--
-- This was verified directly against this database, in both directions:
--
--   * Before 0017, `set role authenticated; select count(*) from organizations`
--     succeeded. That looked like proof the revoke was harmless. It was not:
--     0005 revoked only from `anon` and `authenticated`, neither of which held
--     the privilege directly, so nothing had been revoked at all and the grant
--     to `PUBLIC` was still doing the work.
--   * After 0017 the same query raised `permission denied for function
--     current_role_name`.
--
-- A TRIGGER function is different, and was tested separately: firing a trigger
-- performs no EXECUTE check on the invoking role, so `handle_new_auth_user`,
-- `reject_mutation`, and the guard triggers stay revoked from everyone and
-- still fire. Those are the ones that matter most — `handle_new_auth_user` is
-- SECURITY DEFINER and writes `public.users`.
--
-- So the split this migration lands on:
--
--   `anon`          no EXECUTE on anything. An unauthenticated caller can no
--                   longer probe the scope graph through `/rest/v1/rpc/...`,
--                   which is the hole 0005 set out to close.
--   `authenticated` EXECUTE on the policy helpers only, because the policies
--                   cannot work without it. This leaks nothing: every one of
--                   these functions answers about `auth.uid()` — the caller's
--                   own scope — which they can already determine by querying
--                   the tables the helpers guard.
--   `PUBLIC`        nothing, so no future role inherits a grant by default.
--
-- This also repairs 0006 and 0011, which wrote `from public, anon,
-- authenticated` on `version_is_draft`, `lesson_is_editable`, and
-- `structure_is_editable`. Those were correct about `PUBLIC` and wrong for the
-- same reason: the curriculum policies that call them would have raised for
-- every signed-in author. Applied and unexercised, it had not surfaced yet.
--
-- Forward-only.

-- --- Scope helpers (0003, redefined 0012) -----------------------------------
grant execute on function public.current_role_name()            to authenticated;
grant execute on function public.current_org()                  to authenticated;
grant execute on function public.current_site()                 to authenticated;
grant execute on function public.is_curriculum_author()         to authenticated;
grant execute on function public.students_in_scope()            to authenticated;
grant execute on function public.can_read_student(uuid)         to authenticated;
grant execute on function public.can_assign_intervention(uuid)  to authenticated;
grant execute on function public.can_enter_grade(uuid)          to authenticated;

-- --- Provisioning scope (0012) ----------------------------------------------
grant execute on function public.can_provision(public.user_role, uuid, uuid)
  to authenticated;

-- --- Curriculum draft rule (0006, 0011) — repairing those files -------------
grant execute on function public.version_is_draft(uuid)      to authenticated;
grant execute on function public.lesson_is_editable(uuid)    to authenticated;
grant execute on function public.structure_is_editable(uuid) to authenticated;

-- --- Storage path parsing (0013) --------------------------------------------
grant execute on function public.storage_object_owner(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Deliberately NOT granted back
-- ---------------------------------------------------------------------------
--
-- Trigger functions. Firing a trigger does not check EXECUTE, so these stay
-- unreachable over HTTP and keep working:
--
--   handle_new_auth_user, reject_mutation, reject_non_draft_content,
--   reject_non_draft_structure, reject_foreign_lesson_video,
--   reject_foreign_lesson_material, reject_placed_material_delete,
--   reject_placed_video_delete, guard_invitation_update, guard_user_update,
--   reject_second_account_for_address
--
-- `public.rls_auto_enable()` is platform-created and left alone (see 0005).

-- ---------------------------------------------------------------------------
-- What the linter still reports after this, and why it is left
-- ---------------------------------------------------------------------------
--
-- `authenticated_security_definer_function_executable` remains for every helper
-- granted above. That is the direct cost of the grant, not an oversight: the
-- policies cannot evaluate without it while the functions live in `public`,
-- which PostgREST exposes.
--
-- It leaks nothing. Each one answers a question about `auth.uid()` — the
-- caller's own role, organization, site, or scope — which a signed-in person can
-- already determine by querying the tables those helpers guard. There is no
-- argument by which a caller learns about anybody else: `can_read_student(x)`
-- returns whether THEY may read x, and returns false when they may not.
--
-- The clean fix is to move the helpers into a schema PostgREST does not expose
-- (conventionally `private`), which removes the RPC surface without touching
-- the grant. Policies survive that move — a policy expression stores the
-- function's OID, not its name — but the function BODIES do not: they call each
-- other as `public.current_role_name()`, `public.students_in_scope()`, and so
-- on, and those qualified references resolve by name at execution. Moving the
-- schema therefore means rewriting all thirteen bodies together, and getting it
-- half-right silently breaks every policy in the schema at once.
--
-- That is a focused change with a real blast radius, and it is worth doing on
-- its own with its own verification rather than folded into this correction.
--
-- `public.rls_auto_enable()` is still reported for `anon`. It is created by the
-- platform, not by this schema, and 0005 leaves it alone for that reason.
