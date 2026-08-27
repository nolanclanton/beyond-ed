import type { Metadata } from "next";
import Link from "next/link";

import { generationsForOrg } from "@/lib/ai/generations";
import { canReviewCurriculum, curriculumGrantsOf } from "@/lib/auth/scope";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/clock";
import { CURRICULUM_STATUS_PRESENTATION } from "@/lib/curriculum/publication";
import { db } from "@/lib/db/store";
import {
  Banner,
  ButtonLink,
  Card,
  CardHeader,
  Empty,
  MetricTile,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { allBeats, readableNarratives } from "@/lib/narrative/bible";
import { NARRATIVE_STATUS_PRESENTATION } from "@/lib/narrative/status";

export const metadata: Metadata = {
  title: "Review queue · Beyond.Ed",
  description: "Curriculum waiting on a second reader, and what the assistant contributed to it.",
};

/**
 * The review queue (vision §7, §21, §22).
 *
 * What is waiting on somebody, in one place. Two rules from §22 are visible on
 * this page rather than merely implemented behind it:
 *
 *   - **A person submits.** Nothing arrives here by itself.
 *   - **The reviewer is not the author.** A reviewer sees their own submissions
 *     listed, and sees plainly that somebody else has to act on them.
 *
 * The assistance column is the point of the page for anyone checking §21: a
 * reviewer can see which submissions had a proposal accepted into them, and go
 * and read exactly what was asked for.
 */
export default async function ReviewQueuePage() {
  const actor = await requireUser();
  const d = db();
  const grants = curriculumGrantsOf(actor);
  const canReview = canReviewCurriculum(actor);

  const versionsInReview = d.courseVersions.filter(
    (v) => v.status === "in_review" || v.status === "approved",
  );
  const narrativesInReview = readableNarratives(actor).filter(
    (n) => n.status === "in_review",
  );

  const generations = generationsForOrg(actor.orgId);
  const acceptedByNarrative = new Map<string, number>();
  const acceptedByVersion = new Map<string, number>();
  for (const g of generations) {
    if (g.status !== "accepted" && g.status !== "accepted_edited") continue;
    if (g.narrativeId) {
      acceptedByNarrative.set(g.narrativeId, (acceptedByNarrative.get(g.narrativeId) ?? 0) + 1);
    }
    if (g.courseVersionId) {
      acceptedByVersion.set(
        g.courseVersionId,
        (acceptedByVersion.get(g.courseVersionId) ?? 0) + 1,
      );
    }
  }

  const nameOf = (userId: string): string => {
    const user = d.users.find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "A former colleague";
  };

  return (
    <div className="py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Review queue</h1>
          <p className="mt-2 max-w-3xl text-base text-ink-muted">
            Curriculum somebody submitted and somebody else has to read. Nothing
            arrives here on its own, and nothing leaves it without a person.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {grants.length === 0 ? (
            <StatusChip label="No curriculum authorization" tone="neutral" />
          ) : (
            grants.map((g) => (
              <StatusChip key={g} label={`Curriculum ${g}`} tone="info" />
            ))
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricTile
          value={`${narrativesInReview.length}`}
          label="Narratives in review"
          caption="Frozen while they wait"
          tone={narrativesInReview.length > 0 ? "attention" : "neutral"}
        />
        <MetricTile
          value={`${versionsInReview.length}`}
          label="Course versions"
          caption="In review or approved"
          tone={versionsInReview.length > 0 ? "info" : "neutral"}
        />
        <MetricTile
          value={`${generations.filter((g) => g.status === "accepted" || g.status === "accepted_edited").length}`}
          label="Assisted contributions accepted"
          caption="Across all curriculum"
        />
      </div>

      {canReview ? null : (
        <div className="mt-6">
          <Banner title="You can see this queue but not act on it" tone="neutral">
            Approving, returning, and publishing need the curriculum reviewer
            authorization. Submitting your own work for review does not — that is
            an author&rsquo;s own act, and it is on each narrative&rsquo;s page.
          </Banner>
        </div>
      )}

      <section aria-labelledby="narratives" className="mt-9">
        <SectionHeading
          id="narratives"
          hint="A narrative in review is frozen, so what a reviewer reads is what was sent."
        >
          Narratives waiting
        </SectionHeading>
        {narrativesInReview.length === 0 ? (
          <Empty>No narrative is waiting on a reader.</Empty>
        ) : (
          <ul className="flex flex-col gap-4">
            {narrativesInReview.map((n) => {
              const assisted = acceptedByNarrative.get(n.id) ?? 0;
              const yours = n.ownerUserId === actor.id;
              return (
                <Card as="li" key={n.id}>
                  <CardHeader
                    title={n.title}
                    hint={n.premise || "No premise written."}
                    action={
                      <StatusChip
                        label={NARRATIVE_STATUS_PRESENTATION[n.status].label}
                        tone={NARRATIVE_STATUS_PRESENTATION[n.status].tone}
                      />
                    }
                  />
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted">
                      <span>Submitted by {nameOf(n.ownerUserId)}</span>
                      <span>
                        {n.chapters.length} chapters · {allBeats(n).length} beats
                      </span>
                      <span>{formatDateTime(n.updatedAt)}</span>
                      {assisted > 0 ? (
                        <StatusChip
                          label={`${assisted} assisted ${assisted === 1 ? "contribution" : "contributions"}`}
                          tone="info"
                        />
                      ) : (
                        <StatusChip label="Written by hand" tone="neutral" />
                      )}
                    </div>

                    {yours ? (
                      <p className="mt-3 text-sm text-ink-muted">
                        You wrote this, so somebody else has to review it. That is
                        what makes the review step mean something.
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/org/curriculum/narrative/${n.id}?part=preview`}
                        className={`inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-strong ${FOCUS_RING}`}
                      >
                        Read it through &rarr;
                      </Link>
                      <ButtonLink
                        href={`/org/curriculum/narrative/${n.id}?part=governance`}
                        emphasis="secondary"
                      >
                        {canReview && !yours ? "Decide" : "Status and versions"}
                      </ButtonLink>
                    </div>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="versions" className="mt-9">
        <SectionHeading
          id="versions"
          hint="Course versions are governed on the versions page, which enforces the day budget and standards coverage."
        >
          Course versions
        </SectionHeading>
        {versionsInReview.length === 0 ? (
          <Empty>No course version is in review.</Empty>
        ) : (
          <ul className="flex flex-col gap-4">
            {versionsInReview.map((v) => {
              const assisted = acceptedByVersion.get(v.id) ?? 0;
              return (
                <Card as="li" key={v.id}>
                  <CardHeader
                    title={`${v.courseTitle} ${v.version}`}
                    hint={v.notes}
                    action={
                      <StatusChip
                        label={CURRICULUM_STATUS_PRESENTATION[v.status].label}
                        tone={CURRICULUM_STATUS_PRESENTATION[v.status].tone}
                      />
                    }
                  />
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                      {assisted > 0 ? (
                        <StatusChip
                          label={`${assisted} assisted ${assisted === 1 ? "contribution" : "contributions"} accepted`}
                          tone="info"
                        />
                      ) : (
                        <StatusChip label="Written by hand" tone="neutral" />
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <ButtonLink href={`/org/curriculum/build/${v.id}`} emphasis="secondary">
                        Read its lessons
                      </ButtonLink>
                      <ButtonLink href="/org/curriculum" emphasis="secondary">
                        Version governance
                      </ButtonLink>
                    </div>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="assisted" className="mt-9">
        <SectionHeading
          id="assisted"
          hint="Every bounded request, and what a person decided about it."
        >
          Assistance history
        </SectionHeading>
        {generations.length === 0 ? (
          <Empty>Nobody has used design assistance yet.</Empty>
        ) : (
          <Card>
            <ul className="divide-y divide-line">
              {generations.slice(0, 40).map((g) => (
                <li key={g.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink">
                      {g.capability.replace(/_/g, " ")}
                      {g.lessonCode ? ` · ${g.lessonCode}` : ""}
                    </p>
                    <div className="flex items-center gap-2">
                      <StatusChip
                        label={g.status.replace(/_/g, " ")}
                        tone={
                          g.status === "accepted" || g.status === "accepted_edited"
                            ? "positive"
                            : g.status === "failed"
                              ? "attention"
                              : "neutral"
                        }
                      />
                      <span className="text-xs text-ink-muted">{nameOf(g.userId)}</span>
                    </div>
                  </div>
                  {g.instructions ? (
                    <p className="mt-0.5 text-sm text-ink-muted">
                      Asked for: {g.instructions}
                    </p>
                  ) : null}
                  {g.failureReason ? (
                    <p className="mt-0.5 text-sm text-ink-muted">{g.failureReason}</p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatDateTime(g.requestedAt)} · context sent:{" "}
                    {g.contextKeys.length === 0
                      ? "none"
                      : g.contextKeys.map((k) => k.replace(/_/g, " ")).join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
