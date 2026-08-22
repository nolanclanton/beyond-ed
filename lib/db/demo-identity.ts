/**
 * ============================================================================
 * DEMO TENANT IDENTITY — the one file to change when rebranding the demo
 * ============================================================================
 *
 * Beyond.Ed is standalone software. The organization it serves is a TENANT:
 * a row in `organizations`, read at request time, never hardcoded into a
 * component. Nothing in `/app` or `/lib/design` names a customer.
 *
 * The names below are fictional and exist only to make the seeded demo
 * readable. Pointing the product at a different district means seeding a
 * different organization — not editing the interface.
 */

export const DEMO_ORGANIZATION = {
  id: "org_demo",
  name: "Northfield Learning Network",
  /** Shown where a short form reads better than the full name. */
  shortName: "Northfield",
} as const;

/**
 * The five sites of the demo district, with the staffing and enrollment each
 * one carries. Site names are fictional placenames, chosen so no real school or
 * district is implied.
 */
export const DEMO_SITES = [
  { id: "site_northfield", shortName: "Northfield Central", students: 126, teachers: 8 },
  { id: "site_riverside", shortName: "Riverside", students: 118, teachers: 7 },
  { id: "site_oakmont", shortName: "Oakmont", students: 94, teachers: 6 },
  { id: "site_lakeview", shortName: "Lakeview", students: 109, teachers: 7 },
  { id: "site_summit", shortName: "Summit", students: 137, teachers: 9 },
] as const;

/** The full display name of a site, e.g. "Northfield Learning Network — Oakmont". */
export function siteDisplayName(shortName: string): string {
  return `${DEMO_ORGANIZATION.name} — ${shortName}`;
}
