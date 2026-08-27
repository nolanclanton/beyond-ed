/**
 * ============================================================================
 * DEMO SEED DATA — NOT PRODUCTION DATA
 * ============================================================================
 *
 * Every person below is fictional. No real student, staff member, roster, or
 * identifier appears here (CLAUDE.md §14 — no student PII in fixtures). The
 * seed is marked at the record level: `MEANINGFUL_SEED_REASON` appears in the
 * reason field of every audit event this file writes, so seeded actions are
 * distinguishable from actions a reviewer takes.
 *
 * Curriculum facts — course titles, unit names, day budgets, lesson codes, and
 * standard codes — are read from `lib/curriculum/data/`, which is generated
 * from the curriculum architecture workbook. Nothing here invents curriculum.
 * A student's weak skills are given as COURSE DAYS, and the standard behind
 * each is resolved from the catalog, so the seed cannot claim a standard the
 * curriculum does not have.
 *
 * Historical evidence uses item identifiers derived from each lesson's
 * assessment record (for example `A-MATH-06-L004#2`). Live work uses the
 * authored demo item bank in `demo-items.ts`.
 */
import { currentTimestamp, nextTimestamp, resetClock } from "@/lib/clock";
import { DEMO_ORGANIZATION, DEMO_SITES, siteDisplayName } from "./demo-identity";
import {
  COURSES,
  courseLessons,
  getCourse,
  primaryStandards,
  standardCode,
  assessmentId,
  type CatalogCourse,
} from "@/lib/curriculum/catalog";
import { prerequisiteSupports } from "@/lib/curriculum/prerequisites";
import {
  GRADE_CATEGORY_SHAPE,
  categoryIdFor,
} from "@/lib/grades/gradebook";
import { SUPPORT_MINUTES } from "@/lib/intervention/bank";
import { DEFAULT_RETURN_RULE, RULE_VERSIONS } from "@/lib/rules/versions";
import { appendAudit, appendGradeRecord, db, nextId } from "./store";
import { recordEvidence } from "@/lib/evidence/ledger";
import type {
  CourseVersion,
  CurriculumGrant,
  Enrollment,
  Intervention,
  RosterSection,
  User,
} from "./types";

const SEED_REASON = "Seeded demo record (not a real action).";

/**
 * Deterministic pseudo-randomness. FNV-1a over a string, with an avalanche
 * finalizer; no Math.random anywhere.
 *
 * The finalizer is not optional. Without it, two seeds differing only in their
 * last character return nearly the same value, because FNV's final multiply
 * barely diffuses the last byte into the high bits — and `unitInterval` reads
 * the high bits. That made `seed + "|f"` and `seed + "|l"` move together and
 * produced a roster of near-identical names.
 */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return h >>> 0;
}
function unitInterval(s: string): number {
  return hash(s) / 4294967296;
}

// ---------------------------------------------------------------------------
// The demo organization
// ---------------------------------------------------------------------------

type SeedCourse = {
  title: string;
  /** Lesson the student is currently on. Everything before it is complete. */
  at: string;
  /**
   * Course days this student has struggled on, and the error family shown.
   * The standard is resolved from the catalog, never written down here.
   */
  weak?: { day: number; errorCode: string }[];
};

type SeedStudent = {
  key: string;
  first: string;
  last: string;
  grade: number;
  site: "ORO" | "MESA";
  transferredFrom?: "ORO" | "MESA";
  courses: SeedCourse[];
};

const SEED_STUDENTS: SeedStudent[] = [
  {
    key: "amara", first: "Amara", last: "Oyelaran", grade: 6, site: "ORO",
    courses: [
      { title: "Mathematics 6", at: "MATH-06-L035", weak: [{ day: 20, errorCode: "fraction-or-ratio" }] },
      { title: "English 6", at: "ELA-06-L021", weak: [{ day: 7, errorCode: "evidence-without-support" }] },
      { title: "Integrated Science 6", at: "SCI-06-L078", weak: [{ day: 4, errorCode: "model-omits-component" }] },
      { title: "Grade 6 Ancient World", at: "HSS-06-L001" },
    ],
  },
  {
    key: "tobias", first: "Tobias", last: "Ferreira", grade: 7, site: "MESA",
    courses: [
      { title: "Mathematics 7", at: "MATH-07-L022", weak: [{ day: 16, errorCode: "unit-and-scale" }] },
      { title: "English 7", at: "ELA-07-L014" },
      { title: "Integrated Science 7", at: "SCI-07-L020", weak: [{ day: 5, errorCode: "model-omits-component" }] },
      { title: "Grade 7 Medieval/Early Modern World", at: "HSS-07-L018" },
    ],
  },
  {
    key: "diego", first: "Diego", last: "Reyes-Marin", grade: 8, site: "ORO",
    courses: [
      { title: "Mathematics 8", at: "MATH-08-L023", weak: [
        { day: 3, errorCode: "distribution-and-like-terms" },
        { day: 4, errorCode: "inverse-operation" }] },
      { title: "English 8", at: "ELA-08-L018", weak: [{ day: 7, errorCode: "ungrounded-inference" }] },
      { title: "Integrated Science 8", at: "SCI-08-L020" },
      { title: "Grade 8 U.S. Growth and Conflict", at: "HSS-08-L020" },
    ],
  },
  {
    key: "priya", first: "Priya", last: "Raghunathan", grade: 9, site: "ORO",
    courses: [
      { title: "Math 1", at: "MATH-1-L046", weak: [{ day: 16, errorCode: "variable-interpretation" }] },
      { title: "English 9", at: "ELA-09-L021" },
      { title: "Biology", at: "SCI-BIO-L020" },
      { title: "Human Geography", at: "HSS-HGEO-L010" },
    ],
  },
  {
    key: "jamal", first: "Jamal", last: "Ortiz", grade: 9, site: "ORO", transferredFrom: "MESA",
    courses: [
      { title: "Math 1", at: "MATH-1-L030", weak: [{ day: 2, errorCode: "unit-and-scale" }] },
      { title: "English 9", at: "ELA-09-L018", weak: [{ day: 7, errorCode: "quotation-without-commentary" }] },
      { title: "Biology", at: "SCI-BIO-L022" },
      { title: "Human Geography", at: "HSS-HGEO-L012" },
    ],
  },
  {
    key: "marcus", first: "Marcus", last: "Bell", grade: 10, site: "ORO",
    courses: [
      { title: "Math 2", at: "MATH-2-L025", weak: [{ day: 6, errorCode: "equality-and-equivalence" }] },
      { title: "English 10", at: "ELA-10-L018" },
      { title: "Chemistry", at: "SCI-CHEM-L020" },
      { title: "Modern World History", at: "HSS-MWH-L020", weak: [{ day: 5, errorCode: "single-cause" }] },
    ],
  },
  {
    key: "sofia", first: "Sofia", last: "Nakamura", grade: 11, site: "MESA",
    courses: [
      { title: "Math 3", at: "MATH-3-L020" },
      { title: "English 11", at: "ELA-11-L021", weak: [{ day: 7, errorCode: "quotation-without-commentary" }] },
      { title: "Physics", at: "SCI-PHYS-L022" },
      { title: "US History", at: "HSS-US-L022" },
    ],
  },
  {
    key: "lena", first: "Lena", last: "Whitcomb", grade: 12, site: "MESA",
    courses: [
      { title: "Statistics", at: "MATH-STATS-L020" },
      { title: "English 12", at: "ELA-12-L018" },
      { title: "Environmental Science", at: "SCI-ENV-L016", weak: [{ day: 6, errorCode: "correlation-as-cause" }] },
      { title: "Government", at: "HSS-GOV-L014" },
    ],
  },
];

