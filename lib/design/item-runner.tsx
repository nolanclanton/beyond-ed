"use client";

import { useActionState, useRef, useState } from "react";

import type { ActionResult } from "@/lib/actions/result";
import { Banner, Button } from "./primitives";
import { FOCUS_RING } from "./tokens";

export type RunnerItem = {
  id: string;
  stem: string;
  choices: { id: string; text: string }[];
  /** Shown only AFTER the set is submitted (blueprint §4). */
  rationale?: string;
  correctChoiceId?: string;
};

type AnyResult = ActionResult<Record<string, unknown>>;

/** Idle threshold in milliseconds. Mirrors CLAUDE.md §5 (five minutes). */
const IDLE_PAUSE_MS = 5 * 60 * 1000;

/**
 * Runs a set of items and submits the SELECTED CHOICES to a server action.
 *
 * The client never asserts correctness. It reports which choice was picked and
 * how many minutes of meaningful activity elapsed; the server scores the set,
 * writes the evidence, and decides what happens next (CLAUDE.md §1).
 *
 * Meaningful activity is measured between interactions and each gap is capped
 * at the five-minute idle threshold, so a page left open cannot inflate the
 * record (CLAUDE.md §5).
 */
export function ItemRunner({
  items,
  action,
  hidden,
  idempotencyKey,
  submitLabel,
  heading,
  onResult,
}: {
  items: RunnerItem[];
  action: (formData: FormData) => Promise<AnyResult>;
  hidden: Record<string, string>;
  idempotencyKey: string;
  submitLabel: string;
  heading?: string;
  onResult?: (result: AnyResult) => React.ReactNode;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const activeMs = useRef(0);
  const lastTouch = useRef<number | null>(null);

  const [state, formAction, pending] = useActionState<AnyResult | null, FormData>(
    async (_prev, formData) => {
      formData.set(
        "answers",
        JSON.stringify(
          items.map((i) => ({ itemId: i.id, choiceId: answers[i.id] ?? "" })),
        ),
      );
      formData.set("minutes", String(Math.round((activeMs.current / 60000) * 10) / 10));
      return action(formData);
    },
    null,
  );

  function touch() {
    const now = Date.now();
    if (lastTouch.current !== null) {
      activeMs.current += Math.min(now - lastTouch.current, IDLE_PAUSE_MS);
    }
    lastTouch.current = now;
  }

  const answered = items.filter((i) => answers[i.id]).length;
  const submitted = state !== null && state.ok;

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

        <ol className="flex flex-col gap-6">
          {items.map((item, index) => {
            const picked = answers[item.id];
            return (
              <li key={item.id}>
                <fieldset disabled={submitted || pending}>
                  <legend className="text-sm font-semibold text-ink">
                    {heading ? `${heading} ` : ""}
                    {index + 1} of {items.length}
                  </legend>
                  <p className="mt-1.5 text-base text-ink">{item.stem}</p>
                  <div className="mt-3 flex flex-col gap-2">
                    {item.choices.map((choice) => {
                      const isPicked = picked === choice.id;
                      const isCorrect =
                        submitted && item.correctChoiceId === choice.id;
                      const isWrongPick =
                        submitted && isPicked && item.correctChoiceId !== choice.id;
                      return (
                        <label
                          key={choice.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                            isCorrect
                              ? "border-positive-line bg-positive-surface"
                              : isWrongPick
                                ? "border-urgent-line bg-urgent-surface"
                                : isPicked
                                  ? "border-primary-line bg-primary-surface"
                                  : "border-line bg-surface hover:border-primary-line"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`item-${item.id}`}
                            value={choice.id}
                            checked={isPicked ?? false}
                            onChange={() => {
                              touch();
                              setAnswers((a) => ({ ...a, [item.id]: choice.id }));
                            }}
                            className={`mt-0.5 h-4 w-4 shrink-0 accent-[#1F5FA0] ${FOCUS_RING}`}
                          />
                          <span className="text-ink">
                            {choice.text}
                            {isCorrect ? (
                              <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-positive">
                                Correct answer
                              </span>
                            ) : null}
                            {isWrongPick ? (
                              <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-urgent">
                                Your answer
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                {submitted && item.rationale ? (
                  <p className="mt-2 rounded-lg bg-surface-sunken px-4 py-3 text-sm text-ink">
                    <span className="font-semibold">Why: </span>
                    {item.rationale}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>

        {!submitted ? (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button emphasis="primary" disabled={pending || answered < items.length}>
              {pending ? "Recording…" : submitLabel}
            </Button>
            <p className="text-sm text-ink-muted" aria-live="polite">
              {answered} of {items.length} answered
              {answered < items.length ? " — answer every item to submit" : ""}
            </p>
          </div>
        ) : null}
      </form>

      {state ? (
        <div className="mt-5" aria-live="polite">
          {state.ok ? (
            <Banner title={state.message} tone="positive" role="status">
              {onResult ? onResult(state) : null}
            </Banner>
          ) : (
            <Banner title={state.message} tone="urgent" role="alert">
              <p>{state.preserved}</p>
              <p className="mt-1">{state.nextStep}</p>
            </Banner>
          )}
        </div>
      ) : null}
    </div>
  );
}
