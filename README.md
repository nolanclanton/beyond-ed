# Beyond.Ed — functional beta

A standalone grades 6–12 learning and academic-operations platform. Every
student stays on a rigorous course pathway and receives precise, timely support
when the evidence shows a barrier.

The organization it serves is a **tenant record**, read at request time. No
customer name is built into the interface — pointing Beyond.Ed at a different
district means seeding a different organization, not editing markup.

Product source of truth: [`docs/blueprint.md`](docs/blueprint.md).
Engineering rules: [`CLAUDE.md`](CLAUDE.md).

---

## Run it

```bash
pnpm install
```

```bash
pnpm dev
```

Open <http://localhost:3000> and pick a person to review as. There is no
password, because there is no authentication in this build — see
[ADR 0003](docs/decisions/0003-demo-identity-not-authentication.md).

**The store is in memory and resets when the dev server restarts.** "Rebuild
demo data" on the landing page resets it without a restart.

The seeded tenant is a fictional district — **Northfield Learning Network**,
with **5 sites, 584 students, 37 teachers** across Northfield Central,
Riverside, Oakmont, Lakeview, and Summit. Eight students and five teachers at
the first two sites have hand-written records that demonstrate specific
behaviour; the rest is generated so the site and organization rollups have a
real population behind them.

Everything about that tenant lives in
[`lib/db/demo-identity.ts`](lib/db/demo-identity.ts) — one file to change to
rebrand the demo.

## What to look at

The fastest path through the product's core promise — *detect the smallest
blocking skill, show the evidence, assign the shortest appropriate support,
verify transfer, and return the student to the exact pathway location*:

1. **Sign in as Renata Alvarez (teacher).** The action queue shows
   recommendations with their trigger evidence, the ranking inputs, the
   suggested support, the return destination, and the return rule. Open
   "Preview and assign" on Amara Oyelaran's `6.RP.1` item, read what the student
   would see, and assign it with a reason.
2. **Switch to Amara Oyelaran (student).** Today shows the support first,
   because finishing it unblocks the lesson behind it. Open it: the return
   destination is on every screen. Work the model, take the readiness check and
   the transfer item, and watch the return rule decide whether you go back.
3. **Open her lesson `M6-U1-L2`** from Learn. Ten stages. Stage 2 is the Spiral
   Review with its selection reasons; stage 9 is the Exit Ticket. Answer one of
   four correctly to see the below-50% band hold you back and grant one
   supported retry.
4. **Grades and Progress.** The same student's official results and readiness
   estimates, on separate pages, calculated separately, labelled as different
   measures.
5. **Camille Okonjo (organization administrator).** The audit log carries every
   action you just took, with actor, role, scope, before, after, and reason.
6. **Yusra Haddad (curriculum author).** The Mathematics 6 `2026.2` draft can be
   moved through review, approval, and publication — and publication is gated on
   135 + 40 = 175.
7. **Victor Salinas (site administrator).** Northfield Central's portal: 126
   students, 8 teachers, 504 enrollments, teacher loads, and the unresolved
   queue a site leader can act on with a recorded reason.
8. **Camille Okonjo again, on the district table.** Completion and performance
   per site, and — below it — the grade-12 mathematics branches, where a cohort
   split three ways falls under the 10-student threshold and is suppressed
   rather than reported.

Also worth a look: **Caseload** in the teacher workspace (position, performance,
and active minutes as three separate filterable bands), the **course progress
map** on Progress, the three tabs on **Grades**, and **Example lessons** —
`Operation Firewall` and `City Transit`, two narrative multi-phase sequences that
record nothing and change no pathway position.

Six lessons across four subjects have authored items and instruction
([ADR 0005](docs/decisions/0005-demo-content-is-labelled.md)):
`M6-U1-L2`, `E6-U1-L2`, `S6-U1-L2`, `H6-U1-L2`, `IM1-U2-L2`, `E9-U1-L2`.
Everywhere else, the curriculum record is real and the page says the instruction
has not been authored.