const SEED_STAFF = [
  // The vision's "Teacher Author": builds curriculum without any administrative
  // access. She holds `author` and nothing more, so she can draft and submit
  // but cannot approve, publish, or change what the assistant may do.
  { key: "alvarez", first: "Renata", last: "Alvarez", role: "teacher" as const, site: "ORO" as const, subjects: ["Mathematics"], curriculumAuthor: true, curriculumGrants: ["author"] as CurriculumGrant[] },
  { key: "adjei", first: "Kwame", last: "Adjei", role: "teacher" as const, site: "ORO" as const, subjects: ["English Language Arts", "History-Social Science"], curriculumAuthor: false, curriculumGrants: [] as CurriculumGrant[] },
  { key: "delacroix", first: "Hana", last: "Delacroix", role: "teacher" as const, site: "ORO" as const, subjects: ["Science"], curriculumAuthor: false, curriculumGrants: [] as CurriculumGrant[] },
  { key: "thornbury", first: "Elias", last: "Thornbury", role: "teacher" as const, site: "MESA" as const, subjects: ["Mathematics", "Science"], curriculumAuthor: false, curriculumGrants: [] as CurriculumGrant[] },
  { key: "farouk", first: "Nadia", last: "Farouk", role: "teacher" as const, site: "MESA" as const, subjects: ["English Language Arts", "History-Social Science"], curriculumAuthor: false, curriculumGrants: [] as CurriculumGrant[] },
  { key: "salinas", first: "Victor", last: "Salinas", role: "site_admin" as const, site: "ORO" as const, subjects: [], curriculumAuthor: false, curriculumGrants: [] as CurriculumGrant[] },
  { key: "petrova", first: "Ingrid", last: "Petrova", role: "site_admin" as const, site: "MESA" as const, subjects: [], curriculumAuthor: false, curriculumGrants: [] as CurriculumGrant[] },
  { key: "okonjo", first: "Camille", last: "Okonjo", role: "org_admin" as const, site: null, subjects: [], curriculumAuthor: false, curriculumGrants: [] as CurriculumGrant[] },
  { key: "haddad", first: "Yusra", last: "Haddad", role: "curriculum_author" as const, site: null, subjects: [], curriculumAuthor: true, curriculumGrants: ["author", "reviewer", "administrator"] as CurriculumGrant[] },
];

/**
 * The five sites of the district. The named demo people below all sit at the
 * first two; the rest of the population is generated so that district and site
 * rollups have enough students to be meaningful — and so that small-group
 * suppression can be seen working where a slice really is small.
 *
 * Names come from `demo-identity.ts`, which is the only file to change when
 * rebranding the demo.
 */
const DISTRICT_SITES = DEMO_SITES;

/**
 * Name pools for the generated population. Fictional, and combined by index so
 * the roster is identical on every boot (CLAUDE.md §14 — no student PII).
 */
const FIRST_NAMES = [
  "Ava", "Elijah", "Isabella", "Liam", "Mateo", "Maya", "Noah", "Sofia", "Zoe",
  "Amir", "Bianca", "Caleb", "Daniela", "Ezra", "Fatima", "Gabriel", "Hana",
  "Ibrahim", "Jocelyn", "Kai", "Leila", "Micah", "Nadia", "Omar", "Priya",
  "Quinn", "Rosa", "Samuel", "Tessa", "Uriel", "Valeria", "Wren", "Ximena",
  "Yusuf", "Zara", "Adaeze", "Bodhi", "Cecilia", "Dashiell", "Esme",
];
/**
 * Assigns a name to the i-th person at a site with no repeats.
 *
 * `i * STRIDE` walks the whole first x last grid exactly once because the
 * stride is coprime with the grid size, so two people at the same site never
 * share a full name — which matters when a reviewer is clicking a roster.
 */
const NAME_STRIDE = 37;

function nameFor(siteSeed: string, index: number): { first: string; last: string } {
  const grid = FIRST_NAMES.length * LAST_NAMES.length;
  const offset = Math.floor(unitInterval(siteSeed + "|nameoffset") * grid);
  const code = (offset + index * NAME_STRIDE) % grid;
  return {
    first: FIRST_NAMES[code % FIRST_NAMES.length],
    last: LAST_NAMES[Math.floor(code / FIRST_NAMES.length)],
  };
}

const LAST_NAMES = [
  "Johnson", "Brooks", "Martin", "Patel", "Wilson", "Chen", "Kim", "Garcia",
  "Thomas", "Okafor", "Rivera", "Nguyen", "Haddad", "Silva", "Novak", "Ito",
  "Mbeki", "Larsen", "Ferrari", "Costa", "Duval", "Rahman", "Sandoval",
  "Whitfield", "Ortega", "Bergstrom", "Adeyemi", "Kowalski", "Marchetti",
  "Villanueva", "Osei", "Petrov", "Yamada", "Delgado", "Broussard",
];

/**
 * Grade 12 mathematics is a branch decision, not a single course: the pathway
 * graph opens Precalculus, Statistics, and Calculus off Math 3. Spreading a
 * cohort across them is what a real roster looks like — and it is what makes
 * some course-at-site slices genuinely small.
 */
const GRADE_12_MATH = ["Precalculus", "Statistics", "Calculus"];

