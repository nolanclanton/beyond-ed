/**
 * The closed role set (CLAUDE.md §3).
 *
 * `curriculum_author` is a separate authorization, not a hierarchy level. It is
 * carried on the user record as a flag and checked independently of role.
 */
import type { Role } from "@/lib/db/types";

export const ROLES: readonly Role[] = [
  "student",
  "teacher",
  "site_admin",
  "org_admin",
  "curriculum_author",
];

export const ROLE_PRESENTATION: Record<
  Role,
  { label: string; scope: string; home: string; summary: string }
> = {
  student: {
    label: "Student",
    scope: "Self",
    home: "/today",
    summary:
      "Own enrollments, lessons, evidence, mastery, grades, interventions, and messages.",
  },
  teacher: {
    label: "Teacher",
    scope: "Assigned roster sections",
    home: "/teacher",
    summary:
      "Assigned students and authorized courses. Assigns, modifies, dismisses, and escalates interventions; enters and changes grades, audited.",
  },
  site_admin: {
    label: "Site administrator",
    scope: "One site",
    home: "/site",
    summary:
      "Site enrollment, staffing, loads, interventions, escalations, and data quality.",
  },
  org_admin: {
    label: "Organization administrator",
    scope: "Organization",
    home: "/org",
    summary:
      "Cross-site aggregate and authorized record-level data, permissions, intervention configuration, exports, and the audit log.",
  },
  curriculum_author: {
    label: "Curriculum author",
    scope: "Authorization, not hierarchy",
    home: "/org/curriculum/courses",
    summary:
      "Designs lessons, and drafts, reviews, approves, publishes, and retires curriculum versions.",
  },
};
