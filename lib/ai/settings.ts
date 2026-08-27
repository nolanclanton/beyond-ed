/**
 * Which capabilities an organization has turned on (vision §7, §20).
 *
 * ---------------------------------------------------------------------------
 * The registry says what can exist. This says what is allowed here.
 * ---------------------------------------------------------------------------
 *
 * Two separate questions, deliberately kept apart:
 *
 *   - **Does this capability exist at all?** `lib/ai/capabilities.ts`, decided in
 *     source, changed by a deploy and a code review. Nothing at runtime adds an
 *     entry, which is what makes the prohibited list structurally unavailable
 *     rather than one database row away from working.
 *   - **Has this organization turned it on?** Here, decided by a curriculum
 *     administrator, changed by a form and an audit event.
 *
 * `setCapabilityEnabled` refuses any name that is not already a registry key, so
 * a row for `publish_lesson` cannot be written by any route — not by a hand-made
 * request, not by a direct insert that gets past the policy, not by a bug. The
 * write path validates against the same literal object the gateway checks
 * against, so the two cannot disagree about what exists.
 *
 * Absence is meaningful. No row means "whatever the registry defaults to", which
 * is how a newly shipped capability arrives switched on without anybody having
 * to go and enable it, and how an organization that has never opened the page
 * behaves sensibly rather than having everything off.
 */
import { recordAudit, requestIdFor } from "@/lib/audit/log";
import { assertCanAdministerCurriculum, NotAuthorizedError } from "@/lib/auth/scope";
import { nextTimestamp } from "@/lib/clock";
import { db, nextId, transact, withIdempotency } from "@/lib/db/store";
import type { AiCapabilitySetting, User } from "@/lib/db/types";

import {
  AI_CAPABILITIES,
  isCapabilityName,
  type AiCapabilityName,
} from "./capabilities";

export class CapabilitySettingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CapabilitySettingError";
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

function settingFor(
  orgId: string,
  capability: AiCapabilityName,
): AiCapabilitySetting | undefined {
  return db().aiCapabilitySettings.find(
    (s) => s.orgId === orgId && s.capability === capability,
  );
}

/**
 * Whether one capability is available to one organization.
 *
 * The registry default unless this organization has decided otherwise. This is
 * the ONLY function that answers the question — the gateway calls it, the
 * assistance panels call it, and the administrator's page calls it, so a control
 * cannot be offered for something the server would refuse.
 *
 * Note what it does not do: it never consults the feature flags. Whether Gemini
 * is configured at all, and whether visual generation is on, are deployment
 * facts rather than organization decisions, and mixing them here would make an
 * administrator's switch look responsible for something it does not control.
 * The gateway checks both, in that order, and says which one refused.
 */
export function capabilityEnabledFor(
  orgId: string,
  capability: AiCapabilityName,
): boolean {
  return settingFor(orgId, capability)?.enabled ?? AI_CAPABILITIES[capability].enabled;
}

export type CapabilityDecision = {
  capability: AiCapabilityName;
  enabled: boolean;
  /** True when somebody decided this, rather than it being the shipped default. */
  decided: boolean;
  reason: string;
  changedAt: string | null;
  changedByName: string | null;
};

