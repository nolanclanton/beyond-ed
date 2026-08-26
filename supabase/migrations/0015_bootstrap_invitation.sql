-- ============================================================================
-- 0015 — The first administrator
-- ============================================================================
--
-- Corrects a real gap in 0012, found by testing the gate rather than reading it.
--
-- 0012 made `account_invitations.invited_by_user_id` NOT NULL, which is right
-- for every invitation but one: the first. A district's first organization
-- administrator has nobody to invite them, `public.users` is empty, and the
-- `on_auth_user_created` trigger cannot be disabled to insert them by hand
-- (nothing short of the table owner may, and the platform owns `auth.users`).
-- The result was a database in which no account could ever be created.
--
-- The fix is to let exactly one shape of invitation exist without an inviter:
--
--   * `invited_by_user_id` may be null, and
--   * a null inviter is permitted ONLY for an `org_admin`.
--
-- That is safe because of where a null can come from. The
-- `invitations_insert_admin` policy requires `invited_by_user_id = auth.uid()`,
-- and `auth.uid()` is never null for a policy-checked insert — so no client,
-- with any role, can ever write one. A null inviter can only be produced by a
-- session that bypasses RLS entirely: the project owner in the SQL editor, which
-- is precisely the person entitled to name the first administrator.
--
-- The bootstrap is therefore one INSERT, documented in SUPABASE_SETUP.md, and
-- it grants the narrowest thing that can grow the rest of the district.
--
-- Forward-only: this relaxes a constraint and replaces one function body.

-- ---------------------------------------------------------------------------
-- 1. Allow the inviter to be absent, for an org admin only
-- ---------------------------------------------------------------------------

alter table public.account_invitations
  alter column invited_by_user_id drop not null;

alter table public.account_invitations
  add constraint invitations_bootstrap_is_org_admin_only
  check (invited_by_user_id is not null or role = 'org_admin');

-- ---------------------------------------------------------------------------
-- 2. The claim trigger describes a bootstrap honestly
-- ---------------------------------------------------------------------------
--
-- Identical to 0012 apart from the audit reason, which previously interpolated
-- `invite.invited_by_user_id` directly and would have rendered an empty string
-- for the bootstrap row. An audit event that says who issued an invitation
-- should say "nobody, this was the first account" when that is the truth.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite            public.account_invitations%rowtype;
  normalized_email  text := lower(trim(coalesce(new.email, '')));
  provider          text := coalesce(new.raw_app_meta_data ->> 'provider', '');
  issued_by         text;
begin
  if provider <> 'google' then
    raise exception
      'Beyond.Ed accounts sign in with Google. The provider offered was "%".', provider
      using errcode = 'insufficient_privilege';
  end if;

  if normalized_email = '' then
    raise exception 'A Google identity with no email address cannot be provisioned.'
      using errcode = 'insufficient_privilege';
  end if;

  select * into invite
  from public.account_invitations
  where email = normalized_email
    and status = 'pending'
  for update;

  if not found then
    raise exception
      'No Beyond.Ed account is provisioned for %. A district administrator creates accounts; there is no self sign-up.',
      normalized_email
      using errcode = 'insufficient_privilege';
  end if;

  insert into public.users (
    id, org_id, site_id, first_name, last_name, role, curriculum_author, grade_level
  ) values (
    new.id, invite.org_id, invite.site_id, invite.first_name, invite.last_name,
    invite.role, invite.curriculum_author, invite.grade_level
  );

  update public.account_invitations
     set status             = 'claimed',
         claimed_by_user_id = new.id,
         claimed_at         = now()
   where id = invite.id;

  issued_by := coalesce(
    invite.invited_by_user_id::text,
    'the project owner, as the district''s first administrator'
  );

  insert into public.audit_events (
    actor_user_id, actor_role, scope, action, target_entity, target_id,
    before_state, after_state, reason, idempotency_key, request_id
  ) values (
    new.id,
    invite.role,
    'self',
    'account.claimed',
    'user',
    new.id::text,
    jsonb_build_object('invitation', invite.id, 'status', 'pending'),
    jsonb_build_object('invitation', invite.id, 'status', 'claimed', 'role', invite.role),
    format('Google sign-in from %s claimed the invitation issued by %s.',
           normalized_email, issued_by),
    'account.claim:' || invite.id::text,
    'auth:' || new.id::text
  );

  return new;
end;
$$;
