# ADR 0016 — The Curriculum Design Studio, and a constrained design assistant

**Status:** Accepted
**Date:** 2026-08-27
**Extends:** [ADR 0010](0010-lesson-studio.md), [ADR 0012](0012-lesson-canvas.md), [ADR 0015](0015-the-design-studio.md)
**Amends:** CLAUDE.md §0 invariant 7, §1, §10, §12, §15

## Context

ADR 0010 made lessons authorable, 0012 gave them typed blocks, and 0015 gave
those blocks a canvas. What none of them addressed is the work that happens
*around* a lesson: the story a unit is taught inside, the visual identity that
holds it together, and the repetitive production a designer does by hand
between having an idea and having a lesson.

The owner asked for the Curriculum Portal to become a professional authoring
environment — a Lesson Creator Workshop, a Narrative Studio, a reusable
Narrative Bank, a Visual Design Studio — with a **constrained Google Gemini
assistant** placed beside the work it can help with.

That request collided head-on with this repository's own governing rules.

## The conflict, and how it was resolved

CLAUDE.md invariant 7 and §10 said the product contains **no AI-facing surface
of any kind**, explicitly including administrators. The ban was not prose alone:
`@google/genai` was listed in `eslint.config.mjs`, three tests in
`tests/unit/module-boundaries.test.ts` failed if the package was installed,
imported, or if the phrase "AI assistant" appeared under `app/`, and the shell
footer printed a standing denial on every page.

Invariant 9 says to stop and ask rather than proceed on assumption. That was
done, and the owner chose to **narrow the rule rather than suspend it**.

The distinction the amendment draws is between the **learning product** and the
**authoring tools**. §10.1 now states the original guarantee more strongly than
before: no generative call in any learner-facing or teacher-facing path, and
none at all inside `/lib/grades`, `/lib/mastery`, `/lib/recommend`,
`/lib/evidence`, `/lib/intervention`, or `/lib/audit`. §10.2 carves out exactly
one exception — a curriculum designer building a lesson in `/org/curriculum` —
and defines it exhaustively.

The enforcement moved with the rule rather than being removed:

| Before | After |
|---|---|
| `@google/genai` banned everywhere | Importable **only** under `lib/ai/**`, banned everywhere else |
| 3 boundary tests | 16, including "not reachable from any learner surface" and "never imported by a Client Component" |
| — | `/lib/ai` may not import `/lib/grades`, `/lib/mastery`, `/lib/evidence`, `/lib/recommend`, `/lib/intervention`, `/lib/views`, or `/lib/learning` |
| — | No file outside `/lib/ai` may read `GEMINI_API_KEY`; `NEXT_PUBLIC_GEMINI*` may not exist anywhere |

A lint pattern needed fixing to make this work at all: `no-restricted-imports`
matches with gitignore semantics, so the unanchored pattern `ai` was matching
this repository's own `/lib/ai` as well as the npm package `ai`. The patterns
are now anchored (`/ai`, `/ai/*`), and a probe confirmed both halves still
behave — the package is refused, the directory is not.

## Decisions

### 1. The capability registry is the security boundary, not the buttons

The browser names an action. `lib/ai/capabilities.ts` is a literal object, and
`isCapabilityName` is a `keyof` check against it. A name that is not a key is
refused **before authentication is consulted and before any record is read**.

Each entry declares what it may see, who may run it, what shape it must return,
and whether regeneration is offered. There is no wildcard entry, no
"everything else" fallback, and no free-text prompt endpoint. Hiding a control
is a courtesy to the person using it; it is never what stops a request.

`FORBIDDEN_CAPABILITIES` lists publishing, approving, deleting, re-sequencing,
editing standards or prerequisites, assigning students, messaging students,
changing permissions, managing users, running database queries, whole-course
generation, and autonomous design. **These are not toggles set to off.** There
is no registry entry, no context builder, no output schema, and no write path
for any of them. A toggle that looked like it might work would be worse than no
toggle, because it invites someone to try. The administrator's page says so in
those words.

### 2. The context builder is the privacy boundary, and it works by absence

A capability declares its `allowedContext`; `buildAIContext` assembles exactly
those kinds. The property that matters is not that the builders avoid student
data — it is that **there is no builder for student data**, so no capability can
declare one and no bug can reach one. There is no `evidence`, `enrollment`,
`grade`, `mastery`, `intervention`, or `user` builder in the file, and lint
forbids `/lib/ai` from importing the modules that hold them.

