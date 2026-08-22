"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import {
  approveVersion,
  publishVersion,
  retireVersion,
  submitForReview,
} from "@/lib/curriculum/authoring";
import { toFailure, type ActionResult } from "./result";

const Move = z.object({
  versionId: z.string().min(1),
  reason: z.string().trim().min(4, "A recorded reason is required.").max(500),
  idempotencyKey: z.string().min(8).max(200),
});

async function run(
  formData: FormData,
  fn: (
    actor: Awaited<ReturnType<typeof requireUser>>,
    versionId: string,
    reason: string,
    key: string,
  ) => { status: string; version: string; courseTitle: string },
  verb: string,
): Promise<ActionResult<{ status: string }>> {
  try {
    const actor = await requireUser();
    const input = Move.parse({
      versionId: formData.get("versionId"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const version = fn(actor, input.versionId, input.reason, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `${version.courseTitle} ${version.version} ${verb}. Running roster sections keep the version they were created with.`,
      status: version.status,
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function submitForReviewAction(formData: FormData) {
  return run(formData, submitForReview, "submitted for review");
}

export async function approveVersionAction(formData: FormData) {
  return run(formData, approveVersion, "approved");
}

export async function publishVersionAction(formData: FormData) {
  return run(formData, publishVersion, "published");
}

export async function retireVersionAction(formData: FormData) {
  return run(formData, retireVersion, "retired");
}
