# SUPABASE_SETUP.md

What you need to do by hand, in the Supabase and Vercel dashboards, to finish
wiring Beyond.Ed to its backend.

Everything that could be done in code and in migrations is already done,
committed, and applied. The steps below need a human because they involve
credentials, and CLAUDE.md §11 is explicit that environment variables are set by
a person and never printed, logged, or committed.

**Project:** `BeyondEd` — `vwbzslqpraqhjrimkoqc`, region `us-east-2`
**API URL:** `https://vwbzslqpraqhjrimkoqc.supabase.co`

There is **no Google Cloud setup**, no OAuth client, and no client secret. That
was an earlier design; see [ADR 0014](docs/decisions/0014-district-provisioned-accounts.md).

---

## How accounts work here, before you start

Two rules, both enforced in the **database** rather than in the interface.

1. **A district administrator creates every account.** There is no self sign-up
   anywhere in the product. An administrator adds a person — email address,
   role, school, grade — and that produces an invitation plus a short **setup
   code**.

2. **Claiming an account takes that code.** The person enters their address and
   the code once, chooses their own password, and the invitation becomes their
   profile. `handle_new_auth_user` refuses any sign-up whose address has no
   pending invitation, and any whose code does not match it. A refusal aborts
   the transaction, so a failed attempt leaves nothing behind at all.

The code exists because school addresses are guessable. Without it, anyone who
guessed a pending address could claim it first and inherit that person's role
and scope. It is single-use, it is shown only to administrators who can already
see that invitation, and it stops working the moment the account is claimed.

**You already have an account waiting.** See §4.

---

## 1. Supabase — authentication settings

Go to <https://supabase.com/dashboard/project/vwbzslqpraqhjrimkoqc>.

### 1a. Turn OFF "Confirm email" — this one is not optional

**Authentication → Sign In / Providers → Email**

- **Enable email provider:** on (it is on by default).
- **Confirm email:** **OFF**.

**This was verified against your project on 2026-08-26, and confirmation is
currently ON.** An account setup attempt came back
`over_email_send_rate_limit` — Supabase was trying to send a confirmation
message and the built-in sender's quota was already spent. Until you turn this
off, nobody can set up an account, including you.

Leaving it on breaks account setup in a way that is hard to recover from. With
confirmation on, claiming an account creates the profile and consumes the
invitation *immediately*, but withholds the session until a confirmation email
is clicked. If that email is delayed or rate-limited (see §1b), the person is
stranded: their invitation is already claimed, they cannot sign in, and it
cannot be re-issued, because one address may only ever hold one account.

The setup code is what verifies the person, and it does so before the account
exists rather than after. That is the same assurance confirmation gives, without
depending on mail delivery.

Leave every other provider disabled. The database refuses them regardless — it
accepts only `email` and `google` — but there is no reason to leave a door in a
wall you are not using.

### 1b. Email, and what actually works without it

Beyond.Ed sends **no** mail for signing in or setting up an account. The only
feature that needs email is **password reset**.

Out of the box that uses Supabase's built-in sender, which is capped at a
handful of messages per hour and is explicitly not for production. It is fine
while you are testing. Before real students use this, add your own SMTP provider
under **Project Settings → Authentication → SMTP Settings** — any of Resend,
SendGrid, Postmark, or Amazon SES will do.

Until then, a forgotten password is recoverable but slow, and a burst of resets
will hit the cap.

### 1c. Redirect URLs

**Authentication → URL Configuration**

Password-reset links are rejected unless their destination is on this list.

- **Site URL:**

  ```
  https://beyond-ed.app
  ```

- **Redirect URLs** — add all three:

  ```
  https://beyond-ed.app/**
  http://localhost:3000/**
  https://*.vercel.app/**
  ```

  If you would rather not allow every `*.vercel.app` host, replace the third
  with your own preview pattern, which you can read off any preview
  deployment's URL — for example `https://beyond-ed-*-yourteam.vercel.app/**`.

### 1d. Copy the publishable key

**Project Settings → API keys**

Copy the **publishable key** — it begins `sb_publishable_...`. If your project
still shows the older naming, the **`anon` / public** key is its equivalent.

This key is meant to reach the browser and carries no authority of its own:
every request it signs is still resolved against `auth.uid()` and the row-level
security policies. It is not a secret.

