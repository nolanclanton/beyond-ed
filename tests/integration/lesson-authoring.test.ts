import { beforeEach, describe, expect, it } from "vitest";

import { auditForTarget } from "@/lib/audit/log";
import {
  approveVersion,
  publishVersion,
  submitForReview,
} from "@/lib/curriculum/authoring";
import {
  addLessonMaterial,
  addLessonVideo,
  authoredLesson,
  authoringGate,
  createDraftVersion,
  lessonReadiness,
  moveLessonBlock,
  removeLessonBlock,
  removeLessonMaterial,
  removeQuizItem,
  saveLessonBlock,
  saveLessonScript,
  saveQuizItem,
} from "@/lib/curriculum/lesson-authoring";
import {
  bankItemById,
  itemsForLesson,
  resolveLessonContent,
} from "@/lib/curriculum/lesson-bank";
import { blocksInSection, sectionCounts } from "@/lib/curriculum/lesson-sections";
import { ensureSeeded } from "@/lib/db/seed";
import { clearDatabase, db } from "@/lib/db/store";
import type {
  BlockInput,
  QuizItemInput,
  ScriptInput,
} from "@/lib/curriculum/lesson-authoring";
import type { User } from "@/lib/db/types";

function user(id: string): User {
  const u = db().users.find((x) => x.id === id);
  if (!u) throw new Error(`missing ${id}`);
  return u;
}

/** The seeded Mathematics 6 draft, and the unit-rate lesson inside it. */
const DRAFT = "cv_Mathematics_6_2026_2";
const PUBLISHED = "cv_Mathematics_6_2026_1";
const LESSON = "MATH-06-L035";
const STANDARD = "6.RP.2";
/** A lesson in the same course that claims a different standard. */
const OTHER_LESSON = "MATH-06-L004";

function script(overrides: Partial<ScriptInput> = {}): ScriptInput {
  return {
    versionId: DRAFT,
    lessonCode: LESSON,
    relevance: "Two stores price the same pens differently.",
    goal: "Find and use a unit rate.",
    successCriteria: ["I can state a unit rate with its units."],
    vocabulary: [{ term: "Unit rate", meaning: "A rate stated per one unit." }],
    workedModel: [{ step: "Divide 150 by 5.", reasoning: "Per gallon means per one." }],
    guidedPractice: [
      { prompt: "24 pages in 3 minutes?", hint: "Divide by minutes.", answer: "8." },
    ],
    independentTask: "Compare two package sizes.",
    notesOutline: ["Rate versus unit rate"],
    reason: "Authoring the unit-rate lesson.",
    ...overrides,
  };
}

function block(overrides: Partial<BlockInput> = {}): BlockInput {
  return {
    versionId: DRAFT,
    lessonCode: LESSON,
    blockId: null,
    section: "instruction",
    kind: "text",
    text: "A rate compares two quantities with different units.",
    title: "",
    tone: "note",
    ordered: false,
    items: [],
    term: "",
    meaning: "",
    caption: "",
    headers: [],
    rows: [],
    url: "",
    alt: "",
    videoId: "",
    materialId: "",
    reason: "Writing the canvas.",
    ...overrides,
  };
}

function quizItem(overrides: Partial<QuizItemInput> = {}): QuizItemInput {
  return {
    versionId: DRAFT,
    lessonCode: LESSON,
    itemId: null,
    purpose: "exit_ticket",
    standard: STANDARD,
    stem: "A 12-pack costs $4.80. What is the cost per bottle?",
    choices: [
      { text: "$0.40", errorCode: "" },
      { text: "$2.50", errorCode: "inverted-division" },
    ],
    correctIndex: 0,
    rationale: "Divide the price by the number of bottles.",
    reason: "Adding an Exit Ticket item.",
    ...overrides,
  };
}

