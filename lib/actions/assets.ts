"use server";

/**
 * The asset library's write endpoints (vision §18).
 *
 * Two operations, and the split between them is the product: adding artwork you
 * already have is one act, and deciding a candidate's fate is another. Both are
 * validated, transactional, and audited like every other consequential write.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { ASSET_ASPECT_RATIOS, ASSET_KINDS } from "@/lib/db/types";
import { addAsset, decideAsset } from "@/lib/narrative/assets";

import { toFailure, type ActionResult } from "./result";

const KEY = z.string().min(8).max(200);
const REASON = z.string().trim().min(4, "A recorded reason is required.").max(500);

function nullable(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value.length > 0 ? value : null;
}

const Add = z.object({
  narrativeId: z.string().max(64).nullable(),
  lessonCode: z.string().max(64).nullable(),
  kind: z.enum(ASSET_KINDS),
  title: z.string().trim().min(1, "An asset needs a title.").max(200),
  brief: z.string().max(2000),
  alt: z
    .string()
    .trim()
    .min(1, "Alternative text is required. Without it the image is missing for part of the class.")
    .max(1000),
  aspectRatio: z.enum(ASSET_ASPECT_RATIOS),
  url: z.string().trim().min(1, "An asset needs an address.").max(2000),
  reason: REASON,
  idempotencyKey: KEY,
});

/**
 * Adds artwork the designer already has.
 *
 * It is accepted on arrival rather than entering the candidate queue: a person
 * who chose this image has already decided about it, and asking them to approve
 * their own upload would be a step that decides nothing. That is exactly why the
 * alternative text is required here and not deferred.
 */
export async function addAssetAction(
  formData: FormData,
): Promise<ActionResult<{ assetId: string }>> {
  try {
    const actor = await requireUser();
    const input = Add.parse({
      narrativeId: nullable(formData, "narrativeId"),
      lessonCode: nullable(formData, "lessonCode"),
      kind: formData.get("kind"),
      title: formData.get("title"),
      brief: String(formData.get("brief") ?? ""),
      alt: formData.get("alt"),
      aspectRatio: formData.get("aspectRatio"),
      url: formData.get("url"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    const asset = addAsset(
      actor,
      { ...input, source: "url", generationId: null, status: "accepted" },
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `"${asset.title}" was added to the library. Place it in a lesson from the studio when you want a student to see it.`,
      assetId: asset.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

const Decide = z.object({
  assetId: z.string().min(1).max(64),
  decision: z.enum(["accepted", "rejected"]),
  alt: z.string().max(1000),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function decideAssetAction(
  formData: FormData,
): Promise<ActionResult<{ assetId: string }>> {
  try {
    const actor = await requireUser();
    const input = Decide.parse({
      assetId: formData.get("assetId"),
      decision: formData.get("decision"),
      alt: String(formData.get("alt") ?? ""),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    const asset = decideAsset(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message:
        input.decision === "accepted"
          ? `"${asset.title}" was accepted into the library.`
          : `"${asset.title}" was turned down. Its record stays, so the history says what was proposed.`,
      assetId: asset.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}
