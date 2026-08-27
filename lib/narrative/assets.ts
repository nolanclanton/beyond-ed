/**
 * The asset library (vision §6, §18).
 *
 * Artwork and documents belonging to a narrative or a lesson. Two rules make it
 * safe to point a generator at:
 *
 * **A candidate is not curriculum.** An image arrives as `candidate` and stays
 * there until a person accepts it. Nothing renders a candidate into a lesson,
 * and rejecting one keeps the record so the history says what was proposed and
 * what happened to it.
 *
 * **Alternative text is required to accept, never to propose.** A picture
 * without it is simply missing for part of the class (CLAUDE.md §12) — but
 * demanding it before the designer has even seen the candidate would be asking
 * them to describe an image that does not exist yet. So the gate is at
 * acceptance, which is the moment the image becomes something a student meets.
 */
import { recordAudit, requestIdFor } from "@/lib/audit/log";
import { assertCanAuthorCurriculum, NotAuthorizedError } from "@/lib/auth/scope";
import { nextTimestamp } from "@/lib/clock";
import { db, nextId, transact, withIdempotency } from "@/lib/db/store";
import type {
  AssetAspectRatio,
  AssetKind,
  AssetStatus,
  NarrativeAsset,
  User,
} from "@/lib/db/types";

import { canEditNarrative, NarrativeError, requireNarrative } from "./bible";

export const ASSET_KIND_PRESENTATION: Record<
  AssetKind,
  { label: string; meaning: string; defaultRatio: AssetAspectRatio }
> = {
  hero: {
    label: "Lesson hero image",
    meaning: "The picture at the top of a lesson. Sets the scene before a word is read.",
    defaultRatio: "16:9",
  },
  character: {
    label: "Character portrait",
    meaning: "Canonical likeness for someone in the story, reused wherever they appear.",
    defaultRatio: "1:1",
  },
  environment: {
    label: "Environment scene",
    meaning: "A location the story returns to.",
    defaultRatio: "16:9",
  },
  diagram: {
    label: "Explanatory diagram",
    meaning: "A picture that carries part of the teaching. Needs the most careful alternative text.",
    defaultRatio: "4:3",
  },
  map: {
    label: "Map",
    meaning: "Where things are in relation to each other.",
    defaultRatio: "3:2",
  },
  mission_brief: {
    label: "Mission briefing",
    meaning: "An in-world document that frames the task.",
    defaultRatio: "3:2",
  },
  case_file: {
    label: "Case file",
    meaning: "An in-world record the student examines.",
    defaultRatio: "3:2",
  },
  artifact: {
    label: "Historical-style artifact",
    meaning: "An object presented as evidence within the story.",
    defaultRatio: "4:3",
  },
  interface: {
    label: "Interface or control panel",
    meaning: "A screen the characters use. Never a real Beyond.Ed screen.",
    defaultRatio: "16:9",
  },
  infographic: {
    label: "Infographic",
    meaning: "Information arranged visually. Its text must also exist as text.",
    defaultRatio: "4:3",
  },
  chapter_cover: {
    label: "Chapter cover",
    meaning: "The image that opens a chapter of the story.",
    defaultRatio: "16:9",
  },
  background: {
    label: "Background",
    meaning: "A surface other content sits on. Carries no meaning of its own.",
    defaultRatio: "21:9",
  },
};

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function assetById(id: string): NarrativeAsset | undefined {
  return db().narrativeAssets.find((a) => a.id === id);
}

export function assetsForNarrative(
  narrativeId: string,
  status?: AssetStatus,
): NarrativeAsset[] {
  return db()
    .narrativeAssets.filter((a) => a.narrativeId === narrativeId)
    .filter((a) => status === undefined || a.status === status)
    .slice()
    .reverse();
}

export function assetsForLesson(lessonCode: string): NarrativeAsset[] {
  return db()
    .narrativeAssets.filter((a) => a.lessonCode === lessonCode && a.status === "accepted")
    .slice()
    .reverse();
}

/** Everything a person may see in their organization, newest first. */
export function libraryFor(actor: User, status?: AssetStatus): NarrativeAsset[] {
  return db()
    .narrativeAssets.filter((a) => a.orgId === actor.orgId)
    .filter((a) => status === undefined || a.status === status)
    .slice()
    .reverse();
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

function requireReason(reason: string): string {
  const trimmed = reason.trim();
  if (trimmed.length < 4) throw new NarrativeError("A recorded reason is required.");
  return trimmed;
}

/**
 * A narrative the actor may attach assets to, or nothing.
 *
 * An asset that belongs to no narrative belongs to the lesson it was made for,
 * and any curriculum author may add one of those. An asset that claims a
 * narrative has to pass the same edit check the narrative itself would.
 */
function assertAssetTarget(actor: User, narrativeId: string | null): void {
  if (!narrativeId) return;
  const narrative = requireNarrative(narrativeId);
  if (!canEditNarrative(actor, narrative)) {
    throw new NotAuthorizedError("that narrative has not been shared with you");
  }
}

/**
 * Where an asset's image may live.
 *
 * The same rule the rest of the product applies to media (`normalizeMediaUrl`
 * in `lib/curriculum/lesson-authoring.ts`): an address a designer supplies is
 * http or https, and nothing else. A generated image is a `data:` URI whose
 * type came from the allow-list in `lib/ai/client.ts`.
 *
 * This matters because the value ends up in an `<img src>`. Browsers do not
 * execute `javascript:` in an image source, so this is not the last line of
 * defence — it is the first, and it fails with a sentence a designer can act on
 * rather than a picture that silently never loads.
 */
function normalizeAssetUrl(raw: string, source: "url" | "generated"): string {
  const value = raw.trim();

  if (source === "generated") {
    if (!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value)) {
      throw new NarrativeError("That is not an image Beyond.Ed can store.");
    }
    return value;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new NarrativeError(
      "That is not a complete web address. Include https:// and the full path.",
    );
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new NarrativeError("An image address must be http or https.");
  }
  return parsed.toString();
}

