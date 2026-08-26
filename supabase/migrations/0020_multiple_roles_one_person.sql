-- ============================================================================
-- 0020 — One person, several roles, one at a time
-- ============================================================================
--
-- Until now a profile held exactly one role, so a person who is genuinely a
-- district administrator AND teaches a section needed two accounts on two
-- addresses. In a small district that is the common case, not the exception —
-- a principal who teaches, a curriculum lead who administers a site — and two
-- logins for one human is worse than it sounds: it splits their audit trail
-- across two actors and makes "who did this" a question with two answers.
--
-- ---------------------------------------------------------------------------
-- What does NOT change
-- ---------------------------------------------------------------------------
--
-- The role set is still closed, and scope is still hierarchical (CLAUDE.md §3).
-- Every policy in this schema still resolves exactly ONE role for the caller,
-- because `current_role_name()` still returns exactly one. Nothing gains a
-- union of permissions: acting as a teacher grants teacher scope and nothing
-- else, and switching is an explicit, audited act.
--
-- The precedent is already in §3: "curriculum_author is a separate
-- authorization, not a hierarchy level. A user may hold it alongside any role."
-- This generalises that — held roles are grants, and one of them is active.
--
-- ---------------------------------------------------------------------------
-- The safety property
-- ---------------------------------------------------------------------------
--
-- `active_role` is a request for a hat, not the hat itself. It takes effect
-- ONLY if the person actually holds that role, and `current_role_name()` is
-- where that is decided — so a profile whose `active_role` was somehow set to
-- something ungranted resolves to their PRIMARY role, never to the role named.
-- Failing closed here means every policy in the schema fails closed with it,
-- without any of them being rewritten.
--
-- Granting is an org-admin act, recorded with a reason. Revoking is a state
-- transition; a grant row is never deleted.

-- ---------------------------------------------------------------------------
-- 1. Which roles a person may act as
-- ---------------------------------------------------------------------------

create table public.user_role_grants (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users (id),
  role               public.user_role not null,
  granted_by_user_id uuid references public.users (id),
  reason             text not null check (length(trim(reason)) > 0),
  granted_at         timestamptz not null default now(),
  revoked_at         timestamptz,
  revoked_reason     text,
  constraint role_grant_revocation_needs_reason
    check (revoked_at is null or coalesce(length(trim(revoked_reason)), 0) > 0)
);

create index on public.user_role_grants (user_id);

-- One live grant per role per person. A revoked one stays, so the record of
-- who could once do what survives (CLAUDE.md §6).
create unique index user_role_grants_one_live_per_role
  on public.user_role_grants (user_id, role)
  where revoked_at is null;

create trigger user_role_grants_no_delete
  before delete on public.user_role_grants
  for each row execute function public.reject_mutation();

-- Which hat is on right now. Null means "the primary role on `users.role`".
alter table public.users add column active_role public.user_role;

-- ---------------------------------------------------------------------------
-- 2. The roles a person actually holds
-- ---------------------------------------------------------------------------

create or replace function public.roles_held(target uuid)
returns setof public.user_role
language sql stable security definer set search_path = public
as $$
  select u.role
    from public.users u
   where u.id = target and u.deactivated_at is null
  union
  select g.role
    from public.user_role_grants g
    join public.users u on u.id = g.user_id
   where g.user_id = target
     and g.revoked_at is null
     and u.deactivated_at is null;
$$;

grant execute on function public.roles_held(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. The one function every policy in this schema depends on
-- ---------------------------------------------------------------------------
--
-- Returns the ACTIVE role when it is genuinely held, and the primary role
-- otherwise. There is no third outcome, and no path here returns a role the
-- person was not granted.

create or replace function public.current_role_name()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select u.active_role
       from public.users u
      where u.id = auth.uid()
        and u.deactivated_at is null
        and u.active_role is not null
        and u.active_role in (select public.roles_held(u.id))),
    (select u.role
       from public.users u
      where u.id = auth.uid() and u.deactivated_at is null)
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. Putting a different hat on
-- ---------------------------------------------------------------------------
--
-- SECURITY DEFINER on purpose, and paired with NO self-update policy on
-- `public.users`. The alternative — letting a person PATCH their own row —
-- would mean the only thing standing between them and an arbitrary column
-- change is a `with check` expression, and `users` carries role, organization,
-- and site. This way the client cannot write that table at all: it can only
-- ask this function, which decides, touches one column, and records it.

