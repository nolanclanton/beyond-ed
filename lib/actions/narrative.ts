"use server";

/**
 * The Narrative Studio's write endpoints.
 *
 * Every one validates with Zod, runs a single transactional domain call that
 * writes its own audit event, and returns a durable result state (CLAUDE.md §1,
 * §6, §12). Nothing here decides anything: the authorization, the draft-only
 * rule, the ownership rule, and the separation between authoring and reviewing
 * all live in `lib/narrative`, so a request that skips these forms still meets
 * them.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import {
  ASSET_ASPECT_RATIOS,
  NARRATIVE_STATUSES,
  PLOT_THREAD_KINDS,
  STORY_ARC_STAGES,
} from "@/lib/db/types";
import {
  advanceNarrative,
  checkpointNarrative,
  createNarrative,
  duplicateNarrative,
  moveChapter,
  removeArcMoment,
  removeBeat,
  removeChapter,
  removeCharacter,
  removeLocation,
  removePlotThread,
  resolvePlotThread,
  saveArcMoment,
  saveBeat,
  saveCentralProblem,
  saveChapter,
  saveCharacter,
  saveContentBoundaries,
  saveLocation,
  saveNarrativeIdentity,
  saveNarrativeState,
  saveNarrativeWorld,
  savePlotThread,
  saveVisualBible,
  setOfficialTemplate,
  shareNarrative,
} from "@/lib/narrative/studio";

import { toFailure, type ActionResult } from "./result";

const KEY = z.string().min(8).max(200);
const ID = z.string().min(1).max(64);
const REASON = z.string().trim().min(4, "A recorded reason is required.").max(500);

/** Textareas carry one entry per line. Blank lines are dropped, not stored. */
function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

