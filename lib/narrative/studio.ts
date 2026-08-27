/**
 * Building a narrative (vision §4, §17; CLAUDE.md §6, §9).
 *
 * The write side of the Narrative Studio. Four rules shape every function here,
 * and they are the same four that shape lesson authoring — deliberately, so
 * there is one set of habits to learn rather than two.
 *
 * **Only a draft is editable.** A narrative in review must read the same on the
 * reviewer's screen as it did when it was sent, and a narrative other people
 * have duplicated must not change out from under the provenance those copies
 * state. Enforced in `editNarrative`, which every write goes through.
 *
 * **A duplicate shares nothing with its source.** `duplicateNarrative` deep
 * copies and re-identifies every nested record, so an edit on either side is
 * invisible to the other. This is an application operation and nothing
 * generative is involved in it (vision §17).
 *
 * **Canon is not overwritten by suggestion.** Everything here is called by a
 * person acting on a form. The assistant proposes; a designer decides; the
 * decision arrives here as an ordinary write with an ordinary reason.
 *
 * **Every write is transactional, idempotent, and audited in the same
 * transaction** (CLAUDE.md §1, §6). A narrative is working state rather than a
 * record of something a student did, so it may be edited and its parts removed
 * — but who changed the canon, and when, is an attributable human action.
 */
import { recordAudit, requestIdFor } from "@/lib/audit/log";
import {
  assertCanAdministerCurriculum,
  assertCanAuthorCurriculum,
  assertCanReviewCurriculum,
  NotAuthorizedError,
} from "@/lib/auth/scope";
import { nextTimestamp } from "@/lib/clock";
import { cloneNarrative, db, nextId, transact, withIdempotency } from "@/lib/db/store";
import type {
  ContentBoundaries,
  Narrative,
  NarrativeBeat,
  NarrativeChapter,
  NarrativeCharacter,
  NarrativeLocation,
  NarrativeState,
  NarrativeStatus,
  NarrativeVersion,
  PlotThread,
  PlotThreadKind,
  StoryArcMoment,
  StoryArcStage,
  User,
  VisualBible,
} from "@/lib/db/types";

import {
  canEditNarrative,
  emptyBoundaries,
  emptyCentralProblem,
  emptyState,
  emptyVisualBible,
  emptyWorld,
  NarrativeError,
  requireNarrative,
  submissionBlockers,
} from "./bible";
import {
  isNarrativeEditable,
  NARRATIVE_STATUS_PRESENTATION,
  transitionNarrative,
} from "./status";

// ---------------------------------------------------------------------------
// The one write path
// ---------------------------------------------------------------------------

function requireReason(reason: string): string {
  const trimmed = reason.trim();
  if (trimmed.length < 4) {
    throw new NarrativeError("A recorded reason is required for this change.");
  }
  return trimmed;
}

/**
 * Every edit to a narrative goes through here.
 *
 * Authorization, the draft-only rule, the transaction, the idempotency key, the
 * audit event, and the updated-at stamp are done once, in one place. A function
 * below cannot forget one of them, because it never has the chance to: it
 * receives a narrative that is already checked and returns nothing.
 *
 * `describe` produces the before/after pair recorded on the audit event. It runs
 * against a deep copy taken before the mutation, so the "before" is genuinely
 * the previous state rather than the same object read twice.
 */
function editNarrative<T>(
  actor: User,
  narrativeId: string,
  action: string,
  reason: string,
  idempotencyKey: string,
  mutate: (narrative: Narrative) => T,
  describe: (before: Narrative, after: Narrative) => { before: unknown; after: unknown },
): Narrative {
  assertCanAuthorCurriculum(actor);
  const recordedReason = requireReason(reason);

  return withIdempotency(
    idempotencyKey,
    () =>
      transact(() => {
        const narrative = requireNarrative(narrativeId);
        if (!canEditNarrative(actor, narrative)) {
          throw new NotAuthorizedError(
            "this narrative belongs to someone else and has not been shared with you",
          );
        }
        if (!isNarrativeEditable(narrative.status)) {
          throw new NarrativeError(
            `This narrative is ${NARRATIVE_STATUS_PRESENTATION[
              narrative.status
            ].label.toLowerCase()}, so it cannot be edited. Return it to draft first.`,
          );
        }

        const before = cloneNarrative(narrative);
        mutate(narrative);
        narrative.updatedAt = nextTimestamp();
        narrative.updatedByUserId = actor.id;

        const described = describe(before, narrative);
        recordAudit({
          actor,
          action,
          targetEntity: "narrative",
          targetId: narrative.id,
          before: described.before,
          after: described.after,
          reason: recordedReason,
          idempotencyKey,
          requestId: requestIdFor(action, idempotencyKey),
        });
        return narrative;
      }),
    (existingId) => requireNarrative(existingId),
  );
}

/** Most edits describe themselves as "this part, before and after". */
function part<K extends keyof Narrative>(key: K) {
  return (before: Narrative, after: Narrative) => ({
    before: before[key],
    after: after[key],
  });
}

// ---------------------------------------------------------------------------
// Creating
// ---------------------------------------------------------------------------

