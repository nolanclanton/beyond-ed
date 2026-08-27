import type { Metadata } from "next";
import Link from "next/link";

import { canAuthorCurriculum } from "@/lib/auth/scope";
import { requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/clock";
import {
  bankFacets,
  filtersFromParams,
  searchBank,
  sortFromParams,
  type BankEntry,
} from "@/lib/narrative/bank";
import { NARRATIVE_STATUS_PRESENTATION } from "@/lib/narrative/status";
import { NARRATIVE_STATUSES } from "@/lib/db/types";
import {
  Banner,
  ButtonLink,
  Card,
  CardHeader,
  Empty,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

export const metadata: Metadata = {
  title: "Narrative Bank · Beyond.Ed",
  description:
    "Find a story world to build on, preview it, and duplicate it into your own workspace.",
};

/**
 * The Narrative Bank (vision §5, §16).
 *
 * A library of story worlds, so a designer starts from a proven structure
 * rather than from nothing. Filtering is plain string matching over stored
 * fields and the order is stable — a bank that returned a different set on
 * Tuesday would not be one anyone could rely on.
 *
 * Every filter lives in the URL, which is what makes a search shareable, a back
 * button work, and the whole page a Server Component with no client state to
 * keep in step.
 */
export default async function NarrativeBankPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireUser();
  const params = await searchParams;
  const filters = filtersFromParams(params);
  const sort = sortFromParams(params);
  const facets = bankFacets(actor);
  const entries = searchBank(actor, filters, sort);
  const canAuthor = canAuthorCurriculum(actor);

  return (
    <div className="py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Narrative Bank</h1>
          <p className="mt-2 max-w-3xl text-base text-ink-muted">
            Story worlds a unit can be taught inside. Read one, duplicate it, and
            make the copy your own — the original is never touched.
          </p>
        </div>
        {canAuthor ? (
          <ButtonLink href="/org/curriculum/narrative/new" emphasis="primary">
            Start a narrative
          </ButtonLink>
        ) : (
          <StatusChip label="Read-only for your role" tone="neutral" />
        )}
      </header>

      <section aria-labelledby="find" className="mt-8">
        <SectionHeading id="find" hint="Everything here is stored on the narrative itself.">
          Find one
        </SectionHeading>
        <Card>
          <form method="get" className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="lg:col-span-2">
              <span className="text-sm font-medium text-ink">Search</span>
              <input
                type="search"
                name="q"
                defaultValue={filters.query}
                placeholder="Title, premise, character, keyword, creator…"
                className={`mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ${FOCUS_RING}`}
              />
            </label>

            <Select
              label="Status"
              name="status"
              value={filters.status}
              options={NARRATIVE_STATUSES.map((s) => ({
                value: s,
                label: NARRATIVE_STATUS_PRESENTATION[s].label,
              }))}
            />
            <Select
              label="Subject"
              name="subject"
              value={filters.subject}
              options={facets.subjects.map((s) => ({ value: s, label: s }))}
            />
            <Select
              label="Course"
              name="course"
              value={filters.courseId}
              options={facets.courseIds.map((c) => ({ value: c, label: c }))}
            />
            <Select
              label="Genre"
              name="genre"
              value={filters.genre}
              options={facets.genres.map((g) => ({ value: g, label: g }))}
            />
            <Select
              label="Grade band"
              name="grade"
              value={filters.gradeBand}
              options={facets.gradeBands.map((g) => ({ value: g, label: g }))}
            />
            <Select
              label="Creator"
              name="creator"
              value={filters.creatorUserId}
              options={facets.creators.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Select
              label="Order"
              name="sort"
              value={sort}
              anyLabel="Recently updated"
              options={[
                { value: "title", label: "Title" },
                { value: "most_reused", label: "Most reused" },
              ]}
            />

            <div className="flex flex-wrap items-end gap-4 sm:col-span-2 lg:col-span-4">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  name="official"
                  value="1"
                  defaultChecked={filters.officialOnly}
                  className={`h-4 w-4 rounded border-line-strong ${FOCUS_RING}`}
                />
                Official templates only
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  name="mine"
                  value="1"
                  defaultChecked={filters.mineOnly}
                  className={`h-4 w-4 rounded border-line-strong ${FOCUS_RING}`}
                />
                Only ones I can edit
              </label>
              <button
                type="submit"
                className={`rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-strong ${FOCUS_RING}`}
              >
                Search
              </button>
              <Link
                href="/org/curriculum/narrative"
                className={`rounded px-2 py-1 text-sm text-primary underline underline-offset-4 ${FOCUS_RING}`}
              >
                Clear
              </Link>
            </div>
          </form>
        </Card>
      </section>

      <section aria-labelledby="results" className="mt-8">
        <SectionHeading
          id="results"
          hint={
            entries.length === 1
              ? "One narrative."
              : `${entries.length} narratives. Someone else's unfinished draft is not listed.`
          }
        >
          Results
        </SectionHeading>

        {entries.length === 0 ? (
          <Empty>
            Nothing matches that. Clear the filters, or start a narrative of your
            own.
          </Empty>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {entries.map((entry) => (
              <BankCard key={entry.narrative.id} entry={entry} />
            ))}
          </ul>
        )}
      </section>

      {canAuthor ? null : (
        <div className="mt-8">
          <Banner title="You can read these but not build with them" tone="neutral">
            Curriculum authoring is a separate authorization. An administrator
            grants it; holding an administrative role does not.
          </Banner>
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  name,
  value,
  options,
  anyLabel = "Any",
}: {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  anyLabel?: string;
}) {
  return (
    <label>
      <span className="text-sm font-medium text-ink">{label}</span>
      <select
        name={name}
        defaultValue={value === "any" ? "" : value}
        className={`mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ${FOCUS_RING}`}
      >
        <option value="">{anyLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function BankCard({ entry }: { entry: BankEntry }) {
  const n = entry.narrative;
  const presentation = NARRATIVE_STATUS_PRESENTATION[n.status];
  return (
    <Card as="li">
      <CardHeader
        title={n.title}
        hint={n.premise || "No premise written yet."}
        action={
          <div className="flex flex-col items-end gap-1">
            <StatusChip label={presentation.label} tone={presentation.tone} />
            {n.official ? (
              <StatusChip label="Official template" tone="positive" />
            ) : null}
          </div>
        }
      />
      <div className="p-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          <Fact label="Subject" value={n.subject || "—"} />
          <Fact label="Genre" value={n.genre || "—"} />
          <Fact label="Grade band" value={n.gradeBand || "—"} />
          <Fact label="Chapters" value={`${entry.chapters}`} />
          <Fact label="Lesson beats" value={`${entry.beats}`} />
          <Fact label="Characters" value={`${entry.characters}`} />
          <Fact label="Creator" value={entry.creatorName} />
          <Fact label="Last changed" value={formatDate(n.updatedAt)} />
          <Fact
            label="Reused"
            value={
              n.reuseCount === 0
                ? "Not yet"
                : `${n.reuseCount} ${n.reuseCount === 1 ? "copy" : "copies"}`
            }
          />
        </dl>

        {entry.basedOnTitle ? (
          <p className="mt-3 text-sm text-ink-muted">
            Based on &ldquo;{entry.basedOnTitle}&rdquo;. Independent of it since
            the day it was copied.
          </p>
        ) : null}

        {n.keywords.length > 0 ? (
          <p className="mt-3 text-xs text-ink-muted">{n.keywords.join(" · ")}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/org/curriculum/narrative/${n.id}`}
            className={`inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-strong ${FOCUS_RING}`}
          >
            {entry.canEdit ? "Open" : "Read"} &rarr;
          </Link>
        </div>
      </div>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  );
}
