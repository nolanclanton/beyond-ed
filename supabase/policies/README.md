# Row-level security policies

One file per table (CLAUDE.md §1). Every table in `public` has RLS enabled and a
default of deny; each grant below is explicit and narrow.

Each policy file states, in a comment, the positive and negative cases it must
satisfy. Those cases exist as executable tests in `/tests/policies`, which run
today against `lib/auth/scope.ts` — the application-layer enforcement point this
beta uses in the absence of a provisioned Supabase project (ADR 0002). When a
project exists, the same cases run against the database and both must pass.

The service-role key is never used to satisfy an ordinary product request. It
exists for migrations and system jobs only. If a feature seems to need it, the
policy is wrong — fix the policy.
