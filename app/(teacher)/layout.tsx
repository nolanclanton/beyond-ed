import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth/session";
import { AppShell, TEACHER_NAV } from "@/lib/design/shell";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/");
  if (user.role !== "teacher") redirect("/");

  return (
    <AppShell
      user={user}
      nav={TEACHER_NAV}
      contextLine="Recommendations are proposals; every assignment below is your decision and is recorded with your name and reason."
    >
      {children}
    </AppShell>
  );
}
