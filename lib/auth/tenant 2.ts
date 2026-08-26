/**
 * The tenant labels the shell displays: which district, which school.
 *
 * Beyond.Ed is standalone software. The organization is a record it reads, not
 * something built into the product (ADR 0007), so these names are resolved per
 * request rather than written into a component. Pointing the product at a
 * different district changes data, not markup.
 *
 * Returns nulls rather than throwing: a missing label makes the header shorter,
 * which is not worth failing a page render over.
 */
import type { User } from "@/lib/db/types";

export type Tenant = {
  organizationName: string | null;
  siteShortName: string | null;
};

const EMPTY: Tenant = { organizationName: null, siteShortName: null };

export async function tenantFor(user: User): Promise<Tenant> {
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
