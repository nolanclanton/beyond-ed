/**
 * Reading a narrative (vision §4).
 *
 * Pure reads and pure shapes. Nothing here writes, so the studio pages, the
 * Narrative Bank, the lesson workshop, and the assistant's context builders all
 * read a narrative through one module and cannot disagree about what it says.
 *
 * The completeness checks below are the honest kind: they report what a
 * narrative currently has, and an incomplete narrative is a normal state while
 * someone is building one. They are advisory everywhere except the submission
 * gate, where a narrative with no premise and no chapters is not something a
 * reviewer can review.
 */
import { db } from "@/lib/db/store";
import type {
  ContentBoundaries,
  Narrative,
  NarrativeBeat,
  NarrativeChapter,
  NarrativeCharacter,
  NarrativeLocation,
  NarrativeState,
  NarrativeVersion,
  PlotThread,
  StoryArcMoment,
  StoryArcStage,
  User,
  VisualBible,
} from "@/lib/db/types";
import { STORY_ARC_STAGES } from "@/lib/db/types";

export class NarrativeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NarrativeError";
  }
}

// ---------------------------------------------------------------------------
// Empty shapes
// ---------------------------------------------------------------------------

/**
 * A new narrative's empty parts.
 *
 * Written out rather than left undefined so every reader — a page, a context
 * builder, a duplication — meets the same shape whether or not a designer has
 * filled it in yet. An absent field and an empty field are the same fact here,
 * and having only one of them removes a whole class of null checks.
 */
export function emptyWorld() {
  return {
    place: "",
    period: "",
    technologyLevel: "",
    worldRules: [] as string[],
    constraints: [] as string[],
    locations: [] as NarrativeLocation[],
  };
}

export function emptyCentralProblem() {
  return { challenge: "", stakes: "", objective: "", studentRole: "" };
}

export function emptyState(): NarrativeState {
  return {
    happened: [],
    studentsKnow: [],
    cluesRevealed: [],
    currentObjective: "",
    futureReveals: [],
  };
}

export function emptyVisualBible(): VisualBible {
  return {
    artDirection: "",
    visualTone: "",
    palette: "",
    interfaceTreatment: "",
    recurringProps: [],
    motifs: [],
    symbols: [],
    defaultAspectRatio: "16:9",
    textInImages:
      "Avoid text inside images. Anything a student must read belongs in the lesson, where a screen reader can reach it.",
    accessibilityRules: [
      "Every image carries alternative text describing what it shows, not that it is an image.",
      "Meaning is never carried by colour alone.",
    ],
    ageAppropriateness: "",
  };
}