function coursesForGrade(grade: number, seed: string): string[] {
  const base = GRADE_COURSES[grade] ?? [];
  if (grade !== 12) return base;
  const branch = GRADE_12_MATH[Math.floor(unitInterval(seed + "|branch") * GRADE_12_MATH.length)];
  return [branch, ...base.slice(1)];
}

/** Which four courses a grade level takes. Placement is policy, not inference. */
const GRADE_COURSES: Record<number, string[]> = {
  6: ["Mathematics 6", "English 6", "Integrated Science 6", "Grade 6 Ancient World"],
  7: ["Mathematics 7", "English 7", "Integrated Science 7", "Grade 7 Medieval/Early Modern World"],
  8: ["Mathematics 8", "English 8", "Integrated Science 8", "Grade 8 U.S. Growth and Conflict"],
  9: ["Math 1", "English 9", "Biology", "Human Geography"],
  10: ["Math 2", "English 10", "Chemistry", "Modern World History"],
  11: ["Math 3", "English 11", "Physics", "US History"],
  12: ["Statistics", "English 12", "Environmental Science", "Government"],
};

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

export function ensureSeeded(): void {
  const d = db();
  if (d.seeded) return;
  d.seeded = true;
  resetClock();

  const orgId = DEMO_ORGANIZATION.id;
  d.organizations.push({ id: orgId, name: DEMO_ORGANIZATION.name });

  for (const site of DISTRICT_SITES) {
    d.sites.push({
      id: site.id,
      orgId,
      name: siteDisplayName(site.shortName),
      shortName: site.shortName,
    });
  }
  // The named demo people are placed at the first two sites. The keys are
  // positional aliases, not place names.
  const sites = {
    ORO: d.sites[0],
    MESA: d.sites[1],
  };

  // --- People -------------------------------------------------------------
  const staffById = new Map<string, User>();
  for (const s of SEED_STAFF) {
    const user: User = {
      id: `u_${s.key}`,
      orgId,
      siteId: s.site ? sites[s.site].id : null,
      firstName: s.first,
      lastName: s.last,
      role: s.role,
      curriculumAuthor: s.curriculumAuthor,
      curriculumGrants: s.curriculumGrants,
      gradeLevel: null,
    };
    d.users.push(user);
    staffById.set(s.key, user);
  }

  const studentUsers = new Map<string, User>();
  for (const s of SEED_STUDENTS) {
    const user: User = {
      id: `u_${s.key}`,
      orgId,
      siteId: sites[s.site].id,
      firstName: s.first,
      lastName: s.last,
      role: "student",
      curriculumAuthor: false,
      gradeLevel: s.grade,
    };
    d.users.push(user);
    studentUsers.set(s.key, user);
  }

  // --- Course versions ----------------------------------------------------
  // Every catalog course gets a published 2026.1 version. Two extra versions
  // demonstrate the lifecycle: one draft and one in review.
  // Every course any student in the district can be placed into needs its
  // gradebook configuration, not only the named demo students' courses.
  const usedTitles = new Set([
    ...SEED_STUDENTS.flatMap((s) => s.courses.map((c) => c.title)),
    ...Object.values(GRADE_COURSES).flat(),
  ]);
  for (const course of COURSES) {
    d.courseVersions.push({
      id: `cv_${course.title.replace(/[^A-Za-z0-9]+/g, "_")}_2026_1`,
      courseTitle: course.title,
      version: "2026.1",
      status: "published",
      publishedAt: nextTimestamp(),
      retiredAt: null,
      notes: "Initial approved version for the 2026-2027 school year.",
    });
  }
  d.courseVersions.push({
    id: "cv_Mathematics_6_2026_2",
    courseTitle: "Mathematics 6",
    version: "2026.2",
    status: "draft",
    publishedAt: null,
    retiredAt: null,
    notes: "Revised Unit 5 readings and phenomena. Standards, skill ids, and return destinations unchanged.",
  });
  d.courseVersions.push({
    id: "cv_English_9_2026_2",
    courseTitle: "English 9",
    version: "2026.2",
    status: "in_review",
    publishedAt: null,
    retiredAt: null,
    notes: "New Unit 3 text set. Awaiting curriculum review.",
  });

  const publishedVersionFor = (title: string) =>
    d.courseVersions.find((v) => v.courseTitle === title && v.status === "published");

  // --- Grade categories ---------------------------------------------------
  for (const title of usedTitles) {
    for (const shape of GRADE_CATEGORY_SHAPE) {
      d.gradeCategories.push({
        id: `gc_${title.replace(/[^A-Za-z0-9]+/g, "_")}_${shape.suffix}`,
        courseTitle: title,
        name: shape.name,
        weight: shape.weight,
      });
    }
    d.gradebookConfigs.push({
      id: `gbc_${title.replace(/[^A-Za-z0-9]+/g, "_")}`,
      courseTitle: title,
      ruleVersion: RULE_VERSIONS.grading,
      scale: [
        { min: 90, letter: "A" },
        { min: 80, letter: "B" },
        { min: 70, letter: "C" },
        { min: 60, letter: "D" },
        { min: 0, letter: "F" },
      ],
    });
  }

  // --- Roster sections ----------------------------------------------------
  const teacherFor = (siteKey: "ORO" | "MESA", subject: string): User => {
    const match = SEED_STAFF.find(
      (s) => s.role === "teacher" && s.site === siteKey && s.subjects.includes(subject),
    );
    return staffById.get(match?.key ?? (siteKey === "ORO" ? "alvarez" : "thornbury")) as User;
  };

  // Keyed by site ID, not by the seed's shorthand: the generated pass uses the
  // same key, and a mismatch would create two sections of one course at one
  // site with different teachers.
  const sectionKey = (siteId: string, title: string) => `${siteId}::${title}`;
  const sectionsByKey = new Map<string, RosterSection>();
  let period = 0;

  for (const s of SEED_STUDENTS) {
    for (const c of s.courses) {
      const key = sectionKey(sites[s.site].id, c.title);
      if (sectionsByKey.has(key)) continue;
      const course = getCourse(c.title);
      if (!course) continue;
      const version = publishedVersionFor(c.title);
      if (!version) continue;
      period += 1;
      const section: RosterSection = {
        id: `sec_${s.site.toLowerCase()}_${c.title.replace(/[^A-Za-z0-9]+/g, "_")}`,
        siteId: sites[s.site].id,
        courseTitle: c.title,
        courseVersionId: version.id,
        teacherId: teacherFor(s.site, course.subject).id,
        period: `Period ${((period - 1) % 6) + 1}`,
        cycle: 2,
        dayInCycle: 5,
      };
      d.sections.push(section);
      sectionsByKey.set(key, section);
    }
  }

  // --- Enrollments, lesson states, evidence, grades -----------------------
  for (const s of SEED_STUDENTS) {
    const student = studentUsers.get(s.key) as User;
    for (const c of s.courses) {
      const course = getCourse(c.title);
      const section = sectionsByKey.get(sectionKey(sites[s.site].id, c.title));
      if (!course || !section) continue;

      const enrollment: Enrollment = {
        id: `enr_${s.key}_${c.title.replace(/[^A-Za-z0-9]+/g, "_")}`,
        studentId: student.id,
        sectionId: section.id,
        status: "active",
        courseTitle: c.title,
        courseVersionId: section.courseVersionId,
        startedAt: nextTimestamp(),
        transferredFromEnrollmentId: s.transferredFrom
          ? `enr_${s.key}_${c.title.replace(/[^A-Za-z0-9]+/g, "_")}_prior`
          : null,
      };
      d.enrollments.push(enrollment);

      seedPathway(course, enrollment, student, c, section.teacherId);
    }
  }

  seedDistrictPopulation(orgId, sectionsByKey, publishedVersionFor);
  seedInterventions(staffById, studentUsers);
  seedMessages(staffById, studentUsers);
  seedNarrative(orgId, staffById);
}