/** An empty select value means "not set", which is a real answer here. */
function nullable(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value.length > 0 ? value : null;
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

const Identity = z.object({
  title: z.string().trim().min(1, "A narrative needs a title.").max(200),
  premise: z.string().max(1000),
  subject: z.string().max(120),
  courseId: z.string().max(40).nullable(),
  unitIds: z.array(z.string().max(40)).max(20),
  genre: z.string().max(80),
  tone: z.string().max(120),
  gradeBand: z.string().max(40),
  audience: z.string().max(200),
  keywords: z.array(z.string().max(60)).max(20),
  reason: REASON,
  idempotencyKey: KEY,
});

function identityFrom(formData: FormData) {
  return {
    title: text(formData, "title"),
    premise: text(formData, "premise"),
    subject: text(formData, "subject"),
    courseId: nullable(formData, "courseId"),
    unitIds: lines(formData.get("unitIds")),
    genre: text(formData, "genre"),
    tone: text(formData, "tone"),
    gradeBand: text(formData, "gradeBand"),
    audience: text(formData, "audience"),
    keywords: String(formData.get("keywords") ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    reason: formData.get("reason"),
    idempotencyKey: formData.get("idempotencyKey"),
  };
}

export async function createNarrativeAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = Identity.parse(identityFrom(formData));
    const narrative = createNarrative(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `"${narrative.title}" was created as a draft. Only you can see it until you share it or take it through review.`,
      narrativeId: narrative.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function saveNarrativeIdentityAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = Identity.extend({ narrativeId: ID }).parse({
      ...identityFrom(formData),
      narrativeId: formData.get("narrativeId"),
    });
    const narrative = saveNarrativeIdentity(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Identity saved.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// World and central problem
// ---------------------------------------------------------------------------

const World = z.object({
  narrativeId: ID,
  place: z.string().max(300),
  period: z.string().max(300),
  technologyLevel: z.string().max(300),
  worldRules: z.array(z.string().max(400)).max(20),
  constraints: z.array(z.string().max(400)).max(20),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function saveNarrativeWorldAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = World.parse({
      narrativeId: formData.get("narrativeId"),
      place: text(formData, "place"),
      period: text(formData, "period"),
      technologyLevel: text(formData, "technologyLevel"),
      worldRules: lines(formData.get("worldRules")),
      constraints: lines(formData.get("constraints")),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const narrative = saveNarrativeWorld(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "World saved.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

const CentralProblem = z.object({
  narrativeId: ID,
  challenge: z.string().max(1000),
  stakes: z.string().max(1000),
  objective: z.string().max(1000),
  studentRole: z.string().max(1000),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function saveCentralProblemAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = CentralProblem.parse({
      narrativeId: formData.get("narrativeId"),
      challenge: text(formData, "challenge"),
      stakes: text(formData, "stakes"),
      objective: text(formData, "objective"),
      studentRole: text(formData, "studentRole"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const narrative = saveCentralProblem(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Central problem saved.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Characters and locations
// ---------------------------------------------------------------------------

const Character = z.object({
  narrativeId: ID,
  characterId: z.string().max(64).nullable(),
  name: z.string().trim().min(1, "A character needs a name.").max(120),
  role: z.string().max(200),
  personality: z.string().max(1000),
  motivation: z.string().max(1000),
  relationships: z.string().max(1000),
  appearance: z.string().max(1000),
  knows: z.string().max(1000),
  arc: z.string().max(1000),
  assetId: z.string().max(64).nullable(),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function saveCharacterAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = Character.parse({
      narrativeId: formData.get("narrativeId"),
      characterId: nullable(formData, "characterId"),
      name: text(formData, "name"),
      role: text(formData, "role"),
      personality: text(formData, "personality"),
      motivation: text(formData, "motivation"),
      relationships: text(formData, "relationships"),
      appearance: text(formData, "appearance"),
      knows: text(formData, "knows"),
      arc: text(formData, "arc"),
      assetId: nullable(formData, "assetId"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const narrative = saveCharacter(
      actor,
      {
        narrativeId: input.narrativeId,
        character: { ...input, id: input.characterId },
        reason: input.reason,
      },
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `${input.name} saved to the canon.`,
      narrativeId: narrative.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function removeCharacterAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        characterId: ID,
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        characterId: formData.get("characterId"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = removeCharacter(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Character removed.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

const Location = z.object({
  narrativeId: ID,
  locationId: z.string().max(64).nullable(),
  name: z.string().trim().min(1, "A location needs a name.").max(120),
  description: z.string().max(1000),
  significance: z.string().max(1000),
  visualReference: z.string().max(1000),
  reason: REASON,
  idempotencyKey: KEY,
});

export async function saveLocationAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = Location.parse({
      narrativeId: formData.get("narrativeId"),
      locationId: nullable(formData, "locationId"),
      name: text(formData, "name"),
      description: text(formData, "description"),
      significance: text(formData, "significance"),
      visualReference: text(formData, "visualReference"),
      reason: formData.get("reason"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const narrative = saveLocation(
      actor,
      {
        narrativeId: input.narrativeId,
        location: { ...input, id: input.locationId },
        reason: input.reason,
      },
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return { ok: true, message: `${input.name} saved.`, narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

export async function removeLocationAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({ narrativeId: ID, locationId: ID, reason: REASON, idempotencyKey: KEY })
      .parse({
        narrativeId: formData.get("narrativeId"),
        locationId: formData.get("locationId"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = removeLocation(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Location removed.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Story arc, chapters, beats
// ---------------------------------------------------------------------------

export async function saveArcMomentAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        momentId: z.string().max(64).nullable(),
        stage: z.enum(STORY_ARC_STAGES),
        summary: z.string().trim().min(1, "Say what happens.").max(1000),
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        momentId: nullable(formData, "momentId"),
        stage: formData.get("stage"),
        summary: text(formData, "summary"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = saveArcMoment(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Story moment saved.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

export async function removeArcMomentAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({ narrativeId: ID, momentId: ID, reason: REASON, idempotencyKey: KEY })
      .parse({
        narrativeId: formData.get("narrativeId"),
        momentId: formData.get("momentId"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = removeArcMoment(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Story moment removed.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

export async function saveChapterAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        chapterId: z.string().max(64).nullable(),
        title: z.string().trim().min(1, "A chapter needs a title.").max(200),
        summary: z.string().max(2000),
        unitId: z.string().max(40).nullable(),
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        chapterId: nullable(formData, "chapterId"),
        title: text(formData, "title"),
        summary: text(formData, "summary"),
        unitId: nullable(formData, "unitId"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = saveChapter(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: `Chapter "${input.title}" saved.`, narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

export async function removeChapterAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({ narrativeId: ID, chapterId: ID, reason: REASON, idempotencyKey: KEY })
      .parse({
        narrativeId: formData.get("narrativeId"),
        chapterId: formData.get("chapterId"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = removeChapter(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: "Chapter removed. Any thread that opened or resolved there is open again.",
      narrativeId: narrative.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function moveChapterAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        chapterId: ID,
        fromIndex: z.coerce.number().int().min(0).max(500),
        direction: z.enum(["up", "down"]),
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        chapterId: formData.get("chapterId"),
        fromIndex: formData.get("fromIndex"),
        direction: formData.get("direction"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = moveChapter(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Chapter moved.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

export async function saveBeatAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        chapterId: ID,
        beatId: z.string().max(64).nullable(),
        lessonCode: z.string().max(64).nullable(),
        academicObjective: z.string().max(1000),
        narrativeEvent: z.string().trim().min(1, "Say what happens.").max(4000),
        learningUnlock: z.string().max(1000),
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        chapterId: formData.get("chapterId"),
        beatId: nullable(formData, "beatId"),
        lessonCode: nullable(formData, "lessonCode"),
        academicObjective: text(formData, "academicObjective"),
        narrativeEvent: text(formData, "narrativeEvent"),
        learningUnlock: text(formData, "learningUnlock"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = saveBeat(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Beat saved.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

export async function removeBeatAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        chapterId: ID,
        beatId: ID,
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        chapterId: formData.get("chapterId"),
        beatId: formData.get("beatId"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = removeBeat(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Beat removed.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// State, threads, visuals, boundaries
// ---------------------------------------------------------------------------

export async function saveNarrativeStateAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        happened: z.array(z.string().max(500)).max(40),
        studentsKnow: z.array(z.string().max(500)).max(40),
        cluesRevealed: z.array(z.string().max(500)).max(40),
        currentObjective: z.string().max(1000),
        futureReveals: z.array(z.string().max(500)).max(40),
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        happened: lines(formData.get("happened")),
        studentsKnow: lines(formData.get("studentsKnow")),
        cluesRevealed: lines(formData.get("cluesRevealed")),
        currentObjective: text(formData, "currentObjective"),
        futureReveals: lines(formData.get("futureReveals")),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = saveNarrativeState(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Narrative state saved.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

export async function savePlotThreadAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        threadId: z.string().max(64).nullable(),
        kind: z.enum(PLOT_THREAD_KINDS),
        summary: z.string().trim().min(1, "Say what the thread is.").max(1000),
        openedInChapterId: z.string().max(64).nullable(),
        note: z.string().max(1000),
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        threadId: nullable(formData, "threadId"),
        kind: formData.get("kind"),
        summary: text(formData, "summary"),
        openedInChapterId: nullable(formData, "openedInChapterId"),
        note: text(formData, "note"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = savePlotThread(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Plot thread saved.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

export async function resolvePlotThreadAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        threadId: ID,
        resolved: z.enum(["true", "false"]).transform((v) => v === "true"),
        resolvedInChapterId: z.string().max(64).nullable(),
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        threadId: formData.get("threadId"),
        resolved: formData.get("resolved"),
        resolvedInChapterId: nullable(formData, "resolvedInChapterId"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = resolvePlotThread(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: input.resolved ? "Thread closed." : "Thread reopened.",
      narrativeId: narrative.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function removePlotThreadAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({ narrativeId: ID, threadId: ID, reason: REASON, idempotencyKey: KEY })
      .parse({
        narrativeId: formData.get("narrativeId"),
        threadId: formData.get("threadId"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = removePlotThread(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Thread removed.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

export async function saveVisualBibleAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        artDirection: z.string().max(2000),
        visualTone: z.string().max(1000),
        palette: z.string().max(1000),
        interfaceTreatment: z.string().max(1000),
        recurringProps: z.array(z.string().max(200)).max(30),
        motifs: z.array(z.string().max(200)).max(30),
        symbols: z.array(z.string().max(200)).max(30),
        defaultAspectRatio: z.enum(ASSET_ASPECT_RATIOS),
        textInImages: z.string().max(1000),
        accessibilityRules: z.array(z.string().max(400)).max(20),
        ageAppropriateness: z.string().max(1000),
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        artDirection: text(formData, "artDirection"),
        visualTone: text(formData, "visualTone"),
        palette: text(formData, "palette"),
        interfaceTreatment: text(formData, "interfaceTreatment"),
        recurringProps: lines(formData.get("recurringProps")),
        motifs: lines(formData.get("motifs")),
        symbols: lines(formData.get("symbols")),
        defaultAspectRatio: formData.get("defaultAspectRatio"),
        textInImages: text(formData, "textInImages"),
        accessibilityRules: lines(formData.get("accessibilityRules")),
        ageAppropriateness: text(formData, "ageAppropriateness"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = saveVisualBible(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Visual bible saved.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

export async function saveContentBoundariesAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        mustStayConsistent: z.array(z.string().max(400)).max(30),
        avoid: z.array(z.string().max(400)).max(30),
        requiredFraming: z.array(z.string().max(400)).max(30),
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        mustStayConsistent: lines(formData.get("mustStayConsistent")),
        avoid: lines(formData.get("avoid")),
        requiredFraming: lines(formData.get("requiredFraming")),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = saveContentBoundaries(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return { ok: true, message: "Content boundaries saved.", narrativeId: narrative.id };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Duplication, sharing, versions, lifecycle
// ---------------------------------------------------------------------------

export async function duplicateNarrativeAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const on = (name: string): boolean => formData.get(name) === "on";
    const input = z
      .object({
        sourceNarrativeId: ID,
        title: z.string().trim().min(1, "The copy needs a title.").max(200),
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        sourceNarrativeId: formData.get("sourceNarrativeId"),
        title: text(formData, "title"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });

    const copy = duplicateNarrative(
      actor,
      {
        ...input,
        parts: {
          characters: on("characters"),
          locations: on("locations"),
          visualBible: on("visualBible"),
          storyArc: on("storyArc"),
          chapters: on("chapters"),
          lessonBeats: on("lessonBeats"),
          plotThreads: on("plotThreads"),
          narrativeState: on("narrativeState"),
        },
      },
      input.idempotencyKey,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `"${copy.title}" is yours to edit. It is a separate narrative — editing it never changes the one it came from, and vice versa. Lesson placements were not copied, so place its beats on your own course's lessons.`,
      narrativeId: copy.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function shareNarrativeAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        userIds: z.array(z.string().max(64)).max(50),
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        userIds: formData.getAll("userIds").map((v) => String(v)),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = shareNarrative(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message:
        input.userIds.length === 0
          ? "Sharing removed. Only you can edit this now."
          : `Shared with ${input.userIds.length} ${input.userIds.length === 1 ? "colleague" : "colleagues"}.`,
      narrativeId: narrative.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function checkpointNarrativeAction(
  formData: FormData,
): Promise<ActionResult<{ versionId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        label: z.string().trim().min(1, "A saved version needs a label.").max(80),
        note: z.string().max(1000),
        aiAssisted: z.enum(["true", "false"]).transform((v) => v === "true"),
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        label: text(formData, "label"),
        note: text(formData, "note"),
        aiAssisted: formData.get("aiAssisted") ?? "false",
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const version = checkpointNarrative(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Saved as "${version.label}". You can read it again from the version history.`,
      versionId: version.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function advanceNarrativeAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        to: z.enum(NARRATIVE_STATUSES),
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        to: formData.get("to"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = advanceNarrative(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `"${narrative.title}" is now ${narrative.status.replace(/_/g, " ")}.`,
      narrativeId: narrative.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function setOfficialTemplateAction(
  formData: FormData,
): Promise<ActionResult<{ narrativeId: string }>> {
  try {
    const actor = await requireUser();
    const input = z
      .object({
        narrativeId: ID,
        official: z.enum(["true", "false"]).transform((v) => v === "true"),
        reason: REASON,
        idempotencyKey: KEY,
      })
      .parse({
        narrativeId: formData.get("narrativeId"),
        official: formData.get("official"),
        reason: formData.get("reason"),
        idempotencyKey: formData.get("idempotencyKey"),
      });
    const narrative = setOfficialTemplate(actor, input, input.idempotencyKey);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: narrative.official
        ? "Marked as an official template. It now appears as one in the Narrative Bank."
        : "No longer an official template.",
      narrativeId: narrative.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}