create or replace function public.switch_active_role(p_role public.user_role)
returns public.user_role
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_before public.user_role;
begin
  if v_uid is null then
    raise exception 'Not authorized: you are not signed in.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_role not in (select public.roles_held(v_uid)) then
    raise exception 'You do not hold the % role.', p_role
      using errcode = 'insufficient_privilege';
  end if;

  select coalesce(active_role, role) into v_before
    from public.users where id = v_uid;

  update public.users set active_role = p_role where id = v_uid;

  -- Which hat somebody was wearing is exactly the kind of thing an audit
  -- reader needs, so the switch itself is an event and not just a side effect.
  insert into public.audit_events (
    actor_user_id, actor_role, scope, action, target_entity, target_id,
    before_state, after_state, reason, idempotency_key, request_id
  ) values (
    v_uid, p_role, 'self', 'account.role_switched', 'user', v_uid::text,
    jsonb_build_object('active_role', v_before),
    jsonb_build_object('active_role', p_role),
    format('Switched to acting as %s.', p_role),
    'role.switch:' || v_uid::text || ':' || p_role::text || ':' || clock_timestamp()::text,
    'rpc:switch_active_role'
  );

  return p_role;
end;
$$;

grant execute on function public.switch_active_role(public.user_role) to authenticated;
revoke execute on function public.switch_active_role(public.user_role) from anon;

-- ---------------------------------------------------------------------------
-- 5. A profile update may now also change the active role
-- ---------------------------------------------------------------------------
--
-- Only `switch_active_role` can reach it — there is no RLS policy letting a
-- client update `users` for itself — but the guard has to stop refusing it.
-- Everything that decides SCOPE stays immutable.

create or replace function public.guard_user_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.org_id is distinct from old.org_id
     or new.site_id is distinct from old.site_id
     or new.first_name is distinct from old.first_name
     or new.last_name is distinct from old.last_name
     or new.role is distinct from old.role
     or new.curriculum_author is distinct from old.curriculum_author
     or new.grade_level is distinct from old.grade_level
     or new.created_at is distinct from old.created_at then
    raise exception
      'A profile''s identity, primary role, and scope are fixed. Change what someone may act as by granting a role, and change access by deactivating the profile.'
      using errcode = 'restrict_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_user_update() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. An invitation can describe the whole account
-- ---------------------------------------------------------------------------

alter table public.account_invitations
  add column additional_roles public.user_role[] not null default '{}';

-- The primary role is not also an "additional" one.
alter table public.account_invitations
  add constraint invitations_primary_role_not_repeated
  check (not (role = any (additional_roles)));

-- Listing a role twice would produce two grant rows for it and trip the
-- one-live-grant-per-role index at claim time — that is, it would fail LATER,
-- to the person signing up, for a mistake the administrator made. A CHECK
-- cannot express this (deduplicating needs a subquery, which CHECK forbids),
-- so it is a trigger, and it fails at the moment the invitation is issued.
create or replace function public.guard_invitation_role_set()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if array_length(new.additional_roles, 1) is not null
     and array_length(new.additional_roles, 1) <>
         (select count(distinct r) from unnest(new.additional_roles) as r) then
    raise exception 'A role is listed more than once on this invitation.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger account_invitations_distinct_roles
  before insert or update on public.account_invitations
  for each row execute function public.guard_invitation_role_set();

revoke execute on function public.guard_invitation_role_set()
  from public, anon, authenticated;

-- The site and grade rules now read the WHOLE role set, not just the primary.
-- A person who administers the district and teaches a section needs a site for
-- the teaching half; carrying one does an org admin no harm, because org-admin
-- policies resolve scope from the organization and never from the site.
alter table public.account_invitations drop constraint invitations_site_matches_role;
alter table public.account_invitations drop constraint invitations_grade_matches_role;

alter table public.account_invitations
  add constraint invitations_site_matches_role_set
  check (
    case
      when (additional_roles || role)
           && array['student','teacher','site_admin']::public.user_role[]
      then site_id is not null
      else true
    end
  );

alter table public.account_invitations
  add constraint invitations_grade_matches_role_set
  check (
    case
      when 'student' = any (additional_roles || role) then grade_level is not null
      else grade_level is null
    end
  );