export type NarrativeIdentityInput = {
  title: string;
  premise: string;
  subject: string;
  courseId: string | null;
  unitIds: string[];
  genre: string;
  tone: string;
  gradeBand: string;
  audience: string;
  keywords: string[];
};

export function createNarrative(
  actor: User,
  input: NarrativeIdentityInput & { reason: string },
  idempotencyKey: string,
): Narrative {
  assertCanAuthorCurriculum(actor);
  const reason = requireReason(input.reason);
  if (input.title.trim().length === 0) {
    throw new NarrativeError("A narrative needs a title before it can be created.");
  }

  return withIdempotency(
    idempotencyKey,
    () =>
      transact(() => {
        const now = nextTimestamp();
        const narrative: Narrative = {
          id: nextId("nar"),
          orgId: actor.orgId,
          status: "draft",
          // Only a curriculum administrator marks something official, and this
          // is not that action.
          official: false,
          title: input.title.trim(),
          premise: input.premise.trim(),
          subject: input.subject.trim(),
          courseId: input.courseId,
          unitIds: [...input.unitIds],
          genre: input.genre.trim(),
          tone: input.tone.trim(),
          gradeBand: input.gradeBand.trim(),
          audience: input.audience.trim(),
          world: emptyWorld(),
          characters: [],
          centralProblem: emptyCentralProblem(),
          storyArc: [],
          chapters: [],
          state: emptyState(),
          plotThreads: [],
          visualBible: emptyVisualBible(),
          boundaries: emptyBoundaries(),
          keywords: input.keywords.map((k) => k.trim()).filter(Boolean),
          basedOnNarrativeId: null,
          reuseCount: 0,
          ownerUserId: actor.id,
          sharedWithUserIds: [],
          createdAt: now,
          updatedAt: now,
          updatedByUserId: actor.id,
        };
        db().narratives.push(narrative);

        recordAudit({
          actor,
          action: "narrative.create",
          targetEntity: "narrative",
          targetId: narrative.id,
          before: null,
          after: { title: narrative.title, status: narrative.status },
          reason,
          idempotencyKey,
          requestId: requestIdFor("narrative.create", idempotencyKey),
        });
        return narrative;
      }),
    (existingId) => requireNarrative(existingId),
  );
}

// ---------------------------------------------------------------------------
// Duplication (vision §17)
// ---------------------------------------------------------------------------

/**
 * What a duplicate carries over.
 *
 * Offered as choices because the reason to duplicate differs: someone reusing a
 * proven mission structure wants the arc and the chapters and none of the
 * characters, and someone building a sequel wants the characters and none of
 * the chapters. The bible itself — identity, world, central problem — always
 * comes, because a narrative without it is not a narrative.
 */
export type DuplicationParts = {
  characters: boolean;
  locations: boolean;
  visualBible: boolean;
  storyArc: boolean;
  chapters: boolean;
  /** Beats keep their text but lose their lesson placement — see below. */
  lessonBeats: boolean;
  plotThreads: boolean;
  narrativeState: boolean;
};

export const ALL_DUPLICATION_PARTS: DuplicationParts = {
  characters: true,
  locations: true,
  visualBible: true,
  storyArc: true,
  chapters: true,
  lessonBeats: true,
  plotThreads: true,
  narrativeState: true,
};

/**
 * Copy a narrative into a new, independent one.
 *
 * A database operation, start to finish. Nothing generative is involved: the
 * point of duplication is an exact, predictable copy, and a model asked to
 * "duplicate" a story would paraphrase it (vision §17).
 *
 * Three things make the copy genuinely independent:
 *
 *   1. **Every nested record is re-identified.** Sharing an id would make two
 *      narratives point at one character.
 *   2. **Every object is deep-copied** via `cloneNarrative`, so no array is
 *      shared by reference and an edit on one side cannot reach the other.
 *   3. **The copy starts as a draft owned by whoever made it**, with its own
 *      empty share list. Inheriting the source's sharing would hand strangers
 *      write access to a private adaptation.
 *
 * `basedOnNarrativeId` is set once and never changed. It is provenance, not a
 * link: the source is not consulted when the copy is read, and neither record
 * can write to the other.
 *
 * **Lesson placements are dropped even when beats are copied.** A beat's
 * `lessonCode` names a lesson in the course the source was written for.
 * Carrying it into a copy meant for another course would silently attach the
 * new story to lessons nobody chose. The beat's words survive; where it runs is
 * a decision for the person adapting it.
 */
