/**
 * Beyond.Ed design tokens — single source of truth for colour and status
 * presentation (CLAUDE.md §1, §13).
 *
 * The hex values below are mirrored into `app/globals.css` under `@theme`, which
 * is what generates the Tailwind utilities (`bg-surface`, `text-ink`,
 * `border-line`, `bg-primary`, …). Change a value here and change it there in
 * the same commit.
 *
 * ---------------------------------------------------------------------------
 * The ethos: blue and green carry the product. Warm colours carry memory.
 * ---------------------------------------------------------------------------
 *
 * Blue and green are DOMINANT and calm. They are what a student sees for hours:
 * the pathway, their progress, the next action, the reading surfaces. The
 * intent is a workspace that supports thinking rather than one that pushes.
 *
 * Yellow, orange, and red are RESERVED and rare. They are not decoration and
 * they are not severity for its own sake — they mark things the mind is meant
 * to hold on to:
 *
 *   - `recall` (amber) marks MEMORY CUES: Spiral Review, keep-fresh work, a
 *     skill going stale, an upcoming dependency. Warmth here is doing a job —
 *     it makes retrieval practice visually distinct from new learning, which is
 *     the distinction the student needs to feel.
 *   - `urgent`  (red) is for genuinely urgent states only. If it appears often,
 *     something is wrong with the rules, not with the palette.
 *
 * Roles, not hues, are the vocabulary:
 *   - `brand`    is deep blue-green — the product's own surfaces: app bar, hero.
 *   - `primary`  is blue  — actions, navigation, the pathway.
 *   - `positive` is green — learning, progress, readiness that held.
 *   - `recall`   is amber — memory cues and retrieval practice.
 *   - `urgent`   is red   — genuinely urgent states. Rare.
 *
 * Every foreground token meets at least 4.5:1 against `surface`, and every
 * on-brand foreground meets it against `brandDeep`.
 */

export const color = {
  /**
   * Product branding. A deep blue-green rather than a warm hue, so the largest
   * persistent surface in the interface reinforces the ethos instead of
   * fighting it.
   */
  brandDeep: "#0C3A47",
  brandGreen: "#0E4A42",
  brandBlue: "#123F55",
  /** Bright teal for accents ON the dark brand surfaces only. */
  brandAccent: "#4FD1C5",

  /** Page canvas and raised surfaces. */
  canvas: "#F6F8F8",
  surface: "#FFFFFF",
  surfaceSunken: "#EEF2F3",

  /** Text. */
  ink: "#16292E",
  inkMuted: "#54646A",

  /** Hairlines and dividers. */
  line: "#DCE4E6",
  lineStrong: "#C2CED1",

  /** Blue — actions, navigation, pathway. */
  primary: "#1F5FA0",
  primaryStrong: "#174B80",
  primarySurface: "#EDF3FA",
  primaryLine: "#C0D5E8",

  /** Green — learning, progress, readiness. Co-dominant with blue. */
  positive: "#2A7A5C",
  positiveStrong: "#1F6149",
  positiveSurface: "#E8F4EE",
  positiveLine: "#B7DAC8",

  /** Amber — memory cues and retrieval practice. Reserved. */
  recall: "#8A5300",
  recallSurface: "#FDF3E3",
  recallLine: "#F0D9AE",

  /** Red — genuinely urgent states only. Rare. */
  urgent: "#A03028",
  urgentSurface: "#FBEDEC",
  urgentLine: "#EFC9C6",
} as const;

/**
 * Emphasis level for a status chip. The chip's *text* always carries the
 * status; the tone only reinforces it (CLAUDE.md §12 — status is conveyed by
 * text as well as by colour).
 */
export type Tone = "neutral" | "info" | "positive" | "attention";

/** Tailwind classes per tone. Kept here so no component hand-picks a colour. */
export const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-surface-sunken text-ink-muted border-line-strong",
  info: "bg-primary-surface text-primary border-primary-line",
  positive: "bg-positive-surface text-positive border-positive-line",
  attention: "bg-recall-surface text-recall border-recall-line",
};

/**
 * The five portal accents. All are drawn from the blue-green family so no role
 * is signalled with a warm colour — warmth is reserved for memory.
 */
export const PORTAL_ACCENTS = {
  /** Green — the learner's own surface. */
  student: { tile: "bg-[#2A7A5C]" },
  /** Blue — decision and action. */
  teacher: { tile: "bg-[#1F5FA0]" },
  /** Teal — the join between the two. */
  site_admin: { tile: "bg-[#0F6E78]" },
  /** Deep navy — the widest scope. */
  org_admin: { tile: "bg-[#163F6B]" },
  /** Deep forest — authorship, set apart from the learner's green. */
  curriculum_author: { tile: "bg-[#1E5F4A]" },
} as const;

/** Visible focus is mandatory (CLAUDE.md §12 — accessibility). */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Focus ring for controls sitting on the dark brand surface. */
export const FOCUS_RING_ON_BRAND =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
