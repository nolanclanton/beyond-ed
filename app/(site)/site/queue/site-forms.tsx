"use client";

import { useState } from "react";

import { assignRecommendationAction } from "@/lib/actions/staff";
import { ActionForm } from "@/lib/design/action-form";
import { Button } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

const FIELD = `mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 ${FOCUS_RING}`;

export function SiteDecideForm({
  refInput,
  idempotencySalt,
  teacherName,
}: {
  refInput: { enrollmentId: string; skill: string; trigger: string };
  idempotencySalt: string;
  teacherName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button
        type="button"
        emphasis="primary"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Close" : "Assign this support as site administrator"}
      </Button>

      {open ? (
        <div className="mt-4 rounded-lg border border-notice-line bg-notice-surface p-4">
          <p className="text-sm font-semibold text-ink">
            This is recorded as a site-administrator assignment
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            The audit event will name you and your role, not {teacherName}. A reason
            is required.
          </p>
          <ActionForm
            className="mt-3"
            action={assignRecommendationAction}
            idempotencyKey={`assign:${idempotencySalt}`}
          >
            {(pending) => (
              <>
                <input type="hidden" name="enrollmentId" value={refInput.enrollmentId} />
                <input type="hidden" name="skill" value={refInput.skill} />
                <input type="hidden" name="trigger" value={refInput.trigger} />
                <div>
                  <label htmlFor={`sr-${idempotencySalt}`} className="text-sm font-medium text-ink">
                    Reason (recorded)
                  </label>
                  <input
                    id={`sr-${idempotencySalt}`}
                    name="reason"
                    required
                    minLength={4}
                    maxLength={500}
                    placeholder="Unresolved for six school days; teacher on leave. Coordinated with the department lead."
                    className={FIELD}
                  />
                </div>
                <div>
                  <label htmlFor={`sd-${idempotencySalt}`} className="text-sm font-medium text-ink">
                    Due expectation
                  </label>
                  <select
                    id={`sd-${idempotencySalt}`}
                    name="dueExpectation"
                    defaultValue="Before the next intervention-capacity day"
                    className={FIELD}
                  >
                    <option>Before the next intervention-capacity day</option>
                    <option>This week</option>
                    <option>Before the next unit assessment</option>
                  </select>
                </div>
                <div>
                  <Button emphasis="primary" disabled={pending}>
                    {pending ? "Assigning…" : "Assign and record the reason"}
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