/** Every capability and where its current answer came from. */
export function capabilityDecisions(orgId: string): CapabilityDecision[] {
  const d = db();
  return (Object.keys(AI_CAPABILITIES) as AiCapabilityName[]).map((capability) => {
    const setting = settingFor(orgId, capability);
    const user = setting
      ? d.users.find((u) => u.id === setting.changedByUserId)
      : undefined;
    return {
      capability,
      enabled: setting?.enabled ?? AI_CAPABILITIES[capability].enabled,
      decided: setting !== undefined,
      reason: setting?.reason ?? "",
      changedAt: setting?.changedAt ?? null,
      changedByName: user ? `${user.firstName} ${user.lastName}` : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * Turn one capability on or off for one organization.
 *
 * A curriculum administrator only, and audited like every other consequential
 * change. Turning something OFF takes effect on the next request: a proposal
 * already on somebody's screen is unaffected, because a proposal is not
 * curriculum and accepting one goes through the ordinary authoring path, which
 * this switch has nothing to do with.
 */
export function setCapabilityEnabled(
  actor: User,
  input: { capability: string; enabled: boolean; reason: string },
  idempotencyKey: string,
): AiCapabilitySetting {
  assertCanAdministerCurriculum(actor);

  // The gate that keeps the prohibited list prohibited. A name that is not
  // already a registry key cannot be written here, so no row can bring one into
  // existence.
  if (!isCapabilityName(input.capability)) {
    throw new CapabilitySettingError(
      "That is not a design-assistance capability. Capabilities are defined in code and reviewed; this page turns the existing ones on and off.",
    );
  }
  const capability: AiCapabilityName = input.capability;

  const reason = input.reason.trim();
  if (reason.length < 4) {
    throw new CapabilitySettingError(
      "Say why. Turning a capability off changes what every author in the organization can do.",
    );
  }

  return withIdempotency(
    idempotencyKey,
    () =>
      transact(() => {
        const d = db();
        const existing = settingFor(actor.orgId, capability);
        const before = existing?.enabled ?? AI_CAPABILITIES[capability].enabled;

        const setting: AiCapabilitySetting = existing ?? {
          id: nextId("acs"),
          orgId: actor.orgId,
          capability,
          enabled: input.enabled,
          reason,
          changedAt: nextTimestamp(),
          changedByUserId: actor.id,
        };
        setting.enabled = input.enabled;
        setting.reason = reason;
        setting.changedAt = nextTimestamp();
        setting.changedByUserId = actor.id;
        if (!existing) d.aiCapabilitySettings.push(setting);

        recordAudit({
          actor,
          action: input.enabled ? "ai.capability_enabled" : "ai.capability_disabled",
          targetEntity: "ai_capability",
          targetId: capability,
          before: { enabled: before },
          after: { enabled: setting.enabled },
          reason,
          idempotencyKey,
          requestId: requestIdFor("ai.capability", idempotencyKey),
        });
        return setting;
      }),
    (existingId) => {
      const setting = db().aiCapabilitySettings.find((s) => s.id === existingId);
      if (!setting) {
        throw new CapabilitySettingError("That change is no longer recorded.");
      }
      return setting;
    },
  );
}

/**
 * Return a capability to whatever the registry ships.
 *
 * Distinct from turning it on, and worth having: an organization that turned
 * something off two years ago and no longer remembers why should be able to stop
 * holding an opinion about it rather than pin it to today's default forever.
 */
export function clearCapabilityDecision(
  actor: User,
  input: { capability: string; reason: string },
  idempotencyKey: string,
): void {
  assertCanAdministerCurriculum(actor);
  if (!isCapabilityName(input.capability)) {
    throw new CapabilitySettingError("That is not a design-assistance capability.");
  }
  const reason = input.reason.trim();
  if (reason.length < 4) throw new CapabilitySettingError("Say why.");

  transact(() => {
    const d = db();
    const index = d.aiCapabilitySettings.findIndex(
      (s) => s.orgId === actor.orgId && s.capability === input.capability,
    );
    if (index === -1) {
      throw new CapabilitySettingError(
        "That capability is already at its shipped default.",
      );
    }
    const before = d.aiCapabilitySettings[index].enabled;
    d.aiCapabilitySettings.splice(index, 1);

    recordAudit({
      actor,
      action: "ai.capability_default",
      targetEntity: "ai_capability",
      targetId: input.capability,
      before: { enabled: before, decided: true },
      after: {
        enabled: AI_CAPABILITIES[input.capability as AiCapabilityName].enabled,
        decided: false,
      },
      reason,
      idempotencyKey,
      requestId: requestIdFor("ai.capability_default", idempotencyKey),
    });
  });
}

/** Raised as an authorization failure so the action layer reports it uniformly. */
export function assertMayConfigureCapabilities(actor: User): void {
  try {
    assertCanAdministerCurriculum(actor);
  } catch {
    throw new NotAuthorizedError(
      "managing design-assistance capabilities is a curriculum administrator action",
    );
  }
}