describe("lesson authoring: who may write (CLAUDE.md §3, §7)", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  it("POSITIVE: a curriculum author writes a script into a draft version", () => {
    expect(user("u_haddad").curriculumAuthor).toBe(true);
    const lesson = saveLessonScript(user("u_haddad"), script(), "k-script-1");

    expect(lesson.goal).toBe("Find and use a unit rate.");
    expect(lesson.successCriteria).toHaveLength(1);
    expect(authoredLesson(DRAFT, LESSON)?.id).toBe(lesson.id);
  });

  it("NEGATIVE: an org admin without the authorization cannot write", () => {
    expect(user("u_okonjo").curriculumAuthor).toBe(false);
    expect(() => saveLessonScript(user("u_okonjo"), script(), "k-script-2")).toThrow(
      /separate authorization you do not hold/,
    );
    expect(authoredLesson(DRAFT, LESSON)).toBeUndefined();
  });

  it("NEGATIVE: a teacher without the authorization cannot write", () => {
    // Ms Alvarez teaches AND holds the authorization; Dr Delacroix teaches and
    // does not. The check is on the authorization, never on the role.
    expect(user("u_alvarez").curriculumAuthor).toBe(true);
    expect(user("u_delacroix").curriculumAuthor).toBe(false);
    expect(() => saveLessonScript(user("u_delacroix"), script(), "k-script-3")).toThrow(
      /separate authorization you do not hold/,
    );
  });

  it("reports the gate before a control is offered", () => {
    expect(authoringGate(user("u_haddad"), DRAFT).editable).toBe(true);
    const readOnly = authoringGate(user("u_okonjo"), DRAFT);
    expect(readOnly.editable).toBe(false);
    expect(readOnly.blockers.join(" ")).toMatch(/separate authorization/);
  });
});

describe("lesson authoring: only a draft is editable (CLAUDE.md §7)", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  it("refuses a write once the version has left draft", () => {
    saveLessonScript(user("u_haddad"), script(), "k-1");
    submitForReview(user("u_haddad"), DRAFT, "Ready for review.", "k-review");

    expect(() =>
      saveLessonScript(user("u_haddad"), script({ goal: "Changed." }), "k-2"),
    ).toThrow(/editable only while a version is a draft/);
    expect(authoredLesson(DRAFT, LESSON)?.goal).toBe("Find and use a unit rate.");
  });

  it("refuses a write against a published version", () => {
    expect(() =>
      saveLessonScript(user("u_haddad"), script({ versionId: PUBLISHED }), "k-3"),
    ).toThrow(/editable only while a version is a draft/);
  });

  it("opens the next draft version to author into", () => {
    const created = createDraftVersion(
      user("u_haddad"),
      {
        courseTitle: "Mathematics 6",
        version: "2026.3",
        notes: "Unit 2 rewrite.",
        reason: "Starting the next revision.",
      },
      "k-new-version",
    );
    expect(created.status).toBe("draft");
    expect(authoringGate(user("u_haddad"), created.id).editable).toBe(true);

    // Version labels are stable: the same label cannot be opened twice.
    expect(() =>
      createDraftVersion(
        user("u_haddad"),
        {
          courseTitle: "Mathematics 6",
          version: "2026.3",
          notes: "",
          reason: "Trying again.",
        },
        "k-new-version-dup",
      ),
    ).toThrow(/already exists/);
  });
});

