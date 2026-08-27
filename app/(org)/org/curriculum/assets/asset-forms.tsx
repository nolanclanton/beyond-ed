"use client";

import { useState } from "react";

import { addAssetAction, decideAssetAction } from "@/lib/actions/assets";
import { ASSET_ASPECT_RATIOS, ASSET_KINDS } from "@/lib/db/types";
import { ActionForm } from "@/lib/design/action-form";
import { Button } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

/**
 * The asset library's controls.
 *
 * Client components because choosing a kind and deciding a candidate are
 * interaction. Both submit validated, audited server actions; the browser is
 * never trusted with whether an asset may exist (CLAUDE.md §1).
 */

const FIELD = `mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 ${FOCUS_RING}`;

const KIND_LABEL: Record<(typeof ASSET_KINDS)[number], string> = {
  hero: "Lesson hero image",
  character: "Character portrait",
  environment: "Environment scene",
  diagram: "Explanatory diagram",
  map: "Map",
  mission_brief: "Mission briefing",
  case_file: "Case file",
  artifact: "Historical-style artifact",
  interface: "Interface or control panel",
  infographic: "Infographic",
  chapter_cover: "Chapter cover",
  background: "Background",
};

export function AddAssetPanel({
  narratives,
  seq,
}: {
  narratives: { id: string; title: string }[];
  seq: number;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} aria-expanded={false}>
        Add artwork
      </Button>
    );
  }

  return (
    <ActionForm action={addAssetAction} idempotencyKey={`asset-add-${seq}`}>
      {(pending) => (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="text-sm font-medium text-ink">Title</span>
              <input name="title" required maxLength={200} className={FIELD} />
            </label>
            <label>
              <span className="text-sm font-medium text-ink">Kind</span>
              <select name="kind" defaultValue="hero" className={FIELD}>
                {ASSET_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-ink">Address</span>
              <p className="mt-0.5 text-xs text-ink-muted">
                Where the image lives. Binary upload needs storage, which is not
                provisioned in this build.
              </p>
              <input name="url" required maxLength={2000} className={FIELD} />
            </label>
            <label>
              <span className="text-sm font-medium text-ink">Narrative</span>
              <select name="narrativeId" defaultValue="" className={FIELD}>
                <option value="">Not tied to a narrative</option>
                {narratives.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-ink">Aspect ratio</span>
              <select name="aspectRatio" defaultValue="16:9" className={FIELD}>
                {ASSET_ASPECT_RATIOS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-ink">Lesson code</span>
              <p className="mt-0.5 text-xs text-ink-muted">
                Optional. Leave blank if it belongs to the world rather than one
                lesson.
              </p>
              <input name="lessonCode" maxLength={64} className={FIELD} />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-ink">Alternative text</span>
              <p className="mt-0.5 text-xs text-ink-muted">
                What the image shows, not that it is an image. Required — without
                it, the picture is simply missing for part of the class.
              </p>
              <textarea name="alt" required rows={2} maxLength={1000} className={FIELD} />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-ink">Brief</span>
              <p className="mt-0.5 text-xs text-ink-muted">
                Optional. What this was made to show, for whoever revisits it.
              </p>
              <textarea name="brief" rows={2} maxLength={2000} className={FIELD} />
            </label>
          </div>

          <label>
            <span className="text-sm font-medium text-ink">Reason</span>
            <input
              name="reason"
              required
              minLength={4}
              maxLength={500}
              defaultValue="Added artwork for the unit."
              className={FIELD}
            />
          </label>

          <div className="flex gap-3">
            <Button type="submit" emphasis="primary" disabled={pending}>
              {pending ? "Adding…" : "Add to the library"}
            </Button>
            <Button type="button" emphasis="quiet" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

/**
 * Deciding a candidate.
 *
 * Accepting requires the alternative text, written now by the person who can
 * see the image and can tell whether the description is true.
 */
export function DecideCandidateForm({ assetId, seq }: { assetId: string; seq: number }) {
  return (
    <div className="flex flex-col gap-4">
      <ActionForm action={decideAssetAction} idempotencyKey={`asset-accept-${assetId}-${seq}`}>
        {(pending) => (
          <>
            <input type="hidden" name="assetId" value={assetId} />
            <input type="hidden" name="decision" value="accepted" />
            <label>
              <span className="text-sm font-medium text-ink">Alternative text</span>
              <p className="mt-0.5 text-xs text-ink-muted">
                Describe what it shows. Required to accept.
              </p>
              <textarea name="alt" required rows={2} maxLength={1000} className={FIELD} />
            </label>
            <label>
              <span className="text-sm font-medium text-ink">Reason</span>
              <input
                name="reason"
                required
                minLength={4}
                maxLength={500}
                defaultValue="Reviewed the candidate and accepted it."
                className={FIELD}
              />
            </label>
            <div>
              <Button type="submit" emphasis="primary" disabled={pending}>
                {pending ? "Accepting…" : "Accept into the library"}
              </Button>
            </div>
          </>
        )}
      </ActionForm>

      <ActionForm
        action={decideAssetAction}
        idempotencyKey={`asset-reject-${assetId}-${seq}`}
        successTone="notice"
      >
        {(pending) => (
          <>
            <input type="hidden" name="assetId" value={assetId} />
            <input type="hidden" name="decision" value="rejected" />
            <input type="hidden" name="alt" value="" />
            <input
              type="hidden"
              name="reason"
              value="Reviewed the candidate and turned it down."
            />
            <Button type="submit" emphasis="quiet" disabled={pending}>
              {pending ? "Recording…" : "Turn it down"}
            </Button>
          </>
        )}
      </ActionForm>
    </div>
  );
}
