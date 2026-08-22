# ADR 0002 — The beta runs on an in-memory store, not Supabase

**Status:** Accepted
**Date:** 2026-08-21

## Context

CLAUDE.md §1 fixes the approved database as Supabase Postgres with row-level
security on every table. Standing up that database needs things this build
cannot produce on its own:

- a provisioned Supabase project,
- environment variables set by a human (§11 — "Environment variables are set by
  a human. Never print, log, or commit a secret"),
- `supabase link` and `supabase db push`, both of which require explicit human
  approval per command and per session (§2).

The request was a working beta to review. Waiting on provisioning would have
produced a design mock instead.

## Decision

The beta runs the same record shapes against an in-memory store,
`lib/db/store.ts`, and the Postgres schema is written and committed as the
canonical definition rather than skipped.

**What is real and stays real when Supabase lands:**

- **The schema.** `supabase/migrations/0001_core_schema.sql` is the canonical
  definition. `lib/db/types.ts` mirrors it table for table.
- **Append-only.** `evidence`, `audit_events`, and `grade_records` are
  insert-only in both places: the store exposes `appendEvidence`, `appendAudit`,
  and `appendGradeRecord` and nothing that mutates, and
  `0002_append_only.sql` installs triggers that raise on `UPDATE` and `DELETE`.
  A test in `tests/unit/module-boundaries.test.ts` greps the source for any
  mutation of those arrays.
- **Scope.** `lib/auth/scope.ts` is the enforcement point every read and write
  goes through, and it is the application-layer mirror of the policies in
  `supabase/policies`. Its rules have positive AND negative tests in
  `tests/policies`.
- **Transactions and idempotency.** `transact` restores a snapshot on throw, so
  a partial write cannot survive; `withIdempotency` returns the first result for
  a repeated key. Both are exercised by integration tests.

**What is NOT real, and is stated plainly in the interface:**

- Data lives in the server process and resets when it restarts. Every page says
  so once, in the shell banner.
- Row-level security is not enforced by a database in this build. Scope is
  enforced in application code that every path goes through, which is weaker: a
  future direct-to-database client would bypass it. The policies exist so that
  gap closes with a `db push` rather than a redesign.

## Consequences

- A reviewer can click every path today, including the write paths.
- The migration is: provision the project, apply `0001`-`0003` and the policy
  files, generate `lib/database.types.ts`, and replace `lib/db/store.ts` with a
  Supabase client. The domain modules above it — evidence, grades, mastery,
  recommend, intervention, audit — do not change, because none of them know
  where the rows live.
- `tests/policies` runs against the scope resolver today. When the database
  exists, the same cases must also run against it, and both must pass. That is
  a required follow-up, not an optional one.