describe("quiz items must be able to direct something (CLAUDE.md §8)", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  it("POSITIVE: an aligned item with a diagnosed distractor is saved", () => {
    const item = saveQuizItem(user("u_haddad"), quizItem(), "k-item-1");
    expect(item.standard).toBe(STANDARD);
    expect(item.skill).toBe(STANDARD);
    expect(item.choices).toHaveLength(2);
    expect(item.correctChoiceId).toBe(item.choices[0].id);
    expect(item.choices[0].errorCode).toBeNull();
    expect(item.choices[1].errorCode).toBe("inverted-division");
  });

  it("NEGATIVE: an item cannot claim a standard the lesson does not cover", () => {
    expect(() =>
      saveQuizItem(user("u_haddad"), quizItem({ standard: "8.EE.5" }), "k-item-2"),
    ).toThrow(/not primary coverage/);
    expect(authoredLesson(DRAFT, LESSON)?.items ?? []).toHaveLength(0);
  });

  it("NEGATIVE: a distractor with no error family is refused", () => {
    expect(() =>
      saveQuizItem(
        user("u_haddad"),
        quizItem({
          choices: [
            { text: "$0.40", errorCode: "" },
            { text: "$2.50", errorCode: "" },
          ],
        }),
        "k-item-3",
      ),
    ).toThrow(/error it reveals/);
  });

  it("NEGATIVE: fewer than two choices is refused", () => {
    expect(() =>
      saveQuizItem(
        user("u_haddad"),
        quizItem({ choices: [{ text: "$0.40", errorCode: "" }] }),
        "k-item-4",
      ),
    ).toThrow(/two and six choices/);
  });

  it("NEGATIVE: an item cannot claim a standard another lesson carries", () => {
    // The whole point of a coverage record is that it belongs to one lesson.
    expect(() =>
      saveQuizItem(
        user("u_haddad"),
        quizItem({ lessonCode: OTHER_LESSON, standard: STANDARD }),
        "k-item-5",
      ),
    ).toThrow(/not primary coverage/);
  });

  it("NEGATIVE: an item cannot be written against a lesson in another course", () => {
    expect(() =>
      saveQuizItem(
        user("u_haddad"),
        quizItem({ lessonCode: "MATH-08-L003", standard: "8.EE.1" }),
        "k-item-8",
      ),
    ).toThrow(/is not a lesson in Mathematics 6/);
  });

  it("removing an item leaves the rest intact", () => {
    const item = saveQuizItem(user("u_haddad"), quizItem(), "k-item-6");
    saveQuizItem(
      user("u_haddad"),
      quizItem({ stem: "A printer prints 24 pages in 3 minutes. Pages per minute?" }),
      "k-item-7",
    );
    removeQuizItem(
      user("u_haddad"),
      { versionId: DRAFT, lessonCode: LESSON, itemId: item.id, reason: "Duplicate." },
      "k-item-remove",
    );
    expect(authoredLesson(DRAFT, LESSON)?.items).toHaveLength(1);
  });
});

describe("video is a reference plus a transcript (CLAUDE.md §12)", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  const video = {
    versionId: DRAFT,
    lessonCode: LESSON,
    title: "Finding a unit rate",
    url: "https://media.example.org/unit-rate.mp4",
    minutes: 6,
    transcript: "In this video we divide 150 miles by 5 gallons.",
    captionsUrl: null,
    reason: "Recorded walkthrough.",
  };

  it("POSITIVE: attaches a video with its transcript", () => {
    const saved = addLessonVideo(user("u_haddad"), video, "k-video-1");
    expect(saved.source).toBe("url");
    expect(saved.transcript.length).toBeGreaterThan(0);
    expect(authoredLesson(DRAFT, LESSON)?.videos).toHaveLength(1);
  });

  it("NEGATIVE: refuses a video with no transcript", () => {
    expect(() =>
      addLessonVideo(user("u_haddad"), { ...video, transcript: "   " }, "k-video-2"),
    ).toThrow(/transcript/);
    expect(authoredLesson(DRAFT, LESSON)).toBeUndefined();
  });

  it("NEGATIVE: refuses an address that is not a web address", () => {
    expect(() =>
      addLessonVideo(user("u_haddad"), { ...video, url: "unit-rate.mp4" }, "k-video-3"),
    ).toThrow(/complete web address/);
  });

  it("reports an unfinished lesson as unfinished", () => {
    const before = lessonReadiness(DRAFT, LESSON);
    expect(before.complete).toBe(false);
    expect(before.checks.find((c) => c.label === "Exit Ticket has items")?.done).toBe(
      false,
    );

    saveLessonScript(user("u_haddad"), script(), "k-r-1");
    saveQuizItem(user("u_haddad"), quizItem(), "k-r-2");
    addLessonVideo(user("u_haddad"), video, "k-r-3");
    // A lesson with nothing on its canvas is not finished, whatever else exists.
    expect(lessonReadiness(DRAFT, LESSON).complete).toBe(false);

    saveLessonBlock(user("u_haddad"), block(), "k-r-4");
    expect(lessonReadiness(DRAFT, LESSON).complete).toBe(true);
  });
});

