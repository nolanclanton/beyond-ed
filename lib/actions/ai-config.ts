"use server";

/**
 * Turning a design-assistance capability on or off (vision §7, §20).
 *
 * A curriculum administrator's action, validated and audited like every other
 * consequential change. The authorization and the registry check both live in
 * `lib/ai/settings.ts`, so a request that skips this form still meets them.
 *
 * There is deliberately no action here for the prohibited list. Those are not
 * settings, and an endpoint that accepted their names — even to refuse them —
 * would be the first half of a way to enable them.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { clearCapabilityDecision, setCapabilityEnabled } from "@/lib/ai/settings";
import { requireUser } from "@/lib/auth/session";

import { toFailure, type ActionResult } from "./result";

const Toggle = z.object({
  capability: z.string().min(1).max(64),
  enabled: z.enum(["true", "false"]).transform((v) => v === "true"),
  reason: z.string().trim().min(4, "A recorded reason is required.").max(500),
  idempotencyKey: z.string().min(8).max(200),
});

export async function setCapabilityEnabledAction(
  formData: FormData,
): Promise<ActionResult<{ capability: string }>> {
  try {
    const actor = await requireUser();
    const input = Toggle.parse({
      capability: formData.get("capability"),
      enabled: formData.get("enabled"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    const setting = setCapabilityEnabled(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: setting.enabled
        ? `Turned on for your organization. Authors will see it on their next page load.`
        : `Turned off for your organization. Any proposal already on somebody's screen is unaffected — a proposal is not curriculum, and accepting one goes through the ordinary authoring path.`,
      capability: setting.capability,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const Clear = z.object({
  capability: z.string().min(1).max(64),
  reason: z.string().trim().min(4, "A recorded reason is required.").max(500),
  idempotencyKey: z.string().min(8).max(200),
});

export async function clearCapabilityDecisionAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireUser();
    const input = Clear.parse({
      capability: formData.get("capability"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    clearCapabilityDecision(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message:
        "Back to the shipped default. Your organization no longer holds an opinion about this one.",
    };
  } catch (error) {
    return toFailure(error);
  }
}
