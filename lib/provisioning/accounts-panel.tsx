"use client";

import { useActionState, useId, useState } from "react";
import type { ReactNode } from "react";

import {
  issueInvitationAction,
  revokeInvitationAction,
  setProfileActiveAction,
} from "@/lib/actions/provisioning";
import type { ActionResult } from "@/lib/actions/result";
import { ROLE_PRESENTATION } from "@/lib/auth/roles";
import type { Role } from "@/lib/db/types";
import { Banner, Card, CardHeader, ScrollX, StatusChip } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

import type { DirectoryPerson, DistrictSite, Invitation } from "./directory";

type AnyResult = ActionResult<Record<string, unknown>>;

/**
 * The district administrator's account portal.
 *
 * Creating an account is issuing an invitation: an address, a role, a school, a
 * grade, and a reason. That produces a one-time setup code to hand over; the
 * person enters it once, chooses their own password, and the database turns the
 * invitation into their profile. Nothing else creates an account, and there is
 * no form anywhere in this product for a person to make their own.
 *
 * Three panels, in the order the work happens: provision, then what is waiting
 * to be claimed, then who is already in. Every consequential control asks for a
 * reason before it will run, because every one of them writes an audit event
 * and an event without a reason is not much of a record (CLAUDE.md §6, §13).
 */