describe("materials are a reference plus a way in (CLAUDE.md §12)", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  function material(overrides: Record<string, unknown> = {}) {
    return {
      versionId: DRAFT,
      lessonCode: LESSON,
      kind: "worksheet" as const,
      title: "Unit-price comparison sheet",
      url: "https://materials.example.org/unit-price.pdf",
      purpose: "Fill in the price per ounce, then decide which package is the better buy.",
      accessNote:
        "Tagged PDF, readable by a screen reader. A large-print copy is in the classroom folder.",
      minutes: 10,
      reason: "Added the comparison sheet the pilot classes asked for.",
      ...overrides,
    };
  }

  it("attaches a material with what it is for and how else to get it", () => {
    const saved = addLessonMaterial(user("u_haddad"), material(), "mat-1-xxxxxxxx");
    expect(saved.kind).toBe("worksheet");
    expect(saved.source).toBe("url");
    expect(authoredLesson(DRAFT, LESSON)?.materials).toHaveLength(1);
    expect(
      auditForTarget("authored_lesson", authoredLesson(DRAFT, LESSON)!.id).some(
        (e) => e.action === "curriculum.lesson_material_added",
      ),
    ).toBe(true);
  });

  it("refuses a material with no purpose, and one with no access note", () => {
    expect(() =>
      addLessonMaterial(user("u_haddad"), material({ purpose: "  " }), "mat-2-xxxxxxxx"),
    ).toThrow(/what the student does/i);
    expect(() =>
      addLessonMaterial(user("u_haddad"), material({ accessNote: "" }), "mat-3-xxxxxxxx"),
    ).toThrow(/access note/i);
    expect(authoredLesson(DRAFT, LESSON)).toBeUndefined();
  });

  it("places a material on the canvas and refuses to strand the block", () => {
    const saved = addLessonMaterial(user("u_haddad"), material(), "mat-4-xxxxxxxx");
    saveLessonBlock(
      user("u_haddad"),
      block({ kind: "material", materialId: saved.id }),
      "mat-5-xxxxxxxx",
    );
    expect(authoredLesson(DRAFT, LESSON)?.blocks[0].kind).toBe("material");

    expect(() =>
      removeLessonMaterial(
        user("u_haddad"),
        {
          versionId: DRAFT,
          lessonCode: LESSON,
          materialId: saved.id,
          reason: "Should be refused while a block places it.",
        },
        "mat-6-xxxxxxxx",
      ),
    ).toThrow(/canvas places this material/);
    expect(authoredLesson(DRAFT, LESSON)?.materials).toHaveLength(1);
  });

  it("a material block cannot reference a material the lesson does not have", () => {
    expect(() =>
      saveLessonBlock(
        user("u_haddad"),
        block({ kind: "material", materialId: "am_9999" }),
        "mat-7-xxxxxxxx",
      ),
    ).toThrow(/Attach the material to this lesson first/);
  });

  it("materials reach the student only through publication", () => {
    const saved = addLessonMaterial(user("u_haddad"), material(), "mat-8-xxxxxxxx");
    saveLessonScript(user("u_haddad"), script(), "mat-9-xxxxxxxx");
    expect(resolveLessonContent(DRAFT, LESSON).materials).toHaveLength(0);

    submitForReview(user("u_haddad"), DRAFT, "Ready.", "mat-10-xxxxxxxx");
    approveVersion(user("u_haddad"), DRAFT, "Approved.", "mat-11-xxxxxxxx");
    publishVersion(user("u_haddad"), DRAFT, "Published.", "mat-12-xxxxxxxx");

    const resolved = resolveLessonContent(DRAFT, LESSON);
    expect(resolved.materials).toHaveLength(1);
    expect(resolved.materials[0].id).toBe(saved.id);
    expect(resolved.materials[0].accessNote.length).toBeGreaterThan(0);
  });
});