/**
 * One demonstration narrative, so the Narrative Bank and the Studio have
 * something in them on a fresh boot.
 *
 * Deliberately a single, complete one rather than a shelf of thin ones: the
 * point of the bank is that a designer can read a narrative, judge whether it
 * is worth building on, and duplicate it — and none of that can be judged from
 * a stub. It carries a beat on `MATH-06-L035`, which is the lesson the studio's
 * own demonstration content is written against, so the lesson workshop's
 * narrative transition has something real to show.
 *
 * Written by the curriculum lead and shared with the mathematics teacher who
 * holds `author`, which is the vision's "Teacher Author" working alongside a
 * designer rather than under one.
 */
function seedNarrative(orgId: string, staff: Map<string, User>): void {
  const d = db();
  const lead = staff.get("haddad") as User;
  const teacherAuthor = staff.get("alvarez") as User;
  const now = currentTimestamp();

  const chapterOne = nextId("cha");
  const chapterTwo = nextId("cha");

  d.narratives.push({
    id: nextId("nar"),
    orgId,
    status: "draft",
    official: false,
    title: "The Signal in the Water",
    premise:
      "A town's water readings stop agreeing with each other, and only proportional reasoning can say which set is impossible.",
    subject: "Mathematics",
    courseId: "MATH-06",
    unitIds: [],
    genre: "Investigation",
    tone: "Urgent but never frightening. Nobody is in danger; the town is.",
    gradeBand: "6",
    audience: "Sixth graders who have met ratios but not rates",
    world: {
      place: "Ashfield, a river town of about nine thousand people",
      period: "The present day",
      technologyLevel:
        "Ordinary municipal equipment. Clipboards and a decade-old sensor network.",
      worldRules: [
        "Every measurement in this world is real and checkable. Nothing is solved by a hunch.",
        "Adults are competent and busy. They need the student because they are stretched, not because they are foolish.",
        "No mystery is resolved by an authority figure simply announcing the answer.",
      ],
      constraints: [
        "No contaminated-water imagery, and nobody falls ill.",
        "The municipal politics stay procedural: a council vote, not a conspiracy.",
      ],
      locations: [
        {
          id: nextId("loc"),
          name: "The Ashfield pump house",
          description:
            "A low brick building beside the weir, louder inside than anyone expects. Two banks of gauges, one of them thirty years newer than the other.",
          significance:
            "Where the two disagreeing logs are kept, and where the student first sees both.",
          visualReference:
            "Overcast daylight through high windows. Wet concrete, painted steel, one warm sodium lamp over the desk.",
        },
        {
          id: nextId("loc"),
          name: "The council annexe",
          description:
            "A meeting room with a laminated map of the water network and chairs for more people than ever attend.",
          significance: "Where the findings have to hold up in front of people who can act.",
          visualReference: "Fluorescent, flat, municipal. The map is the only colour.",
        },
      ],
    },
    characters: [
      {
        id: nextId("chr"),
        name: "Dr Imani Osei",
        role: "Municipal hydrologist",
        personality: "Precise, warm in private, impatient with guesswork.",
        motivation:
          "Find out which log is wrong before the council votes on a replacement network she thinks is unnecessary.",
        relationships:
          "Trusts the student's arithmetic more than she trusts the contractor's summary. Went to school with the council chair.",
        appearance:
          "Tall, close-cropped grey hair, a field jacket that has been rained on many times.",
        knows:
          "That the two logs disagree, and that both cannot be right. Not yet why, and not yet who filed the second one.",
        arc: "From certainty, through doubt, to a better-founded certainty she can defend in public.",
        assetId: null,
      },
      {
        id: nextId("chr"),
        name: "Petra Vance",
        role: "Contractor's site engineer",
        personality: "Genial, quick, allergic to being slowed down.",
        motivation: "Get the replacement network signed off before the quarter closes.",
        relationships: "Cordial with Dr Osei and quietly dismissive of her objections.",
        appearance: "Hi-vis over a good coat. Always holding a tablet.",
        knows:
          "That her firm's sensors report in different units from the old ones. She has not thought about it hard.",
        arc: "From dismissal to genuine alarm, and then to being useful.",
        assetId: null,
      },
    ],
    centralProblem: {
      challenge:
        "Two sets of water-flow readings for the same week disagree by a factor nobody has pinned down.",
      stakes:
        "The council votes in three weeks on replacing a network that may not need replacing.",
      objective:
        "Work out which readings are impossible, and be able to show why to people who are not mathematicians.",
      studentRole:
        "Dr Osei has the readings and no time. The student has the time and is learning exactly the reasoning the readings need.",
    },
    storyArc: [
      {
        id: nextId("arc"),
        stage: "opening",
        summary: "Dr Osei shows the student two logs of the same week that cannot both be true.",
      },
      {
        id: nextId("arc"),
        stage: "rising_action",
        summary:
          "Each lesson's reasoning eliminates one explanation, and the remaining ones get harder.",
      },
      {
        id: nextId("arc"),
        stage: "turning_point",
        summary:
          "The second log turns out to be in different units — which is a smaller problem and a worse one.",
      },
      {
        id: nextId("arc"),
        stage: "resolution",
        summary:
          "The student's own comparison is what the council actually reads, in the student's own words.",
      },
    ],
    chapters: [
      {
        id: chapterOne,
        title: "Chapter One: Two Logs, One Week",
        summary: "The anomaly is found, and the shape of the problem becomes clear.",
        unitId: null,
        beats: [
          {
            id: nextId("bea"),
            lessonCode: "MATH-06-L035",
            academicObjective: "Find and use a unit rate.",
            narrativeEvent:
              "Dr Osei hands over both logs at the pump house and asks a question she has not had time to answer: per hour, do these two even describe the same river?",
            learningUnlock:
              "state each log as a rate per hour and say plainly which one is impossible",
          },
        ],
      },
      {
        id: chapterTwo,
        title: "Chapter Two: The Second Signature",
        summary: "Who filed the second log, and what were they measuring in?",
        unitId: null,
        beats: [],
      },
    ],
    state: {
      happened: [
        "The student met Dr Osei at the pump house and saw both logs.",
        "Both logs cover the same week of the same river.",
      ],
      studentsKnow: [
        "That the two logs disagree.",
        "That the council votes in three weeks.",
        "That Petra Vance's firm installed the newer sensors.",
      ],
      cluesRevealed: [
        "A second signature at the foot of the newer log that Dr Osei does not recognise.",
      ],
      currentObjective:
        "Express both logs as a rate per hour and work out which one cannot be right.",
      futureReveals: [
        "The newer sensors report in litres per second while the old ones report in cubic metres per hour. Nobody converted.",
        "The second signature is Petra Vance's, from her first week on site.",
      ],
    },
    plotThreads: [
      {
        id: nextId("thr"),
        kind: "question",
        summary: "Whose signature is at the foot of the newer log?",
        openedInChapterId: chapterOne,
        resolvedInChapterId: null,
        resolved: false,
        note: "Planned for chapter two. Do not answer it earlier.",
      },
      {
        id: nextId("thr"),
        kind: "objective",
        summary: "Produce something the council will actually read before the vote.",
        openedInChapterId: chapterOne,
        resolvedInChapterId: null,
        resolved: false,
        note: "The unit's final task.",
      },
    ],
    visualBible: {
      artDirection:
        "Documentary realism under overcast light. Municipal, unglamorous, and specific — this is a real town with a real budget.",
      visualTone: "Cool and factual, never ominous.",
      palette:
        "Slate blue, wet concrete grey, painted steel green, and exactly one warm sodium lamp per scene.",
      interfaceTreatment:
        "Gauges and printed logs. No glowing screens, no futuristic overlays.",
      recurringProps: ["Sample vials in a foam tray", "A clipboard with a bulldog clip", "The laminated network map"],
      motifs: ["The surface of moving water", "Two readings side by side"],
      symbols: ["The Ashfield town seal — a weir and three fish"],
      defaultAspectRatio: "16:9",
      textInImages:
        "None. Anything a student must read belongs in the lesson, where a screen reader can reach it.",
      accessibilityRules: [
        "Every image carries alternative text describing what it shows, not that it is an image.",
        "Meaning is never carried by colour alone; the two logs are told apart by label, not by hue.",
      ],
      ageAppropriateness:
        "No peril to named characters, no illness, no imagery of contaminated water.",
    },
    boundaries: {
      mustStayConsistent: [
        "Dr Osei never simply announces the answer. The student's reasoning is what settles it.",
        "Every number in the story is checkable, and the arithmetic is always doable with what the lesson has taught.",
        "The town is Ashfield and the river is unnamed.",
      ],
      avoid: [
        "Illness, contamination imagery, or anyone coming to harm.",
        "Villains. Petra Vance is wrong, not dishonest.",
        "Resolving the unit with a coincidence.",
      ],
      requiredFraming: [
        "Adults are competent and stretched, never foolish.",
        "The mathematics is what makes the student useful, not a hunch or a lucky guess.",
      ],
    },
    keywords: ["water", "investigation", "rates", "civic", "measurement"],
    basedOnNarrativeId: null,
    reuseCount: 0,
    ownerUserId: lead.id,
    sharedWithUserIds: [teacherAuthor.id],
    createdAt: now,
    updatedAt: now,
    updatedByUserId: lead.id,
  });

  appendAudit({
    id: nextId("aud"),
    actorUserId: lead.id,
    actorRole: lead.role,
    scope: `org:${orgId}`,
    action: "narrative.create",
    targetEntity: "narrative",
    targetId: d.narratives[d.narratives.length - 1].id,
    before: null,
    after: JSON.stringify({ title: "The Signal in the Water", status: "draft" }),
    reason: SEED_REASON,
    idempotencyKey: `seed:narrative:${orgId}`,
    requestId: `seed:narrative:${orgId}`,
    recordedAt: now,
  });
}

