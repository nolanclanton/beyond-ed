# ADR 0008 — A portal entry screen, and colour that does a job

**Status:** Accepted
**Date:** 2026-08-22

## Context

Two problems, one screen apart.

**The entry screen was cluttered.** It listed every hand-written demo person —
eight students, five teachers, five site administrators, and two more — as a wall
of eighteen buttons under five headings, above a fold of statistics. A reviewer
arriving at the product had to read a roster before they could look at anything.
What they actually want is a role: *show me the teacher experience.*

**The palette contradicted its own rule.** CLAUDE.md §13 has always said blue and
green dominant, warm colours reserved. But the largest persistent surface in the
interface — the application bar, on every page — was a deep warm maroon, and green
appeared only as a status accent. The rule was written down and not followed.

## Decisions

### 1. The entry screen offers a portal, not a person

Five cards, one per role, each opening as the demo person whose record was
written to demonstrate that role. `lib/auth/portals.ts` holds the definitions;
the sign-in path is unchanged, so this is a different first screen over the same
mechanism.

Nothing was removed. Every seeded person is still reachable from a disclosure
below the portals, and from "Switch demo user" inside. The roster is no longer
the first thing a reviewer has to get past.

This also fits the stated goal for the build: a **structure to evolve from**. A
portal is a stable surface that real curriculum and real accounts can arrive
behind. A hardcoded roster is not.

### 2. Blue and green carry the product; warm colours carry memory

The ethos is not decoration, so the tokens now say what each colour is *for*:

| Role | Colour | What it marks |
|---|---|---|
| `brand` | deep blue-green (`#0C3A47` → `#0E4A42`) | The product's own surfaces: app bar, entry screen |
| `primary` | blue | Actions, navigation, the pathway |
| `positive` | green | Learning, progress, readiness that held |
| `recall` | amber | **Memory cues** — retrieval practice and things that come back |
| `urgent` | red | Genuinely urgent states. Rare. |

The amber token was called `notice`, which described its brightness rather than
its purpose. It is now `recall`, and it is applied where memory is actually the
point:

- **Spiral Review** carries an amber band reading "Memory work — bringing earlier
  learning back", so retrieval practice is visually distinct from new learning.
  That distinction is the one a student needs to feel.
- **"Review scheduled"** moved from green to amber. Its meaning is "done for now,
  this comes back later to keep it fresh" — the *comes back* is the part worth
  registering, and green said "finished".
- **Spaced-review recommendations** in the teacher queue moved from neutral to
  amber for the same reason.
- **Keep-fresh review** on the student Review page says memory work lives inside
  lessons rather than in a separate queue.

Progress became green where it had been blue by default: work completed and
lessons finished are learning that held, which is green's job.

### 3. The brand field replaces the maroon bar

The application bar is now a deep blue-green gradient. White text on it measures
12.3:1; each of the five portal accents measures between 5.2:1 and 10.7:1 against
white, all above the 4.5:1 floor.

The five accents are all drawn from the blue-green family — green, blue, teal,
navy, deep forest — so no role is signalled with a warm colour. Warmth stays
reserved.

### 4. CLAUDE.md §13 was rewritten to match

The palette rule previously named a maroon as product branding and listed the
warm colours' purpose loosely. It now states the brand field, and says plainly
what amber is for. The invariants were not touched.

## Consequences

- A reviewer sees five choices and picks one. The demo roster is available and
  no longer in the way.
- Warm colour now carries information. If amber starts appearing outside memory
  contexts, that is a regression worth catching in review.
- `lib/design/tokens.ts` and the `@theme` block in `app/globals.css` still hold
  the same values in two places and must change together. Unchanged from ADR
  0001; still the cost of Tailwind's build-time theme.