describe("the lesson canvas (CLAUDE.md §7, §12)", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  it("places blocks in the order they are added, and reorders them", () => {
    saveLessonBlock(user("u_haddad"), block({ text: "First paragraph." }), "b-1");
    saveLessonBlock(
      user("u_haddad"),
      block({ kind: "heading", text: "Getting the division right" }),
      "b-2",
    );
    expect(authoredLesson(DRAFT, LESSON)?.blocks.map((b) => b.kind)).toEqual([
      "text",
      "heading",
    ]);

    const second = authoredLesson(DRAFT, LESSON)!.blocks[1];
    moveLessonBlock(
      user("u_haddad"),
      {
        versionId: DRAFT,
        lessonCode: LESSON,
        blockId: second.id,
        direction: "up",
        reason: "Heading belongs first.",
      },
      "b-move",
    );
    expect(authoredLesson(DRAFT, LESSON)?.blocks.map((b) => b.kind)).toEqual([
      "heading",
      "text",
    ]);
  });

  it("NEGATIVE: an image with no alternative text is refused", () => {
    expect(() =>
      saveLessonBlock(
        user("u_haddad"),
        block({
          kind: "image",
          url: "https://media.example.org/rate-table.png",
          alt: "   ",
        }),
        "b-img",
      ),
    ).toThrow(/alternative text/);
    expect(authoredLesson(DRAFT, LESSON)).toBeUndefined();
  });

  it("NEGATIVE: a video block cannot reference a video the lesson does not have", () => {
    expect(() =>
      saveLessonBlock(
        user("u_haddad"),
        block({ kind: "video", videoId: "av_nope" }),
        "b-vid",
      ),
    ).toThrow(/Attach the video to this lesson first/);
  });

  it("keeps a table rectangular against its own headings", () => {
    const saved = saveLessonBlock(
      user("u_haddad"),
      block({
        kind: "table",
        caption: "Same numbers, two questions",
        headers: ["Division", "Unit rate"],
        rows: [["3 ÷ 2", "1.5 cups per batch", "extra cell that has no column"]],
      }),
      "b-table",
    );
    expect(saved.kind).toBe("table");
    if (saved.kind === "table") {
      expect(saved.rows[0]).toHaveLength(2);
    }
  });

  it("NEGATIVE: a reader without the authorization cannot touch the canvas", () => {
    expect(() =>
      saveLessonBlock(user("u_okonjo"), block(), "b-deny"),
    ).toThrow(/separate authorization you do not hold/);
  });

  it("places an element in the part it was given, and each part keeps its own order", () => {
    saveLessonBlock(
      user("u_haddad"),
      block({ section: "instruction", text: "Rates compare two quantities." }),
      "s-1",
    );
    saveLessonBlock(
      user("u_haddad"),
      block({ section: "worked_model", text: "Divide 150 by 5." }),
      "s-2",
    );
    saveLessonBlock(
      user("u_haddad"),
      block({ section: "instruction", text: "The unit after 'per' is the divisor." }),
      "s-3",
    );

    const blocks = authoredLesson(DRAFT, LESSON)!.blocks;
    expect(sectionCounts(blocks)).toMatchObject({
      instruction: 2,
      worked_model: 1,
      relevance: 0,
    });
    expect(
      blocksInSection(blocks, "instruction").map((b) => (b.kind === "text" ? b.text : "")),
    ).toEqual([
      "Rates compare two quantities.",
      "The unit after 'per' is the divisor.",
    ]);
  });

  it("moving an element reorders it inside its own part and disturbs no other", () => {
    saveLessonBlock(user("u_haddad"), block({ section: "instruction", text: "A." }), "m-1");
    saveLessonBlock(user("u_haddad"), block({ section: "relevance", text: "Why." }), "m-2");
    saveLessonBlock(user("u_haddad"), block({ section: "instruction", text: "B." }), "m-3");

    const b = blocksInSection(authoredLesson(DRAFT, LESSON)!.blocks, "instruction")[1];
    moveLessonBlock(
      user("u_haddad"),
      {
        versionId: DRAFT,
        lessonCode: LESSON,
        blockId: b.id,
        direction: "up",
        reason: "B reads better first.",
      },
      "m-move",
    );

    const after = authoredLesson(DRAFT, LESSON)!.blocks;
    expect(
      blocksInSection(after, "instruction").map((x) => (x.kind === "text" ? x.text : "")),
    ).toEqual(["B.", "A."]);
    expect(
      blocksInSection(after, "relevance").map((x) => (x.kind === "text" ? x.text : "")),
    ).toEqual(["Why."]);
  });

  it("NEGATIVE: an element already first in its part will not move up past another part", () => {
    saveLessonBlock(user("u_haddad"), block({ section: "relevance", text: "Why." }), "e-1");
    saveLessonBlock(user("u_haddad"), block({ section: "instruction", text: "A." }), "e-2");

    const only = blocksInSection(authoredLesson(DRAFT, LESSON)!.blocks, "instruction")[0];
    expect(() =>
      moveLessonBlock(
        user("u_haddad"),
        {
          versionId: DRAFT,
          lessonCode: LESSON,
          blockId: only.id,
          direction: "up",
          reason: "Trying to climb out of the stage.",
        },
        "e-move",
      ),
    ).toThrow(/already first in Instruction/);
  });

  it("moving an element to another part re-places it at the end of that part", () => {
    saveLessonBlock(user("u_haddad"), block({ section: "instruction", text: "A." }), "x-1");
    saveLessonBlock(user("u_haddad"), block({ section: "instruction", text: "B." }), "x-2");
    saveLessonBlock(user("u_haddad"), block({ section: "notes", text: "Heading list." }), "x-3");

    const first = blocksInSection(authoredLesson(DRAFT, LESSON)!.blocks, "instruction")[0];
    saveLessonBlock(
      user("u_haddad"),
      block({ blockId: first.id, section: "notes", text: "A." }),
      "x-move",
    );

    const after = authoredLesson(DRAFT, LESSON)!.blocks;
    expect(
      blocksInSection(after, "instruction").map((b) => (b.kind === "text" ? b.text : "")),
    ).toEqual(["B."]);
    expect(
      blocksInSection(after, "notes").map((b) => (b.kind === "text" ? b.text : "")),
    ).toEqual(["Heading list.", "A."]);
  });

  it("a lesson is not ready while the instruction stage is empty, even if other parts are full", () => {
    saveLessonScript(user("u_haddad"), script(), "sec-script");
    saveLessonBlock(
      user("u_haddad"),
      block({ section: "worked_model", text: "Divide 150 by 5." }),
      "sec-b",
    );
    const check = lessonReadiness(DRAFT, LESSON).checks.find((c) =>
      c.label.startsWith("Instruction stage"),
    );
    expect(check?.done).toBe(false);
  });

  it("removing a block leaves the rest in order", () => {
    saveLessonBlock(user("u_haddad"), block({ text: "One." }), "b-a");
    saveLessonBlock(user("u_haddad"), block({ text: "Two." }), "b-b");
    saveLessonBlock(user("u_haddad"), block({ text: "Three." }), "b-c");
    const middle = authoredLesson(DRAFT, LESSON)!.blocks[1];
    removeLessonBlock(
      user("u_haddad"),
      {
        versionId: DRAFT,
        lessonCode: LESSON,
        blockId: middle.id,
        reason: "Said the same thing twice.",
      },
      "b-remove",
    );
    const remaining = authoredLesson(DRAFT, LESSON)!.blocks;
    expect(remaining).toHaveLength(2);
    expect(remaining.map((b) => (b.kind === "text" ? b.text : ""))).toEqual([
      "One.",
      "Three.",
    ]);
  });
});