**Do not copy the `service_role` / secret key.** Nothing in this application
uses one, no environment variable expects one, and a test in the suite fails if
one ever appears in the source (`tests/unit/authentication.test.ts`).

---

## 2. Environment variables

Exactly two, both public by design.

### Local development

Create `.env.local` in the repository root — it is git-ignored:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://vwbzslqpraqhjrimkoqc.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Then `pnpm dev` and open <http://localhost:3000>.

> **The two modes.** With these variables **absent**, the app runs the seeded
> in-memory demo with the labelled identity picker (ADR 0003), which is how the
> five role workspaces stay reviewable without a database. With them
> **present**, that picker does not exist and district accounts are the only way
> in. There is no way to reach a demo identity on a deployment that has a
> database — the actions behind it refuse.

### Vercel

**Project Settings → Environment Variables.** Add both to **Production**,
**Preview**, and **Development**:

| Name | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vwbzslqpraqhjrimkoqc.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Production, Preview, Development |

Add one more, **Production only**:

| Name | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://beyond-ed.app` | Production |

Vercel's own variables report the *deployment* hostname, not the custom domain
aliased onto it, so without this a production password-reset link can point at a
`*.vercel.app` URL instead of `beyond-ed.app`. Leave it unset on Preview and
Development, where the per-deployment hostname is the correct destination.

Redeploy after adding variables — Next.js inlines `NEXT_PUBLIC_*` at build time,
so an existing deployment will not pick them up.

---

## 3. Migrations — already applied

All nineteen are applied and recorded in
`supabase_migrations.schema_migrations` under their repository filenames.
Nothing to do here; this is for your records.

| | |
|---|---|
| `0001`–`0004` | Core schema, append-only triggers, scope helpers, RLS policies |
| `0005` | Pinned `search_path`; first attempt at closing the helper RPC surface |
| `0006`–`0011` | Authored lessons, lesson canvas, materials, course structures |
| `0012` | **Account provisioning** — invitations, deactivation, the sign-up gate |
| `0013` | **Private `student-uploads` bucket** and its policies |
| `0014` | The three provisioning writes, as atomic Postgres functions |
| `0015` | Lets the district's **first** administrator be bootstrapped |
| `0016` | One address, one account |
| `0017`–`0018` | Closed the scope-helper RPC surface to `anon` without breaking the policies |
| `0019` | **Setup codes** — replaces the Google-only rule with email plus a code |

**For future migrations**, once the CLI is logged in (`supabase login`, then
`supabase link --project-ref vwbzslqpraqhjrimkoqc`):

```bash
supabase db push
```

Regenerate the types in the same commit:

```bash
supabase gen types typescript --linked > lib/database.types.ts
```

---

## 4. Your account — already created

The bootstrap is done. There is a pending invitation waiting for you:

| | |
|---|---|
| Email | `nolan20823@gmail.com` |
| Role | Organization administrator |
| Organization | `Beyond.Ed` |
| **Setup code** | **`XAWK BSUF`** (enter it as `XAWKBSUF` — spacing and case do not matter) |

Once §1 and §2 are done, open the site, choose **Set up my account**, and enter
that address, that code, and a password of your choosing. You land on `/org`
with access to every organization surface — including **Accounts**, where you
add everybody else.

The organization is named `Beyond.Ed` and there is one school, `Main Campus`,
because I did not know your district's real names. To change them, in the
Supabase **SQL Editor**:

```sql
update public.organizations set name = 'Your District Name';
update public.sites set name = 'Your School Name', short_name = 'YHS';
```

### If you ever need to bootstrap another administrator by hand

You should not — use the Accounts page. But if the last administrator account is
ever lost, this is the escape hatch, and it works because
`invited_by_user_id` may be null **only** for an `org_admin`, and only from a
session that bypasses row-level security (migration 0015):

```sql
insert into public.account_invitations (
  org_id, site_id, email, role, first_name, last_name, invited_by_user_id
) values (
  (select id from public.organizations limit 1),
  null,
  'someone@example.com',   -- lower case
  'org_admin',
  'First', 'Last',
  null
)
returning email, claim_code;
```

The `returning` clause gives you the setup code to hand over.

---

## 5. Adding everyone else

Two routes, and they do the same thing:

