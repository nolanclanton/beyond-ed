-- ============================================================================
-- 0014 — The three provisioning writes, as atomic Postgres functions
-- ============================================================================
--
-- Issuing an invitation, revoking one, and withdrawing a profile each change
-- more than one row: the record itself, its audit event, and the idempotency
-- key that makes a retry safe. supabase-js cannot span statements in one
-- transaction, and a partial write is a defect (CLAUDE.md §1), so each of these
-- is a Postgres function — a function body IS a transaction, which gives all
-- three properties at once:
--
--   * **Atomic.** The audit event is written in the same transaction as the
--     action. If the audit insert fails, the action fails. There is no
--     unaudited path (CLAUDE.md §6).
--   * **Scoped.** They are SECURITY INVOKER, deliberately. Every statement
--     inside runs as the caller and is filtered by the same row-level security
--     policies a direct query would hit, so these functions grant no authority
--     of their own — a site admin calling `issue_invitation` for another site
--     is refused by the policy, not by a check someone remembered to write.
--   * **Idempotent.** Every consequential write takes a client-supplied key. A
--     retry returns the id the first attempt produced instead of creating a
--     second record.
--
-- The service-role key is not involved in any of this, and does not need to be.

-- ---------------------------------------------------------------------------
-- 1. Issue an invitation
-- ---------------------------------------------------------------------------