describe("every write is idempotent, atomic, and audited (CLAUDE.md §1, §6)", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  it("a retried save does not write a second record", () => {
    const first = saveLessonScript(user("u_haddad"), script(), "same-key");
    const second = saveLessonScript(
      user("u_haddad"),
      script({ goal: "Different goal." }),
      "same-key",
    );
    expect(second.id).toBe(first.id);
    expect(db().authoredLessons).toHaveLength(1);
    expect(authoredLesson(DRAFT, LESSON)?.goal).toBe("Find and use a unit rate.");
  });

  it("a rejected item leaves nothing behind", () => {
    saveLessonScript(user("u_haddad"), script(), "k-a-1");
    const itemsBefore = authoredLesson(DRAFT, LESSON)?.items.length ?? 0;
    expect(() =>
      saveQuizItem(user("u_haddad"), quizItem({ standard: "8.EE.5" }), "k-a-2"),
    ).toThrow();
    expect(authoredLesson(DRAFT, LESSON)?.items.length ?? 0).toBe(itemsBefore);
    // The rolled-back attempt did not consume its idempotency key either.
    const retried = saveQuizItem(user("u_haddad"), quizItem(), "k-a-2");
    expect(retried.standard).toBe(STANDARD);
  });

  it("writes an audit event naming the actor and the reason", () => {
    const lesson = saveLessonScript(user("u_haddad"), script(), "k-audit-1");
    const events = auditForTarget("authored_lesson", lesson.id);
    expect(events).toHaveLength(1);
    expect(events[0].actorUserId).toBe("u_haddad");
    expect(events[0].action).toBe("curriculum.lesson_script_saved");
    expect(events[0].reason).toBe("Authoring the unit-rate lesson.");
    expect(events[0].after).toContain(LESSON);
  });
});

