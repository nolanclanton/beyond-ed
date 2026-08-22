import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth/session";
import { AppShell, SITE_NAV } from "@/lib/design/shell";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/");
  if (user.role !== "site_admin") redirect("/");

  return (
    <AppShell
      user={user}
      nav={SITE_NAV}
      contextLine="Site scope. You can assign an approved support when a teacher queue item is unresolved — with a recorded reason."
    >
      {children}
    </AppShell>
  );
}
