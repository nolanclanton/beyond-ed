import type { Metadata } from "next";

import { resetDemoData, signInAs } from "@/lib/actions/session";
import { ROLE_PRESENTATION } from "@/lib/auth/roles";
import { ensureSeeded } from "@/lib/db/seed";
import { db } from "@/lib/db/store";
import { Banner, Button, Card, CardHeader } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { CAPACITY_CONTRACT } from "@/lib/rules/versions";
import { COURSES } from "@/lib/curriculum/catalog";

export const metadata: Metadata = {
  title: "Beyond.Ed — beta",
  description:
    "Learning and academic operations for Mojave River Academy, grades 6-12.",
};

/**
 * The beta entry point.
 *
 * This is a DEMO IDENTITY PICKER, not a sign-in form. There is no password
 * field because there is no authentication in this build: Supabase Auth needs a
 * provisioned project and a human to set the environment variables (ADR 0003).
 * Choosing a person here sets a server-read cookie holding a seeded user id;
 * every read and write is still scope-checked against that identity on the
 * server.
 */
export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; error?: string }>;
}) {
  ensureSeeded();
  const params = await searchParams;
  const d = db();

  /**
   * The district holds 584 students. Listing all of them here would be a wall,
   * not a picker — so this shows the people whose records were written by hand
   * to demonstrate something specific, plus every site administrator (there are
   * five). The rest of the district is reachable where it belongs: inside the
   * teacher, site, and organization workspaces.
   *
   * Generated people carry an id prefix; named ones do not.
   */
  const isGenerated = (id: string) =>
    id.startsWith("u_s_") || id.startsWith("u_t_");
  const order = ["student", "teacher", "site_admin", "org_admin", "curriculum_author"] as const;
  const grouped = order.map((role) => ({
    role,
    users: d.users
      .filter((u) => u.role === role)
      .filter((u) => role === "site_admin" || !isGenerated(u.id))
      .sort((a, b) => a.lastName.localeCompare(b.lastName)),
  }));

  const students = d.users.filter((u) => u.role === "student").length;
  const teachers = d.users.filter((u) => u.role === "teacher").length;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-maroon">
          Mojave River Academy
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink">Beyond.Ed</h1>
        <p className="mt-3 max-w-2xl text-base text-ink-muted">
          A grades 6&ndash;12 learning and academic-operations platform. Every
          student stays on a rigorous course pathway and gets precise, timely
          support when the evidence shows a barrier.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-muted">
          <span>
            <strong className="text-ink">{CAPACITY_CONTRACT.totalDays}</strong> available workdays
          </span>
          <span>
            <strong className="text-ink">{CAPACITY_CONTRACT.pathwayDays}</strong> normal pathway days
          </span>
          <span>
            <strong className="text-ink">{CAPACITY_CONTRACT.interventionDays}</strong> intervention-capacity days
          </span>
          <span>
            <strong className="text-ink">{COURSES.length}</strong> courses in the catalog
          </span>
        </p>
        <p className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-muted">
          <span>
            <strong className="text-ink">{d.sites.length}</strong> sites
          </span>
          <span>
            <strong className="text-ink">{students}</strong> students
          </span>
          <span>
            <strong className="text-ink">{teachers}</strong> teachers
          </span>
        </p>
      </header>

      {params.reset ? (
        <div className="mt-6">
          <Banner title="Demo data rebuilt." tone="positive" role="status">
            Everything is back to the seeded starting state.
          </Banner>
        </div>
      ) : null}
      {params.error ? (
        <div className="mt-6">
          <Banner title="That person is not in the demo roster." tone="urgent" role="alert">
            Pick someone from the list below.
          </Banner>
        </div>
      ) : null}

      <div className="mt-8">
        <Banner title="This is a beta build with no authentication." tone="notice">
          <p>
            There is no password field because there are no accounts. Choosing a
            person below sets a cookie holding a seeded user id, which the
            server reads on every request and scope-checks like a real session.
            Real sign-in arrives with Supabase Auth.
          </p>
          <p className="mt-2">
            Data lives in memory and resets when the server restarts. Every
            person, roster, grade, and result is fictional.
          </p>
        </Banner>
      </div>

      <section aria-labelledby="who" className="mt-8">
        <h2 id="who" className="text-lg font-semibold tracking-tight text-ink">
          Choose a person to review as
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Each role sees a different workspace reading from the same records.
          These are the people whose records were written by hand to show
          something specific. The other {students - 8} students and{" "}
          {teachers - 5} teachers in the district appear inside the teacher,
          site, and organization workspaces.
        </p>

        <div className="mt-5 flex flex-col gap-5">
          {grouped.map(({ role, users }) => (
            <Card key={role}>
              <CardHeader
                title={ROLE_PRESENTATION[role].label}
                hint={ROLE_PRESENTATION[role].summary}
              />
              <ul className="flex flex-wrap gap-2 p-4">
                {users.map((user) => {
                  const site = d.sites.find((s) => s.id === user.siteId);
                  return (
                    <li key={user.id}>
                      <form action={signInAs}>
                        <input type="hidden" name="userId" value={user.id} />
                        <button
                          type="submit"
                          className={`flex flex-col items-start rounded-lg border border-line bg-surface px-4 py-2.5 text-left transition-colors hover:border-primary-line hover:bg-primary-surface ${FOCUS_RING}`}
                        >
                          <span className="text-sm font-semibold text-primary">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-ink-muted">
                            {user.gradeLevel ? `Grade ${user.gradeLevel}` : ROLE_PRESENTATION[role].scope}
                            {site ? ` · ${site.shortName}` : ""}
                            {user.curriculumAuthor && role !== "curriculum_author"
                              ? " · also a curriculum author"
                              : ""}
                          </span>
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="reset" className="mt-10">
        <h2 id="reset" className="text-lg font-semibold tracking-tight text-ink">
          Start over
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Rebuilds the seeded store from scratch. Anything you assigned,
          dismissed, submitted, or published during this session is discarded.
        </p>
        <form action={resetDemoData} className="mt-3">
          <Button emphasis="caution">Rebuild demo data</Button>
        </form>
      </section>

      <p className="mt-12 border-t border-line pt-6 text-xs text-ink-muted">
        Beyond.Ed contains no AI tutor, chatbot, copilot, or conversational
        assistant. Individualized review and recommendations use transparent,
        versioned curriculum rules over stored evidence.
      </p>
    </div>
  );
}
