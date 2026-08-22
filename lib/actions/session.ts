"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ROLE_PRESENTATION } from "@/lib/auth/roles";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/session";
import { clearDatabase, db } from "@/lib/db/store";
import { ensureSeeded } from "@/lib/db/seed";

/**
 * Demo identity selection. NOT authentication — see `lib/auth/session.ts` and
 * ADR 0003. No password is collected, stored, or checked anywhere in this build.
 */
const SignIn = z.object({ userId: z.string().min(1).max(64) });

export async function signInAs(formData: FormData) {
  ensureSeeded();
  const parsed = SignIn.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) redirect("/?error=invalid");

  const user = db().users.find((u) => u.id === parsed.data.userId);
  if (!user) redirect("/?error=unknown");

  const jar = await cookies();
  jar.set(DEMO_SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect(ROLE_PRESENTATION[user.role].home);
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(DEMO_SESSION_COOKIE);
  redirect("/");
}

/**
 * Rebuilds the seeded store from scratch. The beta runs in memory, so this is
 * how a reviewer gets back to a known state after clicking through the write
 * paths. It is a demo control and is labelled as one.
 */
export async function resetDemoData() {
  clearDatabase();
  ensureSeeded();
  const jar = await cookies();
  jar.delete(DEMO_SESSION_COOKIE);
  redirect("/?reset=1");
}
