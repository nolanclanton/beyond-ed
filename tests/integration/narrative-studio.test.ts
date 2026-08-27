import { beforeEach, describe, expect, it } from "vitest";

import { auditForTarget } from "@/lib/audit/log";
import { ensureSeeded } from "@/lib/db/seed";
import { clearDatabase, db } from "@/lib/db/store";
import type { Narrative, User } from "@/lib/db/types";
import { addAsset } from "@/lib/narrative/assets";
import { searchBank, NO_FILTERS } from "@/lib/narrative/bank";
import {
  allBeats,
  beatForLesson,
  narrativeReadiness,
  narrativesForLesson,
  readableNarratives,
  submissionBlockers,
  versionsOfNarrative,
} from "@/lib/narrative/bible";
import { transitionNarrative } from "@/lib/narrative/status";
import {
  ALL_DUPLICATION_PARTS,
  advanceNarrative,
  checkpointNarrative,
  createNarrative,
  duplicateNarrative,
  removeChapter,
  saveBeat,
  saveChapter,
  saveCharacter,
  saveNarrativeState,
  savePlotThread,
  saveVisualBible,
  setOfficialTemplate,
  shareNarrative,
} from "@/lib/narrative/studio";

/**
 * The Narrative Studio and Bank (vision §4, §5, §16, §17).
 *
 * The tests that matter most here are the duplication ones. "Editing a copy
 * never changes its source" is the single promise the whole reuse story rests
 * on, and it is the kind of promise a shallow copy quietly breaks — so it is
 * checked by mutating each side and reading the other, rather than by
 * inspecting how the copy was made.
 */

function user(id: string): User {
  const u = db().users.find((x) => x.id === id);
  if (!u) throw new Error(`missing ${id}`);
  return u;
}

/** Author, reviewer, and administrator. */
const LEAD = "u_haddad";
/** A teacher who holds `author` and nothing else. */
const AUTHOR = "u_alvarez";
/** An organization administrator with no curriculum authorization. */
const ADMIN = "u_okonjo";

const LESSON = "MATH-06-L035";

let keySeq = 0;
function key(label: string): string {
  keySeq += 1;
  return `test-${label}-${String(keySeq).padStart(4, "0")}`;
}

/**
 * A narrative with something in every part, so a copy has something to lose.
 *
 * `shareWith` matters: an unshared draft is private, and most of the reuse
 * tests need a source the other person is actually allowed to read.
 */
