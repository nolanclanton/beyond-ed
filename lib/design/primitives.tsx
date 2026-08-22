import type { ReactNode } from "react";
import Link from "next/link";

import { FOCUS_RING, TONE_CLASSES, type Tone } from "./tokens";

/**
 * A canonical status, rendered as text. Colour reinforces the label; it never
 * carries the meaning on its own (CLAUDE.md §12).
 */
export function StatusChip({
  label,
  tone,
  title,
}: {
  label: string;
  tone: Tone;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}

/** A short labelled fact, e.g. "About 15 minutes". */
export function MetaItem({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
  as: Tag = "section",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "article" | "div" | "li";
  id?: string;
  "aria-labelledby"?: string;
}) {
  return (
    <Tag
      {...rest}
      className={`rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(28,31,35,0.05)] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  hint,
  id,
  action,
}: {
  title: string;
  hint?: string;
  id?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 id={id} className="text-base font-semibold text-ink">
          {title}
        </h2>
        {hint ? <p className="mt-1 text-sm text-ink-muted">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

const EMPHASIS = {
  primary: "bg-primary text-white px-5 py-3 text-base hover:bg-primary-strong",
  secondary:
    "border border-primary-line bg-surface text-primary px-4 py-2.5 text-sm hover:bg-primary-surface",
  quiet: "text-primary px-2 py-1 text-sm underline underline-offset-4",
  caution:
    "border border-urgent-line bg-surface text-urgent px-4 py-2.5 text-sm hover:bg-urgent-surface",
} as const;

export type Emphasis = keyof typeof EMPHASIS;

export function Button({
  children,
  emphasis = "secondary",
  type = "submit",
  name,
  value,
  disabled,
  className = "",
  onClick,
  "aria-expanded": ariaExpanded,
}: {
  children: ReactNode;
  emphasis?: Emphasis;
  type?: "submit" | "button";
  name?: string;
  value?: string;
  disabled?: boolean;
  className?: string;
  /** Only pass this from a Client Component. */
  onClick?: () => void;
  "aria-expanded"?: boolean;
}) {
  return (
    <button
      type={type}
      name={name}
      value={value}
      disabled={disabled}
      onClick={onClick}
      aria-expanded={ariaExpanded}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${EMPHASIS[emphasis]} ${FOCUS_RING} ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  emphasis = "secondary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  emphasis?: Emphasis;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors ${EMPHASIS[emphasis]} ${FOCUS_RING} ${className}`}
    >
      {children}
    </Link>
  );
}

/**
 * A control that is deliberately inert, for a capability that is not built.
 * CLAUDE.md §12 forbids dead controls, so anything that cannot complete its
 * action says so in text as well as in styling.
 */
export function PreviewAction({
  label,
  detail,
}: {
  label: string;
  detail: string;
}) {
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        aria-disabled="true"
        className={`inline-flex cursor-default items-center justify-center gap-2 rounded-lg border border-line bg-surface-sunken px-4 py-2.5 text-sm font-semibold text-ink-muted ${FOCUS_RING}`}
      >
        {label}
        <span
          aria-hidden="true"
          className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted"
        >
          Not built
        </span>
      </button>
      <span className="text-xs text-ink-muted">{detail}</span>
    </span>
  );
}

const BANNER_TONE = {
  info: "border-primary-line bg-primary-surface text-ink",
  positive: "border-positive-line bg-positive-surface text-ink",
  notice: "border-notice-line bg-notice-surface text-ink",
  urgent: "border-urgent-line bg-urgent-surface text-ink",
  neutral: "border-line bg-surface-sunken text-ink",
} as const;