export function duplicateNarrative(
  actor: User,
  input: {
    sourceNarrativeId: string;
    title: string;
    parts: DuplicationParts;
    reason: string;
  },
  idempotencyKey: string,
): Narrative {
  assertCanAuthorCurriculum(actor);
  const reason = requireReason(input.reason);
  if (input.title.trim().length === 0) {
    throw new NarrativeError("The copy needs a title of its own.");
  }

  return withIdempotency(
    idempotencyKey,
    () =>
      transact(() => {
        const source = requireNarrative(input.sourceNarrativeId);
        if (source.orgId !== actor.orgId) {
          throw new NotAuthorizedError("that narrative is outside your organization");
        }
        // A draft belonging to someone else is not in the bank and is not
        // something to build on. Everything else in the organization is.
        if (
          source.status === "draft" &&
          source.ownerUserId !== actor.id &&
          !source.sharedWithUserIds.includes(actor.id)
        ) {
          throw new NotAuthorizedError(
            "that narrative is an unfinished draft belonging to someone else",
          );
        }

        const now = nextTimestamp();
        const copy = cloneNarrative(source);

        copy.id = nextId("nar");
        copy.title = input.title.trim();
        copy.status = "draft";
        copy.official = false;
        copy.basedOnNarrativeId = source.id;
        copy.reuseCount = 0;
        copy.ownerUserId = actor.id;
        copy.sharedWithUserIds = [];
        copy.createdAt = now;
        copy.updatedAt = now;
        copy.updatedByUserId = actor.id;

        // Re-identify or drop each part. The mapping from old character id to
        // new one is kept so a location or an asset reference that pointed at a
        // copied character still points at the copy's own.
        if (input.parts.characters) {
          copy.characters = copy.characters.map((c) => ({
            ...c,
            id: nextId("chr"),
            // An asset belongs to the source's library, not the copy's. The
            // copy gets the description and picks its own artwork.
            assetId: null,
          }));
        } else {
          copy.characters = [];
        }

        if (input.parts.locations) {
          copy.world.locations = copy.world.locations.map((l) => ({
            ...l,
            id: nextId("loc"),
          }));
        } else {
          copy.world.locations = [];
        }

        if (!input.parts.visualBible) copy.visualBible = emptyVisualBible();

        if (input.parts.storyArc) {
          copy.storyArc = copy.storyArc.map((m) => ({ ...m, id: nextId("arc") }));
        } else {
          copy.storyArc = [];
        }

        if (input.parts.chapters) {
          copy.chapters = copy.chapters.map((c) => ({
            ...c,
            id: nextId("cha"),
            // A chapter's unit is the source course's unit, for the same
            // reason a beat's lesson is.
            unitId: null,
            beats: input.parts.lessonBeats
              ? c.beats.map((b) => ({ ...b, id: nextId("bea"), lessonCode: null }))
              : [],
          }));
        } else {
          copy.chapters = [];
        }

        if (input.parts.plotThreads) {
          const chapterIds = new Set(copy.chapters.map((c) => c.id));
          copy.plotThreads = copy.plotThreads.map((t) => ({
            ...t,
            id: nextId("thr"),
            // A thread cannot point at a chapter the copy did not take.
            openedInChapterId: null,
            resolvedInChapterId: null,
            resolved: chapterIds.size > 0 ? t.resolved : false,
          }));
        } else {
          copy.plotThreads = [];
        }

        // Narrative state describes how far a class has been taken through the
        // source's story. A fresh adaptation has not been taught yet, so
        // carrying it is opt-in rather than automatic.
        if (!input.parts.narrativeState) copy.state = emptyState();

        db().narratives.push(copy);

        // The source records that it was built on. This is the only way the
        // source is touched, and it changes no content.
        source.reuseCount += 1;

        recordAudit({
          actor,
          action: "narrative.duplicate",
          targetEntity: "narrative",
          targetId: copy.id,
          before: { sourceNarrativeId: source.id, sourceTitle: source.title },
          after: {
            narrativeId: copy.id,
            title: copy.title,
            parts: input.parts,
            lessonPlacementsCopied: false,
          },
          reason,
          idempotencyKey,
          requestId: requestIdFor("narrative.duplicate", idempotencyKey),
        });
        return copy;
      }),
    (existingId) => requireNarrative(existingId),
  );
}

// ---------------------------------------------------------------------------
// The bible
// ---------------------------------------------------------------------------

export function saveNarrativeIdentity(
  actor: User,
  input: NarrativeIdentityInput & { narrativeId: string; reason: string },
  idempotencyKey: string,
): Narrative {
  if (input.title.trim().length === 0) {
    throw new NarrativeError("A narrative needs a title.");
  }
  return editNarrative(
    actor,
    input.narrativeId,
    "narrative.identity",
    input.reason,
    idempotencyKey,
    (n) => {
      n.title = input.title.trim();
      n.premise = input.premise.trim();
      n.subject = input.subject.trim();
      n.courseId = input.courseId;
      n.unitIds = [...input.unitIds];
      n.genre = input.genre.trim();
      n.tone = input.tone.trim();
      n.gradeBand = input.gradeBand.trim();
      n.audience = input.audience.trim();
      n.keywords = input.keywords.map((k) => k.trim()).filter(Boolean);
    },
    (before, after) => ({
      before: { title: before.title, premise: before.premise, genre: before.genre },
      after: { title: after.title, premise: after.premise, genre: after.genre },
    }),
  );
}

export function saveNarrativeWorld(
  actor: User,
  input: {
    narrativeId: string;
    place: string;
    period: string;
    technologyLevel: string;
    worldRules: string[];
    constraints: string[];
    reason: string;
  },
  idempotencyKey: string,
): Narrative {
  return editNarrative(
    actor,
    input.narrativeId,
    "narrative.world",
    input.reason,
    idempotencyKey,
    (n) => {
      n.world.place = input.place.trim();
      n.world.period = input.period.trim();
      n.world.technologyLevel = input.technologyLevel.trim();
      n.world.worldRules = input.worldRules.map((r) => r.trim()).filter(Boolean);
      n.world.constraints = input.constraints.map((c) => c.trim()).filter(Boolean);
    },
    part("world"),
  );
}

