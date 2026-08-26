-- ============================================================================
-- 0019 — Email sign-up, proven by a claim code the district hands over
-- ============================================================================
--
-- Replaces the Google-only rule from 0012/0015. The reason is practical: a
-- Google identity meant a Google Cloud OAuth client, a consent screen, and a
-- client secret before anybody could sign in at all. This district wants to add
-- an address and have that person able to log in.
--
-- **What does NOT change, and is the part that matters:** an account still
-- exists only because a district administrator provisioned it. The trigger
-- below still refuses any sign-up whose address has no pending invitation, and
-- still builds the profile from the invitation rather than from anything the
-- browser sent. That was never Google's job — it was the invitation's — so
-- dropping Google leaves the invariant exactly where it was.
--
-- ---------------------------------------------------------------------------
-- Why a claim code, and not just an email address
-- ---------------------------------------------------------------------------
--
-- Without one, "sign up with an invited address" is a race the wrong person can
-- win. District addresses are guessable — firstname.lastname@district.org — so
-- anyone who guessed a pending address could claim it first and receive that
-- person's role, school, and scope. For a student account that is bad; for a
-- teacher or administrator account it is a privilege escalation.
--
-- The usual fix is email confirmation, which proves the claimant controls the
-- inbox. That needs a real SMTP provider before it is usable, which is another
-- external dependency of exactly the kind this change is removing.
--
-- So the assurance is a short code, generated when the invitation is issued,
-- shown only to the administrators who can already read that invitation, and
-- handed to the person however the district already hands things to people. It
-- proves the same thing — that the district gave this account to this human —
-- with nothing to configure.
--
-- The code is single-use by construction: it is checked only against a PENDING
-- invitation, and claiming moves that invitation to `claimed`. It cannot be
-- edited (see the guard below); to rotate one, revoke the invitation and issue
-- another, which mints a new code and is audited.
--
-- Forward-only.

-- ---------------------------------------------------------------------------
-- 1. The code
-- ---------------------------------------------------------------------------
--
-- Eight characters from a 31-symbol alphabet — about 8.5 x 10^11 codes.
-- `0/O`, `1/I/L` are excluded so a code read aloud or written on a slip cannot
-- be transcribed into a different one.
--
-- This is the one place in the schema that is deliberately random. CLAUDE.md §8
-- forbids randomness in the recommendation engine, where it would make results
-- irreproducible; a credential that is not random is not a credential.

create or replace function public.generate_claim_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(
           substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789',
                  1 + floor(random() * 31)::int, 1),
           '')
  from generate_series(1, 8);
$$;

revoke execute on function public.generate_claim_code() from public, anon, authenticated;

alter table public.account_invitations
  add column claim_code text not null default public.generate_claim_code();

alter table public.account_invitations
  add constraint invitations_claim_code_shape
  check (claim_code ~ '^[A-HJ-NP-Z2-9]{8}$');

-- ---------------------------------------------------------------------------
-- 2. The code is fixed for the life of the invitation
-- ---------------------------------------------------------------------------
--
-- Same reasoning as the address and the role: a code that could be changed
-- under a pending invitation is a silent hand-over that no audit event
-- describes.

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
     or new.claim_code is distinct from old.claim_code
     or new.created_at is distinct from old.created_at then
    raise exception
      'An invitation''s address, role, scope, and setup code are fixed when it is issued. Revoke it and issue a new one.'
      using errcode = 'restrict_violation';
  end if;

  if old.status = 'pending' and new.status in ('claimed', 'revoked') then
    return new;
  end if;

  raise exception 'Illegal invitation transition: % -> %.', old.status, new.status
    using errcode = 'restrict_violation';
end;
$$;

revoke execute on function public.guard_invitation_update() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. The gate
-- ---------------------------------------------------------------------------
--
-- Three things must hold before a profile exists. All of them are checked here,
-- inside the transaction that creates the `auth.users` row, so a failure leaves
-- nothing behind and the address can be claimed properly afterwards.
--
--   1. The provider is one Beyond.Ed accepts.
--   2. A PENDING invitation exists for the address.
--   3. For an email sign-up, the claim code matches that invitation.
--
-- `google` is still accepted, and is exempt from the code. It is unreachable
-- while the provider is disabled in the dashboard, and it is kept because the
-- exemption is correct rather than convenient: Google has already verified that
-- the person controls the address, which is a stronger assurance than the code
-- gives. If this district ever turns Google on, the right thing happens with no
-- further migration.
--
-- The code arrives in `raw_user_meta_data`, which the client controls — as it
-- must, since the client is the one supplying it. That is not a weakness: the
-- trigger compares it against the invitation, and a caller who does not know
-- the code cannot make the comparison succeed. Nothing else is read from that
-- object; role, school, and grade all come off the invitation.

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
    jsonb_build_object('invitation', invite.id, 'status', 'claimed',
                       'role', invite.role, 'provider', provider),
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