function fullNarrative(actor: User = user(LEAD), shareWith: string[] = []): Narrative {
  const created = createNarrative(
    actor,
    {
      title: "The Signal in the Water",
      premise: "A town's water readings stop making sense, and only ratios explain why.",
      subject: "Mathematics",
      courseId: "MATH-06",
      unitIds: [],
      genre: "Investigation",
      tone: "Urgent but not frightening",
      gradeBand: "6",
      audience: "Sixth graders",
      keywords: ["water", "investigation", "ratios"],
      reason: "Building the unit narrative.",
    },
    key("create"),
  );

  saveCharacter(
    actor,
    {
      narrativeId: created.id,
      character: {
        id: null,
        name: "Dr Imani Osei",
        role: "Municipal hydrologist",
        personality: "Precise, impatient with guesswork",
        motivation: "Find the source before the council votes",
        relationships: "Trusts the student; distrusts the contractor",
        appearance: "Tall, close-cropped grey hair, field jacket",
        knows: "That the readings are wrong. Not yet why.",
        arc: "From certainty to doubt to a better certainty",
        assetId: null,
      },
      reason: "Adding the lead character.",
    },
    key("character"),
  );

  saveVisualBible(
    actor,
    {
      narrativeId: created.id,
      artDirection: "Documentary realism, overcast light",
      visualTone: "Cool and factual",
      palette: "Slate blue, wet concrete, one warm sodium lamp",
      interfaceTreatment: "Municipal, unglamorous",
      recurringProps: ["Sample vials", "Clipboard"],
      motifs: ["Water surface"],
      symbols: ["Town seal"],
      defaultAspectRatio: "16:9",
      textInImages: "None.",
      accessibilityRules: ["Alternative text on every image."],
      ageAppropriateness: "No peril to named characters.",
      reason: "Setting the visual rules.",
    },
    key("visual"),
  );

  const withChapter = saveChapter(
    actor,
    {
      narrativeId: created.id,
      chapterId: null,
      title: "Chapter One: The First Reading",
      summary: "The anomaly is found.",
      unitId: null,
      reason: "Opening chapter.",
    },
    key("chapter"),
  );
  const chapterId = withChapter.chapters[0].id;

  saveBeat(
    actor,
    {
      narrativeId: created.id,
      chapterId,
      beatId: null,
      lessonCode: LESSON,
      academicObjective: "Find and use a unit rate.",
      narrativeEvent: "Dr Osei hands over two sample logs that disagree.",
      learningUnlock: "compare the two logs and say which one is impossible",
      reason: "First beat.",
    },
    key("beat"),
  );

  savePlotThread(
    actor,
    {
      narrativeId: created.id,
      threadId: null,
      kind: "question",
      summary: "Who filed the second log?",
      openedInChapterId: chapterId,
      note: "Answered in chapter three.",
      reason: "Tracking the mystery.",
    },
    key("thread"),
  );

  saveNarrativeState(
    actor,
    {
      narrativeId: created.id,
      happened: ["The anomaly was found."],
      studentsKnow: ["That two logs disagree."],
      cluesRevealed: ["A second signature on the log."],
      currentObjective: "Work out which log is impossible.",
      futureReveals: ["The contractor filed the second log."],
      reason: "Where the story stands.",
    },
    key("state"),
  );

  if (shareWith.length > 0) {
    shareNarrative(
      actor,
      { narrativeId: created.id, userIds: shareWith, reason: "Building this together." },
      key("fixture-share"),
    );
  }

  return db().narratives.find((n) => n.id === created.id) as Narrative;
}

beforeEach(() => {
  clearDatabase();
  ensureSeeded();
  keySeq = 0;
});

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

describe("who may build a narrative", () => {
  it("refuses an organization administrator without curriculum authoring", () => {
    expect(() =>
      createNarrative(
        user(ADMIN),
        {
          title: "Should not exist",
          premise: "",
          subject: "",
          courseId: null,
          unitIds: [],
          genre: "",
          tone: "",
          gradeBand: "",
          audience: "",
          keywords: [],
          reason: "Trying without the authorization.",
        },
        key("refused"),
      ),
    ).toThrow(/authorization/i);
  });

  it("refuses an edit by someone the narrative was not shared with", () => {
    const narrative = fullNarrative();
    expect(() =>
      saveChapter(
        user(AUTHOR),
        {
          narrativeId: narrative.id,
          chapterId: null,
          title: "Uninvited",
          summary: "",
          unitId: null,
          reason: "Editing someone else's draft.",
        },
        key("uninvited"),
      ),
    ).toThrow(/shared with you/i);
  });

  it("allows an edit once the owner shares it", () => {
    const narrative = fullNarrative();
    shareNarrative(
      user(LEAD),
      { narrativeId: narrative.id, userIds: [AUTHOR], reason: "Building this together." },
      key("share"),
    );
    const updated = saveChapter(
      user(AUTHOR),
      {
        narrativeId: narrative.id,
        chapterId: null,
        title: "Chapter Two",
        summary: "",
        unitId: null,
        reason: "Adding a chapter as a collaborator.",
      },
      key("shared-edit"),
    );
    expect(updated.chapters).toHaveLength(2);
  });

  it("lets only the owner change who can edit", () => {
    const narrative = fullNarrative();
    shareNarrative(
      user(LEAD),
      { narrativeId: narrative.id, userIds: [AUTHOR], reason: "Sharing." },
      key("share2"),
    );
    expect(() =>
      shareNarrative(
        user(AUTHOR),
        { narrativeId: narrative.id, userIds: [], reason: "Re-sharing what is not mine." },
        key("reshare"),
      ),
    ).toThrow(/only the owner/i);
  });

  it("refuses to share with someone who cannot author curriculum", () => {
    const narrative = fullNarrative();
    expect(() =>
      shareNarrative(
        user(LEAD),
        { narrativeId: narrative.id, userIds: [ADMIN], reason: "Sharing with an admin." },
        key("share-admin"),
      ),
    ).toThrow(/does not hold curriculum authoring/i);
  });
});

