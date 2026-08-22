import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { canReadAllAudit } from "@/lib/auth/scope";
import { readableAudit } from "@/lib/audit/log";
import { formatDateTime } from "@/lib/clock";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  Empty,
  ScrollX,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

export const metadata: Metadata = {
  title: "Audit · Beyond.Ed",
  description: "Every attributable human action, append-only.",
};

/**
 * The audit log (CLAUDE.md §6).
 *
 * Append-only. Written in the same transaction as the action it records — if
 * the audit write fails, the action fails. Readable by `org_admin` and by the
 * actor for their own actions; writable by no one.
 */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const { action: filter } = await searchParams;
  const actor = await requireUser();
  const d = db();

  const all = readableAudit(actor);
  const events = filter ? all.filter((e) => e.action.startsWith(filter)) : all;
  const actions = [...new Set(all.map((e) => e.action))].sort();

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Audit</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          {canReadAllAudit(actor)
            ? "Every attributable action across the organization."
            : "Your own actions."}{" "}
          {all.length} event{all.length === 1 ? "" : "s"}.
        </p>
      </header>

      <div className="mt-5">
        <Banner title="This log is append-only and is writable by no one." tone="info">
          Every event is written in the same transaction as the action it records.
          If the audit write fails, the action fails — there is no unaudited path.
          Nothing here can be edited or deleted, including by an administrator.
        </Banner>
      </div>

      {actions.length > 0 ? (
        <nav aria-label="Filter by action" className="mt-6">
          <ul className="flex flex-wrap gap-1.5">
            <li>
              <a
                href="/org/audit"
                className={`inline-block rounded-lg border px-3 py-1.5 text-xs font-medium ${FOCUS_RING} ${
                  !filter
                    ? "border-primary bg-primary text-white"
                    : "border-line bg-surface text-ink-muted hover:border-primary-line hover:text-primary"
                }`}
              >
                All
              </a>
            </li>
            {actions.map((a) => (
              <li key={a}>
                <a
                  href={`/org/audit?action=${encodeURIComponent(a)}`}
                  className={`inline-block rounded-lg border px-3 py-1.5 font-mono text-xs ${FOCUS_RING} ${
                    filter === a
                      ? "border-primary bg-primary text-white"
                      : "border-line bg-surface text-ink-muted hover:border-primary-line hover:text-primary"
                  }`}
                >
                  {a}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="mt-6">
        {events.length === 0 ? (
          <Empty>No events recorded.</Empty>
        ) : (
          <Card>
            <CardHeader
              title="Events"
              hint="Newest first. Actor, role, scope, action, target, before, after, reason, idempotency key, request id, and timestamp."
            />
            <ul className="divide-y divide-line">
              {events.slice(0, 120).map((e) => {
                const who = d.users.find((u) => u.id === e.actorUserId);
                return (
                  <li key={e.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-mono text-sm font-semibold text-ink">{e.action}</p>
                      <p className="text-xs text-ink-muted">{formatDateTime(e.recordedAt)}</p>
                    </div>
                    <p className="mt-1 text-sm text-ink">
                      {who ? `${who.firstName} ${who.lastName}` : e.actorUserId}{" "}
                      <span className="text-ink-muted">
                        ({e.actorRole.replace(/_/g, " ")}, {e.scope})
                      </span>{" "}
                      &rarr; <span className="font-mono text-xs">{e.targetEntity}</span>{" "}
                      <span className="font-mono text-xs text-ink-muted">{e.targetId}</span>
                    </p>
                    <p className="mt-1.5 text-sm text-ink-muted">
                      <span className="font-semibold text-ink">Reason: </span>
                      {e.reason}
                    </p>
                    {e.before || e.after ? (
                      <ScrollX>
                        <div className="mt-2 flex min-w-[28rem] gap-4 text-xs">
                          <div className="flex-1">
                            <p className="font-semibold uppercase tracking-wide text-ink-muted">
                              Before
                            </p>
                            <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-surface-sunken p-2 font-mono text-[11px] text-ink">
                              {e.before ?? "—"}
                            </pre>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold uppercase tracking-wide text-ink-muted">
                              After
                            </p>
                            <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-surface-sunken p-2 font-mono text-[11px] text-ink">
                              {e.after ?? "—"}
                            </pre>
                          </div>
                        </div>
                      </ScrollX>
                    ) : null}
                    <p className="mt-2 font-mono text-[11px] text-ink-muted">
                      idempotency {e.idempotencyKey} &middot; request {e.requestId}
                    </p>
                  </li>
                );
              })}
            </ul>
            {events.length > 120 ? (
              <p className="border-t border-line px-5 py-3 text-xs text-ink-muted">
                Showing the 120 most recent of {events.length}. Nothing is dropped
                from the record — this list is truncated for reading only.
              </p>
            ) : null}
          </Card>
        )}
      </div>
    </div>
  );
}