export function saveCentralProblem(
  actor: User,
  input: {
    narrativeId: string;
    challenge: string;
    stakes: string;
    objective: string;
    studentRole: string;
    reason: string;
  },
  idempotencyKey: string,
): Narrative {
  return editNarrative(
    actor,
    input.narrativeId,
    "narrative.central_problem",
    input.reason,
    idempotencyKey,
    (n) => {
      n.centralProblem = {
        challenge: input.challenge.trim(),
        stakes: input.stakes.trim(),
        objective: input.objective.trim(),
        studentRole: input.studentRole.trim(),
      };
    },
    part("centralProblem"),
  );
}

// ---------------------------------------------------------------------------
// Characters and locations
// ---------------------------------------------------------------------------

export type CharacterInput = Omit<NarrativeCharacter, "id"> & { id: string | null };

export function saveCharacter(
  actor: User,
  input: { narrativeId: string; character: CharacterInput; reason: string },
  idempotencyKey: string,
): Narrative {
  if (input.character.name.trim().length === 0) {
    throw new NarrativeError("A character needs a name.");
  }
  return editNarrative(
    actor,
    input.narrativeId,
    input.character.id ? "narrative.character.update" : "narrative.character.add",
    input.reason,
    idempotencyKey,
    (n) => {
      const shaped: NarrativeCharacter = {
        id: input.character.id ?? nextId("chr"),
        name: input.character.name.trim(),
        role: input.character.role.trim(),
        personality: input.character.personality.trim(),
        motivation: input.character.motivation.trim(),
        relationships: input.character.relationships.trim(),
        appearance: input.character.appearance.trim(),
        knows: input.character.knows.trim(),
        arc: input.character.arc.trim(),
        assetId: input.character.assetId,
      };
      const index = n.characters.findIndex((c) => c.id === shaped.id);
      if (index === -1) n.characters.push(shaped);
      else n.characters[index] = shaped;
    },
    part("characters"),
  );
}

export function removeCharacter(
  actor: User,
  input: { narrativeId: string; characterId: string; reason: string },
  idempotencyKey: string,
): Narrative {
  return editNarrative(
    actor,
    input.narrativeId,
    "narrative.character.remove",
    input.reason,
    idempotencyKey,
    (n) => {
      const index = n.characters.findIndex((c) => c.id === input.characterId);
      if (index === -1) throw new NarrativeError("That character is not in this narrative.");
      n.characters.splice(index, 1);
    },
    part("characters"),
  );
}

export type LocationInput = Omit<NarrativeLocation, "id"> & { id: string | null };

export function saveLocation(
  actor: User,
  input: { narrativeId: string; location: LocationInput; reason: string },
  idempotencyKey: string,
): Narrative {
  if (input.location.name.trim().length === 0) {
    throw new NarrativeError("A location needs a name.");
  }
  return editNarrative(
    actor,
    input.narrativeId,
    input.location.id ? "narrative.location.update" : "narrative.location.add",
    input.reason,
    idempotencyKey,
    (n) => {
      const shaped: NarrativeLocation = {
        id: input.location.id ?? nextId("loc"),
        name: input.location.name.trim(),
        description: input.location.description.trim(),
        significance: input.location.significance.trim(),
        visualReference: input.location.visualReference.trim(),
      };
      const index = n.world.locations.findIndex((l) => l.id === shaped.id);
      if (index === -1) n.world.locations.push(shaped);
      else n.world.locations[index] = shaped;
    },
    part("world"),
  );
}

export function removeLocation(
  actor: User,
  input: { narrativeId: string; locationId: string; reason: string },
  idempotencyKey: string,
): Narrative {
  return editNarrative(
    actor,
    input.narrativeId,
    "narrative.location.remove",
    input.reason,
    idempotencyKey,
    (n) => {
      const index = n.world.locations.findIndex((l) => l.id === input.locationId);
      if (index === -1) throw new NarrativeError("That location is not in this narrative.");
      n.world.locations.splice(index, 1);
    },
    part("world"),
  );
}

// ---------------------------------------------------------------------------
// Story arc, chapters, and beats
// ---------------------------------------------------------------------------

export function saveArcMoment(
  actor: User,
  input: {
    narrativeId: string;
    momentId: string | null;
    stage: StoryArcStage;
    summary: string;
    reason: string;
  },
  idempotencyKey: string,
): Narrative {
  if (input.summary.trim().length === 0) {
    throw new NarrativeError("A story moment needs a description.");
  }
  return editNarrative(
    actor,
    input.narrativeId,
    input.momentId ? "narrative.arc.update" : "narrative.arc.add",
    input.reason,
    idempotencyKey,
    (n) => {
      const shaped: StoryArcMoment = {
        id: input.momentId ?? nextId("arc"),
        stage: input.stage,
        summary: input.summary.trim(),
      };
      const index = n.storyArc.findIndex((m) => m.id === shaped.id);
      if (index === -1) n.storyArc.push(shaped);
      else n.storyArc[index] = shaped;
    },
    part("storyArc"),
  );
}

