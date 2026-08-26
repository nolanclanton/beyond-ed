-- ============================================================================
-- 0012 — Account provisioning: Google-only sign-in, invitation-only accounts
-- ============================================================================
--
-- Two rules, both enforced HERE rather than in the interface, because a rule a
-- server action checks is a rule a future code path forgets (CLAUDE.md §0.2 —
-- roles and permissions are enforced at the database layer, not just the UI).
--
--  1. **Google only.** A Beyond.Ed identity is a Google identity. There is no
--     password column, no password reset, and no email/password grant anywhere
--     in this system. `handle_new_auth_user` rejects any `auth.users` insert
--     whose provider is not `google`, so disabling the other providers in the
--     dashboard is a convenience, not the control.
--
--  2. **Accounts are created by a district administrator, never by the person
--     signing in.** There is no self-signup. An administrator issues an
--     invitation naming the Gmail address, the role, the site, and the grade;
--     the FIRST Google sign-in from that address claims it and becomes the
--     `public.users` profile. A sign-in from an address with no pending
--     invitation raises, which aborts the transaction that would have created
--     the `auth.users` row — so an unprovisioned person does not get a
--     half-made account, they get no account at all.
--
-- Revocation is a state transition, never a delete (CLAUDE.md §6). A pending
-- invitation is revoked; a claimed one is revoked by deactivating the profile
-- it produced, which the scope helpers below then treat as having no role, no
-- organization, and no site — so RLS denies that person everything.
--
-- Forward-only. To correct anything here, add a new migration.

-- ---------------------------------------------------------------------------
-- 1. Profiles can be deactivated
-- ---------------------------------------------------------------------------
--
-- Staff leave and students transfer out. Nothing is hard-deleted, so access is
-- withdrawn by setting these two columns and writing an audit event.

alter table public.users
  add column deactivated_at     timestamptz,
  add column deactivated_reason text;

alter table public.users
  add constraint users_deactivation_needs_reason
  check (
    deactivated_at is null
    or coalesce(length(trim(deactivated_reason)), 0) > 0
  );

create index on public.users (deactivated_at);

-- ---------------------------------------------------------------------------
-- 2. The invitation roster
-- ---------------------------------------------------------------------------

create type public.invitation_status as enum ('pending', 'claimed', 'revoked');

create table public.account_invitations (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organizations (id),
  -- Students, teachers, and site admins belong to one site. Org admins and
  -- curriculum authors do not — same rule as `public.users`.
  site_id             uuid references public.sites (id),
  -- Always stored lowercased so the lookup in `handle_new_auth_user` is exact.
  email               text not null,
  role                public.user_role not null,
  curriculum_author   boolean not null default false,
  first_name          text not null check (length(trim(first_name)) > 0),
  last_name           text not null check (length(trim(last_name)) > 0),
  grade_level         smallint check (grade_level between 6 and 12),
  status              public.invitation_status not null default 'pending',
  invited_by_user_id  uuid not null references public.users (id),
  claimed_by_user_id  uuid references public.users (id),
  claimed_at          timestamptz,
  revoked_at          timestamptz,
  revoked_reason      text,
  created_at          timestamptz not null default now(),

  constraint invitations_email_is_lowercased
    check (email = lower(trim(email))),
  -- Deliberately permissive on the local part; the provider check in
  -- `handle_new_auth_user` is what actually decides whether an address is a
  -- usable Google identity.
  constraint invitations_email_shape
    check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint invitations_site_matches_role
    check (
      case
        when role in ('org_admin', 'curriculum_author') then site_id is null
        else site_id is not null
      end
    ),
  constraint invitations_grade_matches_role
    check (
      case when role = 'student' then grade_level is not null
           else grade_level is null
      end
    ),
  constraint invitations_revocation_needs_reason
    check (
      status <> 'revoked'
      or coalesce(length(trim(revoked_reason)), 0) > 0
    ),
  constraint invitations_claim_is_recorded
    check (
      (status = 'claimed') = (claimed_by_user_id is not null and claimed_at is not null)
    )
);

create index on public.account_invitations (org_id);
create index on public.account_invitations (site_id);
create index on public.account_invitations (status);

