# ADR 0010 — The lesson studio: where lessons are built

**Status:** Accepted
**Date:** 2026-08-24

## Context

The curriculum portal governed versions and nothing else. It could move a course
version from draft to published and it validated the 135 + 40 = 175 day budget,
but there was no way to write what a lesson actually *is*. Instructional content
lived in two committed TypeScript modules — six demonstration lessons and their
item banks — which meant authoring a lesson required a developer, a commit, and a
deploy.

The owner asked for the portal to become the place lessons are built: write the
script, attach video, create quizzes.

## Decisions

### 1. Content hangs off a course version, and only a draft is editable

There is no second lifecycle. `authored_lessons` references `course_versions`,
and the existing state machine does the work:

| Version status | Content |
|---|---|
| Draft | Editable by a curriculum author |
| In review | Frozen, so a reviewer and a publisher read the same thing |
| Approved | Frozen |
| Published | Live for sections created on that version; frozen |
| Retired | Frozen |

This is what makes §7 hold without new machinery. A roster section keeps the
version it was created with, so publishing 2026.3 cannot change what a class
running on 2026.1 is being taught, and cannot alter what prior evidence was
collected against. Editing published content means opening the next version —
which is what versioning is for.

Enforced in three places, deliberately: `assertEditable` in the domain, the RLS
policy in `supabase/policies/authored_lessons.sql`, and a trigger in migration
0006 that raises regardless of how the write arrives.

### 2. Authoring fills in the course plan; it cannot change it

A lesson is written against an existing catalog `lessonCode`. The studio never
creates a lesson code, never sets a day range, and never touches the catalog,
which is generated from the blueprint. Two consequences, both wanted:

- **The day contract cannot be broken by authoring.** 135 + 40 = 175 is
  validated over the catalog; nothing in the studio writes to it.
- **Identifiers stay stable** across content revisions (CLAUDE.md §7).

Creating a genuinely new lesson changes a course's day allocation. That is a
blueprint decision, not an authoring one, and doing it in the studio would let a
course quietly outgrow its own budget. It is not offered.

### 3. An item must be able to direct something

Validation on a quiz item is the product, not paperwork:

- The item's standard must be **primary coverage for that lesson**. An item
  measuring something the lesson does not teach produces evidence nobody can act
  on. Lessons that claim no new standard (launch, diagnostic) cannot carry items
  at all, and say so.
- **Every wrong choice names the error family it reveals.** A distractor with no
  error behind it is a mark rather than a diagnosis, and the recommendation
  engine reads error families (CLAUDE.md §8).
- Exactly one correct choice; two to six choices; a rationale, shown after the
  student answers rather than during.

The item's `skill` is the bare standard code, matching every other item in the
system, so mastery and recommendation read authored evidence with no special
case.

### 4. Video is a reference and a transcript, not an upload

The studio stores the **address** of a video plus a required transcript. It does
not accept a file, because file storage is not provisioned in this build (ADR
0002) and an upload control that cannot finish what it started is a dead control
(CLAUDE.md §12). The `source` column exists with a single value, `url`, so a
storage-backed source can be added later without changing every reader.

The transcript is required rather than encouraged: a video nobody can read is a
lesson some students cannot take. An optional WebVTT captions address may be
attached as well; it does not replace the transcript.

### 5. Authored content replaces the demo bank, never mixes with it

Resolution for a student is: content published in **their enrollment's own
course version**, else the demonstration lesson, else "this lesson has not been
written yet" (`lib/curriculum/lesson-bank.ts`).

Where a lesson has authored items, they replace the demo bank for that lesson
rather than joining it. Quietly mixing example questions into a real Exit Ticket
would put a student's advancement decision partly on content nobody adopted.

## Consequences

- Lessons can be authored, reviewed, and published by a person holding the
  curriculum-author authorization, with no developer in the loop.
- Every authoring write is transactional, idempotent, and audited in the same
  transaction, with a reason (CLAUDE.md §6). Draft content is working state and
  may be edited or removed; evidence and audit remain append-only and untouched.
- Migration 0006 is written but **not applied to the hosted database** —
  applying it needs `supabase db push`, which is a human-approved command
  (CLAUDE.md §2). The beta runs the same shapes in memory.
- A readiness checklist tells an author what a student would meet if the version
  were published today. It is advisory: an unfinished lesson is a normal state
  while it is being written, and the publication gate remains the day budget.