export function removeArcMoment(
  actor: User,
  input: { narrativeId: string; momentId: string; reason: string },
  idempotencyKey: string,
): Narrative {
  return editNarrative(
    actor,
    input.narrativeId,
    "narrative.arc.remove",
    input.reason,
    idempotencyKey,
    (n) => {
      const index = n.storyArc.findIndex((m) => m.id === input.momentId);
      if (index === -1) throw new NarrativeError("That story moment does not exist.");
      n.storyArc.splice(index, 1);
    },
    part("storyArc"),
  );
}

export function saveChapter(
  actor: User,
  input: {
    narrativeId: string;
    chapterId: string | null;
    title: string;
    summary: string;
    unitId: string | null;
    reason: string;
  },
  idempotencyKey: string,
): Narrative {
  if (input.title.trim().length === 0) {
    throw new NarrativeError("A chapter needs a title.");
  }
  return editNarrative(
    actor,
    input.narrativeId,
    input.chapterId ? "narrative.chapter.update" : "narrative.chapter.add",
    input.reason,
    idempotencyKey,
    (n) => {
      const existing = n.chapters.find((c) => c.id === input.chapterId);
      if (existing) {
        existing.title = input.title.trim();
        existing.summary = input.summary.trim();
        existing.unitId = input.unitId;
        return;
      }
      const shaped: NarrativeChapter = {
        id: nextId("cha"),
        title: input.title.trim(),
        summary: input.summary.trim(),
        unitId: input.unitId,
        beats: [],
      };
      n.chapters.push(shaped);
    },
    part("chapters"),
  );
}

export function removeChapter(
  actor: User,
  input: { narrativeId: string; chapterId: string; reason: string },
  idempotencyKey: string,
): Narrative {
  return editNarrative(
    actor,
    input.narrativeId,
    "narrative.chapter.remove",
    input.reason,
    idempotencyKey,
    (n) => {
      const index = n.chapters.findIndex((c) => c.id === input.chapterId);
      if (index === -1) throw new NarrativeError("That chapter does not exist.");
      // A thread that opened or resolved here would otherwise point at nothing.
      for (const thread of n.plotThreads) {
        if (thread.openedInChapterId === input.chapterId) thread.openedInChapterId = null;
        if (thread.resolvedInChapterId === input.chapterId) {
          thread.resolvedInChapterId = null;
          thread.resolved = false;
        }
      }
      n.chapters.splice(index, 1);
    },
    (before, after) => ({
      before: { chapters: before.chapters, plotThreads: before.plotThreads },
      after: { chapters: after.chapters, plotThreads: after.plotThreads },
    }),
  );
}

/** Moves a chapter one place earlier or later. Idempotent per current index. */
export function moveChapter(
  actor: User,
  input: {
    narrativeId: string;
    chapterId: string;
    fromIndex: number;
    direction: "up" | "down";
    reason: string;
  },
  idempotencyKey: string,
): Narrative {
  return editNarrative(
    actor,
    input.narrativeId,
    "narrative.chapter.move",
    input.reason,
    idempotencyKey,
    (n) => {
      const index = n.chapters.findIndex((c) => c.id === input.chapterId);
      if (index === -1) throw new NarrativeError("That chapter does not exist.");
      // The key carries where the chapter sat, so a double click moves it once
      // and a deliberate second move moves it again.
      if (index !== input.fromIndex) {
        throw new NarrativeError(
          "That chapter has moved since this page was loaded. Reload and try again.",
        );
      }
      const target = input.direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= n.chapters.length) {
        throw new NarrativeError("That chapter is already at the end of the story.");
      }
      const [moved] = n.chapters.splice(index, 1);
      n.chapters.splice(target, 0, moved);
    },
    (before, after) => ({
      before: before.chapters.map((c) => c.title),
      after: after.chapters.map((c) => c.title),
    }),
  );
}

export function saveBeat(
  actor: User,
  input: {
    narrativeId: string;
    chapterId: string;
    beatId: string | null;
    lessonCode: string | null;
    academicObjective: string;
    narrativeEvent: string;
    learningUnlock: string;
    reason: string;
  },
  idempotencyKey: string,
): Narrative {
  if (input.narrativeEvent.trim().length === 0) {
    throw new NarrativeError("A beat needs to say what happens in the story.");
  }
  return editNarrative(
    actor,
    input.narrativeId,
    input.beatId ? "narrative.beat.update" : "narrative.beat.add",
    input.reason,
    idempotencyKey,
    (n) => {
      const chapter = n.chapters.find((c) => c.id === input.chapterId);
      if (!chapter) throw new NarrativeError("That chapter does not exist.");

      // One lesson, one beat. Two beats on the same lesson would make
      // `beatForLesson` return whichever came first, and the lesson workshop
      // would silently show one of two stories.
      if (input.lessonCode) {
        const clash = n.chapters
          .flatMap((c) => c.beats.map((b) => ({ chapter: c, beat: b })))
          .find(
            ({ beat }) =>
              beat.lessonCode === input.lessonCode && beat.id !== input.beatId,
          );
        if (clash) {
          throw new NarrativeError(
            `${input.lessonCode} already has a beat in "${clash.chapter.title}". A lesson sits at one point in the story.`,
          );
        }
      }

      const shaped: NarrativeBeat = {
        id: input.beatId ?? nextId("bea"),
        lessonCode: input.lessonCode,
        academicObjective: input.academicObjective.trim(),
        narrativeEvent: input.narrativeEvent.trim(),
        learningUnlock: input.learningUnlock.trim(),
      };
      const index = chapter.beats.findIndex((b) => b.id === shaped.id);
      if (index === -1) chapter.beats.push(shaped);
      else chapter.beats[index] = shaped;
    },
    part("chapters"),
  );
}