describe("authored content reaches students only through publication (CLAUDE.md §7)", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  function authorAndPublish() {
    saveLessonScript(user("u_haddad"), script(), "k-p-1");
    saveLessonBlock(user("u_haddad"), block(), "k-p-1b");
    saveQuizItem(user("u_haddad"), quizItem(), "k-p-2");
    submitForReview(user("u_haddad"), DRAFT, "Ready.", "k-p-3");
    approveVersion(user("u_haddad"), DRAFT, "Approved by committee.", "k-p-4");
    publishVersion(user("u_haddad"), DRAFT, "Publishing the 2026.2 revision.", "k-p-5");
  }

  it("a draft is not visible to students, however complete it is", () => {
    saveLessonScript(user("u_haddad"), script(), "k-d-1");
    const resolved = resolveLessonContent(DRAFT, LESSON);
    expect(resolved.source).not.toBe("authored");
  });

  it("publication makes the authored script the lesson for that version", () => {
    authorAndPublish();
    const resolved = resolveLessonContent(DRAFT, LESSON);
    expect(resolved.source).toBe("authored");
    expect(resolved.content?.goal).toBe("Find and use a unit rate.");
    expect(resolved.versionLabel).toBe("Mathematics 6 2026.2");
  });

  it("a section on an older version is untouched by the new one", () => {
    authorAndPublish();
    // The seeded enrollments are pinned to 2026.1 and must not move.
    const onOldVersion = resolveLessonContent(PUBLISHED, LESSON);
    expect(onOldVersion.source).toBe("demo");
    expect(onOldVersion.content?.goal).not.toBe("Find and use a unit rate.");
  });

  it("authored items replace the demo bank for that lesson, and score by id", () => {
    authorAndPublish();
    const authored = itemsForLesson(LESSON, "exit_ticket", DRAFT);
    expect(authored).toHaveLength(1);
    expect(authored[0].stem).toMatch(/12-pack/);

    // Older version keeps its own bank.
    const demo = itemsForLesson(LESSON, "exit_ticket", PUBLISHED);
    expect(demo.some((i) => i.stem.match(/12-pack/))).toBe(false);

    // Evidence records an item id; it must always resolve back to the item.
    const resolvedItem = bankItemById(authored[0].id);
    expect(resolvedItem?.correctChoiceId).toBe(authored[0].correctChoiceId);
  });
});