## Checks

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm test:policies
```

- `pnpm test` — 127 unit and integration tests
- `pnpm test:policies` — 28 scope-isolation tests, each grant with a positive
  and a negative case
- `pnpm catalog` — regenerates the curriculum catalog from the blueprint

## How it is built

| Layer | Where |
|---|---|
| Curriculum catalog | `lib/curriculum/` — generated from the blueprint, 30 courses, 249 units, 741 lessons |
| School-year calendar | `lib/calendar/` — the ten planning cycles mapped to September–June |
| Completion and performance | `lib/views/metrics.ts` — two distinct measures, never combined, never mixed with readiness |
| Teacher caseload | `lib/views/caseload.ts` — position, performance, and active minutes as separate written bands |
| Day-budget gate | `lib/curriculum/budget.ts` — 135 + 40 = 175, validated for every course |
| Evidence ledger | `lib/evidence/` — append-only, corrections supersede, reads resolve supersession explicitly |
| Official gradebook | `lib/grades/` — never imports `/lib/mastery` |
| Readiness and confidence | `lib/mastery/` — never imports `/lib/grades` |
| Recommendation engine | `lib/recommend/` — pure, deterministic, no I/O, no clock, no randomness |
| Intervention lifecycle | `lib/intervention/` — guarded transitions, stored return destination |
| Audit | `lib/audit/` — append-only, written in the same transaction as the action |
| Server actions | `lib/actions/` — Zod-validated, idempotent, transactional, audited |
| Database schema | `supabase/migrations/`, `supabase/policies/` — canonical, not yet applied |

### The invariants, and where they are enforced

- **Grades and mastery never mix.** Separate tables, separate modules, separate
  pages. Enforced by a lint rule and by `tests/unit/module-boundaries.test.ts`,
  which greps the source rather than trusting intent.
- **Evidence and audit are append-only.** No update, no delete, in the store or
  in the schema. Postgres triggers in `0002_append_only.sql` raise even for the
  table owner.
- **Recommendations are deterministic.** `recommend()` is a pure function of
  stored evidence and a versioned rule set. Same inputs, same output, in the
  same order — tested, including with the input array reversed.
- **Nothing assigns itself.** Every plan carries the person who decided it and
  their reason. There is no code path that creates an assigned plan without an
  actor.
- **Every calculation stores its rule version and inputs**, so a historical
  result recomputes exactly.
- **No AI anywhere.** No LLM dependency, no generative call, no chat surface.
  Checked in `package.json`, in every import, and in the rendered copy.

## Known gaps

Stated plainly, because the interface states them too:

- **No database.** The beta runs in memory ([ADR 0002](docs/decisions/0002-in-memory-store-for-the-beta.md)).
  The schema and RLS policies are written and committed; applying them needs a
  provisioned Supabase project and human approval.
- **No authentication** ([ADR 0003](docs/decisions/0003-demo-identity-not-authentication.md)).
  Do not deploy this build anywhere reachable.
- **Playwright end-to-end tests are not set up.** Vitest covers the domain and
  the flows; browser-level coverage is the next testing step.
- **Assessment items and instruction are demo content** on six lessons and
  absent elsewhere ([ADR 0005](docs/decisions/0005-demo-content-is-labelled.md)).
- **Not built, and not implied to be:** file upload and downloadable workbooks,
  media with captions and transcripts, role-change controls, configurable return
  rules, producing an actual export file, section reassignment, SIS/LMS/SSO
  integration, a family portal, and native applications.
- **Foreign language and physical education** appear on the student's subject
  list marked as not in the catalog. Adding them means authoring curriculum,
  which is a curriculum owner's decision.
- **No AI tutor or assistant**, by design and by the owner's explicit
  confirmation ([ADR 0006](docs/decisions/0006-myjourney-capabilities.md)).