export function removeBeat(
  actor: User,
  input: { narrativeId: string; chapterId: string; beatId: string; reason: string },
  idempotencyKey: string,
): Narrative {
  return editNarrative(
    actor,
    input.narrativeId,
    "narrative.beat.remove",
    input.reason,
    idempotencyKey,
    (n) => {
      const chapter = n.chapters.find((c) => c.id === input.chapterId);
      if (!chapter) throw new NarrativeError("That chapter does not exist.");
      const index = chapter.beats.findIndex((b) => b.id === input.beatId);
      if (index === -1) throw new NarrativeError("That beat does not exist.");
      chapter.beats.splice(index, 1);
    },
    part("chapters"),
  );
}

// ---------------------------------------------------------------------------
// State, threads, visuals, boundaries
// ---------------------------------------------------------------------------

export function saveNarrativeState(
  actor: User,
  input: NarrativeState & { narrativeId: string; reason: string },
  idempotencyKey: string,
): Narrative {
  return editNarrative(
    actor,
    input.narrativeId,
    "narrative.state",
    input.reason,
    idempotencyKey,
    (n) => {
      n.state = {
        happened: input.happened.map((x) => x.trim()).filter(Boolean),
        studentsKnow: input.studentsKnow.map((x) => x.trim()).filter(Boolean),
        cluesRevealed: input.cluesRevealed.map((x) => x.trim()).filter(Boolean),
        currentObjective: input.currentObjective.trim(),
        futureReveals: input.futureReveals.map((x) => x.trim()).filter(Boolean),
      };
    },
    part("state"),
  );
}

export function savePlotThread(
  actor: User,
  input: {
    narrativeId: string;
    threadId: string | null;
    kind: PlotThreadKind;
    summary: string;
    openedInChapterId: string | null;
    note: string;
    reason: string;
  },
  idempotencyKey: string,
): Narrative {
  if (input.summary.trim().length === 0) {
    throw new NarrativeError("A plot thread needs a description.");
  }
  return editNarrative(
    actor,
    input.narrativeId,
    input.threadId ? "narrative.thread.update" : "narrative.thread.add",
    input.reason,
    idempotencyKey,
    (n) => {
      const existing = n.plotThreads.find((t) => t.id === input.threadId);
      if (existing) {
        existing.kind = input.kind;
        existing.summary = input.summary.trim();
        existing.openedInChapterId = input.openedInChapterId;
        existing.note = input.note.trim();
        return;
      }
      const shaped: PlotThread = {
        id: nextId("thr"),
        kind: input.kind,
        summary: input.summary.trim(),
        openedInChapterId: input.openedInChapterId,
        resolvedInChapterId: null,
        resolved: false,
        note: input.note.trim(),
      };
      n.plotThreads.push(shaped);
    },
    part("plotThreads"),
  );
}

/**
 * Closing a thread, or re-opening one.
 *
 * Resolution names the chapter it happened in, because "resolved" with no
 * chapter is a claim nobody can check against the story.
 */
export function resolvePlotThread(
  actor: User,
  input: {
    narrativeId: string;
    threadId: string;
    resolved: boolean;
    resolvedInChapterId: string | null;
    reason: string;
  },
  idempotencyKey: string,
): Narrative {
  return editNarrative(
    actor,
    input.narrativeId,
    input.resolved ? "narrative.thread.resolve" : "narrative.thread.reopen",
    input.reason,
    idempotencyKey,
    (n) => {
      const thread = n.plotThreads.find((t) => t.id === input.threadId);
      if (!thread) throw new NarrativeError("That plot thread does not exist.");
      if (input.resolved) {
        if (!input.resolvedInChapterId) {
          throw new NarrativeError(
            "Say which chapter resolves it. A thread resolved nowhere is still open.",
          );
        }
        if (!n.chapters.some((c) => c.id === input.resolvedInChapterId)) {
          throw new NarrativeError("That chapter does not exist.");
        }
      }
      thread.resolved = input.resolved;
      thread.resolvedInChapterId = input.resolved ? input.resolvedInChapterId : null;
    },
    part("plotThreads"),
  );
}

export function removePlotThread(
  actor: User,
  input: { narrativeId: string; threadId: string; reason: string },
  idempotencyKey: string,
): Narrative {
  return editNarrative(
    actor,
    input.narrativeId,
    "narrative.thread.remove",
    input.reason,
    idempotencyKey,
    (n) => {
      const index = n.plotThreads.findIndex((t) => t.id === input.threadId);
      if (index === -1) throw new NarrativeError("That plot thread does not exist.");
      n.plotThreads.splice(index, 1);
    },
    part("plotThreads"),
  );
}