export function AccountsPanel({
  invitations,
  people,
  sites,
  grantableRoles,
  actorId,
  error,
}: {
  invitations: Invitation[];
  people: DirectoryPerson[];
  sites: DistrictSite[];
  grantableRoles: Role[];
  actorId: string;
  error: string | null;
}) {
  const siteName = (id: string | null) =>
    id ? (sites.find((s) => s.id === id)?.shortName ?? "Unknown school") : "District-wide";

  const pending = invitations.filter((i) => i.status === "pending");
  const settled = invitations.filter((i) => i.status !== "pending");

  if (error) {
    return (
      <Banner title="The account directory could not be loaded." tone="urgent" role="alert">
        <p>
          Nothing has changed, and no account was affected. This is a
          connectivity or configuration problem, not a change to your district.
        </p>
        <p className="mt-1">Reload the page. If it keeps failing, tell your administrator.</p>
      </Banner>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <IssueAccountForm sites={sites} grantableRoles={grantableRoles} />

      <section aria-labelledby="pending-invitations">
        <Card>
          <CardHeader
            title="Waiting to be claimed"
            hint={`${pending.length} ${pending.length === 1 ? "invitation" : "invitations"}`}
          />
          {pending.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink-muted">
              No invitations are outstanding. Everyone provisioned so far has
              signed in.
            </p>
          ) : (
            <ScrollX>
              <table className="w-full min-w-[52rem] border-collapse text-sm">
                <caption className="sr-only" id="pending-invitations">
                  Invitations issued but not yet claimed
                </caption>
                <thead>
                  <tr className="border-b border-line text-left">
                    <Th>Person</Th>
                    <Th>Email address</Th>
                    <Th>Setup code</Th>
                    <Th>Role</Th>
                    <Th>School</Th>
                    <Th>Revoke</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pending.map((invite) => (
                    <tr key={invite.id}>
                      <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                        {invite.firstName} {invite.lastName}
                        {invite.gradeLevel ? (
                          <span className="block text-xs font-normal text-ink-muted">
                            Grade {invite.gradeLevel}
                          </span>
                        ) : null}
                      </th>
                      <td className="px-5 py-3 text-ink-muted">{invite.email}</td>
                      <td className="px-5 py-3">
                        <ClaimCode code={invite.claimCode} />
                      </td>
                      <td className="px-5 py-3 text-xs text-ink-muted">
                        {ROLE_PRESENTATION[invite.role].label}
                        {invite.curriculumAuthor ? (
                          <span className="mt-1 block">
                            <StatusChip label="Curriculum author" tone="info" />
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-xs text-ink-muted">
                        {siteName(invite.siteId)}
                      </td>
                      <td className="px-5 py-3">
                        <ReasonedAction
                          summary="Revoke"
                          heading={`Revoke the invitation for ${invite.email}?`}
                          explanation="That address will no longer be able to create a Beyond.Ed account. The invitation is kept and marked revoked — nothing is deleted."
                          confirmLabel="Revoke invitation"
                          action={revokeInvitationAction}
                          idempotencyKey={`revoke:${invite.id}`}
                          hidden={{ invitationId: invite.id }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollX>
          )}
        </Card>
      </section>

      <section aria-labelledby="people-with-accounts">
        <Card>
          <CardHeader
            title="People with accounts"
            hint={`${people.length} ${people.length === 1 ? "person" : "people"}`}
          />
          {people.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink-muted">
              Nobody has signed in yet. Provision an account above, and it
              appears here once that person uses their setup code for the first
              time.
            </p>
          ) : (
            <ScrollX>
              <table className="w-full min-w-[52rem] border-collapse text-sm">
                <caption className="sr-only" id="people-with-accounts">
                  People who have claimed an account
                </caption>
                <thead>
                  <tr className="border-b border-line text-left">
                    <Th>Person</Th>
                    <Th>Role</Th>
                    <Th>School</Th>
                    <Th>Access</Th>
                    <Th>Change</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {people.map((person) => {
                    const active = person.deactivatedAt === null;
                    const isSelf = person.id === actorId;
                    return (
                      <tr key={person.id}>
                        <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                          {person.firstName} {person.lastName}
                          {person.gradeLevel ? (
                            <span className="block text-xs font-normal text-ink-muted">
                              Grade {person.gradeLevel}
                            </span>
                          ) : null}
                        </th>
                        <td className="px-5 py-3 text-xs text-ink-muted">
                          {ROLE_PRESENTATION[person.role].label}
                          {person.curriculumAuthor ? (
                            <span className="mt-1 block">
                              <StatusChip label="Curriculum author" tone="info" />
                            </span>
                          ) : null}
                        </td>
                        <td className="px-5 py-3 text-xs text-ink-muted">
                          {siteName(person.siteId)}
                        </td>
                        <td className="px-5 py-3">
                          {active ? (
                            <StatusChip label="Active" tone="positive" />
                          ) : (
                            <>
                              <StatusChip label="Withdrawn" tone="neutral" />
                              {person.deactivatedReason ? (
                                <span className="mt-1 block text-xs text-ink-muted">
                                  {person.deactivatedReason}
                                </span>
                              ) : null}
                            </>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {isSelf ? (
                            <span className="text-xs text-ink-muted">
                              You cannot change your own access.
                            </span>
                          ) : (
                            <ReasonedAction
                              summary={active ? "Withdraw" : "Restore"}
                              heading={
                                active
                                  ? `Withdraw access for ${person.firstName} ${person.lastName}?`
                                  : `Restore access for ${person.firstName} ${person.lastName}?`
                              }
                              explanation={
                                active
                                  ? "They will not be able to sign in from their next attempt onward. Every record attached to them is retained and stays readable — nothing is deleted."
                                  : "They will be able to sign in again with the same email address and password, and their records are exactly where they left them."
                              }
                              confirmLabel={active ? "Withdraw access" : "Restore access"}
                              action={setProfileActiveAction}
                              idempotencyKey={`active:${person.id}:${!active}`}
                              hidden={{
                                userId: person.id,
                                active: String(!active),
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollX>
          )}
        </Card>
      </section>

      {settled.length > 0 ? (
        <section aria-labelledby="invitation-history">
          <Card>
            <CardHeader
              title="Invitation history"
              hint="Claimed and revoked invitations are kept permanently."
            />
            <ScrollX>
              <table className="w-full min-w-[44rem] border-collapse text-sm">
                <caption className="sr-only" id="invitation-history">
                  Invitations that have been claimed or revoked
                </caption>
                <thead>
                  <tr className="border-b border-line text-left">
                    <Th>Email address</Th>
                    <Th>Role</Th>
                    <Th>Outcome</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {settled.map((invite) => (
                    <tr key={invite.id}>
                      <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                        {invite.email}
                      </th>
                      <td className="px-5 py-2.5 text-xs text-ink-muted">
                        {ROLE_PRESENTATION[invite.role].label}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-ink-muted">
                        {invite.status === "claimed" ? (
                          <StatusChip label="Claimed" tone="positive" />
                        ) : (
                          <>
                            <StatusChip label="Revoked" tone="neutral" />
                            {invite.revokedReason ? (
                              <span className="mt-1 block">{invite.revokedReason}</span>
                            ) : null}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollX>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

/**
 * Provisioning one account.
 *
 * The role select drives the rest of the form: a student needs a grade and a
 * school, an organization administrator needs neither, and curriculum
 * authorization is offered only to someone who may actually grant it. Fields
 * that do not apply are not rendered rather than being rendered disabled, so
 * nothing on screen is a control that cannot do anything (CLAUDE.md §12).
 */
function IssueAccountForm({
  sites,
  grantableRoles,
}: {
  sites: DistrictSite[];
  grantableRoles: Role[];
}) {
  const fieldId = useId();
  const [role, setRole] = useState<Role>(grantableRoles[0] ?? "student");
  const [email, setEmail] = useState("");
  const [state, formAction, pending] = useActionState<AnyResult | null, FormData>(
    async (_prev, formData) => issueInvitationAction(formData),
    null,
  );

  const needsSite = role !== "org_admin" && role !== "curriculum_author";
  const needsGrade = role === "student";
  const canGrantAuthorship =
    grantableRoles.includes("org_admin") && role !== "curriculum_author";

  return (
    <section aria-labelledby="provision">
      <Card>
        <CardHeader
          title="Provision an account"
          hint="The only way an account is created. There is no self sign-up."
        />
        <div className="px-5 py-5">
          <p className="mb-5 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Enter the email address this person will sign in with. Saving it
            produces a short <strong className="font-semibold text-ink">setup
            code</strong> to hand to them &mdash; they enter the address and the
            code once, choose their own password, and the account becomes their
            workspace. You never see or set their password.
          </p>

          <form action={formAction} className="flex flex-col gap-4">
            <input
              type="hidden"
              name="idempotencyKey"
              value={issueKeyFor(email, state)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" id={`${fieldId}-first`}>
                <input
                  id={`${fieldId}-first`}
                  name="firstName"
                  required
                  maxLength={80}
                  autoComplete="off"
                  className={inputClass}
                />
              </Field>
              <Field label="Last name" id={`${fieldId}-last`}>
                <input
                  id={`${fieldId}-last`}
                  name="lastName"
                  required
                  maxLength={80}
                  autoComplete="off"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field
              label="Email address"
              id={`${fieldId}-email`}
              hint="The address they will sign in with. Any address they can receive password-reset mail at."
            >
              <input
                id={`${fieldId}-email`}
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Role" id={`${fieldId}-role`}>
                <select
                  id={`${fieldId}-role`}
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className={inputClass}
                >
                  {grantableRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_PRESENTATION[r].label}
                    </option>
                  ))}
                </select>
              </Field>

              {needsSite ? (
                <Field label="School" id={`${fieldId}-site`}>
                  <select
                    id={`${fieldId}-site`}
                    name="siteId"
                    required
                    className={inputClass}
                    defaultValue={sites.length === 1 ? sites[0].id : ""}
                  >
                    <option value="" disabled>
                      Choose a school
                    </option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}

              {needsGrade ? (
                <Field label="Grade" id={`${fieldId}-grade`}>
                  <select
                    id={`${fieldId}-grade`}
                    name="gradeLevel"
                    required
                    className={inputClass}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Choose a grade
                    </option>
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
            </div>

            {canGrantAuthorship ? (
              <label className="flex items-start gap-2.5 text-sm text-ink">
                <input
                  type="checkbox"
                  name="curriculumAuthor"
                  className={`mt-0.5 h-4 w-4 rounded border-line-strong ${FOCUS_RING}`}
                />
                <span>
                  Also authorize curriculum authoring
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    A separate authorization, not a level of seniority. It grants
                    curriculum access and no access to student records.
                  </span>
                </span>
              </label>
            ) : null}

            <Field
              label="Reason"
              id={`${fieldId}-reason`}
              hint="Recorded on the audit event with your name and the time."
            >
              <input
                id={`${fieldId}-reason`}
                name="reason"
                required
                minLength={4}
                maxLength={500}
                placeholder="New sixth-grade enrollment for the autumn term"
                className={inputClass}
              />
            </Field>

            <div>
              <button
                type="submit"
                disabled={pending || email.trim().length === 0}
                className={`inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
              >
                {pending ? "Saving…" : "Provision account"}
              </button>
            </div>
          </form>

          {state ? (
            <div className="mt-4" aria-live="polite">
              {state.ok ? (
                <Banner title={state.message} tone="positive" role="status">
                  <p>
                    Give them this setup code. They enter it once, with their
                    email address, to choose a password:
                  </p>
                  <p className="mt-2">
                    <ClaimCode
                      code={typeof state.claimCode === "string" ? state.claimCode : ""}
                      large
                    />
                  </p>
                  <p className="mt-2">
                    It is also listed below, so you can read it back to them at
                    any time until they use it.
                  </p>
                </Banner>
              ) : (
                <Banner title={state.message} tone="urgent" role="alert">
                  <p>{state.preserved}</p>
                  <p className="mt-1">{state.nextStep}</p>
                </Banner>
              )}
            </div>
          ) : null}
        </div>
      </Card>
    </section>
  );
}

/**
 * A consequential control behind a disclosure, with a required reason.
 *
 * Collapsed by default so a destructive-sounding button is never one stray
 * click away, and the reason is part of the same form as the confirmation, so
 * there is no path that performs the action without recording why.
 */
function ReasonedAction({
  summary,
  heading,
  explanation,
  confirmLabel,
  action,
  idempotencyKey,
  hidden,
}: {
  summary: string;
  heading: string;
  explanation: string;
  confirmLabel: string;
  action: (formData: FormData) => Promise<AnyResult>;
  idempotencyKey: string;
  hidden: Record<string, string>;
}) {
  const fieldId = useId();
  const [state, formAction, pending] = useActionState<AnyResult | null, FormData>(
    async (_prev, formData) => action(formData),
    null,
  );

  return (
    <details className="group">
      <summary
        className={`inline-flex cursor-pointer list-none items-center rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-sunken ${FOCUS_RING}`}
      >
        {summary}
      </summary>
      <div className="mt-3 max-w-md rounded-xl border border-line bg-canvas p-4">
        <p className="text-sm font-semibold text-ink">{heading}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{explanation}</p>

        <form action={formAction} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          {Object.entries(hidden).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}

          <label htmlFor={`${fieldId}-reason`} className="text-xs font-semibold text-ink">
            Reason
          </label>
          <input
            id={`${fieldId}-reason`}
            name="reason"
            required
            minLength={4}
            maxLength={500}
            className={inputClass}
          />
          <div>
            <button
              type="submit"
              disabled={pending}
              className={`inline-flex items-center rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
            >
              {pending ? "Saving…" : confirmLabel}
            </button>
          </div>
        </form>

        {state ? (
          <div className="mt-3" aria-live="polite">
            {state.ok ? (
              <Banner title={state.message} tone="positive" role="status" />
            ) : (
              <Banner title={state.message} tone="urgent" role="alert">
                <p>{state.preserved}</p>
                <p className="mt-1">{state.nextStep}</p>
              </Banner>
            )}
          </div>
        ) : null}
      </div>
    </details>
  );
}

/**
 * The idempotency key for one provisioning attempt.
 *
 * Derived, not generated: the address being provisioned, plus the id of the
 * last invitation this form successfully created. That gives both halves of
 * what CLAUDE.md §1 asks for, with no random value and nothing to synchronise.
 *
 *  - Resubmitting the SAME form — a lost response, an impatient second click —
 *    produces the same key, so the server returns the first result instead of a
 *    second account.
 *  - Provisioning the same address again after a success (issued, revoked,
 *    re-issued) produces a different key, because the previous id is now part
 *    of it. That is a genuinely new request and is meant to create a row.
 */
function issueKeyFor(email: string, state: AnyResult | null): string {
  const previous =
    state?.ok && typeof state.invitationId === "string" ? state.invitationId : "";
  return `issue:${email.trim().toLowerCase()}:${previous}`;
}

const inputClass =
  "w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * A setup code, shown so it can be read aloud without ambiguity.
 *
 * Monospaced and split in two, because the whole point of the code is that it
 * survives being spoken across a desk or written on a slip of paper. The
 * generating alphabet already excludes `0/O` and `1/I/L` for the same reason
 * (migration 0019).
 */
function ClaimCode({ code, large = false }: { code: string; large?: boolean }) {
  if (!code) return <span className="text-xs text-ink-muted">&mdash;</span>;
  return (
    <code
      className={`inline-block rounded-md border border-line-strong bg-canvas px-2 py-1 font-mono tracking-[0.18em] text-ink ${
        large ? "text-base font-semibold" : "text-xs"
      }`}
    >
      {code.slice(0, 4)} {code.slice(4)}
    </code>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th scope="col" className="px-5 py-3 font-semibold text-ink">
      {children}
    </th>
  );
}
