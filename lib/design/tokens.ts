/**
 * Beyond.Ed design tokens — single source of truth for color and status
 * presentation (CLAUDE.md §1, §13).
 *
 * The hex values below are mirrored into `app/globals.css` under `@theme`, which
 * is what generates the Tailwind utilities (`bg-surface`, `text-ink`,
 * `border-line`, `bg-primary`, …). Change a value here and change it there in
 * the same commit.
 *
 * Roles, not hues, are the vocabulary. The hue behind each role is fixed by
 * CLAUDE.md §13:
 *   - `primary`  is blue  — dominant, calm: actions, pathway, navigation.
 *   - `positive` is green — dominant, calm: readiness, progress that held.
 *   - `notice`   is amber — reserved: memory cues, encouragement, time pressure.
 *   - `urgent`   is red   — reserved: genuinely urgent states only. Rare.
 *   - `brandMaroon` is Mojave River maroon — organizational branding only.
 *
 * Every foreground token meets at least 4.5:1 against `surface`.
 */

export const color = {
  /** Organizational branding only — never a status or an action color. */
  brandMaroon: "#481514",

  /** Page canvas and raised surfaces. */
  canvas: "#F6F7F9",
  surface: "#FFFFFF",
  surfaceSunken: "#EFF2F5",

  /** Text. */
  ink: "#1C1F23",
  inkMuted: "#5A626B",

  /** Hairlines and dividers. */
  line: "#DFE3E8",
  lineStrong: "#C7CDD4",

  /** Blue. */
  primary: "#1F5FA0",
  primaryStrong: "#174B80",
  primarySurface: "#EEF4FA",
  primaryLine: "#C3D7E9",

  /** Green. */
  positive: "#2E7D57",
  positiveSurface: "#EAF4EF",
  positiveLine: "#BCDCCB",

  /** Amber. */
  notice: "#8A5300",
  noticeSurface: "#FDF3E3",
  noticeLine: "#F0D9AE",

  /** Red. */
  urgent: "#A03028",
  urgentSurface: "#FBEDEC",
  urgentLine: "#EFC9C6",
} as const;

/**
 * Emphasis level for a status chip. The chip's *text* always carries the
 * status; the tone only reinforces it (CLAUDE.md §12 — status is conveyed by
 * text as well as by color).
 */
export type Tone = "neutral" | "info" | "positive" | "attention";

/** Tailwind classes per tone. Kept here so no component hand-picks a color. */
export const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-surface-sunken text-ink-muted border-line-strong",
  info: "bg-primary-surface text-primary border-primary-line",
  positive: "bg-positive-surface text-positive border-positive-line",
  attention: "bg-notice-surface text-notice border-notice-line",
};

/** Visible focus is mandatory (CLAUDE.md §12 — accessibility). */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