export function saveVisualBible(
  actor: User,
  input: VisualBible & { narrativeId: string; reason: string },
  idempotencyKey: string,
): Narrative {
  return editNarrative(
    actor,
    input.narrativeId,
    "narrative.visual_bible",
    input.reason,
    idempotencyKey,
    (n) => {
      n.visualBible = {
        artDirection: input.artDirection.trim(),
        visualTone: input.visualTone.trim(),
        palette: input.palette.trim(),
        interfaceTreatment: input.interfaceTreatment.trim(),
        recurringProps: input.recurringProps.map((x) => x.trim()).filter(Boolean),
        motifs: input.motifs.map((x) => x.trim()).filter(Boolean),
        symbols: input.symbols.map((x) => x.trim()).filter(Boolean),
        defaultAspectRatio: input.defaultAspectRatio,
        textInImages: input.textInImages.trim(),
        accessibilityRules: input.accessibilityRules.map((x) => x.trim()).filter(Boolean),
        ageAppropriateness: input.ageAppropriateness.trim(),
      };
    },
    part("visualBible"),
  );
}

export function saveContentBoundaries(
  actor: User,
  input: ContentBoundaries & { narrativeId: string; reason: string },
  idempotencyKey: string,
): Narrative {
  return editNarrative(
    actor,
    input.narrativeId,
    "narrative.boundaries",
    input.reason,
    idempotencyKey,
    (n) => {
      n.boundaries = {
        mustStayConsistent: input.mustStayConsistent.map((x) => x.trim()).filter(Boolean),
        avoid: input.avoid.map((x) => x.trim()).filter(Boolean),
        requiredFraming: input.requiredFraming.map((x) => x.trim()).filter(Boolean),
      };
    },
    part("boundaries"),
  );
}

// ---------------------------------------------------------------------------
// Sharing, versioning, and lifecycle
// ---------------------------------------------------------------------------

/**
 * Sharing is edit access, and only the owner grants it.
 *
 * Not a role check: someone the narrative was shared with cannot re-share it,
 * because that would make the owner's list grow without the owner deciding.
 */
export function shareNarrative(
  actor: User,
  input: { narrativeId: string; userIds: string[]; reason: string },
  idempotencyKey: string,
): Narrative {
  assertCanAuthorCurriculum(actor);
  const reason = requireReason(input.reason);

  return withIdempotency(
    idempotencyKey,
    () =>
      transact(() => {
        const narrative = requireNarrative(input.narrativeId);
        if (narrative.ownerUserId !== actor.id) {
          throw new NotAuthorizedError("only the owner may change who can edit this");
        }
        const d = db();
        const before = [...narrative.sharedWithUserIds];
        const shared: string[] = [];
        for (const userId of input.userIds) {
          const user = d.users.find((u) => u.id === userId);
          if (!user || user.orgId !== actor.orgId) {
            throw new NarrativeError("That person is not in your organization.");
          }
          if (!user.curriculumAuthor) {
            throw new NarrativeError(
              `${user.firstName} ${user.lastName} does not hold curriculum authoring, so sharing this would give them a page they cannot use.`,
            );
          }
          if (userId !== narrative.ownerUserId && !shared.includes(userId)) {
            shared.push(userId);
          }
        }
        narrative.sharedWithUserIds = shared;
        narrative.updatedAt = nextTimestamp();
        narrative.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: "narrative.share",
          targetEntity: "narrative",
          targetId: narrative.id,
          before,
          after: shared,
          reason,
          idempotencyKey,
          requestId: requestIdFor("narrative.share", idempotencyKey),
        });
        return narrative;
      }),
    (existingId) => requireNarrative(existingId),
  );
}

/**
 * A deliberate checkpoint (vision §21).
 *
 * Not an autosave. Ordinary edits are already recorded in the audit log; a
 * version is a person saying "keep this one, I can come back to it", and it
 * carries whether the assistant was involved in producing what is being kept.
 * Keeping a version per keystroke would make the history unreadable, which is
 * the same as not having one.
 */
export function checkpointNarrative(
  actor: User,
  input: {
    narrativeId: string;
    label: string;
    note: string;
    aiAssisted: boolean;
    reason: string;
  },
  idempotencyKey: string,
): NarrativeVersion {
  assertCanAuthorCurriculum(actor);
  const reason = requireReason(input.reason);
  if (input.label.trim().length === 0) {
    throw new NarrativeError("A saved version needs a label.");
  }

  return withIdempotency(
    idempotencyKey,
    () =>
      transact(() => {
        const narrative = requireNarrative(input.narrativeId);
        if (!canEditNarrative(actor, narrative)) {
          throw new NotAuthorizedError("this narrative has not been shared with you");
        }
        const version: NarrativeVersion = {
          id: nextId("nvr"),
          narrativeId: narrative.id,
          label: input.label.trim(),
          note: input.note.trim(),
          snapshot: cloneNarrative(narrative),
          aiAssisted: input.aiAssisted,
          createdAt: nextTimestamp(),
          createdByUserId: actor.id,
        };
        db().narrativeVersions.push(version);

        recordAudit({
          actor,
          action: "narrative.checkpoint",
          targetEntity: "narrative",
          targetId: narrative.id,
          before: null,
          after: { versionId: version.id, label: version.label, aiAssisted: version.aiAssisted },
          reason,
          idempotencyKey,
          requestId: requestIdFor("narrative.checkpoint", idempotencyKey),
        });
        return version;
      }),
    (existingId) => {
      const version = db().narrativeVersions.find((v) => v.id === existingId);
      if (!version) throw new NarrativeError("That saved version no longer exists.");
      return version;
    },
  );
}

