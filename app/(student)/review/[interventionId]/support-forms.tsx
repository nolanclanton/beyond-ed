"use client";

import Link from "next/link";

import {
  startInterventionAction,
  submitReadinessCheckAction,
  submitTransferCheckAction,
} from "@/lib/actions/student";
import { ActionForm } from "@/lib/design/action-form";
import { ItemRunner, type RunnerItem } from "@/lib/design/item-runner";
import { Button } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

export function StartSupportForm({
  interventionId,
  idempotencyKey,
}: {
  interventionId: string;
  idempotencyKey: string;
}) {
  return (
    <ActionForm action={startInterventionAction} idempotencyKey={idempotencyKey}>
      {(pending) => (
        <>
          <input type="hidden" name="interventionId" value={interventionId} />
          <div>
            <Button emphasis="primary" disabled={pending}>
              {pending ? "Starting…" : "Start this support"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function ReadinessRunner({
  items,
  interventionId,
  idempotencyKey,
  cycle,
}: {
  items: RunnerItem[];
  interventionId: string;
  idempotencyKey: string;
  cycle: number;
}) {
  return (
    <ItemRunner
      items={items}
      action={submitReadinessCheckAction}
      hidden={{ interventionId }}
      idempotencyKey={`${idempotencyKey}:${cycle}`}
      submitLabel="Record my readiness check"
      heading="Readiness item"
      onResult={(result) =>
        result.ok ? (
          <p>
            {result.meetsBar
              ? "That clears the bar. The transfer item is below."
              : "That is under the bar. The transfer item is still below — your teacher sees both results either way."}
          </p>
        ) : null
      }
    />
  );
}

export function TransferForm({
  item,
  interventionId,
  idempotencyKey,
  cycle,
}: {
  item: RunnerItem;
  interventionId: string;
  idempotencyKey: string;
  cycle: number;
}) {
  return (
    <ItemRunner
      items={[item]}
      action={async (formData) => {
        const parsed = JSON.parse(String(formData.get("answers") ?? "[]")) as {
          itemId: string;
          choiceId: string;
        }[];
        formData.set("itemId", parsed[0]?.itemId ?? "");
        formData.set("choiceId", parsed[0]?.choiceId ?? "");
        return submitTransferCheckAction(formData);
      }}
      hidden={{ interventionId }}
      idempotencyKey={`${idempotencyKey}:${cycle}`}
      submitLabel="Submit the transfer item"
      heading="Transfer item"
      onResult={(result) =>
        result.ok ? (
          <div>
            {result.detail ? <p>{String(result.detail)}</p> : null}
            <p className="mt-2">
              <Link
                href="/today"
                className={`font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
              >
                Back to Today
              </Link>
            </p>
          </div>
        ) : null
      }
    />
  );
}