export function emptyBoundaries(): ContentBoundaries {
  return { mustStayConsistent: [], avoid: [], requiredFraming: [] };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function narrativeById(id: string): Narrative | undefined {
  return db().narratives.find((n) => n.id === id);
}

export function requireNarrative(id: string): Narrative {
  const narrative = narrativeById(id);
  if (!narrative) throw new NarrativeError("That narrative does not exist.");
  return narrative;
}

/**
 * Narratives an actor may read.
 *
 * Organization-wide by design: a bank nobody can browse is not a bank, and
 * reuse is the point of the thing (vision §5). Narratives carry no student
 * data, so reading one exposes nothing about a person. WRITING is what is
 * narrow — see `assertCanEditNarrative`.
 *
 * Drafts are the exception: an unfinished story is working state, and it is
 * visible to its owner and to whoever it was shared with, not to the whole
 * organization.
 */
export function readableNarratives(actor: User): Narrative[] {
  return db()
    .narratives.filter((n) => n.orgId === actor.orgId)
    .filter(
      (n) =>
        n.status !== "draft" ||
        n.ownerUserId === actor.id ||
        n.sharedWithUserIds.includes(actor.id),
    );
}

export function canEditNarrative(actor: User, narrative: Narrative): boolean {
  if (narrative.orgId !== actor.orgId) return false;
  return (
    narrative.ownerUserId === actor.id ||
    narrative.sharedWithUserIds.includes(actor.id)
  );
}

export function versionsOfNarrative(narrativeId: string): NarrativeVersion[] {
  return db()
    .narrativeVersions.filter((v) => v.narrativeId === narrativeId)
    .slice()
    .reverse();
}

/** Copies made from this narrative. Reads only; neither can change the other. */
export function derivedFrom(narrativeId: string): Narrative[] {
  return db().narratives.filter((n) => n.basedOnNarrativeId === narrativeId);
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

export function chapterById(
  narrative: Narrative,
  chapterId: string,
): NarrativeChapter | undefined {
  return narrative.chapters.find((c) => c.id === chapterId);
}

export function characterById(
  narrative: Narrative,
  characterId: string,
): NarrativeCharacter | undefined {
  return narrative.characters.find((c) => c.id === characterId);
}

/** Every beat in the narrative, in chapter order, with its chapter alongside. */
export function allBeats(
  narrative: Narrative,
): { chapter: NarrativeChapter; beat: NarrativeBeat }[] {
  return narrative.chapters.flatMap((chapter) =>
    chapter.beats.map((beat) => ({ chapter, beat })),
  );
}

/**
 * The beat a given lesson is paired with.
 *
 * This is the join between the story and the course, and it is deliberately a
 * soft one: a beat names a catalog `lessonCode`, so re-sequencing a course
 * moves the lesson without breaking the story, and a narrative reused in
 * another course simply has beats that match nothing there yet.
 */
export function beatForLesson(
  narrative: Narrative,
  lessonCode: string,
): { chapter: NarrativeChapter; beat: NarrativeBeat } | undefined {
  return allBeats(narrative).find(({ beat }) => beat.lessonCode === lessonCode);
}

/** Narratives with a beat for this lesson, most recently updated first. */
export function narrativesForLesson(actor: User, lessonCode: string): Narrative[] {
  return readableNarratives(actor)
    .filter((n) => beatForLesson(n, lessonCode) !== undefined)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * What happened before this lesson, in story order.
 *
 * The prior beats up to but not including the current one. This is what makes
 * the next scene consistent without a designer re-reading the whole unit, and
 * it is what a narrative-aware assistant request is given instead of the
 * narrative in full.
 */
export function beatsBefore(
  narrative: Narrative,
  lessonCode: string,
): { chapter: NarrativeChapter; beat: NarrativeBeat }[] {
  const beats = allBeats(narrative);
  const index = beats.findIndex(({ beat }) => beat.lessonCode === lessonCode);
  return index <= 0 ? [] : beats.slice(0, index);
}

export function openThreads(narrative: Narrative): PlotThread[] {
  return narrative.plotThreads.filter((t) => !t.resolved);
}

/** Story arc moments grouped by stage, in the order a reader meets them. */
export function arcByStage(
  narrative: Narrative,
): { stage: StoryArcStage; moments: StoryArcMoment[] }[] {
  return STORY_ARC_STAGES.map((stage) => ({
    stage,
    moments: narrative.storyArc.filter((m) => m.stage === stage),
  }));
}

export const STORY_ARC_STAGE_LABEL: Record<StoryArcStage, string> = {
  opening: "Opening",
  rising_action: "Rising action",
  turning_point: "Turning point",
  complication: "Complication",
  climax: "Climax",
  resolution: "Resolution",
};

// ---------------------------------------------------------------------------
// Completeness
// ---------------------------------------------------------------------------

export type NarrativeCheck = { label: string; done: boolean; detail: string };

/**
 * What this narrative currently has.
 *
 * Advisory, and phrased as results rather than as rules to remember. The one
 * place it is binding is submission: `submissionBlockers` is the subset a
 * reviewer genuinely cannot work without.
 */
export function narrativeReadiness(narrative: Narrative): NarrativeCheck[] {
  const beats = allBeats(narrative);
  const joined = beats.filter(({ beat }) => beat.learningUnlock.trim().length > 0);
  const placed = beats.filter(({ beat }) => beat.lessonCode !== null);

  return [
    {
      label: "Premise",
      done: narrative.premise.trim().length > 0,
      detail: narrative.premise.trim()
        ? "One sentence a colleague could repeat."
        : "The one sentence the whole unit hangs on is not written yet.",
    },
    {
      label: "World",
      done: narrative.world.place.trim().length > 0,
      detail: narrative.world.place.trim()
        ? `Set in ${narrative.world.place}.`
        : "Where and when this happens is not set.",
    },
    {
      label: "Characters",
      done: narrative.characters.length > 0,
      detail:
        narrative.characters.length > 0
          ? `${narrative.characters.length} in the canon.`
          : "No one is in this story yet.",
    },
    {
      label: "Central problem",
      done: narrative.centralProblem.challenge.trim().length > 0,
      detail: narrative.centralProblem.challenge.trim()
        ? "The challenge that carries the unit is stated."
        : "Nothing yet says what the unit is actually about.",
    },
    {
      label: "Story arc",
      done: narrative.storyArc.length > 0,
      detail:
        narrative.storyArc.length > 0
          ? `${narrative.storyArc.length} moments mapped.`
          : "The shape of the story is not mapped.",
    },
    {
      label: "Chapters",
      done: narrative.chapters.length > 0,
      detail:
        narrative.chapters.length > 0
          ? `${narrative.chapters.length} chapters, ${beats.length} lesson beats.`
          : "No chapters, so no lesson has a place in the story.",
    },
    {
      label: "Beats joined to learning",
      done: beats.length > 0 && joined.length === beats.length,
      detail:
        beats.length === 0
          ? "No beats to join yet."
          : `${joined.length} of ${beats.length} beats say what the learning lets the student do. A beat without that is decoration.`,
    },
    {
      label: "Beats placed on lessons",
      done: beats.length > 0 && placed.length === beats.length,
      detail:
        beats.length === 0
          ? "No beats to place yet."
          : `${placed.length} of ${beats.length} beats name the lesson they run in.`,
    },
    {
      label: "Visual bible",
      done: narrative.visualBible.artDirection.trim().length > 0,
      detail: narrative.visualBible.artDirection.trim()
        ? "Art direction is set, so generated visuals have a rule to follow."
        : "No art direction, so every image would look like a different unit.",
    },
    {
      label: "Content boundaries",
      done:
        narrative.boundaries.mustStayConsistent.length > 0 ||
        narrative.boundaries.avoid.length > 0,
      detail:
        narrative.boundaries.mustStayConsistent.length > 0 ||
        narrative.boundaries.avoid.length > 0
          ? "What must hold and what to avoid are written down."
          : "Nothing records what must stay consistent, so nothing can be checked against it.",
    },
  ];
}

/**
 * What genuinely stops a submission.
 *
 * Deliberately short. A reviewer needs something to read and something to
 * check it against; everything else on the readiness list is a designer's own
 * business.
 */
export function submissionBlockers(narrative: Narrative): string[] {
  const blockers: string[] = [];
  if (narrative.title.trim().length === 0) blockers.push("It has no title.");
  if (narrative.premise.trim().length === 0) {
    blockers.push("It has no premise, so there is nothing to review it against.");
  }
  if (narrative.chapters.length === 0) {
    blockers.push("It has no chapters, so no lesson has a place in the story.");
  }
  const beats = allBeats(narrative);
  const unjoined = beats.filter(({ beat }) => beat.learningUnlock.trim().length === 0);
  if (beats.length > 0 && unjoined.length === beats.length) {
    blockers.push(
      "No beat says what the learning lets the student do, which is the thing that makes the story serve the lesson.",
    );
  }
  return blockers;
}