export type AssetInput = {
  narrativeId: string | null;
  lessonCode: string | null;
  kind: AssetKind;
  title: string;
  brief: string;
  alt: string;
  aspectRatio: AssetAspectRatio;
  source: "url" | "generated";
  url: string;
  generationId: string | null;
  /** Generated images arrive as candidates. A designer-supplied URL is chosen. */
  status: AssetStatus;
  reason: string;
};

export function addAsset(
  actor: User,
  input: AssetInput,
  idempotencyKey: string,
): NarrativeAsset {
  assertCanAuthorCurriculum(actor);
  const reason = requireReason(input.reason);
  if (input.title.trim().length === 0) {
    throw new NarrativeError("An asset needs a title so it can be found again.");
  }
  if (input.url.trim().length === 0) {
    throw new NarrativeError("An asset needs an image.");
  }
  if (input.status === "accepted" && input.alt.trim().length === 0) {
    throw new NarrativeError(
      "Alternative text is required before an image becomes part of a lesson. Without it the image is simply missing for part of the class.",
    );
  }

  return withIdempotency(
    idempotencyKey,
    () =>
      transact(() => {
        assertAssetTarget(actor, input.narrativeId);
        const asset: NarrativeAsset = {
          id: nextId("ast"),
          orgId: actor.orgId,
          narrativeId: input.narrativeId,
          lessonCode: input.lessonCode,
          kind: input.kind,
          title: input.title.trim(),
          brief: input.brief.trim(),
          alt: input.alt.trim(),
          aspectRatio: input.aspectRatio,
          source: input.source,
          url: normalizeAssetUrl(input.url, input.source),
          generationId: input.generationId,
          status: input.status,
          usageCount: 0,
          addedAt: nextTimestamp(),
          addedByUserId: actor.id,
        };
        db().narrativeAssets.push(asset);

        recordAudit({
          actor,
          action: input.status === "candidate" ? "asset.propose" : "asset.add",
          targetEntity: "narrative_asset",
          targetId: asset.id,
          before: null,
          after: {
            title: asset.title,
            kind: asset.kind,
            status: asset.status,
            source: asset.source,
            generationId: asset.generationId,
          },
          reason,
          idempotencyKey,
          requestId: requestIdFor("asset.add", idempotencyKey),
        });
        return asset;
      }),
    (existingId) => {
      const asset = assetById(existingId);
      if (!asset) throw new NarrativeError("That asset no longer exists.");
      return asset;
    },
  );
}

/**
 * Accepting or rejecting a candidate.
 *
 * This is the only way a generated image becomes part of curriculum, and it is
 * a person's action with a reason on it. Accepting takes the alternative text
 * the designer wrote, not anything the generator returned: describing the
 * picture is the designer's job, because they are the one who can tell whether
 * the description is true.
 */
export function decideAsset(
  actor: User,
  input: {
    assetId: string;
    decision: "accepted" | "rejected";
    alt: string;
    reason: string;
  },
  idempotencyKey: string,
): NarrativeAsset {
  assertCanAuthorCurriculum(actor);
  const reason = requireReason(input.reason);

  return withIdempotency(
    idempotencyKey,
    () =>
      transact(() => {
        const asset = assetById(input.assetId);
        if (!asset) throw new NarrativeError("That asset does not exist.");
        if (asset.orgId !== actor.orgId) {
          throw new NotAuthorizedError("that asset is outside your organization");
        }
        assertAssetTarget(actor, asset.narrativeId);
        if (asset.status !== "candidate") {
          throw new NarrativeError(
            "That candidate has already been decided. Its record stays as it is.",
          );
        }
        if (input.decision === "accepted" && input.alt.trim().length === 0) {
          throw new NarrativeError(
            "Write the alternative text before accepting. It is what makes the image reachable by the whole class.",
          );
        }

        const before = { status: asset.status, alt: asset.alt };
        asset.status = input.decision;
        if (input.decision === "accepted") asset.alt = input.alt.trim();

        recordAudit({
          actor,
          action: `asset.${input.decision}`,
          targetEntity: "narrative_asset",
          targetId: asset.id,
          before,
          after: { status: asset.status, alt: asset.alt },
          reason,
          idempotencyKey,
          requestId: requestIdFor(`asset.${input.decision}`, idempotencyKey),
        });
        return asset;
      }),
    (existingId) => {
      const asset = assetById(existingId);
      if (!asset) throw new NarrativeError("That asset no longer exists.");
      return asset;
    },
  );
}

/**
 * Records that an accepted asset was placed somewhere.
 *
 * Counted on the write that places it, never inferred from a page view — a
 * usage count derived from reads would drift the moment two people opened the
 * same lesson (CLAUDE.md §1).
 */
export function noteAssetPlaced(assetId: string): void {
  const asset = assetById(assetId);
  if (asset) asset.usageCount += 1;
}