/**
 * Move a narrative through its lifecycle.
 *
 * The transition itself is guarded by `transitionNarrative`, so an illegal move
 * raises rather than being written. Two authorizations sit on top of it:
 *
 *   - **Submitting** is the owner's own act. A designer decides their work is
 *     ready; nobody submits on their behalf (CLAUDE.md §22).
 *   - **Approving, publishing, and marking a template** need the reviewer
 *     authorization, and the reviewer may not be the author. That is what makes
 *     review mean something rather than being a second click by the same person.
 */
export function advanceNarrative(
  actor: User,
  input: { narrativeId: string; to: NarrativeStatus; reason: string },
  idempotencyKey: string,
): Narrative {
  assertCanAuthorCurriculum(actor);
  const reason = requireReason(input.reason);

  return withIdempotency(
    idempotencyKey,
    () =>
      transact(() => {
        const narrative = requireNarrative(input.narrativeId);
        if (narrative.orgId !== actor.orgId) {
          throw new NotAuthorizedError("that narrative is outside your organization");
        }

        const from = narrative.status;
        const owns = narrative.ownerUserId === actor.id;

        if (input.to === "in_review") {
          if (!owns) {
            throw new NotAuthorizedError(
              "only the person who owns this narrative may submit it for review",
            );
          }
          const blockers = submissionBlockers(narrative);
          if (blockers.length > 0) {
            throw new NarrativeError(
              `This narrative is not ready to review. ${blockers.join(" ")}`,
            );
          }
        } else if (input.to === "approved_template" || input.to === "published") {
          assertCanReviewOtherPeoplesWork(actor, narrative.ownerUserId);
        } else if (input.to === "draft" && from === "in_review") {
          // Returning a submission is a reviewer's act; withdrawing your own is
          // not, and both land here.
          if (!owns) assertCanReviewOtherPeoplesWork(actor, narrative.ownerUserId);
        } else if (input.to === "archived" && !owns) {
          assertCanReviewOtherPeoplesWork(actor, narrative.ownerUserId);
        }

        narrative.status = transitionNarrative(from, input.to);
        narrative.updatedAt = nextTimestamp();
        narrative.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: `narrative.${input.to}`,
          targetEntity: "narrative",
          targetId: narrative.id,
          before: { status: from },
          after: { status: narrative.status },
          reason,
          idempotencyKey,
          requestId: requestIdFor(`narrative.${input.to}`, idempotencyKey),
        });
        return narrative;
      }),
    (existingId) => requireNarrative(existingId),
  );
}

/**
 * A reviewer, and not the author.
 *
 * Separation of duties is the entire product of having a review step. Someone
 * who holds both authorizations still cannot approve their own narrative — the
 * check is on the record's owner, not on what the actor happens to hold.
 */
function assertCanReviewOtherPeoplesWork(actor: User, ownerUserId: string): void {
  assertCanReviewCurriculum(actor);
  if (actor.id === ownerUserId) {
    throw new NotAuthorizedError(
      "you wrote this narrative, so someone else has to review it",
    );
  }
}

/**
 * Marking a narrative as an official Beyond.Ed template.
 *
 * A curriculum administrator only, because the label is what tells a designer
 * browsing the bank which starting points the organization stands behind
 * (vision §16).
 */
export function setOfficialTemplate(
  actor: User,
  input: { narrativeId: string; official: boolean; reason: string },
  idempotencyKey: string,
): Narrative {
  assertCanAdministerCurriculum(actor);
  const reason = requireReason(input.reason);

  return withIdempotency(
    idempotencyKey,
    () =>
      transact(() => {
        const narrative = requireNarrative(input.narrativeId);
        if (narrative.orgId !== actor.orgId) {
          throw new NotAuthorizedError("that narrative is outside your organization");
        }
        if (input.official && narrative.status === "draft") {
          throw new NarrativeError(
            "A draft cannot be an official template. Take it through review first.",
          );
        }
        const before = narrative.official;
        narrative.official = input.official;
        narrative.updatedAt = nextTimestamp();
        narrative.updatedByUserId = actor.id;

        recordAudit({
          actor,
          action: "narrative.official",
          targetEntity: "narrative",
          targetId: narrative.id,
          before: { official: before },
          after: { official: narrative.official },
          reason,
          idempotencyKey,
          requestId: requestIdFor("narrative.official", idempotencyKey),
        });
        return narrative;
      }),
    (existingId) => requireNarrative(existingId),
  );
}