The one piece of person-shaped text that travels is the designer's own typed
instruction, which is theirs. It is placed in a labelled section of the *input*,
never appended to the system instruction, and introduced by a sentence telling
the model it cannot change its instructions — so an attempt to escalate through
it is data rather than a rule.

Canon travels with every request. Nothing relies on the model remembering:
`previous_interaction_id` is never sent, `store` is false, and two identical
requests are genuinely independent. Continuity is a property of Beyond.Ed's
records, not of the model's memory.

### 3. One click, one bounded call, and no step thirteen

`lib/ai/gateway.ts` runs twelve steps and stops. It imports no authoring
function, so there is no branch that could write curriculum; the only record it
writes is the log of its own attempt.

The SDK's agent, tool, environment, background, and conversation features are
all reachable from `@google/genai` and none of them is used. `lib/ai/client.ts`
documents each omission next to the call, because a future edit that adds
`tools:` would otherwise look like an improvement.

### 4. Accepting is an ordinary authoring write, performed by a person

Every acceptance path in `lib/actions/ai-assistance.ts` re-validates the content
**from the form** and writes it through the same domain function a hand-typed
edit uses. Three consequences follow, and all three are the point:

- The server does not keep the proposal, so "Edit before accepting" is safe and
  a tampered payload is no more dangerous than someone typing the same thing.
- An assistant-drafted exit-ticket item is refused for the wrong standard
  exactly as a hand-written one is. There is no assistant-specific write path to
  bypass the alignment rules with.
- `resolveGeneration` runs inside the same `transact` as the content write, so
  the history never says "accepted" about something that was not written.

`accepted_edited` is a distinct status from `accepted` because it is the most
common honest outcome, and a history that could not tell them apart would
overstate how much of the curriculum the assistant wrote. `acknowledged` was
added for advisory results — a review or a misconception list commits nothing by
design, and calling that "rejected" would make the usage figures read as if
designers were turning down work they had in fact acted on.

### 5. A narrative is not attached to a course version

Every other authoring table hangs off `course_versions`. A narrative does not,
and that is deliberate: it is reusable across courses and **duplicated rather
than shared**, so binding it to a version would make the Narrative Bank
impossible and would drag story edits into the publication lifecycle of a course
that merely references it.

What joins them is a beat naming a catalog `lessonCode` — a soft reference, like
`course_structure_units.lesson_codes`. Re-sequencing a course moves the lesson
without breaking the story, and a narrative reused elsewhere simply has beats
that match nothing there yet.

**One lesson sits at one point in the story**, enforced in the domain and by a
partial unique index. Two beats on one lesson would make the workshop show one
of two stories, chosen by whichever row came back first.

### 6. A duplicate shares nothing with its source

This is the promise the whole reuse story rests on, and it is the kind a shallow
copy quietly breaks. `duplicateNarrative` deep-copies through `cloneNarrative`
and re-identifies every nested record; the copy starts as a draft owned by
whoever made it, with its own empty share list, because inheriting the source's
sharing would hand strangers write access to a private adaptation.

It is tested by **mutating each side and reading the other**, not by inspecting
how the copy was made.

**Lesson placements are dropped even when beats are copied.** A beat's
`lessonCode` names a lesson in the course the source was written for; carrying it
into a copy meant for another course would silently attach the new story to
lessons nobody chose. The words survive; where it runs is the adapter's
decision.

`basedOnNarrativeId` is set once and made immutable by a trigger. A copy whose
stated history could be re-pointed would be a copy whose history is a guess.

### 7. Review means somebody else read it

Three curriculum grants — `author`, `reviewer`, `administrator` — checked
independently of role and of each other. A teacher may hold `author` without
becoming a site administrator; an organization administrator holds none unless
somebody granted them, because seniority is not a curriculum grant.

An author cannot approve their own narrative **even holding all three grants**.
The check is on the record's owner, not on what the actor happens to hold,
because otherwise the review step is a second click by the same person.

`curriculum_grants` is nullable and NULL is meaningful: it resolves to
`{author}`, which is the access an account provisioned before this migration
already had. Nothing is backfilled — writing `author` into every row would claim
somebody decided that, and nobody did.

The grants deliberately do **not** re-gate the course-version lifecycle, which
`assertCanAuthorCurriculum` has always governed. Changing who may publish a
course version is a governance decision of its own, not a side effect of adding
an authoring tool.

### 8. A candidate is not curriculum

A generated image arrives as `candidate` and stays there until a person accepts
it. `accepted_assets_are_described` refuses an accepted asset with no
alternative text — a constraint rather than a convention, which is what lets the
rest of the product trust the `accepted` state.

