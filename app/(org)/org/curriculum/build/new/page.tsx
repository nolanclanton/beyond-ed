import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { canAuthorCurriculum } from "@/lib/auth/scope";
import { COURSES } from "@/lib/curriculum/catalog";
import {
  editableVersions,
  versionAuthoringSummary,
} from "@/lib/curriculum/lesson-authoring";
import { db } from "@/lib/db/store";
import { Card, CardHeader, SectionHeading } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

import { NewDraftVersionForm } from "../studio-forms";

export const metadata: Metadata = {
  title: "Open a draft version · Beyond.Ed",
  description:
    "Open a draft course version, then design its lessons in the design studio.",
};

/**
 * Where designing a course begins.
 *
 * Lesson content hangs off a course version and only a DRAFT is editable
 * (ADR 0010), so the studio is entered through a version rather than through a
 * lesson. This page does that one thing: open a draft, or pick up one that is
 * already open, and hand off to the design studio.
 *
 * It is its own page rather than a panel on the studio home because opening a
 * version is a decision with consequences a person should read before making —
 * a new version starts EMPTY, and running sections keep the version they were
 * created with.
 */
export default async function NewDraftVersionPage() {
  const actor = await requireUser();
  // The one thing this page does is a curriculum-author write. Nothing here is
  // useful without that authorization, so a reader is sent back rather than
  // shown a page of controls that cannot complete their action (CLAUDE.md §12).
  if (!canAuthorCurriculum(actor)) redirect("/org/curriculum/build");

  const d = db();
  const drafts = editableVersions();

  /** The next unused label per course, so the common case is one keystroke. */
  const suggested: Record<string, string> = {};
  for (const course of COURSES) {
    const revisions = d.courseVersions
      .filter((v) => v.courseTitle === course.title)
      .map((v) => Number(v.version.split(".")[1] ?? 0))
      .filter((n) => Number.isFinite(n));
    const year =
      d.courseVersions.find((v) => v.courseTitle === course.title)?.version.split(".")[0] ??
      "2026";
    suggested[course.title] = `${year}.${Math.max(0, ...revisions) + 1}`;
  }

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/org/curriculum/build" className={`hover:underline ${FOCUS_RING}`}>
          Lesson studio
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">Open a draft version</span>
      </nav>

      <header className="mt-3">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Open a draft version
        </h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          Lessons are designed inside a course version, and only a draft can be
          edited. Open one here and the design studio opens with it — every unit,
          every lesson, and the parts each lesson is laid out into.
        </p>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="open">
          <SectionHeading
            id="open"
            hint="A new version starts empty. Content is not copied forward, so nothing reaches students that nobody re-read."
          >
            The new version
          </SectionHeading>
          <Card>
            <div className="p-5">
              <NewDraftVersionForm
                courses={COURSES.map((c) => c.title)}
                suggested={suggested}
              />
            </div>
          </Card>

          <Card className="mt-4">
            <CardHeader
              title="What opening a version does"
              hint="Read this before you open one — versions are not deleted, only retired."
            />
            <div className="p-5">
              <ul className="flex flex-col gap-3 text-sm text-ink">
                <li>
                  <span className="font-semibold">It starts empty.</span> No lesson,
                  media, or quiz item is copied from an earlier version. Anything
                  that should carry forward is re-read and re-written deliberately.
                </li>
                <li>
                  <span className="font-semibold">
                    Running classes are not affected.
                  </span>{" "}
                  A roster section keeps the version it was created with, so nothing
                  a class is being taught changes underneath it, and no prior
                  evidence is altered.
                </li>
                <li>
                  <span className="font-semibold">It reaches students on publication.</span>{" "}
                  A draft is private working state. Review, approval, and publication
                  happen in{" "}
                  <Link
                    href="/org/curriculum"
                    className={`font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                  >
                    versions
                  </Link>
                  .
                </li>
                <li>
                  <span className="font-semibold">It is recorded.</span> Opening a
                  version writes an audit event with your name, the reason you give,
                  and the time.
                </li>
              </ul>
            </div>
          </Card>
        </section>

        <aside aria-labelledby="already-open">
          <SectionHeading
            id="already-open"
            hint="Already open. Go straight in rather than opening another."
          >
            Drafts you can design in
          </SectionHeading>
          {drafts.length === 0 ? (
            <Card>
              <div className="p-5 text-sm text-ink-muted">
                No course version is a draft right now. Open one on the left.
              </div>
            </Card>
          ) : (
            <Card>
              <ul className="divide-y divide-line">
                {drafts.map((version) => {
                  const summary = versionAuthoringSummary(version.id);
                  return (
                    <li key={version.id} className="px-4 py-3">
                      <p className="text-sm font-semibold text-ink">
                        {version.courseTitle}{" "}
                        <span className="font-mono text-ink-muted">
                          {version.version}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {summary.lessonsStarted} of {summary.lessonsInCourse} lessons
                        started &middot; {summary.blocks} elements laid out
                      </p>
                      <Link
                        href={`/org/curriculum/build/${version.id}`}
                        className={`mt-1.5 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                      >
                        Design its lessons &rarr;
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