/**
 * Generates the rest of the district so site and organization rollups have a
 * real population behind them: 584 students and 37 teachers across five sites.
 *
 * Everything is derived from a hash of the record's own identity, so the whole
 * district is identical on every boot. Background students carry a lighter
 * evidence footprint than the named demo students — enough for completion,
 * performance, and readiness rollups to mean something, without seeding tens of
 * thousands of rows nobody reads.
 */
function seedDistrictPopulation(
  orgId: string,
  sectionsByKey: Map<string, RosterSection>,
  publishedVersionFor: (title: string) => CourseVersion | undefined,
): void {
  const d = db();

  for (const site of DISTRICT_SITES) {
    const namedStudents = d.users.filter(
      (u) => u.role === "student" && u.siteId === site.id,
    ).length;
    const namedTeachers = d.users.filter(
      (u) => u.role === "teacher" && u.siteId === site.id,
    ).length;

    // --- Staff ---------------------------------------------------------
    const subjectRota = [
      ["Mathematics"],
      ["English Language Arts"],
      ["Science"],
      ["History-Social Science"],
      ["Mathematics", "Science"],
      ["English Language Arts", "History-Social Science"],
      ["Mathematics"],
      ["English Language Arts"],
      ["Science"],
    ];
    const siteTeachers: User[] = d.users.filter(
      (u) => u.role === "teacher" && u.siteId === site.id,
    );
    for (let i = namedTeachers; i < site.teachers; i++) {
      const name = nameFor(`${site.id}|staff`, i);
      const teacher: User = {
        id: `u_t_${site.id}_${i}`,
        orgId,
        siteId: site.id,
        firstName: name.first,
        lastName: name.last,
        role: "teacher",
        curriculumAuthor: false,
        gradeLevel: null,
      };
      d.users.push(teacher);
      siteTeachers.push(teacher);
    }

    // Every site needs exactly one site administrator.
    if (!d.users.some((u) => u.role === "site_admin" && u.siteId === site.id)) {
      const name = nameFor(`${site.id}|staff`, site.teachers + 3);
      d.users.push({
        id: `u_sa_${site.id}`,
        orgId,
        siteId: site.id,
        firstName: name.first,
        lastName: name.last,
        role: "site_admin",
        curriculumAuthor: false,
        gradeLevel: null,
      });
    }

    /**
     * Every course offered at the site gets exactly one section, and sections
     * are dealt round-robin to the teachers who cover that subject.
     *
     * Round-robin rather than a hash: a hash leaves some teachers with nothing
     * to teach, which is not a roster — it is a data-quality warning. Dealing
     * in order guarantees every teacher carries load and keeps the assignment
     * deterministic.
     */
    const offeredTitles = [
      ...new Set([...Object.values(GRADE_COURSES).flat(), ...GRADE_12_MATH]),
    ].sort();

    const dealtSoFar = new Map<string, number>();
    for (const title of offeredTitles) {
      const key = `${site.id}::${title}`;
      if (sectionsByKey.has(key)) continue;
      const course = getCourse(title);
      const version = publishedVersionFor(title);
      if (!course || !version) continue;

      const matches = siteTeachers.filter((_, i) =>
        subjectRota[i % subjectRota.length].includes(course.subject),
      );
      const pool = matches.length > 0 ? matches : siteTeachers;
      const dealt = dealtSoFar.get(course.subject) ?? 0;
      dealtSoFar.set(course.subject, dealt + 1);

      const section: RosterSection = {
        id: `sec_${site.id}_${title.replace(/[^A-Za-z0-9]+/g, "_")}`,
        siteId: site.id,
        courseTitle: title,
        courseVersionId: version.id,
        teacherId: pool[dealt % pool.length].id,
        period: `Period ${(dealt % 6) + 1}`,
        cycle: 2,
        dayInCycle: 5,
      };
      d.sections.push(section);
      sectionsByKey.set(key, section);
    }

    // --- Students ------------------------------------------------------
    for (let i = namedStudents; i < site.students; i++) {
      const seed = `${site.id}|student|${i}`;
      const grade = 6 + Math.floor(unitInterval(seed + "|g") * 7);
      const name = nameFor(`${site.id}|roster`, i);
      const student: User = {
        id: `u_s_${site.id}_${i}`,
        orgId,
        siteId: site.id,
        firstName: name.first,
        lastName: name.last,
        role: "student",
        curriculumAuthor: false,
        gradeLevel: grade,
      };
      d.users.push(student);

      const titles = coursesForGrade(grade, seed);
      titles.forEach((title) => {
        const course = getCourse(title);
        if (!course) return;

        const section = sectionsByKey.get(`${site.id}::${title}`);
        if (!section) return;

        const enrollment: Enrollment = {
          id: `enr_${student.id}_${title.replace(/[^A-Za-z0-9]+/g, "_")}`,
          studentId: student.id,
          sectionId: section.id,
          status: "active",
          courseTitle: title,
          courseVersionId: section.courseVersionId,
          startedAt: currentTimestamp(),
          transferredFromEnrollmentId: null,
        };
        d.enrollments.push(enrollment);

        seedLightPathway(course, enrollment, student, section.teacherId, seed + `|${title}`);
      });
    }
  }
}