// ---------------------------------------------------------------------------
// Duplication independence — the promise the bank rests on
// ---------------------------------------------------------------------------

describe("duplicating a narrative", () => {
  it("creates a new record with its own identity and provenance", () => {
    const source = fullNarrative(user(LEAD), [AUTHOR]);
    const copy = duplicateNarrative(
      user(AUTHOR),
      {
        sourceNarrativeId: source.id,
        title: "The Signal in the Grid",
        parts: ALL_DUPLICATION_PARTS,
        reason: "Adapting it for a city-infrastructure setting.",
      },
      key("dup"),
    );

    expect(copy.id).not.toBe(source.id);
    expect(copy.title).toBe("The Signal in the Grid");
    expect(copy.basedOnNarrativeId).toBe(source.id);
    expect(copy.ownerUserId).toBe(AUTHOR);
    expect(copy.status).toBe("draft");
    expect(copy.official).toBe(false);
    expect(copy.reuseCount).toBe(0);
    // Sharing is not inherited: a private adaptation is private.
    expect(copy.sharedWithUserIds).toEqual([]);
  });

  it("counts the reuse on the source without changing its content", () => {
    const source = fullNarrative(user(LEAD), [AUTHOR]);
    const before = JSON.stringify({ ...source, reuseCount: 0 });

    duplicateNarrative(
      user(AUTHOR),
      {
        sourceNarrativeId: source.id,
        title: "A copy",
        parts: ALL_DUPLICATION_PARTS,
        reason: "Reusing the structure.",
      },
      key("dup2"),
    );

    const after = db().narratives.find((n) => n.id === source.id) as Narrative;
    expect(after.reuseCount).toBe(1);
    expect(JSON.stringify({ ...after, reuseCount: 0 })).toBe(before);
  });

  it("re-identifies every nested record, so nothing is shared by id", () => {
    const source = fullNarrative(user(LEAD), [AUTHOR]);
    const copy = duplicateNarrative(
      user(AUTHOR),
      {
        sourceNarrativeId: source.id,
        title: "A copy",
        parts: ALL_DUPLICATION_PARTS,
        reason: "Reusing the structure.",
      },
      key("dup3"),
    );

    const sourceIds = new Set([
      ...source.characters.map((c) => c.id),
      ...source.world.locations.map((l) => l.id),
      ...source.storyArc.map((m) => m.id),
      ...source.chapters.map((c) => c.id),
      ...allBeats(source).map(({ beat }) => beat.id),
      ...source.plotThreads.map((t) => t.id),
    ]);
    const copyIds = [
      ...copy.characters.map((c) => c.id),
      ...copy.world.locations.map((l) => l.id),
      ...copy.storyArc.map((m) => m.id),
      ...copy.chapters.map((c) => c.id),
      ...allBeats(copy).map(({ beat }) => beat.id),
      ...copy.plotThreads.map((t) => t.id),
    ];

    expect(copyIds.length).toBeGreaterThan(0);
    for (const id of copyIds) {
      expect(sourceIds.has(id), `${id} is shared with the source`).toBe(false);
    }
  });

  it("editing the copy never changes the source", () => {
    const source = fullNarrative(user(LEAD), [AUTHOR]);
    const sourceBefore = JSON.stringify(
      db().narratives.find((n) => n.id === source.id),
    );

    const copy = duplicateNarrative(
      user(AUTHOR),
      {
        sourceNarrativeId: source.id,
        title: "A copy",
        parts: ALL_DUPLICATION_PARTS,
        reason: "Reusing the structure.",
      },
      key("dup4"),
    );

    // Mutate every nested part of the copy.
    saveCharacter(
      user(AUTHOR),
      {
        narrativeId: copy.id,
        character: {
          ...copy.characters[0],
          id: copy.characters[0].id,
          name: "Someone Else Entirely",
          knows: "Something the original character never learns.",
        },
        reason: "Replacing the character.",
      },
      key("copy-char"),
    );
    saveChapter(
      user(AUTHOR),
      {
        narrativeId: copy.id,
        chapterId: copy.chapters[0].id,
        title: "A completely different chapter",
        summary: "Rewritten.",
        unitId: null,
        reason: "Rewriting the chapter.",
      },
      key("copy-chapter"),
    );
    saveNarrativeState(
      user(AUTHOR),
      {
        narrativeId: copy.id,
        happened: ["Something else happened."],
        studentsKnow: [],
        cluesRevealed: [],
        currentObjective: "A different objective.",
        futureReveals: [],
        reason: "Moving the copy's story on.",
      },
      key("copy-state"),
    );
    saveVisualBible(
      user(AUTHOR),
      {
        narrativeId: copy.id,
        artDirection: "Completely different art direction",
        visualTone: "",
        palette: "",
        interfaceTreatment: "",
        recurringProps: [],
        motifs: [],
        symbols: [],
        defaultAspectRatio: "1:1",
        textInImages: "",
        accessibilityRules: [],
        ageAppropriateness: "",
        reason: "Re-styling the copy.",
      },
      key("copy-visual"),
    );

    const sourceAfter = db().narratives.find((n) => n.id === source.id) as Narrative;
    // Only the reuse count moved, and that happened at duplication time.
    expect(JSON.stringify({ ...sourceAfter, reuseCount: 0 })).toBe(
      JSON.stringify({ ...JSON.parse(sourceBefore), reuseCount: 0 }),
    );
    expect(sourceAfter.characters[0].name).toBe("Dr Imani Osei");
    expect(sourceAfter.visualBible.artDirection).toBe(
      "Documentary realism, overcast light",
    );
  });

  it("editing the source never changes the copy", () => {
    const source = fullNarrative(user(LEAD), [AUTHOR]);
    const copy = duplicateNarrative(
      user(AUTHOR),
      {
        sourceNarrativeId: source.id,
        title: "A copy",
        parts: ALL_DUPLICATION_PARTS,
        reason: "Reusing the structure.",
      },
      key("dup5"),
    );
    const copyBefore = JSON.stringify(db().narratives.find((n) => n.id === copy.id));

    saveCharacter(
      user(LEAD),
      {
        narrativeId: source.id,
        character: {
          ...source.characters[0],
          name: "Dr Imani Osei-Bonsu",
          knows: "Everything, now.",
        },
        reason: "Renaming the character in the original.",
      },
      key("source-char"),
    );
    removeChapter(
      user(LEAD),
      {
        narrativeId: source.id,
        chapterId: source.chapters[0].id,
        reason: "Cutting the opening chapter.",
      },
      key("source-chapter"),
    );

    const copyAfter = db().narratives.find((n) => n.id === copy.id) as Narrative;
    expect(JSON.stringify(copyAfter)).toBe(copyBefore);
    expect(copyAfter.chapters).toHaveLength(1);
    expect(copyAfter.characters[0].name).toBe("Dr Imani Osei");
  });

  it("drops lesson placements even when beats are copied", () => {
    const source = fullNarrative(user(LEAD), [AUTHOR]);
    expect(beatForLesson(source, LESSON)).toBeDefined();

    const copy = duplicateNarrative(
      user(AUTHOR),
      {
        sourceNarrativeId: source.id,
        title: "A copy",
        parts: ALL_DUPLICATION_PARTS,
        reason: "Adapting for another course.",
      },
      key("dup6"),
    );

    const beats = allBeats(copy);
    expect(beats.length).toBeGreaterThan(0);
    for (const { beat } of beats) {
      expect(beat.lessonCode).toBeNull();
    }
    // The words survive; only the placement is gone.
    expect(beats[0].beat.narrativeEvent).toContain("Dr Osei");
  });

  it("leaves out the parts that were not chosen", () => {
    const source = fullNarrative(user(LEAD), [AUTHOR]);
    const copy = duplicateNarrative(
      user(AUTHOR),
      {
        sourceNarrativeId: source.id,
        title: "Structure only",
        parts: {
          ...ALL_DUPLICATION_PARTS,
          characters: false,
          visualBible: false,
          narrativeState: false,
        },
        reason: "Keeping the structure and none of the cast.",
      },
      key("dup7"),
    );

    expect(copy.characters).toEqual([]);
    expect(copy.visualBible.artDirection).toBe("");
    expect(copy.state.happened).toEqual([]);
    // The bible itself always comes.
    expect(copy.premise).toBe(source.premise);
    expect(copy.chapters).toHaveLength(1);
  });

  it("records the duplication as an attributable human action", () => {
    const source = fullNarrative(user(LEAD), [AUTHOR]);
    const copy = duplicateNarrative(
      user(AUTHOR),
      {
        sourceNarrativeId: source.id,
        title: "A copy",
        parts: ALL_DUPLICATION_PARTS,
        reason: "Adapting the mission structure.",
      },
      key("dup8"),
    );
    const events = auditForTarget("narrative", copy.id);
    const duplication = events.find((e) => e.action === "narrative.duplicate");
    expect(duplication).toBeDefined();
    expect(duplication?.actorUserId).toBe(AUTHOR);
    expect(duplication?.reason).toBe("Adapting the mission structure.");
  });

  it("lets a sharer duplicate a draft they can already read", () => {
    const source = fullNarrative(user(LEAD), [AUTHOR]);
    expect(source.status).toBe("draft");
    const copy = duplicateNarrative(
      user(AUTHOR),
      {
        sourceNarrativeId: source.id,
        title: "Copy of a shared draft",
        parts: ALL_DUPLICATION_PARTS,
        reason: "Adapting a draft I was shown.",
      },
      key("dup9"),
    );
    expect(copy.ownerUserId).toBe(AUTHOR);
    // Reading the source is not editing it, and the copy is the reader's own.
    expect(copy.sharedWithUserIds).toEqual([]);
  });
});

