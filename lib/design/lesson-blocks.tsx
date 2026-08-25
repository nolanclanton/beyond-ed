import type { ReactNode } from "react";

import type { CalloutTone, LessonBlock, LessonVideo } from "@/lib/db/types";

import { ScrollX } from "./primitives";
import { FOCUS_RING } from "./tokens";

/**
 * The lesson canvas, rendered.
 *
 * One renderer for both the student's lesson and the author's preview, so what
 * a curriculum author builds is literally what a student meets — there is no
 * second styling of the same content to drift out of step.
 *
 * Two rules the palette imposes (CLAUDE.md §13). Every callout states its kind
 * in words, so the tone reinforces the label rather than carrying it. And the
 * one warm tone, `memory`, means what amber means everywhere else in the
 * product: something to hold on to and retrieve later. It is not emphasis.
 */

const CALLOUT: Record<
  CalloutTone,
  { label: string; box: string; label_: string }
> = {
  note: {
    label: "Note",
    box: "border-line bg-surface-sunken",
    label_: "text-ink-muted",
  },
  important: {
    label: "Important",
    box: "border-primary-line bg-primary-surface",
    label_: "text-primary",
  },
  example: {
    label: "Example",
    box: "border-positive-line bg-positive-surface",
    label_: "text-positive",
  },
  memory: {
    label: "Remember this — it comes back",
    box: "border-recall-line bg-recall-surface",
    label_: "text-recall",
  },
};

/** How each block kind is named in the studio. Also the a11y label prefix. */
export const BLOCK_LABELS: Record<LessonBlock["kind"], string> = {
  heading: "Heading",
  text: "Paragraph",
  callout: "Callout",
  list: "List",
  definition: "Key term",
  table: "Table",
  image: "Image",
  video: "Video",
};

export function LessonBlocks({
  blocks,
  videos = [],
  className = "",
}: {
  blocks: readonly LessonBlock[];
  videos?: readonly LessonVideo[];
  className?: string;
}) {
  if (blocks.length === 0) return null;
  return (
    <div className={`flex max-w-2xl flex-col gap-4 ${className}`}>
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} videos={videos} />
      ))}
    </div>
  );
}

function BlockView({
  block,
  videos,
}: {
  block: LessonBlock;
  videos: readonly LessonVideo[];
}) {
  switch (block.kind) {
    case "heading":
      return (
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink">
          {block.text}
        </h3>
      );

    case "text":
      return <p className="text-base leading-relaxed text-ink">{block.text}</p>;

    case "callout": {
      const tone = CALLOUT[block.tone];
      return (
        <aside className={`rounded-xl border px-4 py-3 ${tone.box}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${tone.label_}`}>
            {tone.label}
          </p>
          {block.title ? (
            <p className="mt-1 text-sm font-semibold text-ink">{block.title}</p>
          ) : null}
          <p className="mt-1 text-sm leading-relaxed text-ink">{block.text}</p>
        </aside>
      );
    }

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag
          className={`space-y-1.5 pl-5 text-base text-ink ${
            block.ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {block.items.map((item, i) => (
            <li key={`${block.id}-${i}`}>{item}</li>
          ))}
        </Tag>
      );
    }

    case "definition":
      return (
        <dl className="rounded-xl border border-line bg-surface-sunken px-4 py-3">
          <dt className="text-sm font-bold text-ink">{block.term}</dt>
          <dd className="mt-0.5 text-sm text-ink-muted">{block.meaning}</dd>
        </dl>
      );

    case "table":
      return (
        <figure>
          <div className="rounded-xl border border-line">
            <ScrollX>
              <table className="w-full border-collapse text-sm">
                {block.caption ? (
                  <caption className="px-4 py-2 text-left text-sm font-semibold text-ink">
                    {block.caption}
                  </caption>
                ) : null}
                <thead>
                  <tr className="border-b border-line text-left">
                    {block.headers.map((header, i) => (
                      <th
                        key={`${block.id}-h${i}`}
                        scope="col"
                        className="px-4 py-2.5 font-semibold text-ink"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {block.rows.map((row, r) => (
                    <tr key={`${block.id}-r${r}`}>
                      {row.map((cell, c) => (
                        <td key={`${block.id}-r${r}c${c}`} className="px-4 py-2 text-ink">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollX>
          </div>
        </figure>
      );

    case "image":
      return (
        <figure>
          {/*
            A plain <img>: the address is authored, so Next.js image
            optimisation has no allow-list to check it against. Alternative text
            is required at write time, which is why it is safe to render here.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.alt}
            className="w-full rounded-xl border border-line"
          />
          {block.caption ? (
            <figcaption className="mt-1.5 text-sm text-ink-muted">
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      );

    case "video": {
      const video = videos.find((v) => v.id === block.videoId);
      if (!video) return null;
      return <LessonVideoPlayer video={video} />;
    }
  }
}

/**
 * A video with its transcript.
 *
 * No autoplay and no third-party player, and the transcript is on the page
 * whether or not the video plays — a video nobody can read is a lesson some
 * students cannot take (CLAUDE.md §12).
 */
export function LessonVideoPlayer({ video }: { video: LessonVideo }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <p className="text-sm font-semibold text-ink">{video.title}</p>
      <p className="mt-0.5 text-xs text-ink-muted">
        {video.minutes ? `${video.minutes} minutes · ` : ""}
        transcript below
        {video.captionsUrl ? " · captions available" : ""}
      </p>
      <video
        controls
        preload="none"
        className="mt-3 w-full rounded-lg border border-line"
      >
        <source src={video.url} />
        {video.captionsUrl ? (
          <track
            kind="captions"
            src={video.captionsUrl}
            srcLang="en"
            label="English"
            default
          />
        ) : null}
      </video>
      <details className="mt-3">
        <summary className={`cursor-pointer text-sm font-semibold text-primary ${FOCUS_RING}`}>
          Read the transcript
        </summary>
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">
          {video.transcript}
        </p>
      </details>
    </div>
  );
}

/** A one-line summary of a block, for the studio's canvas list. */
export function blockSummary(block: LessonBlock): ReactNode {
  switch (block.kind) {
    case "heading":
    case "text":
      return block.text;
    case "callout":
      return block.title ? `${block.title} — ${block.text}` : block.text;
    case "list":
      return block.items.join(" · ");
    case "definition":
      return `${block.term}: ${block.meaning}`;
    case "table":
      return `${block.caption || "Table"} — ${block.headers.join(", ")} (${block.rows.length} rows)`;
    case "image":
      return block.caption || block.alt;
    case "video":
      return "Attached video, with its transcript";
  }
}