/**
 * A background student's history: a handful of completed lessons with one
 * grade record each and a small evidence sample, then their current lesson.
 * Lessons they have not reached get no row at all — reads treat a missing
 * lesson state as locked, which is what it is.
 */
function seedLightPathway(
  course: CatalogCourse,
  enrollment: Enrollment,
  student: User,
  teacherId: string,
  seed: string,
): void {
  const d = db();
  const lessons = courseLessons(course);
  // Between 2 and 7 lessons in, so pacing varies across the roster.
  const reached = 2 + Math.floor(unitInterval(seed + "|pos") * 6);
  const ability = 0.45 + unitInterval(seed + "|ability") * 0.5;

  lessons.slice(0, reached + 1).forEach((lesson, index) => {
    const isCurrent = index === reached;
    d.lessonStates.push({
      id: nextId("ls"),
      enrollmentId: enrollment.id,
      lessonCode: lesson.code,
      status: isCurrent ? "available" : "completed",
      stage: isCurrent ? 1 : 10,
      attempts: isCurrent ? 0 : 1,
      updatedAt: currentTimestamp(),
    });
    if (isCurrent) return;

    const standards = primaryStandards(lesson).map(standardCode);
    const skills = standards.length > 0 ? standards : [`${lesson.code}-readiness`];
    let earned = 0;
    for (let i = 0; i < 4; i++) {
      const correct = unitInterval(`${seed}|${lesson.code}|${i}`) < ability;
      if (correct) earned += 1;
    }

    // One evidence row per completed lesson keeps the readiness rollup real
    // without seeding four rows for every student in the district.
    const skill = skills[0];
    recordEvidence({
      studentId: student.id,
      enrollmentId: enrollment.id,
      courseVersionId: enrollment.courseVersionId,
      lessonCode: lesson.code,
      stage: "Exit Ticket",
      standard: standards[0] ?? null,
      skill,
      itemId: `${assessmentId(lesson)}#1`,
      correct: earned >= 3,
      response: earned >= 3 ? "Selected the correct response." : "Selected a distractor.",
      errorCode: earned >= 3 ? null : "representation",
      attempt: 1,
      hintsUsed: earned >= 3 ? 0 : 1,
      meaningfulMinutes: 3,
      supportUsed: null,
      source: "exit_ticket",
      supersedesEvidenceId: null,
      recordedByUserId: student.id,
    });

    appendGradeRecord({
      id: nextId("gr"),
      studentId: student.id,
      enrollmentId: enrollment.id,
      categoryId: categoryIdFor(enrollment.courseTitle, lesson.code),
      assessmentId: assessmentId(lesson),
      lessonCode: lesson.code,
      pointsEarned: earned,
      pointsPossible: 4,
      ruleVersion: RULE_VERSIONS.grading,
      supersedesGradeId: null,
      enteredByUserId: teacherId,
      reason: SEED_REASON,
      recordedAt: currentTimestamp(),
    });
  });
}

