-- ============================================================================
-- 0016 — One address, one account
-- ============================================================================
--
-- Corrects a gap in 0012 that the gate test found.
--
-- 0012 guarded the invitation roster with two PARTIAL unique indexes: one
-- pending row per address, and one claimed row per address. Each does what it
-- says, and together they still allow the case that matters — issuing a NEW
-- PENDING invitation for an address whose invitation has already been claimed.
-- The two indexes never collide, because the rows are in different states.
--
-- Why that is not merely untidy:
--
--   * It lets an administrator "provision" somebody who already has an account,
--     with a different role or a different school, and see it sit in the
--     waiting list forever. Signing in again does not claim it, because
--     `handle_new_auth_user` fires on INSERT into `auth.users` and that person
--     already exists — so the interface shows a promise the product will never
--     keep.
--   * Worse, it is only inert while the `auth.users` row survives. If that
--     identity were ever removed and the person signed in again, the stale
--     pending row would be claimed and would mint a SECOND profile, with
--     whatever role it happened to name. A dormant privilege grant is still a
--     privilege grant.
--
-- A partial unique index cannot express "no pending row when a claimed row
-- exists for the same address", because the condition spans two rows in
-- different states. A trigger can, so this is a trigger.
--
-- Revoked rows are deliberately NOT covered: an address that was invited by
-- mistake, revoked, and later invited for real is an ordinary correction, and
-- 0012's pending-uniqueness index already stops two open invitations at once.
--
-- Forward-only. Adds a trigger; changes no data and drops nothing.

create or replace function public.reject_second_account_for_address()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.account_invitations existing
    where existing.email = new.email
      and existing.status = 'claimed'
      and existing.id <> new.id
  ) then
    raise exception
      'That address already has a Beyond.Ed account. One person, one account: to change someone''s role or school, withdraw their access and provision the new account on a different address.'
      using errcode = 'unique_violation';
  end if;
  return new;
end;
$$;

-- INSERT only. An UPDATE is the claim itself — the row being claimed is the one
-- that would match — and `guard_invitation_update` already confines updates to
-- the two legal transitions.
create trigger account_invitations_one_per_address
  before insert on public.account_invitations
  for each row execute function public.reject_second_account_for_address();

revoke execute on function public.reject_second_account_for_address()
  from public, anon, authenticated;
