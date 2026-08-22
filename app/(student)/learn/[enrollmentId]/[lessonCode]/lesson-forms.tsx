"use client";

import Link from "next/link";

import {
  startLessonAction,
  submitExitTicketAction,
  submitSpiralReviewAction,
  completeLessonAction,
} from "@/lib/actions/student";
import { ActionForm } from "@/lib/design/action-form";
import { ItemRunner, type RunnerItem } from "@/lib/design/item-runner";
import { Button } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

export function StartLessonForm({
  enrollmentId,
  lessonCode,
  idempotencyKey,
  label,
}: {
  enrollmentId: string;
  lessonCode: string;
  idempotencyKey: string;
  label: string;
}) {
  return (
    <ActionForm action={startLessonAction} idempotencyKey={idempotencyKey}>
      {(pending) => (
        <>
          <input type="hidden" name="enrollmentId" value={enrollmentId} />
          <input type="hidden" name="lessonCode" value={lessonCode} />
          <div>
            <Button emphasis="primary" disabled={pending}>
              {pending ? "Opening…" : label}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function SpiralReviewRunner({
  items,
  enrollmentId,
  lessonCode,
  idempotencyKey,
}: {
  items: RunnerItem[];
  enrollmentId: string;
  lessonCode: string;
  idempotencyKey: string;
}) {
  return (
    <ItemRunner
      items={items}
      action={submitSpiralReviewAction}
      hidden={{ enrollmentId, lessonCode }}
      idempotencyKey={idempotencyKey}
      submitLabel="Record my Spiral Review"
      heading="Review item"
      onResult={(result) =>
        result.ok ? (
          <p>
            {String(result.correct)} of {String(result.total)} correct. Explanations
            are under each item.
          </p>
        ) : null
      }
    />
  );
}

export function ExitTicketRunner({
  items,
  enrollmentId,
  lessonCode,
  idempotencyKey,
}: {
  items: RunnerItem[];
  enrollmentId: string;
  lessonCode: string;
  idempotencyKey: string;
}) {
  return (
    <ItemRunner
      items={items}
      action={submitExitTicketAction}
      hidden={{ enrollmentId, lessonCode }}
      idempotencyKey={idempotencyKey}
      submitLabel="Submit Exit Ticket"
      heading="Exit Ticket item"
      onResult={(result) =>
        result.ok ? (
          <div>
            <p className="font-semibold">
              {String(result.correctCount)} of {String(result.itemCount)} ={" "}
              {String(result.percent)}% &mdash; band {String(result.bandLabel)}
            </p>
            <p className="mt-1">{String(result.studentMeaning)}</p>
            <p className="mt-2">
              <Link
                href={`/learn/${enrollmentId}/${lessonCode}?stage=10`}
                className={`font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
              >
                See what happens next
              </Link>
            </p>
          </div>
        ) : null
      }
    />
  );
}

export function CompleteLessonForm({
  enrollmentId,
  lessonCode,
  idempotencyKey,
}: {
  enrollmentId: string;
  lessonCode: string;
  idempotencyKey: string;
}) {
  return (
    <ActionForm action={completeLessonAction} idempotencyKey={idempotencyKey}>
      {(pending) => (
        <>
          <input type="hidden" name="enrollmentId" value={enrollmentId} />
          <input type="hidden" name="lessonCode" value={lessonCode} />
          <div>
            <Button emphasis="primary" disabled={pending}>
              {pending ? "Recording…" : "Mark reviewed and unlock the next lesson"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}
