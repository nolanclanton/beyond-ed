import type { ReactNode } from "react";
import Link from "next/link";

import type { FoundationImportance } from "@/lib/db/types";
import {
  FOUNDATIONAL_AT,
  importanceMeaning,
  type Foundation,
} from "@/lib/curriculum/foundations";

import { StatusChip } from "./primitives";
import { FOCUS_RING, type Tone } from "./tokens";

/**
 * The curriculum matrix, rendered.
 *
 * Two things this module refuses to do, both from CLAUDE.md §12 and §13.
 *
 * A cell never carries its meaning in colour alone: the number of foundations
 * and the number of dependents are printed in the cell, and the accessible name
 * of the link says them in a sentence. The tint is a second channel, never the
 * first.
 *
 * The one warm tone is used for what warmth means everywhere else in the
 * product — a dependency the mind is meant to hold on to. A foundational link
 * is amber because it IS an upcoming dependency; red stays reserved for a link
 * that does not hold at all.
 */

/** The tone an importance reads as. Never the only channel. */
function importanceTone(importance: FoundationImportance | null): Tone {
  if (importance === null) return "neutral";
  if (importance >= FOUNDATIONAL_AT) return "attention";
  if (importance === 3) return "info";
  return "neutral";
}

function importanceLabel(importance: FoundationImportance | null): string {
  if (importance === null) return "Not governed";
  return importance >= FOUNDATIONAL_AT
    ? `Foundational · ${importance} of 5`
    : `Importance ${importance} of 5`;
}

export function ImportanceChip({
  importance,
}: {
  importance: FoundationImportance | null;
}) {
  return (
    <StatusChip
      label={importanceLabel(importance)}
      tone={importanceTone(importance)}
      title={importanceMeaning(importance)}
    />
  );
}

/** A foundation's target, its role, and how hard it binds — one row. */
export function FoundationRow({
  foundation,
  targetHref,
  targetName,
  action,
}: {
  foundation: Foundation;
  targetHref?: string;
  targetName: string;
  action?: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-2 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="font-mono text-xs text-ink-muted">
            {foundation.targetId}
            {foundation.source === "authored" ? " · added for this version" : ""}
            {foundation.retired ? " · retired in this version" : ""}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ink">
            {targetHref ? (
              <Link
                href={targetHref}
                className={`text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
              >
                {targetName}
              </Link>
            ) : (
              targetName
            )}
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">{foundation.role}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusChip
            label={foundation.kind === "support" ? "Support" : "Earlier lesson"}
            tone="neutral"
          />
          <ImportanceChip importance={foundation.importance} />
        </div>
      </div>
      <p className="text-sm text-ink">{importanceMeaning(foundation.importance)}</p>
      {foundation.note ? (
        <p className="text-sm text-ink-muted">Note: {foundation.note}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </li>
  );
}

export type MatrixCellData = {
  lessonCode: string;
  day: number;
  title: string;
  foundations: number;
  foundational: number;
  dependents: number;
  conflicts: number;
};

/**
 * One lesson in the course matrix.
 *
 * The cell prints two numbers — what this lesson rests on, and what rests on
 * it. That pair is the whole point of looking at a course as a matrix: it is
 * where the load sits, and it is not visible in a list.
 */
export function MatrixCell({
  cell,
  href,
}: {
  cell: MatrixCellData;
  href: string;
}) {
  const tint = cell.conflicts > 0
    ? "border-urgent-line bg-urgent-surface"
    : cell.foundational > 0
      ? "border-recall-line bg-recall-surface"
      : cell.dependents >= 3
        ? "border-primary-line bg-primary-surface"
        : "border-line bg-surface";

  return (
    <Link
      href={href}
      aria-label={`Day ${cell.day}, ${cell.title}. ${cell.foundations} foundations, ${cell.foundational} of them foundational. ${cell.dependents} later lessons depend on it.${cell.conflicts > 0 ? ` ${cell.conflicts} link does not hold.` : ""}`}
      className={`flex h-16 w-14 shrink-0 flex-col justify-between rounded-lg border p-1.5 text-left transition-colors hover:border-primary ${tint} ${FOCUS_RING}`}
    >
      <span className="text-[0.65rem] font-semibold text-ink-muted" aria-hidden="true">
        d{cell.day}
      </span>
      <span className="text-xs font-semibold text-ink" aria-hidden="true">
        {cell.foundations}
        <span className="font-normal text-ink-muted">/{cell.dependents}</span>
      </span>
      <span className="text-[0.6rem] leading-tight text-ink-muted" aria-hidden="true">
        {cell.conflicts > 0
          ? "conflict"
          : cell.foundational > 0
            ? `${cell.foundational} core`
            : " "}
      </span>
    </Link>
  );
}

/** What the tints and the two numbers mean, in words rather than a colour key. */
export function MatrixLegend() {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      <div className="flex gap-2">
        <dt className="font-semibold text-ink">6/4</dt>
        <dd className="text-ink-muted">
          Six pieces of prior learning; four later lessons depend on this one.
        </dd>
      </div>
      <div className="flex gap-2">
        <dt className="shrink-0 font-semibold text-recall">Amber</dt>
        <dd className="text-ink-muted">
          At least one foundation is governed as foundational — an upcoming
          dependency worth protecting.
        </dd>
      </div>
      <div className="flex gap-2">
        <dt className="shrink-0 font-semibold text-primary">Blue</dt>
        <dd className="text-ink-muted">
          Three or more later lessons rest on it. Moving it costs the most.
        </dd>
      </div>
      <div className="flex gap-2">
        <dt className="shrink-0 font-semibold text-urgent">Red</dt>
        <dd className="text-ink-muted">
          A link does not hold: it points at something this version runs later,
          or at a support that cannot return here.
        </dd>
      </div>
    </dl>
  );
}
