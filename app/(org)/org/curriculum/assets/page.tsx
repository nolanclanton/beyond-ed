import type { Metadata } from "next";
import Link from "next/link";

import { FEATURES } from "@/lib/ai/config";
import { canAuthorCurriculum } from "@/lib/auth/scope";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/clock";
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
import { ASSET_KIND_PRESENTATION, libraryFor } from "@/lib/narrative/assets";
import { readableNarratives } from "@/lib/narrative/bible";

import { AddAssetPanel, DecideCandidateForm } from "./asset-forms";

export const metadata: Metadata = {
  title: "Asset library · Beyond.Ed",
  description: "Artwork and documents a lesson can use, and the candidates waiting on a decision.",
};

/**
 * The Visual Design Studio's library (vision §6, §18).
 *
 * Two lists, and the split between them is the product: candidates are
 * proposals, accepted assets are curriculum. Nothing renders a candidate into a
 * lesson, and accepting one requires the alternative text that makes it
 * reachable by the whole class (CLAUDE.md §12).
 */
export default async function AssetLibraryPage() {
  const actor = await requireUser();
  const canAuthor = canAuthorCurriculum(actor);

  const all = libraryFor(actor);
  const candidates = all.filter((a) => a.status === "candidate");
  const accepted = all.filter((a) => a.status === "accepted");
  const rejected = all.filter((a) => a.status === "rejected");

  const narratives = readableNarratives(actor).map((n) => ({ id: n.id, title: n.title }));
  const narrativeTitle = (id: string | null): string => {
    if (!id) return "Not tied to a narrative";
    return db().narratives.find((n) => n.id === id)?.title ?? "A narrative you cannot read";
  };

  return (
    <div className="py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Asset library</h1>
          <p className="mt-2 max-w-3xl text-base text-ink-muted">
            Artwork and documents a lesson can place. A candidate is a proposal; an
            accepted asset is curriculum, and it carries the description that makes
            it reachable by everyone.
          </p>
        </div>
        {canAuthor ? null : <StatusChip label="Read-only for your role" tone="neutral" />}
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricTile value={`${accepted.length}`} label="Accepted" caption="Usable in a lesson" tone="positive" />
        <MetricTile
          value={`${candidates.length}`}
          label="Candidates"
          caption="Waiting on a person"
          tone={candidates.length > 0 ? "attention" : "neutral"}
        />
        <MetricTile value={`${rejected.length}`} label="Turned down" caption="Kept, so the record is complete" />
      </div>

      {FEATURES.visualGeneration ? null : (
        <div className="mt-6">
          <Banner title="Visual generation is switched off" tone="neutral">
            <p>
              You can still add artwork by address, and everything in this library
              works as it does with generation on. An administrator can enable
              generation from the design-assistance page.
            </p>
          </Banner>
        </div>
      )}

      {canAuthor ? (
        <section aria-labelledby="add" className="mt-8">
          <SectionHeading id="add" hint="An address you already have. It is accepted immediately, so it needs its description now.">
            Add artwork you already have
          </SectionHeading>
          <Card>
            <div className="p-5">
              <AddAssetPanel narratives={narratives} seq={1} />
            </div>
          </Card>
        </section>
      ) : null}

      {candidates.length > 0 ? (
        <section aria-labelledby="candidates" className="mt-9">
          <SectionHeading
            id="candidates"
            hint="Proposed, not part of anything. Accepting one needs its alternative text."
          >
            Waiting on a decision
          </SectionHeading>
          <ul className="grid gap-4 lg:grid-cols-2">
            {candidates.map((asset, index) => (
              <Card as="li" key={asset.id}>
                <CardHeader
                  title={asset.title}
                  hint={ASSET_KIND_PRESENTATION[asset.kind].label}
                  action={<StatusChip label="Candidate" tone="attention" />}
                />
                <div className="p-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt="Candidate image awaiting a decision. It is not part of any lesson."
                    className="max-h-64 w-full rounded-lg border border-line object-contain"
                  />
                  {asset.brief ? (
                    <p className="mt-3 text-sm text-ink-muted">Brief: {asset.brief}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-ink-muted">
                    {narrativeTitle(asset.narrativeId)} · {formatDateTime(asset.addedAt)}
                  </p>
                  {canAuthor ? (
                    <div className="mt-4">
                      <DecideCandidateForm assetId={asset.id} seq={10 + index} />
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="accepted" className="mt-9">
        <SectionHeading
          id="accepted"
          hint="These are the ones a lesson may place. Every one carries alternative text."
        >
          Accepted
        </SectionHeading>
        {accepted.length === 0 ? (
          <Empty>Nothing accepted yet.</Empty>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accepted.map((asset) => (
              <Card as="li" key={asset.id}>
                <div className="p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={asset.alt}
                    className="h-40 w-full rounded-lg border border-line object-cover"
                  />
                  <p className="mt-3 text-sm font-semibold text-ink">{asset.title}</p>
                  <p className="text-xs text-ink-muted">
                    {ASSET_KIND_PRESENTATION[asset.kind].label} · {asset.aspectRatio}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">{asset.alt}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {asset.source === "generated" ? (
                      <StatusChip label="AI-assisted" tone="info" />
                    ) : (
                      <StatusChip label="Supplied" tone="neutral" />
                    )}
                    <span className="text-xs text-ink-muted">
                      Placed {asset.usageCount}{" "}
                      {asset.usageCount === 1 ? "time" : "times"}
                    </span>
                  </div>
                  {asset.narrativeId ? (
                    <p className="mt-2 text-xs">
                      <Link
                        href={`/org/curriculum/narrative/${asset.narrativeId}?part=visual`}
                        className={`text-primary underline underline-offset-4 ${FOCUS_RING}`}
                      >
                        {narrativeTitle(asset.narrativeId)}
                      </Link>
                    </p>
                  ) : null}
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>

      {rejected.length > 0 ? (
        <section aria-labelledby="rejected" className="mt-9">
          <SectionHeading
            id="rejected"
            hint="Nothing here is deleted. A turned-down candidate stays as a record of what was proposed."
          >
            Turned down
          </SectionHeading>
          <Card>
            <ul className="divide-y divide-line">
              {rejected.map((asset) => (
                <li key={asset.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm text-ink">{asset.title}</p>
                    <p className="text-xs text-ink-muted">
                      {ASSET_KIND_PRESENTATION[asset.kind].label} ·{" "}
                      {formatDateTime(asset.addedAt)}
                    </p>
                  </div>
                  <StatusChip label="Rejected" tone="neutral" />
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}

      <div className="mt-9">
        <Banner title="Accepting an asset does not place it" tone="info">
          An accepted asset is in the library. Putting it in front of a student is
          a further act in the lesson studio, on a draft version, which reaches a
          class only when that version is published.{" "}
          <ButtonLink href="/org/curriculum/build" emphasis="quiet">
            Open the studio
          </ButtonLink>
        </Banner>
      </div>
    </div>
  );
}
