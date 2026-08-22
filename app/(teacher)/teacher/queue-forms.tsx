"use client";

import { useState } from "react";

import {
  assignRecommendationAction,
  dismissRecommendationAction,
  escalateRecommendationAction,
} from "@/lib/actions/staff";
import { ActionForm } from "@/lib/design/action-form";
import { Button } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

const FIELD = `mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 ${FOCUS_RING}`;

export type QueueRef = {
  enrollmentId: string;
  skill: string;
  trigger: string;
};

/**
 * Quick Assign (blueprint §5).
 *
 * Required fields: student or group, skill, intervention, reason, due
 * expectation, completion rule, transfer check, and return destination. The
 * first three and the last three are fixed by the recommendation and shown in
 * the preview; the teacher supplies the reason and the due expectation.
 *
 * Preview before confirm: the assign form is only reachable after opening the
 * preview, which shows the student view and the workload impact.
 */
export function DecideForm({
  refInput,
  suggestedReason,
  idempotencySalt,
}: {
  refInput: QueueRef;
  suggestedReason: string;
  idempotencySalt: string;
}) {
  const [mode, setMode] = useState<"none" | "assign" | "dismiss" | "escalate">("none");

  const hidden = (
    <>
      <input type="hidden" name="enrollmentId" value={refInput.enrollmentId} />
      <input type="hidden" name="skill" value={refInput.skill} />
      <input type="hidden" name="trigger" value={refInput.trigger} />
    </>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          emphasis="primary"
          aria-expanded={mode === "assign"}
          onClick={() => setMode(mode === "assign" ? "none" : "assign")}
        >
          {mode === "assign" ? "Close preview" : "Preview and assign"}
        </Button>
        <Button
          type="button"
          aria-expanded={mode === "dismiss"}
          onClick={() => setMode(mode === "dismiss" ? "none" : "dismiss")}
        >
          {mode === "dismiss" ? "Close" : "Dismiss with a reason"}
        </Button>
        <Button
          type="button"
          emphasis="caution"
          aria-expanded={mode === "escalate"}
          onClick={() => setMode(mode === "escalate" ? "none" : "escalate")}
        >
          {mode === "escalate" ? "Close" : "Escalate"}
        </Button>
      </div>

      {mode === "assign" ? (
        <div className="mt-4 rounded-lg border border-primary-line bg-primary-surface p-4">
          <p className="text-sm font-semibold text-ink">Confirm the assignment</p>
          <p className="mt-1 text-sm text-ink-muted">
            The plan is created with the return destination and return rule shown
            above. Your name and reason are recorded on the audit event.
          </p>
          <ActionForm
            className="mt-3"
            action={assignRecommendationAction}
            idempotencyKey={`assign:${idempotencySalt}`}
          >
            {(pending) => (
              <>
                {hidden}
                <div>
                  <label htmlFor={`reason-${idempotencySalt}`} className="text-sm font-medium text-ink">
                    Reason (recorded)
                  </label>
                  <input
                    id={`reason-${idempotencySalt}`}
                    name="reason"
                    required
                    minLength={4}
                    maxLength={500}
                    defaultValue={suggestedReason}
                    className={FIELD}
                  />
                </div>
                <div>
                  <label htmlFor={`due-${idempotencySalt}`} className="text-sm font-medium text-ink">
                    Due expectation
                  </label>
                  <select
                    id={`due-${idempotencySalt}`}
                    name="dueExpectation"
                    defaultValue="Before the next intervention-capacity day"
                    className={FIELD}
                  >
                    <option>Before the next intervention-capacity day</option>
                    <option>During today&rsquo;s intervention time</option>
                    <option>Before the next unit assessment</option>
                    <option>This week</option>
                  </select>
                </div>
                <div>
                  <Button emphasis="primary" disabled={pending}>
                    {pending ? "Assigning…" : "Assign this support"}
                  </Button>
                </div>
              </>
            )}
          </ActionForm>
        </div>
      ) : null}

      {mode === "dismiss" ? (
        <div className="mt-4 rounded-lg border border-line bg-surface-sunken p-4">
          <p className="text-sm font-semibold text-ink">Dismiss this recommendation</p>
          <p className="mt-1 text-sm text-ink-muted">
            A reason is required. It stays off your queue until new evidence
            appears on this skill.
          </p>
          <ActionForm
            className="mt-3"
            action={dismissRecommendationAction}
            idempotencyKey={`dismiss:${idempotencySalt}`}
            successTone="info"
          >
            {(pending) => (
              <>
                {hidden}
                <div>
                  <label htmlFor={`dreason-${idempotencySalt}`} className="text-sm font-medium text-ink">
                    Reason (recorded)
                  </label>
                  <input
                    id={`dreason-${idempotencySalt}`}
                    name="reason"
                    required
                    minLength={4}
                    maxLength={500}
                    placeholder="Already covered in a small group on Tuesday."
                    className={FIELD}
                  />
                </div>
                <div>
                  <Button disabled={pending}>
                    {pending ? "Recording…" : "Dismiss with this reason"}
                  </Button>
                </div>
              </>
            )}
          </ActionForm>
        </div>
      ) : null}

      {mode === "escalate" ? (
        <div className="mt-4 rounded-lg border border-urgent-line bg-urgent-surface p-4">
          <p className="text-sm font-semibold text-ink">Escalate instead of assigning</p>
          <p className="mt-1 text-sm text-ink-muted">
            Use this when another short support is not the right move — a
            conference, a diagnostic, or specialist involvement.
          </p>
          <ActionForm
            className="mt-3"
            action={escalateRecommendationAction}
            idempotencyKey={`escalate:${idempotencySalt}`}
            successTone="notice"
          >
            {(pending) => (
              <>
                {hidden}
                <div>
                  <label htmlFor={`ereason-${idempotencySalt}`} className="text-sm font-medium text-ink">
                    Reason (recorded)
                  </label>
                  <input
                    id={`ereason-${idempotencySalt}`}
                    name="reason"
                    required
                    minLength={4}
                    maxLength={500}
                    placeholder="Scheduling a conference; the pattern is wider than this skill."
                    className={FIELD}
                  />
                </div>
                <div>
                  <Button emphasis="caution" disabled={pending}>
                    {pending ? "Recording…" : "Escalate to teacher review"}
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
