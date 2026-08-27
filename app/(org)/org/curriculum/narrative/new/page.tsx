import type { Metadata } from "next";

import { canAuthorCurriculum } from "@/lib/auth/scope";
import { requireUser } from "@/lib/auth/session";
import { COURSES } from "@/lib/curriculum/catalog";
import { Banner, ButtonLink, Card, CardHeader } from "@/lib/design/primitives";

import { IdentityForm } from "../narrative-forms";

export const metadata: Metadata = {
  title: "Start a narrative · Beyond.Ed",
  description: "Create a new story world for a unit.",
};

/**
 * Starting a narrative.
 *
 * Its own page rather than a disclosure on the bank, for the same reason
 * opening a draft course version is its own page (ADR 0015): it states what
 * creating one does before it does it, and someone who meant to duplicate an
 * existing narrative should not find themselves halfway into a blank one.
 */
export default async function NewNarrativePage() {
  const actor = await requireUser();

  if (!canAuthorCurriculum(actor)) {
    return (
      <div className="py-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Start a narrative</h1>
        <div className="mt-6">
          <Banner title="You do not hold curriculum authoring" tone="neutral">
            <p>
              Building curriculum is a separate authorization from any
              administrative role. An organization administrator grants it.
            </p>
            <p className="mt-2">
              <ButtonLink href="/org/curriculum/narrative">
                Back to the Narrative Bank
              </ButtonLink>
            </p>
          </Banner>
        </div>
      </div>
    );
  }

  const courses = COURSES.map((c) => ({ id: c.id, title: c.title }));

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <ButtonLink href="/org/curriculum/narrative" emphasis="quiet">
          &larr; Narrative Bank
        </ButtonLink>
      </nav>

      <header className="mt-3">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Start a narrative
        </h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          A story world a unit is taught inside. You build it once and write many
          lessons in it without restating the characters, the aesthetic, or what
          has already happened.
        </p>
      </header>

      <div className="mt-6 max-w-3xl">
        <Banner title="What creating one does" tone="info">
          <ul className="list-inside list-disc">
            <li>It starts as a draft. Only you can see it until you share it.</li>
            <li>
              It is not attached to a course version, so it can be reused in any
              course and duplicated by anyone who can read it.
            </li>
            <li>
              Nothing about it reaches a student. A narrative shapes the lessons a
              designer writes; it is not itself delivered.
            </li>
          </ul>
        </Banner>
      </div>

      <section className="mt-6 max-w-3xl">
        <Card>
          <CardHeader
            title="Identity"
            hint="The rest of the bible — world, characters, arc, chapters — comes next, in the studio."
          />
          <div className="p-5">
            <IdentityForm narrative={null} courses={courses} seq={1} />
          </div>
        </Card>
      </section>

      <p className="mt-6 max-w-3xl text-sm text-ink-muted">
        If a narrative close to what you want already exists, duplicating it is
        usually faster than starting here. Open it from the bank and choose
        Duplicate — your copy is independent from the moment it is made.
      </p>
    </div>
  );
}
