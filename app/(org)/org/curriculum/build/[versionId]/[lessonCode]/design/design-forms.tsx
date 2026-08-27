"use client";

import { useState } from "react";

import { saveLessonBlockAction } from "@/lib/actions/lesson-authoring";
import type {
  LessonBlock,
  LessonMaterial,
  LessonSection,
  LessonVideo,
} from "@/lib/db/types";
import { ActionForm } from "@/lib/design/action-form";
import { Button } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

import { BlockForm } from "../../../studio-forms";

/**
 * The design studio's insert controls.
 *
 * Client components because choosing what to insert is interaction. What is
 * inserted is still decided by the server: every one of these submits the same
 * validated, audited server action the rest of the studio uses, so a hand-made
 * request cannot place an element the renderer cannot draw (CLAUDE.md §1).
 */

/** What the gallery offers, in the order an author reaches for them. */
const INSERTABLE: {
  value: LessonBlock["kind"];
  label: string;
  glyph: string;
  hint: string;
}[] = [
  { value: "text", label: "Text", glyph: "¶", hint: "A paragraph of explanation." },
  { value: "heading", label: "Heading", glyph: "H", hint: "Breaks a long part into pieces." },
  { value: "image", label: "Image", glyph: "▧", hint: "A diagram or photograph." },
  { value: "video", label: "Video", glyph: "▶", hint: "A video already attached to this lesson." },
  { value: "material", label: "Material", glyph: "🗎", hint: "A reading, worksheet, or data set already attached." },
  { value: "callout", label: "Callout", glyph: "❝", hint: "A boxed aside." },
  { value: "list", label: "List", glyph: "≡", hint: "Steps, criteria, or examples." },
  { value: "table", label: "Table", glyph: "▦", hint: "A comparison a paragraph would hide." },
  { value: "definition", label: "Key term", glyph: "A", hint: "A term and its meaning." },
];

/**
 * Pick what to add, then fill it in — the two halves of inserting something.
 *
 * A kind that has nothing to reference is disabled with the reason on it rather
 * than hidden: a video button that silently does not exist reads as a missing
 * feature, and one that opens an empty picker is a dead control (CLAUDE.md §12).
 */
export function InsertGallery({
  versionId,
  lessonCode,
  section,
  sectionLabel,
  videos,
  materials,
  seq,
}: {
  versionId: string;
  lessonCode: string;
  section: LessonSection;
  sectionLabel: string;
  videos: readonly LessonVideo[];
  materials: readonly LessonMaterial[];
  seq: number;
}) {
  const [picked, setPicked] = useState<LessonBlock["kind"] | null>(null);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {INSERTABLE.map((option) => {
          const unavailable =
            (option.value === "video" && videos.length === 0) ||
            (option.value === "material" && materials.length === 0);
          const active = picked === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={unavailable}
              aria-pressed={active}
              title={
                unavailable
                  ? `Attach a ${option.value} to this lesson first, on the lesson page.`
                  : option.hint
              }
              onClick={() => setPicked(active ? null : option.value)}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${FOCUS_RING} ${
                active
                  ? "border-primary bg-primary-surface text-primary"
                  : "border-line bg-surface text-ink-muted hover:border-primary-line hover:text-primary"
              }`}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {option.glyph}
              </span>
              <span className="text-[11px] font-semibold leading-tight">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {videos.length === 0 || materials.length === 0 ? (
        <p className="mt-3 text-xs text-ink-muted">
          {videos.length === 0 && materials.length === 0
            ? "Video and Material are unavailable: this lesson has none attached yet."
            : videos.length === 0
              ? "Video is unavailable: this lesson has no video attached yet."
              : "Material is unavailable: this lesson has no reading, worksheet, or data set attached yet."}{" "}
          Attach one on the lesson page, then place it here.
        </p>
      ) : null}

      {picked ? (
        <div className="mt-4 rounded-xl border border-line bg-surface-sunken p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            New {INSERTABLE.find((o) => o.value === picked)?.label.toLowerCase()} in{" "}
            {sectionLabel}
          </p>
          <BlockForm
            versionId={versionId}
            lessonCode={lessonCode}
            videos={videos}
            materials={materials}
            section={section}
            initialKind={picked}
            seq={seq}
          />
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setPicked(null)}
              className={`text-xs font-semibold text-ink-muted underline-offset-4 hover:underline ${FOCUS_RING}`}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink-muted">
          Pick something to add. It lands at the end of {sectionLabel} and you can
          move it from there.
        </p>
      )}
    </div>
  );
}

/**
 * Places a video or material the lesson already has, in one click.
 *
 * This is the link, not a copy: the block holds a reference, so the transcript
 * on a video and the purpose and access note on a material always travel with
 * it, and editing the asset once changes it everywhere it appears.
 */
export function PlaceAssetForm({
  versionId,
  lessonCode,
  section,
  sectionLabel,
  asset,
  seq,
}: {
  versionId: string;
  lessonCode: string;
  section: LessonSection;
  sectionLabel: string;
  asset:
    | { kind: "video"; video: LessonVideo }
    | { kind: "material"; material: LessonMaterial };
  seq: number;
}) {
  const assetId = asset.kind === "video" ? asset.video.id : asset.material.id;
  const title = asset.kind === "video" ? asset.video.title : asset.material.title;
  return (
    <ActionForm
      action={saveLessonBlockAction}
      idempotencyKey={`place-asset:${versionId}:${lessonCode}:${section}:${assetId}:${seq}`}
    >
      {(pending) => (
        <>
          <input type="hidden" name="versionId" value={versionId} />
          <input type="hidden" name="lessonCode" value={lessonCode} />
          <input type="hidden" name="blockId" value="" />
          <input type="hidden" name="section" value={section} />
          <input type="hidden" name="kind" value={asset.kind} />
          <input
            type="hidden"
            name={asset.kind === "video" ? "videoId" : "materialId"}
            value={assetId}
          />
          <input
            type="hidden"
            name="reason"
            value={`Placed “${title}” in ${sectionLabel}.`}
          />
          <Button emphasis="quiet" disabled={pending}>
            {pending ? "Placing…" : `Place in ${sectionLabel}`}
          </Button>
        </>
      )}
    </ActionForm>
  );
}