/**
 * Walks a student's pathway up to their current lesson, writing lesson state,
 * evidence, and one official grade record per completed lesson.
 */
function seedPathway(
  course: CatalogCourse,
  enrollment: Enrollment,
  student: User,
  seed: SeedCourse,
  teacherId: string,
): void {
  const d = db();
  const lessons = courseLessons(course);
  const currentIndex = lessons.findIndex((l) => l.code === seed.at);
  const stopAt = currentIndex < 0 ? 0 : currentIndex;
  // A weak skill is given as a course day; the standard behind it comes from
  // the catalog, so the seed never names a standard the curriculum lacks.
  const weakByStandard = new Map(
    (seed.weak ?? [])
      .map((w) => {
        const lesson = lessons.find((l) => l.day === w.day);
        return lesson ? ([lesson.primaryStandard, w.errorCode] as const) : null;
      })
      .filter((pair): pair is readonly [string, string] => pair !== null),
  );

  lessons.forEach((lesson, index) => {
    if (index > stopAt) {
      d.lessonStates.push({
        id: nextId("ls"),
        enrollmentId: enrollment.id,
        lessonCode: lesson.code,
        status: index === stopAt + 1 ? "locked" : "locked",
        stage: 1,
        attempts: 0,
        updatedAt: nextTimestamp(),
      });
      return;
    }

    const isCurrent = index === stopAt;
    const standards = primaryStandards(lesson).map(standardCode);
    const skills = standards.length > 0 ? standards : [`${lesson.code}-readiness`];

    if (isCurrent) {
      d.lessonStates.push({
        id: nextId("ls"),
        enrollmentId: enrollment.id,
        lessonCode: lesson.code,
        status: "available",
        stage: 1,
        attempts: 0,
        updatedAt: nextTimestamp(),
      });
      return;
    }

    // Completed lesson: four exit-ticket rows plus one spiral-review row.
    let earned = 0;
    const possible = 4;
    skills.slice(0, 4).forEach((skill, i) => {
      const itemId = `${assessmentId(lesson)}#${i + 1}`;
      const errorCode = weakByStandard.get(skill) ?? null;
      const roll = unitInterval(`${student.id}|${lesson.code}|${itemId}`);
      const correct = errorCode ? roll > 0.66 : roll > 0.12;
      if (correct) earned += 1;
      recordEvidence({
        studentId: student.id,
        enrollmentId: enrollment.id,
        courseVersionId: enrollment.courseVersionId,
        lessonCode: lesson.code,
        stage: "Exit Ticket",
        standard: standards[i] ?? null,
        skill,
        itemId,
        correct,
        response: correct ? "Selected the correct response." : "Selected a distractor.",
        errorCode: correct ? null : (errorCode ?? "representation"),
        attempt: 1,
        hintsUsed: correct ? 0 : 1,
        meaningfulMinutes: 2 + Math.round(unitInterval(`t|${itemId}|${student.id}`) * 4),
        supportUsed: null,
        source: "exit_ticket",
        supersedesEvidenceId: null,
        recordedByUserId: student.id,
      });

      // The Below-50% band allows one supported retry. A missed item on a
      // skill the student struggles with therefore has a second attempt,
      // which is what makes "the same Exit Ticket failed twice" detectable.
      if (!correct && errorCode) {
        const retryRoll = unitInterval(`retry|${student.id}|${itemId}`);
        recordEvidence({
          studentId: student.id,
          enrollmentId: enrollment.id,
          courseVersionId: enrollment.courseVersionId,
          lessonCode: lesson.code,
          stage: "Exit Ticket",
          standard: standards[i] ?? null,
          skill,
          itemId,
          correct: retryRoll > 0.75,
          response: "Supported retry response.",
          errorCode: retryRoll > 0.75 ? null : errorCode,
          attempt: 2,
          hintsUsed: 2,
          meaningfulMinutes: 3,
          supportUsed: "Worked model replay",
          source: "exit_ticket",
          supersedesEvidenceId: null,
          recordedByUserId: student.id,
        });
      }
    });

    // Pad the remaining exit-ticket slots for short-standard lessons so every
    // completed lesson has four scored responses.
    for (let i = skills.length; i < 4; i++) {
      const itemId = `${assessmentId(lesson)}#${i + 1}`;
      const skill = skills[i % skills.length];
      const roll = unitInterval(`${student.id}|${lesson.code}|pad|${itemId}`);
      const correct = roll > 0.14;
      if (correct) earned += 1;
      recordEvidence({
        studentId: student.id,
        enrollmentId: enrollment.id,
        courseVersionId: enrollment.courseVersionId,
        lessonCode: lesson.code,
        stage: "Exit Ticket",
        standard: standards[i % Math.max(1, standards.length)] ?? null,
        skill,
        itemId,
        correct,
        response: correct ? "Selected the correct response." : "Selected a distractor.",
        errorCode: correct ? null : "representation",
        attempt: 1,
        hintsUsed: 0,
        meaningfulMinutes: 3,
        supportUsed: null,
        source: "exit_ticket",
        supersedesEvidenceId: null,
        recordedByUserId: student.id,
      });
    }

    // One spiral-review row gives the mastery estimate evidence variety.
    const spiralSkill = skills[0];
    const spiralRoll = unitInterval(`sp|${student.id}|${lesson.code}`);
    recordEvidence({
      studentId: student.id,
      enrollmentId: enrollment.id,
      courseVersionId: enrollment.courseVersionId,
      lessonCode: lesson.code,
      stage: "Spiral Review",
      standard: standards[0] ?? null,
      skill: spiralSkill,
      itemId: `${assessmentId(lesson)}#spiral`,
      correct: weakByStandard.has(spiralSkill) ? spiralRoll > 0.62 : spiralRoll > 0.18,
      response: "Retrieval practice response.",
      errorCode: null,
      attempt: 1,
      hintsUsed: 0,
      meaningfulMinutes: 4,
      supportUsed: null,
      source: "spiral_review",
      supersedesEvidenceId: null,
      recordedByUserId: student.id,
    });

    // Past lessons are complete, review included. The live states — available,
    // in progress, submitted, review scheduled — are produced by working
    // through the lesson player, not seeded into history.
    d.lessonStates.push({
      id: nextId("ls"),
      enrollmentId: enrollment.id,
      lessonCode: lesson.code,
      status: "completed",
      stage: 10,
      attempts: 1,
      updatedAt: nextTimestamp(),
    });

    appendGradeRecord({
      id: nextId("gr"),
      studentId: student.id,
      enrollmentId: enrollment.id,
      categoryId: categoryIdFor(enrollment.courseTitle, lesson.code),
      assessmentId: assessmentId(lesson),
      lessonCode: lesson.code,
      pointsEarned: earned,
      pointsPossible: possible,
      ruleVersion: RULE_VERSIONS.grading,
      supersedesGradeId: null,
      enteredByUserId: teacherId,
      reason: SEED_REASON,
      recordedAt: nextTimestamp(),
    });
  });
}

