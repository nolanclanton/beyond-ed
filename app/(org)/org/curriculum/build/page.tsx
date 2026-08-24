import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { canAuthorCurriculum } from "@/lib/auth/scope";
import { COURSES } from "@/lib/curriculum/catalog";
import { CURRICULUM_STATUS_PRESENTATION } from "@/lib/curriculum/publication";
import {
  editableVersions,
  versionAuthoringSummary,
} from "@/lib/curriculum/lesson-authoring";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  Empty,
  FactList,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

import { NewDraftVersionForm } from "./studio-forms";

export const metadata: Metadata = {
  title: "Lesson studio · Beyond.Ed",
  description: "Write lesson scripts, attach video, and build quizzes on a draft course version.",
};

/**
 * The lesson studio (blueprint §6, CLAUDE.md §7).
 *
 * Where lessons are actually built. Work happens on a DRAFT course version and
 * reaches students when that version is published — which is also why a running
 * class cannot have its lesson change underneath it.
 */
export default async function StudioHomePage() {
  const actor = await requireUser();
  const canAuthor = canAuthorCurriculum(actor);
  const drafts = editableVersions();
  const d = db();

  /** The next unused label per course, so the common case is one keystroke. */
  const suggested: Record<string, string> = {};
  for (const course of COURSES) {
    const revisions = d.courseVersions
      .filter((v) => v.courseTitle === course.title)
      .map((v) => Number(v.version.split(".")[1] ?? 0))
      .filter((n) => Number.isFinite(n));
    const year = d.courseVersions.find((v) => v.courseTitle === course.title)?.version.split(".")[0] ?? "2026";
    suggested[course.title] = `${year}.${Math.max(0, ...revisions) + 1}`;
  }

  const locked = d.courseVersions
    .filter((v) => v.status === "in_review" || v.status === "approved")
    .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Lesson studio</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          Write the script a student reads, attach the video that carries it, and
          build the questions that produce evidence — on a draft version of a
          course the catalog already plans.
        </p>
      </header>

      <div className="mt-5 flex flex-col gap-3">
        {canAuthor ? (
          <Banner title="You hold the curriculum-author authorization." tone="info">
            Content is editable while a version is a draft. Submitting it for
            review freezes it so reviewers read a fixed thing, and publishing puts
            it in front of every section created on that version.
          </Banner>
        ) : (
          <Banner title="You can read lessons but not write them." tone="notice">
            Curriculum authoring is a separate authorization from administrative
            access. Your role does not carry it, so no editing control is shown —
            the content is still fully readable.
          </Banner>
        )}

        <Banner title="A published lesson never changes under a running class." tone="neutral">
          A roster section keeps the course version it was created with. Editing
          a lesson means opening the next version — which is what versioning is
          for, and what keeps a historical result reproducible.
        </Banner>

        <Banner title="Lessons are built onto the course plan, not beside it." tone="neutral">
          Every lesson code, its day range, and its primary standards come from
          the course plan, which already validates 135 + 40 = 175. Authoring
          fills a lesson in; it cannot spend days the plan has not allocated.
        </Banner>
      </div>

      <section aria-labelledby="drafts" className="mt-9">
        <SectionHeading
          id="drafts"
          hint="Only a draft version can be edited. Everything else is read-only by design."
        >
          Draft versions you can build in
        </SectionHeading>

        {drafts.length === 0 ? (
          <Empty>
            No course version is currently a draft, so there is nothing to edit.
            Open one below to start writing.
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            {drafts.map((version) => {
              const summary = versionAuthoringSummary(version.id);
              const presentation = CURRICULUM_STATUS_PRESENTATION[version.status];
              return (
                <Card key={version.id}>
                  <CardHeader
                    title={`${version.courseTitle} ${version.version}`}
                    hint={version.notes}
                    action={
                      <StatusChip label={presentation.label} tone={presentation.tone} />
                    }
                  />
                  <div className="p-5">
                    <FactList
                      columns={3}
                      items={[
                        {
                          label: "Lessons in the course",
                          value: `${summary.lessonsInCourse}`,
                        },
                        {
                          label: "Lessons started",
                          value: `${summary.lessonsStarted}`,
                        },
                        {
                          label: "Lessons ready for students",
                          value: `${summary.lessonsComplete}`,
                        },
                        { label: "Videos attached", value: `${summary.videos}` },
                        { label: "Quiz items written", value: `${summary.items}` },
                        {
                          label: "Reaches students",
                          value: "When this version is published",
                        },
                      ]}
                    />
                    <div className="mt-5">
                      <Link
                        href={`/org/curriculum/build/${version.id}`}
                        className={`inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-strong ${FOCUS_RING}`}
                      >
                        {canAuthor ? "Build lessons" : "Read lessons"} &rarr;
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {canAuthor ? (
        <section aria-labelledby="open" className="mt-10">
          <SectionHeading
            id="open"
            hint="A new version starts empty. Content is not copied forward, so nothing reaches students that nobody re-read."
          >
            Open a draft version
          </SectionHeading>
          <Card>
            <div className="p-5">
              <NewDraftVersionForm
                courses={COURSES.map((c) => c.title)}
                suggested={suggested}
              />
            </div>
          </Card>
        </section>
      ) : null}

      {locked.length > 0 ? (
        <section aria-labelledby="locked" className="mt-10">
          <SectionHeading
            id="locked"
            hint="In review or approved. Content is frozen so a reviewer and a publisher see the same thing."
          >
            Versions closed to editing ({locked.length})
          </SectionHeading>
          <Card>
            <ul className="divide-y divide-line">
              {locked.map((version) => {
                const presentation = CURRICULUM_STATUS_PRESENTATION[version.status];
                return (
                  <li
                    key={version.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {version.courseTitle} {version.version}
                      </p>
                      <p className="text-xs text-ink-muted">{presentation.meaning}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusChip label={presentation.label} tone={presentation.tone} />
                      <Link
                        href={`/org/curriculum/build/${version.id}`}
                        className={`text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                      >
                        Read
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      ) : null}

      <p className="mt-8 text-sm text-ink-muted">
        Moving a version through review, approval, and publication happens in{" "}
        <Link
          href="/org/curriculum"
          className={`font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
        >
          curriculum governance
        </Link>
        .
      </p>
    </div>
  );
}