-- ---------------------------------------------------------------------------
-- 7. Claiming an account also confers its granted roles
-- ---------------------------------------------------------------------------

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
  offered_code      text := upper(regexp_replace(
                              coalesce(new.raw_user_meta_data ->> 'claim_code', ''),
                              '[^A-Za-z0-9]', '', 'g'));
  issued_by         text;
  extra             public.user_role;
begin
  if provider not in ('email', 'google') then
    raise exception
      'Beyond.Ed accounts sign in with an email address and a password. The provider offered was "%".',
      provider
      using errcode = 'insufficient_privilege';
  end if;

  if normalized_email = '' then
    raise exception 'An account cannot be created without an email address.'
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

  if provider = 'email' and offered_code <> invite.claim_code then
    raise exception
      'That setup code does not match the account provisioned for %. Ask your district administrator to read it to you again.',
      normalized_email
      using errcode = 'insufficient_privilege';
  end if;

  insert into public.users (
    id, org_id, site_id, first_name, last_name, role, curriculum_author,
    grade_level, active_role
  ) values (
    new.id, invite.org_id, invite.site_id, invite.first_name, invite.last_name,
    invite.role, invite.curriculum_author, invite.grade_level, invite.role
  );

  foreach extra in array invite.additional_roles loop
    insert into public.user_role_grants (user_id, role, granted_by_user_id, reason)
    values (new.id, extra, invite.invited_by_user_id,
            'Granted with the invitation that created this account.');
  end loop;

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
    jsonb_build_object('invitation', invite.id, 'status', 'claimed',
                       'role', invite.role, 'provider', provider,
                       'additional_roles', invite.additional_roles),
    format('Sign-up from %s claimed the invitation issued by %s, via %s.',
           normalized_email, issued_by,
           case when provider = 'google' then 'a verified Google identity'
                else 'the setup code' end),
    'account.claim:' || invite.id::text,
    'auth:' || new.id::text
  );

  return new;
end;
$$;

revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. Row-level security on the grants
-- ---------------------------------------------------------------------------
--
-- POSITIVE: a person reads their own grants, which is what the role switcher
--           needs; an org admin reads and issues grants inside their
--           organization.
-- NEGATIVE: nobody reads another person's grants; a site admin, teacher,
--           student, or curriculum author issues none; nobody deletes one, and
--           nobody grants themselves anything, because `granted_by_user_id`
--           must be the caller and `can_provision` must admit the target.

alter table public.user_role_grants enable row level security;

create policy role_grants_select_own
  on public.user_role_grants for select
  using (user_id = auth.uid());

create policy role_grants_select_org_admin
  on public.user_role_grants for select
  using (
    public.current_role_name() = 'org_admin'
    and exists (
      select 1 from public.users u
      where u.id = user_role_grants.user_id and u.org_id = public.current_org()
    )
  );

create policy role_grants_insert_org_admin
  on public.user_role_grants for insert
  with check (
    public.current_role_name() = 'org_admin'
    and granted_by_user_id = auth.uid()
    and revoked_at is null
    and exists (
      select 1 from public.users u
      where u.id = user_role_grants.user_id and u.org_id = public.current_org()
    )
  );

create policy role_grants_update_org_admin
  on public.user_role_grants for update
  using (
    public.current_role_name() = 'org_admin'
    and exists (
      select 1 from public.users u
      where u.id = user_role_grants.user_id and u.org_id = public.current_org()
    )
  )
  with check (
    public.current_role_name() = 'org_admin'
    and exists (
      select 1 from public.users u
      where u.id = user_role_grants.user_id and u.org_id = public.current_org()
    )
  );

-- ---------------------------------------------------------------------------
-- 9. "What may I act as?" is the only role question a client may ask
-- ---------------------------------------------------------------------------
--
-- `roles_held(uuid)` answers about ANY person. That is right for the internals
-- that call it — `current_role_name` and `switch_active_role`, both about the
-- caller themselves — and wrong as an HTTP endpoint, where it would let any
-- signed-in person enumerate anybody's roles. So it comes off the public API,
-- and the one question a client legitimately asks gets a function that takes no
-- argument and can therefore only answer about `auth.uid()`.

create or replace function public.my_roles()
returns setof public.user_role
language sql stable security definer set search_path = public
as $$ select public.roles_held(auth.uid()); $$;

grant execute on function public.my_roles() to authenticated;
revoke execute on function public.my_roles() from anon;
revoke execute on function public.roles_held(uuid) from public, anon, authenticated;