-- One OPEN invitation per address. A revoked or claimed row stays forever, so
-- the roster records that the address was once provisioned and by whom, and a
-- second person cannot be invited onto an address already awaiting its claim.
create unique index account_invitations_one_pending_per_email
  on public.account_invitations (email)
  where status = 'pending';

-- An address is claimed once. Re-inviting a person who already signed in would
-- produce a second profile for one human being.
create unique index account_invitations_one_claim_per_email
  on public.account_invitations (email)
  where status = 'claimed';

-- ---------------------------------------------------------------------------
-- 3. Guarded transitions (CLAUDE.md §9)
-- ---------------------------------------------------------------------------
--
-- An invitation moves Pending -> Claimed or Pending -> Revoked, and nowhere
-- else. Its identity, role, and scope are fixed when it is issued: changing the
-- role on a pending invitation would be a silent privilege grant that no audit
-- event describes. To correct a mistake, revoke it and issue another.

create or replace function public.guard_invitation_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.email is distinct from old.email
     or new.org_id is distinct from old.org_id
     or new.site_id is distinct from old.site_id
     or new.role is distinct from old.role
     or new.curriculum_author is distinct from old.curriculum_author
     or new.grade_level is distinct from old.grade_level
     or new.invited_by_user_id is distinct from old.invited_by_user_id
     or new.created_at is distinct from old.created_at then
    raise exception
      'An invitation''s address, role, and scope are fixed when it is issued. Revoke it and issue a new one.'
      using errcode = 'restrict_violation';
  end if;

  if old.status = 'pending' and new.status in ('claimed', 'revoked') then
    return new;
  end if;

  raise exception 'Illegal invitation transition: % -> %.', old.status, new.status
    using errcode = 'restrict_violation';
end;
$$;

create trigger account_invitations_guard_update
  before update on public.account_invitations
  for each row execute function public.guard_invitation_update();

-- Nothing is hard-deleted. A mistaken invitation is revoked, with a reason.
create trigger account_invitations_no_delete
  before delete on public.account_invitations
  for each row execute function public.reject_mutation();

-- ---------------------------------------------------------------------------
-- 4. Profiles change by deactivation only
-- ---------------------------------------------------------------------------
--
-- `public.users` carries role, organization, and site — the three things every
-- RLS policy in this schema resolves scope from. Letting an administrator PATCH
-- that row from the client would make role escalation a single request, so the
-- only columns an update may touch are the deactivation pair. A genuine role
-- change is a new invitation, which is audited and leaves the old profile
-- readable.

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
      'A profile''s identity, role, and scope are fixed. Change access by deactivating this profile and provisioning a new one.'
      using errcode = 'restrict_violation';
  end if;
  return new;
end;
$$;

create trigger users_guard_update
  before update on public.users
  for each row execute function public.guard_user_update();

create trigger users_no_delete
  before delete on public.users
  for each row execute function public.reject_mutation();

-- ---------------------------------------------------------------------------
-- 5. The gate: what happens when someone signs in with Google
-- ---------------------------------------------------------------------------
--
-- Runs inside the transaction that creates the `auth.users` row. Every `raise`
-- below aborts that transaction, so a rejected person leaves no trace in
-- `auth.users` and can be provisioned later without a collision.
--
-- SECURITY DEFINER because it writes `public.users` and reads the invitation
-- roster before the caller has any profile to be scoped by. `search_path` is
-- pinned empty and every name is schema-qualified (the finding corrected in
-- migration 0005).

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
begin
  -- 1. Google identities only. This is the control, not the dashboard toggle.
  if provider <> 'google' then
    raise exception
      'Beyond.Ed accounts sign in with Google. The provider offered was "%".', provider
      using errcode = 'insufficient_privilege';
  end if;

  if normalized_email = '' then
    raise exception 'A Google identity with no email address cannot be provisioned.'
      using errcode = 'insufficient_privilege';
  end if;

  -- 2. There must be an invitation waiting. `for update` holds it so two
  --    simultaneous sign-ins cannot both claim the same row.
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

  -- 3. The invitation becomes the profile. Role, site, and grade come from what
  --    the administrator recorded, never from anything the browser sent.
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

  -- 4. An account coming into existence is an attributable event, written in
  --    the same transaction as the action (CLAUDE.md §6). If this insert fails,
  --    the sign-in fails: there is no unaudited path to a profile.
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
           normalized_email, invite.invited_by_user_id),
    'account.claim:' || invite.id::text,
    'auth:' || new.id::text
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- 6. A deactivated profile resolves to no scope at all
-- ---------------------------------------------------------------------------
--
-- Redefines the helpers from migration 0003 so every policy in the schema
-- inherits the rule without being rewritten: a deactivated person has no role,
-- so `current_role_name()` is null, so every `case` in `students_in_scope`
-- falls through to `false` and every policy that names a role fails to match.
-- Their rows stay readable to their administrators; they can read nothing.

