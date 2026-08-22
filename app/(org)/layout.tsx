import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth/session";
import { AppShell, ORG_NAV } from "@/lib/design/shell";

export default async function OrgLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/");
  // Curriculum authoring is an authorization, not a hierarchy level: a
  // curriculum author reaches the organization workspace for the curriculum
  // surfaces without holding org-admin scope over student records.
  if (user.role !== "org_admin" && user.role !== "curriculum_author") redirect("/");

  return (
    <AppShell
      user={user}
      nav={
        user.role === "curriculum_author"
          ? ORG_NAV.filter((n) => n.href === "/org/curriculum" || n.href === "/org")
          : ORG_NAV
      }
      contextLine={
        user.role === "curriculum_author"
          ? "Curriculum authorization only. This does not grant access to student records."
          : "Organization scope. Exports are purpose-bound and every one is logged."
      }
    >
      {children}
    </AppShell>
  );
}
