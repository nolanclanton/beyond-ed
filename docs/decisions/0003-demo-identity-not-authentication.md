# ADR 0003 — Demo identity selection, not authentication

**Status:** Accepted
**Date:** 2026-08-21

## Context

The approved auth provider is Supabase Auth (CLAUDE.md §1), which needs the
project from ADR 0002 and environment variables set by a human. The beta still
has to be reviewable from all five roles, and every role's workspace has to be
scope-checked or the review proves nothing.

## Decision

The landing page is a **demo identity picker**, not a sign-in form.

1. **No credentials exist anywhere in this build.** There is no password field,
   no password column, no hashing, no session token. Nothing in the codebase
   accepts, stores, or checks a secret. This is a deliberate property: a demo
   login form with a fake password would be the wrong thing to build, because it
   would look like authentication without being it.

2. **Identity is resolved server-side on every request.**
   `lib/auth/session.ts` reads an httpOnly cookie holding a seeded user id and
   looks the user up in the store. The browser can name a seeded user; it cannot
   assert a role, a site, or a scope.

3. **Scope enforcement is real.** Every read and every write goes through
   `lib/auth/scope.ts`. A student cannot read another student, a teacher cannot
   read another teacher's roster, a site admin cannot cross sites, and a
   curriculum author reads no student records at all. Those rules have positive
   and negative tests.

4. **An unknown or absent cookie resolves to no session**, not to a default
   user, and each role's layout redirects anything outside its own role.

5. **The interface says what it is.** The landing page and the shell banner on
   every page state that there is no authentication and that the data is seeded
   and resets.

## Consequences

- Every role is reviewable, and the review of scope isolation is meaningful,
  because the same code path enforces it that will enforce it later.
- This build must never be deployed anywhere reachable by a real user. It has no
  authentication; anyone with the URL can select any identity. Production
  deployment requires explicit human approval per CLAUDE.md §11 regardless, and
  this is a reason to withhold it until Supabase Auth is wired.
- The swap is contained: `currentUser()` becomes a Supabase session read. The
  scope functions, which are what actually protect data, do not change.