Alternative text is **not** required to propose one. Demanding it before the
designer has seen the candidate would be asking them to describe an image that
does not exist yet. The gate is at acceptance, which is the moment the image
becomes something a student meets.

Accepting an asset puts it in the **library**. Placing it in a lesson is a
further act in the studio, on a draft version, which reaches a class only when
that version is published.

### 9. Capabilities are administrable, and the registry is still the authority

Two questions that look like one, kept apart:

| Question | Where it is answered | Who changes it |
|---|---|---|
| Does this capability exist at all? | `lib/ai/capabilities.ts` | A deploy and a code review |
| Has this organization allowed it? | `ai_capability_settings` | A curriculum administrator, with a reason |

The separation is what keeps the prohibited list prohibited. A row here can only
name a capability that is *already* a registry key —
`setCapabilityEnabled` refuses anything else, and migration 0025 refuses the
dangerous names a second time at the database, where an application bug cannot
reach. Turning something "on" can only ever restore something the code already
implements.

**Absence is meaningful.** No row means the shipped default. That is how a newly
released capability arrives available rather than silently off, and how an
organization that has never opened the page behaves sensibly. Nothing is seeded.

`capabilityEnabledFor` is the single function that answers the question, and the
gateway, the assistance panels, and the administrator's page all call it — so a
control cannot be offered for something the server would refuse. It deliberately
does *not* consult the feature flags: whether Gemini is configured, and whether
visual generation is on, are deployment facts rather than organization
decisions, and folding them in here would make an administrator's switch look
responsible for something it does not control. The gateway checks both, in
order, and says which one refused.

The database check constraint is a denylist rather than an allowlist, which is
the unusual choice and the deliberate one: an allowlist would need migrating
every time a capability shipped, and a migration nobody remembered would
silently block a legitimate one. The registry is the allowlist; the constraint
is the floor beneath it.

### 10. The studio is not a chatbot, and does not depend on the assistant

Controls are named actions beside the thing being edited, and what they offer
changes with what is selected. There is no message history, no open-ended box,
and no thread.

`CURRICULUM_STUDIO_ENABLED`, `GEMINI_ASSISTANT_ENABLED`, and
`GEMINI_VISUAL_GENERATION_ENABLED` gate the features, and visual generation
defaults to **off** — it costs more and needs a visual bible to be worth
anything. Every part of authoring works with all three off, with no credential,
or with Gemini failing, and `assistantUnavailableReason()` produces one sentence
that every surface shows rather than composing its own.

## Consequences

- A curriculum designer builds a story world once and writes many lessons in it.
  The workshop shows the beat this lesson sits in, what the learning lets a
  student do in it, and a student preview at desktop and phone widths.
- A teacher-author can duplicate a proven narrative, adapt the copy freely, and
  submit it for review without holding any administrative access.
- Every assisted operation leaves a record saying what was asked for, which
  context parts were sent, what it cost, and what a person decided — visible on
  the lesson, on the narrative, in the review queue, and in aggregate on the
  administrator's page.
- Test coverage went from 322 to 430. The new files are
  `tests/integration/design-assistance.test.ts` (55) and
  `tests/integration/narrative-studio.test.ts` (41), plus six curriculum-grant
  policy cases and thirteen reshaped boundary tests. Gemini is mocked by parameter
  injection, so no test can reach the network or spend a credit by accident.
- A curriculum administrator can turn any of the eleven capabilities off for
  their organization, with a recorded reason, and see who decided what. Doing so
  removes it from every author's panel on their next page load; a proposal
  already on somebody's screen is unaffected, because a proposal is not
  curriculum and accepting one goes through the ordinary authoring path.
- Migrations 0022 through 0025 are written but **not applied to the hosted
  database** — applying them needs approval (CLAUDE.md §2, §11). The beta runs
  the same shapes in memory, as it has since ADR 0002.
- **Not verified in a browser.** The local checkout has no Supabase credentials
  and there is no demo identity to fall back on, so the studio pages could not be
  signed into and rendered. The build compiles every route, the unauthenticated
  refusal of `/api/ai/assist` was exercised live, and the domain is covered by
  tests — but nobody has yet looked at these screens.
- **Not built:** narrative branching, collaborative editing with presence,
  reusable activity patterns, and lesson-level version checkpoints (narratives
  have them; lessons still rely on course-version history). Visual generation is
  implemented end to end but has never been run against the real image model.