describe("a private draft is not in the bank", () => {
  it("is invisible to a colleague until it is shared or reviewed", () => {
    const narrative = fullNarrative();
    const visibleToOther = readableNarratives(user(AUTHOR)).map((n) => n.id);
    expect(visibleToOther).not.toContain(narrative.id);

    shareNarrative(
      user(LEAD),
      { narrativeId: narrative.id, userIds: [AUTHOR], reason: "Sharing it." },
      key("share3"),
    );
    expect(readableNarratives(user(AUTHOR)).map((n) => n.id)).toContain(narrative.id);
  });

  it("refuses a duplicate of a draft that has not been shared", () => {
    const narrative = fullNarrative();
    expect(() =>
      duplicateNarrative(
        user(AUTHOR),
        {
          sourceNarrativeId: narrative.id,
          title: "Copy of a private draft",
          parts: ALL_DUPLICATION_PARTS,
          reason: "Trying to copy a private draft.",
        },
        key("dup10"),
      ),
    ).toThrow(/unfinished draft belonging to someone else/i);
  });
});

// ---------------------------------------------------------------------------
// Lifecycle and separation of duties
// ---------------------------------------------------------------------------

describe("the narrative lifecycle", () => {
  it("raises on an illegal transition", () => {
    expect(() => transitionNarrative("draft", "published")).toThrow(
      /Illegal narrative transition/,
    );
    expect(() => transitionNarrative("archived", "published")).toThrow();
  });

  it("only the owner submits their own work for review", () => {
    const narrative = fullNarrative();
    shareNarrative(
      user(LEAD),
      { narrativeId: narrative.id, userIds: [AUTHOR], reason: "Sharing." },
      key("share4"),
    );
    expect(() =>
      advanceNarrative(
        user(AUTHOR),
        { narrativeId: narrative.id, to: "in_review", reason: "Submitting for them." },
        key("submit-other"),
      ),
    ).toThrow(/only the person who owns/i);
  });

  it("refuses a submission that a reviewer could not work with", () => {
    const bare = createNarrative(
      user(LEAD),
      {
        title: "Nothing in it",
        premise: "",
        subject: "",
        courseId: null,
        unitIds: [],
        genre: "",
        tone: "",
        gradeBand: "",
        audience: "",
        keywords: [],
        reason: "An empty narrative.",
      },
      key("bare"),
    );
    expect(submissionBlockers(bare).length).toBeGreaterThan(0);
    expect(() =>
      advanceNarrative(
        user(LEAD),
        { narrativeId: bare.id, to: "in_review", reason: "Submitting an empty one." },
        key("submit-bare"),
      ),
    ).toThrow(/not ready to review/i);
  });

  it("an author cannot approve their own narrative, even holding both grants", () => {
    const narrative = fullNarrative();
    advanceNarrative(
      user(LEAD),
      { narrativeId: narrative.id, to: "in_review", reason: "Ready for a second reader." },
      key("submit"),
    );
    // LEAD holds author, reviewer, AND administrator — and still cannot approve
    // their own work. The check is on the record's owner, not on what the actor
    // happens to hold.
    expect(() =>
      advanceNarrative(
        user(LEAD),
        { narrativeId: narrative.id, to: "approved_template", reason: "Approving my own." },
        key("self-approve"),
      ),
    ).toThrow(/someone else has to review it/i);
  });

  it("a reviewer who is not the author may approve", () => {
    const narrative = fullNarrative(user(AUTHOR));
    advanceNarrative(
      user(AUTHOR),
      { narrativeId: narrative.id, to: "in_review", reason: "Ready for a reader." },
      key("submit2"),
    );
    const approved = advanceNarrative(
      user(LEAD),
      { narrativeId: narrative.id, to: "approved_template", reason: "Read it; it holds." },
      key("approve"),
    );
    expect(approved.status).toBe("approved_template");
  });

  it("an author without the reviewer grant cannot approve anyone's narrative", () => {
    const narrative = fullNarrative();
    advanceNarrative(
      user(LEAD),
      { narrativeId: narrative.id, to: "in_review", reason: "Ready." },
      key("submit3"),
    );
    expect(() =>
      advanceNarrative(
        user(AUTHOR),
        { narrativeId: narrative.id, to: "approved_template", reason: "Approving." },
        key("approve-unauthorized"),
      ),
    ).toThrow(/reviewer authorization/i);
  });

  it("freezes a narrative that is in review", () => {
    const narrative = fullNarrative();
    advanceNarrative(
      user(LEAD),
      { narrativeId: narrative.id, to: "in_review", reason: "Ready." },
      key("submit4"),
    );
    expect(() =>
      saveChapter(
        user(LEAD),
        {
          narrativeId: narrative.id,
          chapterId: null,
          title: "Sneaking one in",
          summary: "",
          unitId: null,
          reason: "Editing while it is being reviewed.",
        },
        key("frozen-edit"),
      ),
    ).toThrow(/cannot be edited/i);
  });

  it("archiving is a state, not a delete", () => {
    const narrative = fullNarrative();
    const archived = advanceNarrative(
      user(LEAD),
      { narrativeId: narrative.id, to: "archived", reason: "Not using it this year." },
      key("archive"),
    );
    expect(archived.status).toBe("archived");
    expect(db().narratives.find((n) => n.id === narrative.id)).toBeDefined();
    expect(archived.chapters).toHaveLength(1);

    const restored = advanceNarrative(
      user(LEAD),
      { narrativeId: narrative.id, to: "draft", reason: "Picking it up again." },
      key("restore"),
    );
    expect(restored.status).toBe("draft");
  });

  it("only a curriculum administrator marks an official template", () => {
    const narrative = fullNarrative(user(AUTHOR));
    advanceNarrative(
      user(AUTHOR),
      { narrativeId: narrative.id, to: "in_review", reason: "Ready." },
      key("submit5"),
    );
    expect(() =>
      setOfficialTemplate(
        user(AUTHOR),
        { narrativeId: narrative.id, official: true, reason: "Marking my own official." },
        key("official-refused"),
      ),
    ).toThrow(/administrator/i);

    const official = setOfficialTemplate(
      user(LEAD),
      { narrativeId: narrative.id, official: true, reason: "Approved as a starting point." },
      key("official"),
    );
    expect(official.official).toBe(true);
  });

  it("refuses to make a draft an official template", () => {
    const narrative = fullNarrative();
    expect(() =>
      setOfficialTemplate(
        user(LEAD),
        { narrativeId: narrative.id, official: true, reason: "Marking a draft official." },
        key("official-draft"),
      ),
    ).toThrow(/draft cannot be an official template/i);
  });
});

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