create or replace function public.issue_invitation(
  p_email             text,
  p_role              public.user_role,
  p_first_name        text,
  p_last_name         text,
  p_site_id           uuid,
  p_grade_level       smallint,
  p_curriculum_author boolean,
  p_reason            text,
  p_idempotency_key   text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_existing text;
  v_id       uuid;
  v_email    text := lower(trim(coalesce(p_email, '')));
  v_org      uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authorized: you are not signed in.'
      using errcode = 'insufficient_privilege';
  end if;

  if coalesce(length(trim(p_reason)), 0) = 0 then
    raise exception 'Provisioning an account requires a reason.'
      using errcode = 'check_violation';
  end if;

  -- A retry returns the first attempt's result rather than a second account.
  select result_id into v_existing
    from public.idempotency_keys
   where key = p_idempotency_key;
  if v_existing is not null then
    return v_existing::uuid;
  end if;

  -- The organization is never taken from the caller's input; it is read from
  -- the caller's own profile, so an administrator cannot provision into a
  -- district they do not belong to even if they craft the request by hand.
  v_org := public.current_org();
  if v_org is null then
    raise exception 'Not authorized: your profile resolves to no organization.'
      using errcode = 'insufficient_privilege';
  end if;

  v_id := gen_random_uuid();

  -- Claiming the key BEFORE the insert means a genuinely simultaneous double
  -- submit aborts the whole function on the primary-key conflict, leaving
  -- nothing behind, rather than creating two invitations for one person.
  insert into public.idempotency_keys (key, action, result_id, actor_user_id)
  values (p_idempotency_key, 'invitation.issue', v_id::text, auth.uid());

  -- `invitations_insert_admin` decides whether this is allowed. A site admin
  -- naming a role they may not grant is refused HERE, by the policy.
  insert into public.account_invitations (
    id, org_id, site_id, email, role, curriculum_author,
    first_name, last_name, grade_level, status, invited_by_user_id
  ) values (
    v_id, v_org, p_site_id, v_email, p_role, coalesce(p_curriculum_author, false),
    trim(p_first_name), trim(p_last_name), p_grade_level, 'pending', auth.uid()
  );

  insert into public.audit_events (
    actor_user_id, actor_role, scope, action, target_entity, target_id,
    before_state, after_state, reason, idempotency_key, request_id
  ) values (
    auth.uid(),
    public.current_role_name(),
    coalesce(public.current_site()::text, v_org::text),
    'account.invitation.issued',
    'account_invitation',
    v_id::text,
    null,
    jsonb_build_object(
      'email', v_email, 'role', p_role, 'site_id', p_site_id,
      'grade_level', p_grade_level,
      'curriculum_author', coalesce(p_curriculum_author, false)
    ),
    trim(p_reason),
    p_idempotency_key,
    'rpc:issue_invitation:' || p_idempotency_key
  );

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Revoke a pending invitation
-- ---------------------------------------------------------------------------
--
-- Never a delete. The row stays, recording that the address was provisioned,
-- by whom, and why it was withdrawn (CLAUDE.md §6).

create or replace function public.revoke_invitation(
  p_invitation_id   uuid,
  p_reason          text,
  p_idempotency_key text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_existing text;
  v_before   jsonb;
  v_updated  uuid;
begin
  if coalesce(length(trim(p_reason)), 0) = 0 then
    raise exception 'Revoking an invitation requires a reason.'
      using errcode = 'check_violation';
  end if;

  select result_id into v_existing
    from public.idempotency_keys
   where key = p_idempotency_key;
  if v_existing is not null then
    return v_existing::uuid;
  end if;

  -- Readable only if a select policy admits it, which is the same scope test
  -- the update policy applies below.
  select jsonb_build_object('status', status, 'email', email, 'role', role)
    into v_before
    from public.account_invitations
   where id = p_invitation_id;

  if v_before is null then
    raise exception 'That invitation does not exist, or it is outside your scope.'
      using errcode = 'no_data_found';
  end if;

  insert into public.idempotency_keys (key, action, result_id, actor_user_id)
  values (p_idempotency_key, 'invitation.revoke', p_invitation_id::text, auth.uid());

  -- The `account_invitations_guard_update` trigger rejects anything that is not
  -- Pending -> Revoked, so an already-claimed invitation cannot be quietly
  -- withdrawn here; that requires deactivating the profile it produced.
  update public.account_invitations
     set status         = 'revoked',
         revoked_at     = now(),
         revoked_reason = trim(p_reason)
   where id = p_invitation_id
   returning id into v_updated;

  if v_updated is null then
    raise exception 'That invitation could not be revoked.'
      using errcode = 'insufficient_privilege';
  end if;

  insert into public.audit_events (
    actor_user_id, actor_role, scope, action, target_entity, target_id,
    before_state, after_state, reason, idempotency_key, request_id
  ) values (
    auth.uid(),
    public.current_role_name(),
    coalesce(public.current_site()::text, public.current_org()::text),
    'account.invitation.revoked',
    'account_invitation',
    p_invitation_id::text,
    v_before,
    jsonb_build_object('status', 'revoked'),
    trim(p_reason),
    p_idempotency_key,
    'rpc:revoke_invitation:' || p_idempotency_key
  );

  return p_invitation_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Withdraw or restore access to a profile
-- ---------------------------------------------------------------------------
--
-- The claimed half of revocation. A person who has already signed in has a
-- profile, and withdrawing their access means deactivating it — which the scope
-- helpers in 0012 then read as "no role", so every policy denies them. Their
-- records stay exactly where they are.

create or replace function public.set_profile_active(
  p_user_id         uuid,
  p_active          boolean,
  p_reason          text,
  p_idempotency_key text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_existing text;
  v_before   jsonb;
  v_updated  uuid;
begin
  if coalesce(length(trim(p_reason)), 0) = 0 then
    raise exception 'Changing someone''s access requires a reason.'
      using errcode = 'check_violation';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot withdraw your own access.'
      using errcode = 'check_violation';
  end if;

  select result_id into v_existing
    from public.idempotency_keys
   where key = p_idempotency_key;
  if v_existing is not null then
    return v_existing::uuid;
  end if;

  select jsonb_build_object(
           'deactivated_at', deactivated_at,
           'role', role,
           'site_id', site_id
         )
    into v_before
    from public.users
   where id = p_user_id;

  if v_before is null then
    raise exception 'That person does not exist, or they are outside your scope.'
      using errcode = 'no_data_found';
  end if;

  insert into public.idempotency_keys (key, action, result_id, actor_user_id)
  values (p_idempotency_key, 'profile.set_active', p_user_id::text, auth.uid());

  -- `users_guard_update` confines this to the deactivation columns: role,
  -- organization, and site cannot move through this path even by accident.
  update public.users
     set deactivated_at     = case when p_active then null else now() end,
         deactivated_reason = case when p_active then null else trim(p_reason) end
   where id = p_user_id
   returning id into v_updated;

  if v_updated is null then
    raise exception 'That person''s access could not be changed.'
      using errcode = 'insufficient_privilege';
  end if;

  insert into public.audit_events (
    actor_user_id, actor_role, scope, action, target_entity, target_id,
    before_state, after_state, reason, idempotency_key, request_id
  ) values (
    auth.uid(),
    public.current_role_name(),
    coalesce(public.current_site()::text, public.current_org()::text),
    case when p_active then 'account.restored' else 'account.withdrawn' end,
    'user',
    p_user_id::text,
    v_before,
    jsonb_build_object('active', p_active),
    trim(p_reason),
    p_idempotency_key,
    'rpc:set_profile_active:' || p_idempotency_key
  );

  return p_user_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
--
-- These three are the only functions in this schema an ordinary caller is meant
-- to invoke over HTTP, so unlike the scope helpers (migration 0005) their
-- EXECUTE grant stays. Being SECURITY INVOKER, calling one grants nothing that
-- the caller's own policies would not already allow.

revoke execute on function public.issue_invitation(
  text, public.user_role, text, text, uuid, smallint, boolean, text, text
) from anon;
revoke execute on function public.revoke_invitation(uuid, text, text) from anon;
revoke execute on function public.set_profile_active(uuid, boolean, text, text) from anon;
