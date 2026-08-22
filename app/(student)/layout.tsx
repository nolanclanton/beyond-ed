import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth/session";
import { AppShell, STUDENT_NAV } from "@/lib/design/shell";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/");
  if (user.role !== "student") redirect("/");

  return (
    <AppShell user={user} nav={STUDENT_NAV}>
      {children}
    </AppShell>
  );
}
