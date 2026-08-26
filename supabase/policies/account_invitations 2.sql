-- account_invitations
--
-- The district administrator's provisioning roster. A row here is the ONLY way
-- a Beyond.Ed account comes into existence: `handle_new_auth_user` (migration
-- 0012) refuses any Google sign-in whose address has no pending invitation, and
-- there is no self sign-up path anywhere in the product.
--
-- POSITIVE: an org admin reads and issues invitations anywhere in their
--           organization; a site admin reads and issues them for students and
--           teachers at their own site; a person reads the one invitation that
--           produced their own profile.
-- NEGATIVE: a site admin cannot read another site's roster, cannot issue an
--           invitation for a site_admin, org_admin, or curriculum_author, and
--           cannot grant curriculum authorization; a teacher, student, or
--           curriculum author reads and issues nothing; nobody edits an
--           invitation's address, role, or scope after it is issued, and nobody
--           deletes one.
--
-- Applied by migration 0012. The transitions themselves (Pending -> Claimed,
-- Pending -> Revoked, and nothing else) are guarded by a trigger, not by these
-- policies: this file decides WHO may attempt a change, the trigger decides
-- WHICH changes are legal.

create policy invitations_select_org_admin
  on public.account_invitations for select
  using (public.current_role_name() = 'org_admin' and org_id = public.current_org());

create policy invitations_select_site_admin
  on public.account_invitations for select
  using (public.current_role_name() = 'site_admin' and site_id = public.current_site());

create policy invitations_select_own_claim
  on public.account_invitations for select
  using (claimed_by_user_id = auth.uid());

create policy invitations_insert_admin
  on public.account_invitations for insert
  with check (
    public.can_provision(role, org_id, site_id)
    and invited_by_user_id = auth.uid()
    and status = 'pending'
    and claimed_by_user_id is null
    and (curriculum_author = false or public.current_role_name() = 'org_admin')
  );

create policy invitations_update_admin
  on public.account_invitations for update
  using (public.can_provision(role, org_id, site_id))
  with check (public.can_provision(role, org_id, site_id));
