import { switchRoleAction } from "@/lib/actions/session";
import { ROLE_PRESENTATION } from "@/lib/auth/roles";
import type { Role } from "@/lib/db/types";

import { FOCUS_RING } from "./tokens";

/**
 * Changing which role you are acting as.
 *
 * Rendered only for someone who genuinely holds more than one, so nobody sees a
 * control with a single option in it. It is a plain form per role rather than a
 * select-and-submit, because each choice is one action and one audit event, and
 * a control that navigates should say where it goes.
 *
 * The list here is what the DATABASE said this person holds — `my_roles()`,
 * which takes no argument and can only answer about the caller. It is not a
 * permission check: `switch_active_role` refuses anything ungranted, and
 * `current_role_name()` ignores an ungranted active role regardless. This just
 * avoids offering a control that would be refused (CLAUDE.md §12).
 */
export function RoleSwitcher({
  heldRoles,
  active,
}: {
  heldRoles: Role[];
  active: Role;
}) {
  if (heldRoles.length < 2) return null;

  const order: Role[] = [
    "student",
    "teacher",
    "site_admin",
    "org_admin",
    "curriculum_author",
  ];
  const roles = order.filter((r) => heldRoles.includes(r));

  return (
    <details className="group relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-white/30 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/10 ${FOCUS_RING}`}
      >
        Acting as {ROLE_PRESENTATION[active].label}
        <Chevron />
      </summary>

      <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-line bg-surface p-2 shadow-[0_16px_36px_-18px_rgba(12,58,71,0.45)]">
        <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
          Switch role
        </p>
        <ul className="flex flex-col">
          {roles.map((role) => {
            const isActive = role === active;
            return (
              <li key={role}>
                <form action={switchRoleAction}>
                  <input type="hidden" name="role" value={role} />
                  <button
                    type="submit"
                    disabled={isActive}
                    aria-current={isActive ? "true" : undefined}
                    className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors disabled:cursor-default ${
                      isActive ? "bg-primary-surface" : "hover:bg-surface-sunken"
                    } ${FOCUS_RING}`}
                  >
                    <span className="block text-sm font-semibold text-ink">
                      {ROLE_PRESENTATION[role].label}
                      {isActive ? (
                        <span className="ml-1.5 text-xs font-normal text-primary">
                          currently active
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      Scope: {ROLE_PRESENTATION[role].scope}
                    </span>
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-line px-2.5 pb-1 pt-2 text-xs leading-relaxed text-ink-muted">
          You act as one role at a time, and every switch is recorded. Scope
          follows the role you are in &mdash; nothing is combined.
        </p>
      </div>
    </details>
  );
}

/** Disclosure marker. Decorative — the summary text carries the meaning. */
function Chevron() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="transition-transform duration-200 group-open:rotate-180"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
