import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotConfiguredScreen } from "@/app/not-configured-screen";
import { SignInScreen } from "@/app/sign-in-screen";
import { ROLE_PRESENTATION } from "@/lib/auth/roles";
import { sessionState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Beyond.Ed",
  description:
    "A grades 6-12 learning and academic-operations platform: coherent core pathways, evidence-based intervention, and accountable human decisions.",
};

/**
 * The entry screen.
 *
 * One way in: the address a district administrator provisioned, and either the
 * setup code that came with it or the password chosen with that code. There is
 * no demo picker behind this any more — the seeded identity screen from ADR
 * 0003 is gone, and a deployment without a Supabase project says so rather than
 * handing out a pretend session.
 */
export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; signed_out?: string }>;
}) {
  const params = await searchParams;
  const state = await sessionState();

  if (state.kind === "unconfigured") return <NotConfiguredScreen />;

  // Someone already signed in has a workspace, and this page is not it.
  if (state.kind === "signed_in") {
    redirect(ROLE_PRESENTATION[state.user.role].home);
  }

  return (
    <SignInScreen
      state={state}
      notice={{ error: params.error, signedOut: params.signed_out === "1" }}
    />
  );
}
