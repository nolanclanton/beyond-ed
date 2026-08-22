-- organizations, sites
--
-- POSITIVE: any signed-in person reads their own organization and the sites in
--           it, so navigation and labels resolve.
-- NEGATIVE: nobody reads another organization or its sites; nobody writes
--           either table from the client.

create policy organizations_select_own
  on public.organizations for select
  using (id = public.current_org());

create policy sites_select_own_org
  on public.sites for select
  using (org_id = public.current_org());
