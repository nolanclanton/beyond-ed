/**
 * The five portals, and the person each one opens as.
 *
 * The entry screen offers a PORTAL, not a person. That is what a reviewer
 * actually wants — "show me the teacher experience" — and it keeps the first
 * screen to five choices instead of a roster.
 *
 * Each portal opens as a representative demo person whose record was written by
 * hand to demonstrate that role. Every other seeded person is still reachable,
 * from the disclosure below the portals and from "Switch demo user" inside.
 */
import type { Role } from "@/lib/db/types";

export type Portal = {
  role: Role;
  /** Eyebrow above the portal name, e.g. "STUDENT EXPERIENCE". */
  eyebrow: string;
  name: string;
  summary: string;
  /** What the demo data behind this portal actually is. */
  dataNote: string;
  /** The seeded person this portal opens as. */
  defaultUserId: string;
  cta: string;
};

export const PORTALS: readonly Portal[] = [
  {
    role: "student",
    eyebrow: "Student experience",
    name: "Student Portal",
    summary:
      "Work a lesson end to end: Spiral Review, instruction, Exit Ticket, and the decision it produces. See progress, official grades, and assigned support.",
    dataNote: "Opens as a grade 6 student with four courses and authored lessons.",
    defaultUserId: "u_amara",
    cta: "Preview Student Portal",
  },
  {
    role: "teacher",
    eyebrow: "Teacher experience",
    name: "Teacher Portal",
    summary:
      "Triage an action queue of evidence-backed recommendations, review a caseload by pace and performance, and assign support with a recorded reason.",
    dataNote: "Opens with a synthetic caseload across several roster sections.",
    defaultUserId: "u_alvarez",
    cta: "Preview Teacher Portal",
  },
  {
    role: "site_admin",
    eyebrow: "Site admin experience",
    name: "Site Admin Portal",
    summary:
      "Manage students, teacher assignments, and course enrollment for one school site, and follow up on recommendations a teacher has not resolved.",
    dataNote: "Opens with synthetic school-site data for one campus.",
    defaultUserId: "u_salinas",
    cta: "Preview Site Admin Portal",
  },
  {
    role: "org_admin",
    eyebrow: "District experience",
    name: "District Portal",
    summary:
      "Compare completion and performance across sites, review intervention outcomes, manage permissions, and read the append-only audit log.",
    dataNote: "Opens with synthetic district data across five sites.",
    defaultUserId: "u_okonjo",
    cta: "Preview District Portal",
  },
  {
    role: "curriculum_author",
    eyebrow: "Curriculum experience",
    name: "Curriculum Portal",
    summary:
      "Move a course version through review, approval, and publication — gated on the 135 + 40 = 175 day contract. A separate authorization from administration.",
    dataNote: "Opens with a draft and an in-review version ready to move.",
    defaultUserId: "u_haddad",
    cta: "Preview Curriculum Portal",
  },
];
