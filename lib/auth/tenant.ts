/**
 * The tenant labels the shell displays: which district, which school.
 *
 * Beyond.Ed is standalone software. The organization is a record it reads, not
 * something built into the product (ADR 0007), so these names are resolved per
 * request rather than written into a component. Pointing the product at a
 * different district changes data, not markup.
 *
 * Resolves from Postgres in Supabase mode and from the seeded store in demo
 * mode, so the shell does not have to know which one it is running in. Both
 * paths return nulls rather than throwing: a missing label makes the header
 * shorter, which is not worth failing a page render over.
 */
import type { User } from "@/lib/db/types";
import { db } from "@/lib/db/store";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type Tenant = {
  organizationName: string | null;
  siteShortName: string | null;
};

const EMPTY: Tenant = { organizationName: null, siteShortName: null };

export async function tenantFor(user: User): Promise<Tenant> {
  if (!isSupabaseConfigured()) {
    const d = db();
    return {
      organizationName: d.organizations.find((o) => o.id === user.orgId)?.name ?? null,
      siteShortName: d.sites.find((s) => s.id === user.siteId)?.shortName ?? null,
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // `organizations_select_own` and `sites_select_own_org` already restrict
    // both reads to the caller's own organization, so these filters narrow a
    // set the database has already bounded.
    const [org, site] = await Promise.all([
      supabase
        .from("organizations")
        .select("name")
        .eq("id", user.orgId)
        .maybeSingle(),
      user.siteId
        ? supabase
            .from("sites")
            .select("short_name")
            .eq("id", user.siteId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    return {
      organizationName: (org.data as { name: string } | null)?.name ?? null,
      siteShortName:
        (site.data as { short_name: string } | null)?.short_name ?? null,
    };
  } catch {
    return EMPTY;
  }
}
