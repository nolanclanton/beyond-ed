"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { grantableRoles } from "@/lib/provisioning/directory";
import { createClient } from "@/lib/supabase/server";
import { failure, type ActionResult } from "./result";

/**
 * The district administrator's account actions.
 *
 * This is the ONLY way a Beyond.Ed account comes into existence. There is no
 * self sign-up anywhere in the product, and the database enforces that
 * independently: `handle_new_auth_user` refuses any sign-up whose address has
 * no pending invitation, and any whose setup code does not match it
 * (migrations 0012 and 0019).
 *
 * Each action validates with Zod, then calls one of the three Postgres
 * functions from migration 0014. The function is where the work actually
 * happens, because that is where the record, its audit event, and its
 * idempotency key can be written in a single transaction. Nothing here
 * re-implements an authorization check: the functions are SECURITY INVOKER, so
 * the caller's own policies apply, and an administrator reaching outside their
 * scope is refused by the database rather than by this file.
 */
const Key = z.string().min(8).max(200);
const Reason = z.string().trim().min(4, "A recorded reason is required.").max(500);

const ROLES = [
  "student",
  "teacher",
  "site_admin",
  "org_admin",
  "curriculum_author",
] as const;

const Issue = z.object({
  // Deliberately permissive beyond the obvious shape. Districts use their own
  // domains as well as consumer addresses, and this is a roster entry rather
  // than a deliverability check — the setup code, not the domain, is what
  // proves the account reached the right person.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(254)
    .refine((v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Enter a valid email address."),
  firstName: z.string().trim().min(1, "A first name is required.").max(80),
  lastName: z.string().trim().min(1, "A last name is required.").max(80),
  role: z.enum(ROLES),
  siteId: z.string().uuid().nullable(),
  gradeLevel: z.coerce.number().int().min(6).max(12).nullable(),
  curriculumAuthor: z.boolean(),
  reason: Reason,
  idempotencyKey: Key,
});

export async function issueInvitationAction(
  formData: FormData,
): Promise<ActionResult<{ invitationId: string; email: string; claimCode: string }>> {
  try {
    const actor = await requireUser();

    const rawSite = formData.get("siteId");
    const rawGrade = formData.get("gradeLevel");
    const input = Issue.parse({
      email: formData.get("email"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      role: formData.get("role"),
      siteId: typeof rawSite === "string" && rawSite.length > 0 ? rawSite : null,
      gradeLevel:
        typeof rawGrade === "string" && rawGrade.length > 0 ? rawGrade : null,
      curriculumAuthor: formData.get("curriculumAuthor") === "on",
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    // Refuse a role this actor cannot grant before spending a round trip. The
    // policy would refuse it too; this produces the better sentence.
    if (!grantableRoles(actor).includes(input.role)) {
      return failure(
        "You cannot provision that role.",
        "Nothing was changed.",
        "A site administrator provisions students and teachers at their own school. Ask an organization administrator for anything else.",
      );
    }

    // Shape rules the table's own constraints also enforce, checked here so the
    // person filling the form gets a sentence rather than a constraint name.
    const needsSite = !["org_admin", "curriculum_author"].includes(input.role);
    if (needsSite && !input.siteId) {
      return failure(
        "Choose a school for this account.",
        "Nothing was changed.",
        "Students, teachers, and site administrators each belong to one school.",
      );
    }
    if (!needsSite && input.siteId) {
      return failure(
        "That role is organization-wide and cannot be tied to one school.",
        "Nothing was changed.",
        "Leave the school unset for an organization administrator or curriculum author.",
      );
    }
    if (input.role === "student" && input.gradeLevel === null) {
      return failure(
        "Choose a grade for this student.",
        "Nothing was changed.",
        "Beyond.Ed covers grades 6 to 12.",
      );
    }
    if (input.role !== "student" && input.gradeLevel !== null) {
      return failure(
        "Only a student account carries a grade.",
        "Nothing was changed.",
        "Clear the grade and try again.",
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("issue_invitation", {
      p_email: input.email,
      p_role: input.role,
      p_first_name: input.firstName,
      p_last_name: input.lastName,
      p_site_id: input.siteId,
      p_grade_level: input.gradeLevel,
      p_curriculum_author: input.curriculumAuthor,
      p_reason: input.reason,
      p_idempotency_key: input.idempotencyKey,
    });

    if (error) return provisioningFailure(error.message);

    const invitationId = String(data);

    // Read the generated setup code back. It is the one thing the
    // administrator has to carry out of this form and hand to the person, so
    // the success message shows it rather than making them hunt for the row.
    // `invitations_select_*` admits this read only because they may already see
    // the invitation they just created.
    const { data: issued } = await supabase
      .from("account_invitations")
      .select("claim_code")
      .eq("id", invitationId)
      .maybeSingle<{ claim_code: string }>();

    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `${input.firstName} ${input.lastName} can now set up their account with ${input.email}.`,
      invitationId,
      email: input.email,
      claimCode: issued?.claim_code ?? "",
    };
  } catch (error) {
    return zodFailure(error);
  }
}

const Revoke = z.object({
  invitationId: z.string().uuid(),
  reason: Reason,
  idempotencyKey: Key,
});

export async function revokeInvitationAction(
  formData: FormData,
): Promise<ActionResult<{ invitationId: string }>> {
  try {
    await requireUser();
    const input = Revoke.parse({
      invitationId: formData.get("invitationId"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("revoke_invitation", {
      p_invitation_id: input.invitationId,
      p_reason: input.reason,
      p_idempotency_key: input.idempotencyKey,
    });

    if (error) return provisioningFailure(error.message);

    revalidatePath("/", "layout");
    return {
      ok: true,
      message:
        "Invitation revoked. That address can no longer create a Beyond.Ed account.",
      invitationId: String(data),
    };
  } catch (error) {
    return zodFailure(error);
  }
}

const SetActive = z.object({
  userId: z.string().uuid(),
  active: z.boolean(),
  reason: Reason,
  idempotencyKey: Key,
});

/**
 * Withdrawing or restoring an account that has already been claimed.
 *
 * Withdrawing is not a delete and never will be. The profile stays, every
 * record attached to it stays readable, and the scope helpers simply stop
 * resolving a role for that person — so the database denies them everything
 * from the next request onward.
 */
export async function setProfileActiveAction(
  formData: FormData,
): Promise<ActionResult<{ userId: string }>> {
  try {
    await requireUser();
    const input = SetActive.parse({
      userId: formData.get("userId"),
      active: formData.get("active") === "true",
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("set_profile_active", {
      p_user_id: input.userId,
      p_active: input.active,
      p_reason: input.reason,
      p_idempotency_key: input.idempotencyKey,
    });

    if (error) return provisioningFailure(error.message);

    revalidatePath("/", "layout");
    return {
      ok: true,
      message: input.active
        ? "Access restored. They can sign in again with the same email address and password."
        : "Access withdrawn. Their records are retained and nothing was deleted.",
      userId: String(data),
    };
  } catch (error) {
    return zodFailure(error);
  }
}

/**
 * Turns a Postgres error into something a person can act on.
 *
 * The two that actually happen in normal use are a duplicate address and a
 * policy refusal, and both have a specific, non-alarming explanation. Anything
 * else is reported without the raw message: a database error string can name
 * columns, constraints, and other people's data.
 */
function provisioningFailure(message: string) {
  if (
    message.includes("account_invitations_one_pending_per_email") ||
    message.includes("account_invitations_one_claim_per_email")
  ) {
    return failure(
      "That address already has a Beyond.Ed account or a pending invitation.",
      "Nothing was changed.",
      "Check the list below — if the invitation is wrong, revoke it and issue a new one.",
    );
  }
  if (
    message.includes("row-level security") ||
    message.includes("insufficient_privilege") ||
    message.includes("Not authorized")
  ) {
    return failure(
      "That is outside your scope.",
      "Nothing was changed.",
      "A site administrator provisions students and teachers at their own school. Ask an organization administrator for anything else.",
    );
  }
  if (message.includes("Illegal invitation transition")) {
    return failure(
      "That invitation has already been claimed or revoked.",
      "Nothing was changed.",
      "Reload the page to see its current state. To withdraw access from someone who has already signed in, deactivate their profile instead.",
    );
  }
  return failure(
    "That could not be saved.",
    "Nothing was changed — the whole change was rolled back together.",
    "Reload the page and try again. If it keeps failing, note what you were doing and tell your administrator.",
  );
}

function zodFailure(error: unknown) {
  if (error instanceof z.ZodError) {
    return failure(
      error.issues[0]?.message ?? "Check the details and try again.",
      "Nothing was changed.",
      "Correct the highlighted field and submit again.",
    );
  }
  if (error instanceof Error && error.message.includes("not signed in")) {
    return failure(
      "Your session has ended.",
      "Nothing was changed.",
      "Sign in again to continue.",
    );
  }
  return failure(
    "That could not be saved.",
    "Nothing was changed.",
    "Reload the page and try again.",
  );
}
