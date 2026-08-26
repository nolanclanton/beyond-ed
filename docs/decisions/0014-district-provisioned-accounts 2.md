# ADR 0014 — Accounts are provisioned by a district administrator and claimed with a setup code

**Status:** Accepted
**Date:** 2026-08-26
**Supersedes:** the "no authentication" half of [ADR 0003](0003-demo-identity-not-authentication.md)

## Context

ADR 0003 shipped a demo identity picker because Supabase Auth needed a project
that did not exist and environment variables only a human can set. Both now
exist: project `vwbzslqpraqhjrimkoqc`, with migrations `0001`–`0019` applied.

That leaves the question ADR 0003 deferred: who is allowed to be in this
product, and who decides?

The brief was "everyone signs in with a Gmail account, and accounts are created
only through the district admin portal", alongside a list that also asked for
sign-up, email confirmation, and password reset. Those cannot all hold at once —
Google OAuth has no password to reset, and "only an administrator creates
accounts" means there is no sign-up form.

The first implementation took the Gmail half literally: Google-only, enforced by
checking the OAuth provider. It worked, and it was abandoned before anyone used
it, because of what it cost to switch on. A Google identity means a Google Cloud
project, an OAuth consent screen, a web client, and a client secret — four
things to configure, in a console with nothing to do with this product, before
one person can log in. The district's actual ask was to add somebody's address
and have them able to sign in.

## Decision

**A district administrator provisions every account. The person claims it once
with a setup code, choosing their own password. Neither rule lives in the
interface.**

### 1. Provisioning, not registration

`account_invitations` is the roster. A row names the address, the role, the
school, the grade, and the reason it was issued. It is written from the
Accounts page — or, for a bulk load, directly in SQL.

`handle_new_auth_user`, an `after insert` trigger on `auth.users`, is what makes
that the only route. It raises unless a **pending** invitation exists for the
address, and it builds `public.users` **from that invitation**. Every
scope-bearing value on the profile — organization, site, role, curriculum
authorization, grade — comes off the invitation. The only thing taken from the
sign-up is the identity itself.

A raise aborts the transaction that would have created the `auth.users` row. A
rejected person does not get a half-made account with no profile; they get no
account, and can be provisioned properly afterwards without a collision.

### 2. The setup code, and why it is not optional

An address alone is not proof. School addresses are formulaic —
`firstname.lastname@district.org` — so "sign up with an invited address" is a
race the wrong person can win. Claiming a student's account is bad; claiming a
teacher's or an administrator's is privilege escalation.

The conventional answer is email confirmation, which proves the claimant
controls the inbox. It needs a working SMTP provider to be usable, which is
another external dependency of exactly the kind this decision removes — and
Supabase's built-in sender is capped at a few messages an hour.

So the assurance is a code: eight characters, generated when the invitation is
issued, visible only to administrators whose policies already admit that
invitation, handed over however the district already hands things to people. It
proves the same thing — the district gave this account to this human — with
nothing to configure. It is single-use by construction, because it is only ever
checked against a `pending` invitation and claiming moves that invitation to
`claimed`.

Its alphabet excludes `0/O` and `1/I/L`. A code that is read aloud or written on
a slip has to survive being transcribed.

It cannot be edited: `guard_invitation_update` rejects a change to it, as it
does to the address and the role. Rotating one means revoking the invitation and
issuing another, which mints a new code and is audited.

### 3. Confirmation stays off, deliberately

With Supabase's "Confirm email" enabled, claiming an account creates the profile
and consumes the invitation immediately but withholds the session until a
confirmation link is clicked. If that mail is delayed or rate-limited the person
is stranded: the invitation is already claimed, they cannot sign in, and it
cannot be re-issued because one address may hold only one account.

The code verifies the person *before* the account exists rather than after,
which is the same assurance without the dependency. `claimAccountAction` still
handles the confirmation-enabled case with an honest message, but the documented
configuration turns it off.

### 4. Google is still accepted, and exempt from the code

The provider check allows `email` and `google`. It is unreachable while the
provider is disabled, and it is kept because the exemption is *correct* rather
than convenient: Google has already verified that the person controls the
address, which is a stronger assurance than the code gives. If this district
ever turns Google on, the right thing happens with no further migration.

### 5. Where the rules live

Each of these is a database object, because a rule a server action checks is a
rule a future code path forgets:

| Rule | Enforced by |
|---|---|
| No self sign-up | `handle_new_auth_user` |
| The setup code must match | `handle_new_auth_user` |
| Only accepted providers | `handle_new_auth_user` |
| Who may provision whom | `can_provision` + `invitations_insert_admin` |
| A site admin cannot grant a role above their own | `can_provision` |
| One address, one account | `reject_second_account_for_address` + two partial unique indexes |
| An invitation's role, scope, and code are fixed once issued | `guard_invitation_update` |
| A profile's role and scope can never be updated | `guard_user_update` |
| Nothing is hard-deleted | `reject_mutation` on `users` and `account_invitations` |
| A withdrawn person can do nothing | `deactivated_at`, read by every scope helper |

The three writes an administrator performs — issue, revoke, withdraw — are
`security invoker` Postgres functions. A function body is a transaction, which
is what lets the record, its audit event, and its idempotency key be written
together; `security invoker` means each statement inside is filtered by the
caller's own policies, so the functions grant no authority of their own.

### 6. Two failure messages that say less than they know

`claimAccountAction` reports the same thing whether no invitation exists or the
code is wrong. `requestPasswordResetAction` reports success whether or not the
address has an account. Distinguishing either case would turn the form into an
oracle for which addresses have accounts — precisely the enumeration the setup
code exists to defeat.

### 7. Bootstrapping

The first organization administrator has nobody to invite them, and the trigger
cannot be disabled to insert them by hand — nothing short of the table owner
may, and the platform owns `auth.users`. `invited_by_user_id` is therefore
nullable, with a check constraint permitting a null **only** for an `org_admin`.

That is safe because of where a null can come from: `invitations_insert_admin`
requires `invited_by_user_id = auth.uid()`, so no client at any role can write
one. A null inviter can only be produced by a session that bypasses RLS — the
project owner in the SQL editor, which is exactly who is entitled to name the
first administrator.

### 8. Two modes, one switch

`isSupabaseConfigured()` — the presence of both public environment variables —
decides everything. Configured: district accounts, no picker. Unconfigured: the
ADR 0003 demo picker, seeded and labelled, for local review without a database.
`signInAs` and `resetDemoData` refuse outright when Supabase is configured, so a
real deployment cannot be talked into handing out a seeded identity by posting to
the action directly.

## What testing changed

Four of these rules exist because writing the migration was not enough and
running it found the gap:

- **The first administrator was impossible.** `invited_by_user_id NOT NULL` plus
  a trigger nobody may disable meant no account could ever be created. Fixed in
  `0015`.
- **One address could hold two accounts.** The two partial unique indexes in
  `0012` never collide — one covers pending rows, the other claimed rows — so a
  *new pending* invitation could be issued for an address that already had an
  account. Inert while that person's `auth.users` row survives; a dormant
  privilege grant if it ever did not. Fixed in `0016`.
- **The scope helpers were never actually taken off the public API.** `0005`
  revoked `EXECUTE` from `anon` and `authenticated`, neither of which held it
  directly — the grant came from `PUBLIC`. Revoking from `PUBLIC` closed the
  hole and broke every policy that calls a helper, because a function referenced
  by an RLS policy *is* permission-checked against the querying role. `0017` and
  `0018` land on the split that works.
- **A test that passed while testing nothing.** The first check on the revoke
  above succeeded — because the revoke had not revoked anything. That is the one
  worth remembering.

The gate was then exercised end to end against the hosted database, inside
transactions that were rolled back: right code, wrong code, no code, an
unprovisioned address, a code typed in lower case with a dash, an unaccepted
provider, an attempt to edit a code, and re-issue after revoke. What was checked
and when is recorded in the header of `tests/policies/provisioning.test.ts`.

## Consequences

- Nobody reaches this product without an address a district administrator named
  in advance and a code that administrator handed over. There is no registration
  path to harden.
- **Password reset needs SMTP.** It is the only feature that sends mail. It works
  out of the box on Supabase's built-in sender, which is rate-limited to a
  handful of messages an hour and is not for production; a real district
  configures its own provider first. Nothing else in the product sends email.
- Withdrawing access is a state transition with a reason and an audit event.
  Every record the person produced stays exactly where it is.
- **Student progress is not yet in Postgres.** Identity, accounts, invitations,
  audit, and file storage are live; lesson progress, quiz attempts, grades,
  mastery, and interventions still run on the ADR 0002 in-memory store. The
  tables and policies exist and are applied — the domain modules above them have
  not been ported. A signed-in student sees empty states, not a pathway. That
  port is the next piece of work and is why the demo mode still exists.
