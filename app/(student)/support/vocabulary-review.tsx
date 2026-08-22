"use client";

import { useState } from "react";

import { Button, Card } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

export type VocabCard = {
  term: string;
  meaning: string;
  lessonCode: string;
  courseTitle: string;
};

/**
 * Vocabulary review.
 *
 * Retrieval practice on the terms from the lessons the student is actually on.
 * Nothing here is recorded as evidence: it is self-checked practice, and the
 * page says so. Only the Spiral Review and the Exit Ticket write to the record.
 */
export function VocabularyReview({ cards }: { cards: VocabCard[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(new Set());

  if (cards.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-muted">
        No vocabulary has been authored for the lessons you are on.
      </p>
    );
  }

  const card = cards[index];

  function go(next: number) {
    setSeen((s) => new Set(s).add(index));
    setRevealed(false);
    setIndex(((next % cards.length) + cards.length) % cards.length);
  }

  return (
    <div>
      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {card.courseTitle} · {card.lessonCode}
        </p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{card.term}</p>

        <div className="mt-4 min-h-[3.5rem]">
          {revealed ? (
            <p className="text-base text-ink">{card.meaning}</p>
          ) : (
            <Button type="button" onClick={() => setRevealed(true)}>
              Show the meaning
            </Button>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => go(index - 1)}>
            Previous
          </Button>
          <Button type="button" emphasis="primary" onClick={() => go(index + 1)}>
            Next term
          </Button>
          <p className="text-sm text-ink-muted" aria-live="polite">
            Term {index + 1} of {cards.length} · {seen.size} reviewed
          </p>
        </div>
      </Card>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="All terms">
        {cards.map((c, i) => (
          <li key={`${c.lessonCode}-${c.term}`}>
            <button
              type="button"
              onClick={() => {
                setRevealed(false);
                setIndex(i);
              }}
              aria-current={i === index ? "true" : undefined}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${FOCUS_RING} ${
                i === index
                  ? "border-primary bg-primary text-white"
                  : seen.has(i)
                    ? "border-positive-line bg-positive-surface text-ink"
                    : "border-line bg-surface text-ink-muted hover:border-primary-line"
              }`}
            >
              {c.term}
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-ink-muted">
        Self-checked practice. Nothing here is recorded as evidence — only the
        Spiral Review and the Exit Ticket write to your record.
      </p>
    </div>
  );
}
