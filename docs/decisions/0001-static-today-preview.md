# ADR 0001 — Today is built as a static preview with inert controls

**Status:** Superseded by ADR 0002, 0003, and 0005
**Date:** 2026-08-21

> **Superseded.** Today is no longer static. It reads from the seeded store
> through `lib/views/student.ts`, and its controls are real server actions that
> validate, authorize, write an audit event, and return a durable result. The
> `PreviewAction` primitive survives for capabilities that genuinely do not
> exist yet (role changes, configurable return rules), and the reasoning below
> about labelling those explicitly still holds. `demo-data.ts` was deleted, not
> migrated, as this ADR said it would be.

## Context

The student Today page (blueprint §4) was requested as a static page with
placeholder data, before any database exists. Two rules in CLAUDE.md pull
against each other in that situation:

- §12 forbids dead controls: "A control that cannot safely complete its action
  is hidden or explicitly labeled as a preview."
- §4 and §13 require Today to *show* its primary action prominently. Hiding
  every action would leave nothing to review.

## Decision

1. **Every control is an explicit preview.** `PreviewAction` in
   `lib/design/primitives.tsx` renders a `<button type="button">` with
   `aria-disabled="true"`, a visible "Preview" chip, and screen-reader text
   saying the control is not active. It stays keyboard-reachable with a visible
   focus ring so the layout can be checked for accessibility. It carries no
   handler, so it cannot act. One page-level banner states the same thing once
   in prose.

2. **Unbuilt navigation is inert text, not links.** The five other student
   sections appear in the shell so the information architecture is legible, as
   plain `<span>`s with a caption saying they are not built.

3. **Demo data lives beside the route, not in `/lib`.**
   `app/(student)/today/demo-data.ts` is deleted, not migrated, when Today is
   wired to Supabase. Nothing in `/lib` imports it. Its header marks it as
   fictional, and it contains no student PII (§14). Course and standard strings
   are marked as illustrative and are not authoritative curriculum data.

4. **Canonical statuses come from typed unions**, not string literals in JSX —
   `lib/curriculum/lesson-status.ts` and `lib/intervention/status.ts` (§9).
   Their guarded transition functions arrive with the server-side writes; this
   page only reads.

5. **No grade and no mastery value appears on Today.** Blueprint §4 does not ask
   for either here, so the §4 separation guarantee is satisfied by construction
   rather than by careful labelling.

6. **One light palette, no dark theme.** `app/globals.css` sets
   `color-scheme: light` and drops the scaffold's `prefers-color-scheme` block.
   The blue/green/amber/red role separation in §13 carries meaning; a second
   palette needs its own contrast and meaning audit before it can be trusted to
   preserve that. Tokens are role-named (`primary`, `positive`, `notice`,
   `urgent`) so no component hand-picks a hue.

## Consequences

- The page is reviewable as a design without implying working software.
- When the data layer lands, the swap is: replace the `demo-data` import with
  server-side RLS-scoped reads, and replace each `PreviewAction` with a real
  control backed by a validated, idempotent, audited server action.
- `lib/design/tokens.ts` and the `@theme` block in `app/globals.css` hold the
  same hex values in two places and must be changed together. Accepted for now;
  a generator can remove the duplication if the palette starts moving.
