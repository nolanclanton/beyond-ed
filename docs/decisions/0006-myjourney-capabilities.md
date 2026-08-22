# ADR 0006 — Porting the MyJourney capabilities, without the AI surfaces

**Status:** Accepted
**Date:** 2026-08-22

## Context

A separate beta of the same product idea exists at
`pathways-math-one.njclanton.chatgpt.site`, built with ChatGPT Sites under the
name **MyJourney**. The owner asked for its functionality in Beyond.Ed, and was
explicit about the intent:

> "The idea is to give you a baseline of what I want BeyondEd's capabilities to
> be, not to match the website from ChatGPT exactly."

Two things in that site conflicted with the governing document, and one was a
hard invariant.

## Decisions

### 1. No AI tutor and no AI assistant. Confirmed, not assumed.

The MyJourney student portal offers **"Ask AI Tutor — step-by-step guidance for
lesson concepts"**, and its teacher portal carries a **"TEACHER AI ASSISTANT"**
panel marked *"ready for a future OpenAI integration"*.

CLAUDE.md invariant #7 and §10 forbid any AI tutor, chatbot, copilot, or
conversational assistant anywhere in the product, and §10 names this exact
earlier direction as superseded, instructing that it not be reintroduced and
that older prototypes not be treated as authorization. §9 and §15 require
stopping and asking rather than proceeding.

The owner was asked and confirmed: **keep the ban, ignore that part of the
site.** Nothing generative was built, no LLM SDK was added, and the
`no-restricted-imports` rule and `module-boundaries` test that enforce this are
unchanged.

What replaced them:

- The student's fourth resource tile is **"Ask your teacher"** — the existing
  help request, which reaches a person.
- The teacher's assistant panel is the **action queue**, which was already the
  evidence-backed equivalent: it proposes supports from stored evidence under a
  versioned rule and requires a human decision.
- A real **vocabulary review** replaces the Quizlet tile — retrieval practice
  built from the lesson's own authored vocabulary, self-checked, recorded as
  nothing.

### 2. The blueprint's model wins; MyJourney's features are added to it.

MyJourney and Beyond.Ed are different models: six subjects against four, ten
month-mapped units against the 135 + 40 day contract, a single 50% advance
threshold against four decision bands, a district admin against an org admin.

The owner chose **additive**. So the capacity contract, the four decision bands,
the append-only ledger, and the deterministic recommendation engine are
untouched, and the following were added:

| From MyJourney | How it landed here |
|---|---|
| Learning period and week | `lib/calendar/periods.ts` maps the blueprint's ten cycles to September–June. The mapping is a *local calendar* decision, which is what the blueprint says it is. |
| Course progress map | `unitProgress` measures each unit in **pathway days**, not lesson counts, so a 7-day lesson is not one step. |
| Completion % beside grade | `lib/views/metrics.ts`. Completion is work finished of work *reached*; performance is the gradebook. Reported side by side, never combined. |
| Knowledge Checks / Assessments | The gradebook moved from three categories to those two. |
| Grades tabs | Overall summary, grades by unit, grading breakdown. |
| Teacher caseload with filters | `lib/views/caseload.ts` — position, performance, and active minutes as three separate written bands, filterable and sortable. |
| Site admin portal | Metric tiles, manage-this-site cards, student roster with search and paging, teacher assignments. |
| District data | Site comparison table with completion and performance per site. |
| Example lesson sequences | `Operation Firewall` and `City Transit` as multi-phase narrative sequences that record nothing. |
| Six subjects on the schedule | Shown, with foreign language and physical education marked as not in the catalog — §14 says name what is missing rather than invent it. |

### 3. The demo district was scaled to make the rollups real.

MyJourney's district shape — 5 sites, 584 students, 37 teachers, and the exact
per-site counts — is reproduced under fictional site names (see ADR 0007). The previous two-site, eight-student demo made
every organization-level aggregate either trivial or suppressed, so the
suppression rule could not be seen working at all.

Grade-12 mathematics is now split across Precalculus, Statistics, and
Quantitative Reasoning, which the blueprint describes as separate approved
pathways selected by placement. That is both more faithful and the thing that
produces genuinely small slices — so the district page now shows suppression
biting on real data rather than as an assertion.

Scaling exposed four defects, all fixed and covered by tests:

1. Evidence and grade reads scanned whole tables per call. Indexed by student
   and enrollment; the indexes are maintained only inside the append helpers, so
   they cannot drift and cannot mutate anything.
2. The name hash had almost no avalanche, so `seed + "|f"` and `seed + "|l"`
   returned nearly the same value and the roster filled with near-identical
   names. Added a finalizer, and made names collision-free within a site by
   walking the name grid with a coprime stride.
3. Sections were keyed by the seed's site shorthand in one pass and by site id
   in another, producing two sections of one course at one site with different
   teachers.
4. Section-to-teacher assignment indexed by the subject's position in a
   student's schedule — always 0 for mathematics — so every mathematics section
   at a site landed on one teacher. Now dealt round-robin within the subject
   pool, which also guarantees no teacher has an empty load.

## Consequences

- The district surfaces are worth looking at: 584 students, real per-site
  completion and performance, and suppression demonstrated rather than claimed.
- `CLAUDE.md` did not change. Nothing in this work required amending an
  invariant, because the one request that would have was raised and withdrawn.
- Foreign language and physical education remain absent from the catalog and are
  labelled as such. Adding them means authoring curriculum, which is a
  curriculum-owner decision, not an engineering one.
