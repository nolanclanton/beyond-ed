"use client";

import { useState } from "react";

import {
  clearCapabilityDecisionAction,
  setCapabilityEnabledAction,
} from "@/lib/actions/ai-config";
import { ActionForm } from "@/lib/design/action-form";
import { Button } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

/**
 * The administrator's switch for one capability.
 *
 * Turning something off changes what every author in the organization can do, so
 * it asks for a reason rather than being a bare toggle — and the reason is what a
 * colleague reads six months later when they wonder where a control went.
 *
 * The control is a disclosure rather than an instant switch for the same reason.
 * A single click that silently removed a capability from every author's screen
 * would be the kind of control people learn to be afraid of.
 */
export function CapabilityToggle({
  capability,
  label,
  enabled,
  decided,
  seq,
}: {
  capability: string;
  label: string;
  enabled: boolean;
  /** True when somebody chose this, rather than it being the shipped default. */
  decided: boolean;
  seq: number;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          emphasis={enabled ? "quiet" : "secondary"}
          onClick={() => setOpen(true)}
          aria-expanded={false}
        >
          {enabled ? "Turn off" : "Turn on"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface-sunken p-3">
      <ActionForm
        action={setCapabilityEnabledAction}
        idempotencyKey={`capability-${capability}-${enabled ? "off" : "on"}-${seq}`}
        successTone={enabled ? "notice" : "positive"}
      >
        {(pending) => (
          <>
            <input type="hidden" name="capability" value={capability} />
            <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
            <p className="text-sm text-ink">
              {enabled ? (
                <>
                  Turning <strong>{label}</strong> off removes it from every
                  author&rsquo;s panel in your organization. Nothing already
                  written is affected.
                </>
              ) : (
                <>
                  Turning <strong>{label}</strong> on makes it available to every
                  curriculum author in your organization.
                </>
              )}
            </p>
            <label className="mt-2 block">
              <span className="text-sm font-medium text-ink">Reason</span>
              <input
                name="reason"
                required
                minLength={4}
                maxLength={500}
                placeholder={
                  enabled
                    ? "Not using this until the team has agreed a house style."
                    : "The team agreed to trial this for the spring unit."
                }
                className={`mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 ${FOCUS_RING}`}
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="submit"
                emphasis={enabled ? "caution" : "primary"}
                disabled={pending}
              >
                {pending
                  ? "Recording…"
                  : enabled
                    ? `Turn ${label} off`
                    : `Turn ${label} on`}
              </Button>
              <Button type="button" emphasis="quiet" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </ActionForm>

      {decided ? (
        <div className="mt-3 border-t border-line pt-3">
          <ActionForm
            action={clearCapabilityDecisionAction}
            idempotencyKey={`capability-${capability}-default-${seq}`}
            successTone="info"
          >
            {(pending) => (
              <>
                <input type="hidden" name="capability" value={capability} />
                <input
                  type="hidden"
                  name="reason"
                  value="Returned to the shipped default."
                />
                <p className="text-xs text-ink-muted">
                  Your organization currently holds an opinion about this one. You
                  can stop holding it and follow whatever Beyond.Ed ships.
                </p>
                <div className="mt-2">
                  <Button type="submit" emphasis="quiet" disabled={pending}>
                    {pending ? "Recording…" : "Use the shipped default"}
                  </Button>
                </div>
              </>
            )}
          </ActionForm>
        </div>
      ) : null}
    </div>
  );
}