create or replace function public.current_role_name()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.users
   where id = auth.uid() and deactivated_at is null;
$$;

create or replace function public.current_org()
returns uuid
language sql stable security definer set search_path = public
as $$
  select org_id from public.users
   where id = auth.uid() and deactivated_at is null;
$$;

create or replace function public.current_site()
returns uuid
language sql stable security definer set search_path = public
as $$
  select site_id from public.users
   where id = auth.uid() and deactivated_at is null;
$$;

create or replace function public.is_curriculum_author()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select curriculum_author from public.users
      where id = auth.uid() and deactivated_at is null),
    false);
$$;

-- Who may issue an invitation, and for whom. An org admin provisions anyone in
-- their organization. A site admin provisions students and teachers at their
-- own site and NOTHING ELSE — a site admin who could invite an org admin could
-- promote themselves in two steps.
create or replace function public.can_provision(
  target_role  public.user_role,
  target_org   uuid,
  target_site  uuid
)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case public.current_role_name()
    when 'org_admin' then target_org = public.current_org()
    when 'site_admin' then
      target_role in ('student', 'teacher')
      and target_org  = public.current_org()
      and target_site = public.current_site()
    else false
  end;
$$;

revoke execute on function public.can_provision(public.user_role, uuid, uuid)
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Row-level security
-- ---------------------------------------------------------------------------

alter table public.account_invitations enable row level security;

-- Administrators read the roster they are responsible for.
create policy invitations_select_org_admin
  on public.account_invitations for select
  using (public.current_role_name() = 'org_admin' and org_id = public.current_org());

create policy invitations_select_site_admin
  on public.account_invitations for select
  using (public.current_role_name() = 'site_admin' and site_id = public.current_site());

-- A person may read the invitation that produced their own profile, and nothing
-- else. This is what lets the sign-in page say "your account was provisioned by
-- your district" without exposing the roster.
create policy invitations_select_own_claim
  on public.account_invitations for select
  using (claimed_by_user_id = auth.uid());

-- Issuing. `with check` is the privilege boundary: a site admin literally
-- cannot write a row naming a role they are not allowed to grant.
create policy invitations_insert_admin
  on public.account_invitations for insert
  with check (
    public.can_provision(role, org_id, site_id)
    and invited_by_user_id = auth.uid()
    and status = 'pending'
    and claimed_by_user_id is null
    -- A site admin may not grant curriculum authorization; it is a separate
    -- authorization from hierarchy and only an org admin confers it.
    and (curriculum_author = false or public.current_role_name() = 'org_admin')
  );

-- Revoking. The guard trigger already restricts WHICH transitions are legal;
-- this restricts WHO may attempt one.
create policy invitations_update_admin
  on public.account_invitations for update
  using (public.can_provision(role, org_id, site_id))
  with check (public.can_provision(role, org_id, site_id));

-- Deactivating a profile. Same boundary: an org admin within their
-- organization, a site admin within their site and only over students and
-- teachers. The guard trigger confines the update to the deactivation columns.
create policy users_update_deactivation_org_admin
  on public.users for update
  using (public.current_role_name() = 'org_admin' and org_id = public.current_org())
  with check (public.current_role_name() = 'org_admin' and org_id = public.current_org());

create policy users_update_deactivation_site_admin
  on public.users for update
  using (
    public.current_role_name() = 'site_admin'
    and site_id = public.current_site()
    and role in ('student', 'teacher')
  )
  with check (
    public.current_role_name() = 'site_admin'
    and site_id = public.current_site()
    and role in ('student', 'teacher')
  );
