# ADR 0009 — The entry screen as a banner and a light canvas, and how motion is allowed to work

**Status:** Accepted
**Date:** 2026-08-24

## Context

[ADR 0008](0008-entry-portals-and-colour-ethos.md) replaced the roster with five
portals and settled the palette. The layout it left behind was still a single
dark field running the height of the page: hero, portal cards, statistics,
disclosure, and footer all sat on the brand gradient, and each portal card
carried a filled button inside it.

Two things were wrong with that. A wall of the brand field is heavier than a
first screen should be, and it looks nothing like the product behind it, which is
a light canvas with white surfaces. And a card that is entirely clickable, with a
button inside it that is also clickable, is two controls for one decision.

Separately: the screen had no motion at all, which is a fair default but reads as
static for a product a reviewer meets for the first time here.

## Decisions

### 1. The brand field is the greeting, not the room

The gradient is now a banner: wordmark, beta chip, headline, and a four-figure
rail (175 / 135 / 40 / 30). Below it the page settles onto `canvas`, and the
portal cards are lifted over the seam. The cards are `surface` with a `line`
hairline — the same surfaces the product uses on every page — so the entry screen
previews the product rather than advertising it.

`.brand-field-lit` adds one radial highlight in the existing `brandAccent` teal
to the existing gradient. No colour was added to the palette.

### 2. One control per portal

The whole card is the submit control. Inside it: the accent tile, the role
eyebrow in that role's own colour, the portal name, the summary, then a divider
and "Preview … →". `PORTAL_ACCENTS` grew `text`, `soft`, and `edge` variants of
the five existing hexes; each `text` value meets 4.5:1 against `surface`.

The student portal takes the wide slot and the larger reading size. It is the
surface the product exists for, and one primary action should dominate
(CLAUDE.md §13).

### 3. Motion is an enhancement, and it is never load-bearing

Two behaviours: the banner rises once on load (`.rise-in`, staggered across the
statistics), and content below the fold rises as it is scrolled to (`.reveal`).

The reveal is driven by `ScrollReveal` (`lib/design/scroll-reveal.tsx`), one
client component mounted once per page, holding one `IntersectionObserver`. Three
constraints made that the shape:

- **The finished state is the default.** The server renders no `data-reveal`
  attribute, and the hidden state exists only in a rule that needs one. No
  script, no `IntersectionObserver`, or `prefers-reduced-motion: reduce` all
  render the page finished. Nothing can be left permanently invisible waiting
  for an animation that will not run (CLAUDE.md §12).
- **Nothing visible is hidden.** Only elements below the fold at mount are marked
  pending, so hydration never blinks content out and back.
- **A hidden page catches up.** Browsers suspend observer callbacks while a page
  is hidden, so `visibilitychange` and `pageshow` sweep anything already on
  screen and show it outright.

CSS scroll-driven animation (`animation-timeline: view()`) was tried first and
rejected: it is unsupported in Firefox, and the failure mode when a timeline is
inactive or mis-measured is content stuck at partial opacity — the one outcome
this screen must not have.

**Why a client component at all**, when the default is server components: the
behaviour is a response to scrolling, which is interaction. It is one component,
it renders `null`, and the page itself stays a server component.

## Consequences

- The entry screen looks like the product. Changing surface tokens changes both.
- Reduced-motion users, and anyone without JavaScript, get the same page with no
  movement — not a degraded one.
- Motion is confined to the entry screen. The product's working surfaces (Today,
  lesson stages, teacher triage) stay still, which is the point of a workspace.