export function Banner({
  title,
  children,
  tone = "info",
  role = "note",
}: {
  title: string;
  children?: ReactNode;
  tone?: keyof typeof BANNER_TONE;
  role?: "note" | "status" | "alert";
}) {
  return (
    <div
      role={role === "note" ? undefined : role}
      className={`rounded-xl border px-4 py-3 ${BANNER_TONE[tone]}`}
    >
      <p className="text-sm font-semibold">{title}</p>
      {children ? <div className="mt-1 text-sm">{children}</div> : null}
    </div>
  );
}

/** A labelled key/value list. Values are text, never colour-only. */
export function FactList({
  items,
  columns = 2,
}: {
  items: { label: string; value: ReactNode }[];
  columns?: 1 | 2 | 3;
}) {
  const cols =
    columns === 1 ? "sm:grid-cols-1" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-3 ${cols}`}>
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {item.label}
          </dt>
          <dd className="mt-0.5 text-sm text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionHeading({
  children,
  id,
  hint,
}: {
  children: ReactNode;
  id?: string;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <h2 id={id} className="text-lg font-semibold tracking-tight text-ink">
        {children}
      </h2>
      {hint ? <p className="mt-1 text-sm text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-muted">
      {children}
    </p>
  );
}

/**
 * A headline number with its label. The number is never alone: the caption says
 * what it measures, because "79%" of two different things is two different
 * facts (CLAUDE.md §13).
 */
export function MetricTile({
  value,
  label,
  caption,
  tone = "neutral",
}: {
  value: string;
  label: string;
  caption?: string;
  tone?: "neutral" | "positive" | "attention" | "info";
}) {
  const valueTone = {
    neutral: "text-ink",
    info: "text-primary",
    positive: "text-positive",
    attention: "text-notice",
  }[tone];
  return (
    <Card className="p-4">
      <p className={`text-2xl font-bold ${valueTone}`}>{value}</p>
      <p className="mt-0.5 text-sm font-medium text-ink">{label}</p>
      {caption ? <p className="mt-0.5 text-xs text-ink-muted">{caption}</p> : null}
    </Card>
  );
}

/**
 * A compact per-unit progress row. The percentage is written out; the bar is
 * decoration.
 */
export function UnitProgressRow({
  label,
  detail,
  percent,
  state,
  href,
}: {
  label: string;
  detail: string;
  percent: number;
  state: "complete" | "current" | "not_started";
  href?: string;
}) {
  const stateLabel =
    state === "complete" ? "Complete" : state === "current" ? "Current" : "Not started";
  const tone = state === "complete" ? "positive" : state === "current" ? "info" : "neutral";
  const body = (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <div className="flex items-center gap-2">
          <StatusChip label={stateLabel} tone={tone} />
          <span className="text-sm font-medium text-ink-muted">{percent}%</span>
        </div>
      </div>
      <p className="mt-0.5 text-xs text-ink-muted">{detail}</p>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
        aria-hidden="true"
      >
        <div
          className={
            state === "complete" ? "h-full bg-positive" : "h-full bg-primary"
          }
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </>
  );
  return (
    <li className="px-5 py-3.5">
      {href ? (
        <Link href={href} className={`block rounded ${FOCUS_RING}`}>
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}

/** Wide content scrolls inside its own container; the page never scrolls sideways. */
export function ScrollX({ children }: { children: ReactNode }) {
  return <div className="-mx-5 overflow-x-auto px-5">{children}</div>;
}

/**
 * A proportion bar. The number is always written out beside it — the bar is
 * decoration, the text is the status (CLAUDE.md §12).
 */
export function Meter({
  percent,
  tone = "info",
  label,
}: {
  percent: number;
  tone?: Tone;
  label: string;
}) {
  const fill = {
    neutral: "bg-line-strong",
    info: "bg-primary",
    positive: "bg-positive",
    attention: "bg-notice",
  }[tone];
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 w-full max-w-[10rem] overflow-hidden rounded-full bg-surface-sunken"
        aria-hidden="true"
      >
        <div className={`h-full ${fill}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
      <span className="text-sm font-medium text-ink">{label}</span>
    </div>
  );
}