describe("saved versions", () => {
  it("keeps a full snapshot that later edits do not reach", () => {
    const narrative = fullNarrative();
    const version = checkpointNarrative(
      user(LEAD),
      {
        narrativeId: narrative.id,
        label: "Before the rewrite",
        note: "Keeping a point to come back to.",
        aiAssisted: false,
        reason: "Checkpoint.",
      },
      key("checkpoint"),
    );

    saveCharacter(
      user(LEAD),
      {
        narrativeId: narrative.id,
        character: { ...narrative.characters[0], name: "Renamed after the checkpoint" },
        reason: "Renaming.",
      },
      key("post-checkpoint"),
    );

    const stored = versionsOfNarrative(narrative.id)[0];
    expect(stored.id).toBe(version.id);
    expect(stored.snapshot.characters[0].name).toBe("Dr Imani Osei");
    expect(
      (db().narratives.find((n) => n.id === narrative.id) as Narrative).characters[0].name,
    ).toBe("Renamed after the checkpoint");
  });

  it("records whether the assistant was involved", () => {
    const narrative = fullNarrative();
    checkpointNarrative(
      user(LEAD),
      {
        narrativeId: narrative.id,
        label: "After accepting a scene",
        note: "",
        aiAssisted: true,
        reason: "Checkpoint.",
      },
      key("checkpoint2"),
    );
    expect(versionsOfNarrative(narrative.id)[0].aiAssisted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Beats, and the join to a lesson
// ---------------------------------------------------------------------------

describe("beats", () => {
  it("puts one lesson at one point in the story", () => {
    const narrative = fullNarrative();
    const chapterId = narrative.chapters[0].id;
    expect(() =>
      saveBeat(
        user(LEAD),
        {
          narrativeId: narrative.id,
          chapterId,
          beatId: null,
          lessonCode: LESSON,
          academicObjective: "",
          narrativeEvent: "A second beat on the same lesson.",
          learningUnlock: "",
          reason: "Duplicating a placement.",
        },
        key("beat-clash"),
      ),
    ).toThrow(/already has a beat/i);
  });

  it("is found from the lesson it was placed on", () => {
    const narrative = fullNarrative();
    const found = narrativesForLesson(user(LEAD), LESSON);
    expect(found.map((n) => n.id)).toContain(narrative.id);
    expect(beatForLesson(narrative, LESSON)?.beat.learningUnlock).toBe(
      "compare the two logs and say which one is impossible",
    );
  });

  it("reopens a thread whose chapter is removed", () => {
    const narrative = fullNarrative();
    const chapterId = narrative.chapters[0].id;
    expect(narrative.plotThreads[0].openedInChapterId).toBe(chapterId);

    const after = removeChapter(
      user(LEAD),
      { narrativeId: narrative.id, chapterId, reason: "Cutting the chapter." },
      key("remove-chapter"),
    );
    expect(after.plotThreads[0].openedInChapterId).toBeNull();
    expect(after.plotThreads[0].resolved).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// The bank
// ---------------------------------------------------------------------------

describe("the Narrative Bank", () => {
  it("finds a narrative by a word in any of its stored fields", () => {
    const narrative = fullNarrative();
    shareNarrative(
      user(LEAD),
      { narrativeId: narrative.id, userIds: [AUTHOR], reason: "Sharing." },
      key("share5"),
    );

    for (const query of ["signal", "ratios", "investigation", "Osei", "Yusra"]) {
      const results = searchBank(user(AUTHOR), { ...NO_FILTERS, query });
      expect(results.map((r) => r.narrative.id), query).toContain(narrative.id);
    }
  });

  it("narrows rather than widens on a second word", () => {
    const narrative = fullNarrative();
    const hit = searchBank(user(LEAD), { ...NO_FILTERS, query: "signal water" });
    expect(hit.map((r) => r.narrative.id)).toContain(narrative.id);
    const miss = searchBank(user(LEAD), { ...NO_FILTERS, query: "signal helicopter" });
    expect(miss.map((r) => r.narrative.id)).not.toContain(narrative.id);
  });

  it("returns the same order for the same query", () => {
    fullNarrative();
    const a = searchBank(user(LEAD), NO_FILTERS).map((r) => r.narrative.id);
    const b = searchBank(user(LEAD), NO_FILTERS).map((r) => r.narrative.id);
    expect(a).toEqual(b);
  });

  it("shows a copy's provenance", () => {
    const source = fullNarrative();
    const copy = duplicateNarrative(
      user(LEAD),
      {
        sourceNarrativeId: source.id,
        title: "A copy",
        parts: ALL_DUPLICATION_PARTS,
        reason: "Reusing it.",
      },
      key("dup11"),
    );
    const entry = searchBank(user(LEAD), NO_FILTERS).find(
      (e) => e.narrative.id === copy.id,
    );
    expect(entry?.basedOnTitle).toBe("The Signal in the Water");
  });
});

// ---------------------------------------------------------------------------
// Readiness
// ---------------------------------------------------------------------------

describe("readiness", () => {
  it("reports what a narrative has rather than gating on it", () => {
    const narrative = fullNarrative();
    const checks = narrativeReadiness(narrative);
    const byLabel = new Map(checks.map((c) => [c.label, c]));
    expect(byLabel.get("Premise")?.done).toBe(true);
    expect(byLabel.get("Characters")?.done).toBe(true);
    expect(byLabel.get("Chapters")?.done).toBe(true);
    expect(byLabel.get("Beats joined to learning")?.done).toBe(true);
    // Nothing was written for the arc, and that is reported, not refused.
    expect(byLabel.get("Story arc")?.done).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// What an asset's image may be
// ---------------------------------------------------------------------------

describe("asset addresses", () => {
  function asset(url: string, source: "url" | "generated" = "url") {
    return {
      narrativeId: null,
      lessonCode: null,
      kind: "hero" as const,
      title: "A picture",
      brief: "",
      alt: "A description of the picture.",
      aspectRatio: "16:9" as const,
      source,
      url,
      generationId: null,
      status: "accepted" as const,
      reason: "Adding artwork.",
    };
  }

  it("accepts an ordinary https address", () => {
    const saved = addAsset(user(LEAD), asset("https://example.org/hero.png"), key("asset-ok"));
    expect(saved.url).toBe("https://example.org/hero.png");
  });

  it("refuses a script address", () => {
    expect(() =>
      addAsset(user(LEAD), asset("javascript:alert(1)"), key("asset-js")),
    ).toThrow(/http or https/i);
  });

  it("refuses a data URI from the designer-supplied path", () => {
    expect(() =>
      addAsset(
        user(LEAD),
        asset("data:text/html;base64,PHNjcmlwdD4="),
        key("asset-data"),
      ),
    ).toThrow(/http or https/i);
  });

  it("refuses anything but an image on the generated path", () => {
    expect(() =>
      addAsset(
        user(LEAD),
        { ...asset("data:text/html;base64,PHNjcmlwdD4=", "generated"), generationId: "gen_0001" },
        key("asset-gen-bad"),
      ),
    ).toThrow(/not an image/i);
  });

  it("refuses to accept an image nobody described", () => {
    expect(() =>
      addAsset(
        user(LEAD),
        { ...asset("https://example.org/hero.png"), alt: "" },
        key("asset-no-alt"),
      ),
    ).toThrow(/Alternative text is required/i);
  });
});