**Through the site** — Organization → **Accounts**, or Site → **Accounts** for a
school administrator. Fill in the name, address, role, school, grade, and a
reason. The setup code appears in the confirmation and stays listed beside their
name until they use it, so you can read it back at any time.

This is the route to prefer: it is scope-checked, it writes an audit event with
your name and your reason, and it will not let you grant a role you do not hold.

**Through the Supabase SQL editor** — for a bulk import. Same table, and the
code generates itself:

```sql
insert into public.account_invitations (
  org_id, site_id, email, role, first_name, last_name, grade_level, invited_by_user_id
)
select
  (select id from public.organizations limit 1),
  (select id from public.sites where short_name = 'MAIN'),
  lower(v.email), 'student', v.first_name, v.last_name, v.grade,
  (select id from public.users where role = 'org_admin' limit 1)
from (values
  ('ada@example.com',  'Ada',  'Lovelace', 7::smallint),
  ('alan@example.com', 'Alan', 'Turing',   8::smallint)
) as v(email, first_name, last_name, grade)
returning email, claim_code;
```

Two things to keep right, both enforced by check constraints:

- **Addresses are stored lower case.** `lower()` in the insert, as above.
- **`site_id` is null for an `org_admin` or `curriculum_author`**, and set for a
  student, teacher, or site administrator. A student also needs `grade_level`;
  nobody else may have one.

A bulk insert this way is **not** audited, because it did not go through the
portal. Prefer the portal for anything but an initial roster load.

---

## 6. Verify it works

In order. Each step depends on the one before.

1. **Signed out.** Open the site. You should see two tabs — *Sign in* and *Set
   up my account* — and no "create an account" link anywhere.
2. **An unprovisioned address is refused.** Under *Set up my account*, try an
   address you have not added, with any code. It should fail with a message that
   does **not** reveal whether the address exists. Confirm no row was added to
   `auth.users`.
3. **A wrong code is refused.** Try your own address with a wrong code. Same
   message, and your invitation should still say `pending`.
4. **Your own account works.** Your address, the code from §4, a password. You
   should land on `/org`.
5. **Provisioning works.** Accounts → add a student with a second address you
   control. Note the setup code from the confirmation.
6. **The claim works.** Sign out, set up that student's account. They land on
   `/today`, and their invitation moves to *Claimed* in your admin view.
7. **Scope isolation.** Add a second student and confirm neither can see the
   other. (`tests/policies` covers this exhaustively, and the database behaviour
   was verified directly — see the header of
   `tests/policies/provisioning.test.ts`.)
8. **Withdrawal works.** Withdraw one student's access with a reason. They
   should be unable to sign in and should see "This account has been withdrawn."
   Every row they produced is still there — nothing is deleted.
9. **Password reset works.** Use *I have forgotten my password*, follow the
   link, set a new one. (Rate-limited until you configure SMTP — see §1b.)
10. **The audit trail.** Organization → **Audit**. Every action above should be
    there with actor, target, before, after, reason, and timestamp.

---

## 7. What is deliberately not here

- **No `service_role` key.** The application never uses one. If a feature ever
  seems to need it, the row-level security policy is wrong and the policy is
  what gets fixed (CLAUDE.md §3).
- **No sign-up form.** Accounts are provisioned, never registered.
- **No AI or LLM configuration.** The product contains no tutor, chatbot,
  copilot, or conversational assistant, and no AI SDK is installed
  (CLAUDE.md §10).

---

## 8. Known follow-ups

- **Student progress is not yet stored in Supabase.** Identity, accounts,
  invitations, the audit trail, and file storage are live against Postgres.
  Lesson progress, quiz attempts, grades, mastery, and interventions still run
  on the in-memory store from ADR 0002 — the tables and policies exist and are
  applied, but the ~33,000 lines of domain code above them have not been ported
  yet. A signed-in student therefore sees empty states rather than a pathway.
  This is the next piece of work, and it is the reason the demo mode still
  exists.
- **Configure SMTP before real students use password reset.** See §1b.
- **The scope helpers still sit in the `public` schema**, so a *signed-in* caller
  can reach them at `/rest/v1/rpc/...`. They answer only about the caller's own
  scope, so nothing leaks, but moving them to a non-exposed schema would clear
  the remaining database-linter warnings. The reasoning and the risk are written
  up at the bottom of
  `supabase/migrations/0018_grant_policy_helpers_to_authenticated.sql`.
