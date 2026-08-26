# Beyond.Ed — functional beta

A standalone grades 6–12 learning and academic-operations platform. Every
student stays on a rigorous course pathway and receives precise, timely support
when the evidence shows a barrier.

The organization it serves is a **tenant record**, read at request time. No
customer name is built into the interface — pointing Beyond.Ed at a different
district means seeding a different organization, not editing markup.

Product source of truth: [`docs/blueprint.md`](docs/blueprint.md).
Curriculum source of truth:
[`docs/curriculum/curriculum-architecture.xlsx`](docs/curriculum/curriculum-architecture.xlsx)
— 38 courses, 342 units, 5,130 lessons, 160 reusable supports
([ADR 0011](docs/decisions/0011-curriculum-architecture-workbook.md)).
Engineering rules: [`CLAUDE.md`](CLAUDE.md).

---

## Run it

```bash
pnpm install
```

```bash
pnpm dev
```

Open <http://localhost:3000>.

**Both Supabase variables are required** (`NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). There is no demo mode: the seeded
identity picker from ADR 0003 has been removed, along with the cookie it set and
the actions that read it. Without the variables the app renders a plain "not
configured" page, so a misconfigured deployment fails visibly rather than
quietly looking like a working product.

A district administrator provisions each account and hands over a short setup
code; the person uses it once to choose their own password. The database refuses
any sign-up whose address was never invited, and any whose code does not match
([ADR 0014](docs/decisions/0014-district-provisioned-accounts.md)). See
[SUPABASE_SETUP.md](SUPABASE_SETUP.md).

**Student progress still runs on the in-memory store** from ADR 0002, so a
signed-in student sees empty states rather than a pathway, and the curriculum
surfaces read seeded course versions. Porting that to Postgres is the next
piece of work.

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

1. **Open the Teacher Portal.** The action queue shows
   recommendations with their trigger evidence, the ranking inputs, the
   suggested support, the return destination, and the return rule. Open
   "Preview and assign" on Amara Oyelaran's `6.RP.1` item, read what the student
   would see, and assign it with a reason.
2. **Switch to the Student Portal.** Today shows the support first,
   because finishing it unblocks the lesson behind it. Open it: the return
   destination is on every screen. Work the model, take the readiness check and
   the transfer item, and watch the return rule decide whether you go back.
3. **Open her lesson `MATH-06-L035`** from Learn. Ten stages. Stage 2 is the Spiral
   Review with its selection reasons; stage 9 is the Exit Ticket. Answer one of
   four correctly to see the below-50% band hold you back and grant one
   supported retry.
4. **Grades and Progress.** The same student's official results and readiness
   estimates, on separate pages, calculated separately, labelled as different
   measures.
5. **Camille Okonjo (organization administrator).** The audit log carries every
   action you just took, with actor, role, scope, before, after, and reason.
6. **Yusra Haddad (curriculum author).** Courses is the whole architecture:
   38 courses with their pathways, each course's nine units, each unit's
   fifteen-lesson arc and concept graph, and every lesson's standard and six
   prerequisites. The lesson studio then builds one: open Mathematics 6
   `2026.2`, unit 3, `MATH-06-L035`, and compose the canvas a student reads —
   paragraphs, callouts, key terms, tables, images, and video, each placed and
   reordered, with the student's own view beside it as you work
   ([ADR 0012](docs/decisions/0012-lesson-canvas.md)). The same draft moves
   through review, approval, and publication under Versions, gated on
   135 + 40 = 175 **and** on standards coverage. Content is editable only while
   the version is a draft, so a class running on `2026.1` cannot have its lesson
   change underneath it
   ([ADR 0010](docs/decisions/0010-lesson-studio.md)).
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
`MATH-06-L035`, `ELA-06-L021`, `SCI-06-L078`, `HSS-06-L001`, `MATH-1-L046`,
`ELA-09-L021`. Everywhere else the curriculum record is real — unit, essential
question, standard, objective, prerequisites — and the page says plainly that
its instruction has not been written yet. That is what the studio is for.

## Checks

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm test:policies
```

- `pnpm test` — 174 unit and integration tests
- `pnpm test:policies` — 35 scope-isolation tests, each grant with a positive
  and a negative case
- `pnpm catalog` — regenerates the curriculum data from the architecture workbook,
  validating it before it writes: nine units and 135 days per course, every
  primary standard in the course's crosswalk, six prerequisites per lesson, and
  every reference resolving

## Colour

Blue and green are dominant and calm — the pathway, progress, actions, and
reading surfaces. Amber is reserved for **memory cues**: Spiral Review, work
that comes back, a skill going stale. Red is for genuinely urgent states only.
Warmth is doing a job, not decorating
([ADR 0008](docs/decisions/0008-entry-portals-and-colour-ethos.md)).

The entry screen wears the brand gradient as a banner and then hands the page to
the light canvas the product itself uses, so the portal cards are the same
surfaces you meet inside. It is the one screen with motion: the banner rises on
load, and content below the fold rises as it is scrolled to. Both are
enhancements — `prefers-reduced-motion: reduce`, or no JavaScript, renders the
finished page with nothing hidden
([ADR 0009](docs/decisions/0009-entry-screen-layout-and-motion.md)).

## How it is built

| Layer | Where |
|---|---|
| Curriculum catalog | `lib/curriculum/catalog.ts` — generated from the architecture workbook: 38 courses, 342 units, 5,130 lessons |
| Course pathways | `lib/curriculum/pathways.ts` — which course leads into which, and where a student enters |
| Standards crosswalk | `lib/curriculum/standards.ts` — 1,907 standards, first-taught lesson, and the coverage gate |
| Prerequisites | `lib/curriculum/prerequisites.ts` — six pieces of prior learning per lesson, 30,780 links |
| Concept graph | `lib/curriculum/concepts.ts` — which concept enables which, and how strongly |
| Support bank | `lib/intervention/bank.ts` — 160 reusable 30-minute supports, each with its trigger and exit criterion |
| Lesson authoring | `lib/curriculum/lesson-authoring.ts` — the canvas, video, and quiz items written against a draft course version |
| Lesson resolution | `lib/curriculum/lesson-bank.ts` — authored content for the enrollment's own version, else the demo lesson, else "not written yet" |
| School-year calendar | `lib/calendar/` — the ten planning cycles mapped to September–June |
| Completion and performance | `lib/views/metrics.ts` — two distinct measures, never combined, never mixed with readiness |
| Teacher caseload | `lib/views/caseload.ts` — position, performance, and active minutes as separate written bands |
| Day-budget gate | `lib/curriculum/budget.ts` — 135 + 40 = 175, validated for every course |
| Lesson canvas | `lib/design/lesson-blocks.tsx` — one renderer for the author's preview and the student's lesson |
| Evidence ledger | `lib/evidence/` — append-only, corrections supersede, reads resolve supersession explicitly |
| Official gradebook | `lib/grades/` — never imports `/lib/mastery` |
| Readiness and confidence | `lib/mastery/` — never imports `/lib/grades` |
| Recommendation engine | `lib/recommend/` — pure, deterministic, no I/O, no clock, no randomness |
| Intervention lifecycle | `lib/intervention/` — guarded transitions, stored return destination |
| Audit | `lib/audit/` — append-only, written in the same transaction as the action |
| Server actions | `lib/actions/` — Zod-validated, idempotent, transactional, audited |
| Authentication | `lib/auth/`, `lib/supabase/` — server-resolved on every request |
| Account provisioning | `lib/provisioning/`, `supabase/migrations/0012`–`0019` — invitation and setup code, enforced in the database |
| Database schema | `supabase/migrations/`, `supabase/policies/` — canonical, and applied |

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

- **Student progress is not in Postgres yet.** Identity, accounts, invitations,
  the audit trail, and file storage are live against Supabase. Lesson progress,
  quiz attempts, grades, mastery, and interventions still run on the in-memory
  store ([ADR 0002](docs/decisions/0002-in-memory-store-for-the-beta.md)) — the
  tables and RLS policies exist and are applied, but the domain modules above
  them have not been ported. A signed-in student therefore sees empty states
  rather than a pathway. This is the next piece of work, and it is why the demo
  mode still exists.
- **Playwright end-to-end tests are not set up.** Vitest covers the domain and
  the flows; browser-level coverage is the next testing step.
- **Lesson content is written per lesson, and 5,124 of the 5,130 are unwritten.**
  The structure is complete — every lesson has its unit, essential question,
  standard, objective, and six prerequisites — and six lessons carry demo
  instruction and items ([ADR 0005](docs/decisions/0005-demo-content-is-labelled.md)).
  Everywhere else the surfaces say so rather than inventing teaching. Anything
  authored in the studio replaces the demo content for the version it was
  written into.
- **Spiral Review is only as deep as the item bank.** Courses with no authored
  items offer no review rather than borrowing a question from elsewhere, which
  is the correct behaviour and is visible in grades 7 and 11–12.
- **Video and materials are stored as an address, not a file.** The lesson
  studio takes the https address of a video plus a required transcript, and of a
  material — a reading, worksheet, deck, data set, or reference sheet — plus a
  required statement of what the student does with it and how a student who
  cannot open that format gets the same content. Uploading the file itself is
  not wired into the studio yet ([ADR 0010](docs/decisions/0010-lesson-studio.md)).
  The private `student-uploads` bucket and its policies are applied — a student
  writes only beneath their own user id, staff read by the same scope helper
  that governs the student's records, and no role may update or delete an
  object, because uploaded work is evidence.
- **Not built, and not implied to be:** file upload and downloadable workbooks,
  configurable return rules, producing an actual export
  file, section reassignment, SIS/LMS/SSO integration, a family portal, and
  native applications.
- **Foreign language and physical education** are outside the workbook's
  38-course taxonomy and appear on the student's subject list marked as not in
  the catalog. Adding them means authoring curriculum, which is a curriculum
  owner's decision.
- **A course version can be re-sequenced, but only within its units.** A lesson
  moves inside its own unit and a unit moves inside its course, so no unit
  changes lesson count and the 135 + 40 = 175 contract holds by construction.
  Moving a lesson into a different unit would change two unit day budgets at
  once, which is a blueprint decision rather than an authoring one
  ([ADR 0013](docs/decisions/0013-curriculum-governance.md)).
- **Foundation strength is governed, never inferred.** The workbook records that
  a lesson names six pieces of prior learning and what role each plays; how hard
  each binds is a curriculum author's judgement, and an ungoverned link says so
  rather than showing an invented number.
- **No AI tutor or assistant**, by design and by the owner's explicit
  confirmation ([ADR 0006](docs/decisions/0006-myjourney-capabilities.md)).