/** A small set of plans covering the interesting states of the lifecycle. */
function seedInterventions(
  staff: Map<string, User>,
  students: Map<string, User>,
): void {
  const d = db();
  const make = (
    studentKey: string,
    courseTitle: string,
    lessonCode: string,
    partial: Partial<Intervention>,
    decidedByKey: string,
  ) => {
    const student = students.get(studentKey);
    const enrollment = d.enrollments.find(
      (e) => e.studentId === student?.id && e.courseTitle === courseTitle,
    );
    const course = getCourse(courseTitle);
    if (!student || !enrollment || !course) return;
    const found = courseLessons(course).find((l) => l.code === lessonCode);
    if (!found) return;
    // The support is the one the curriculum itself names as a prerequisite for
    // this lesson, not one picked here.
    const support = prerequisiteSupports(found.code)[0];
    if (!support) return;

    const triggers = db()
      .evidence.filter(
        (e) => e.studentId === student.id && e.enrollmentId === enrollment.id && e.correct === false,
      )
      .slice(-2)
      .map((e) => e.id);

    const decider = staff.get(decidedByKey) as User;
    const intervention: Intervention = {
      id: nextId("int"),
      studentId: student.id,
      enrollmentId: enrollment.id,
      status: "assigned",
      interventionLessonId: support.id,
      targetSkill: standardCode(primaryStandards(found)[0] ?? `${found.code}-readiness`),
      targetStandard: primaryStandards(found)[0] ?? null,
      severity: "immediate",
      triggerEvidenceIds: triggers,
      triggerSummary: "Two recent misses share the same error pattern.",
      estimatedMinutes: SUPPORT_MINUTES,
      returnLessonCode: lessonCode,
      returnStage: 5,
      returnRuleVersion: DEFAULT_RETURN_RULE.version,
      readinessMinPercent: DEFAULT_RETURN_RULE.readinessMinPercent,
      transferItemsRequired: DEFAULT_RETURN_RULE.transferItemsRequired,
      readinessPercent: null,
      transferPassed: null,
      cycles: 0,
      recommendedByRuleVersion: RULE_VERSIONS.recommend,
      evidenceCountAtDecision: triggers.length,
      decidedByUserId: decider.id,
      decisionReason: "Assigned from the action queue.",
      dueExpectation: "Before the next intervention-capacity day",
      createdAt: nextTimestamp(),
      updatedAt: nextTimestamp(),
      ...partial,
    };
    d.interventions.push(intervention);

    appendAudit({
      id: nextId("aud"),
      actorUserId: decider.id,
      actorRole: decider.role,
      scope: `site:${db().sites.find((x) => x.id === decider.siteId)?.shortName ?? "unknown"}`,
      action: "intervention.assign",
      targetEntity: "intervention",
      targetId: intervention.id,
      before: null,
      after: JSON.stringify({ status: intervention.status, skill: intervention.targetSkill }),
      reason: `${intervention.decisionReason} ${SEED_REASON}`,
      idempotencyKey: `seed:${intervention.id}`,
      requestId: `seed:${intervention.id}`,
      recordedAt: nextTimestamp(),
    });
  };

  make("amara", "Mathematics 6", "MATH-06-L035", {
    status: "assigned",
    triggerSummary:
      "Two recent unit-rate items were divided the wrong way round, which is the same error twice.",
    decisionReason: "Short support before the percent work that builds on it.",
  }, "alvarez");
  make("diego", "Mathematics 8", "MATH-08-L023", { status: "in_progress" }, "alvarez");
  make("marcus", "Math 2", "MATH-2-L025", {
    status: "escalated",
    cycles: 2,
    severity: "teacher_review",
    triggerSummary:
      "Two support cycles on this skill have not resolved it. The anti-loop rule routed this to teacher review rather than proposing a third retry.",
    readinessPercent: 60,
    transferPassed: false,
    decisionReason: "Two cycles did not resolve it; setting up a conference.",
  }, "alvarez");
  make("priya", "Math 1", "MATH-1-L046", {
    status: "returned_to_pathway",
    readinessPercent: 100,
    transferPassed: true,
    cycles: 1,
    decisionReason: "Assigned after a repeated error pattern on variable interpretation.",
  }, "alvarez");
  make("sofia", "English 11", "ELA-11-L021", {
    status: "readiness_check",
    severity: "targeted",
    triggerSummary:
      "This rubric dimension has limited the result on three separate pieces of work.",
    decisionReason: "Quotation integration keeps capping the analysis score.",
  }, "farouk");
  make("jamal", "English 9", "ELA-09-L018", {
    status: "assigned",
    triggerSummary: "Quotations are dropped into the draft without commentary in two recent responses.",
    decisionReason: "Short support before the Unit 2 performance task.",
  }, "adjei");
}

function seedMessages(staff: Map<string, User>, students: Map<string, User>): void {
  const d = db();
  const push = (fromKey: string, toKey: string, subject: string, body: string, isHelpRequest = false) => {
    const from = staff.get(fromKey) ?? students.get(fromKey);
    const to = students.get(toKey);
    if (!from || !to) return;
    d.messages.push({
      id: nextId("msg"),
      fromUserId: from.id,
      toStudentId: to.id,
      subject,
      body,
      sentAt: nextTimestamp(),
      isHelpRequest,
      resolvedAt: null,
    });
  };

  push("alvarez", "amara", "Nice work on the ratio table",
    "Your ratio table this week was set up well. Keep labelling the units on each column — that is what made the last row easy to check.");
  push("adjei", "jamal", "Bring your draft Thursday",
    "Bring the Unit 2 draft to class on Thursday and we will work on the quotation commentary together.");
  push("amara", "amara", "I need help with unit rate",
    "I keep getting the division backwards when the question says 'per'. Can we go over it?", true);
  push("alvarez", "diego", "Checking in",
    "You have one short support assigned before we go on. It should take about twenty minutes and then you go straight back to where you were.");
}

export { SEED_REASON };
