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
 * Curriculum facts — course titles, unit names, day budgets, lesson codes,
 * standard codes, assessment ids, intervention ids — are read from
 * `lib/curriculum/data/catalog.json`, which is generated from the blueprint.
 * Nothing here invents curriculum.
 *
 * Historical evidence uses item identifiers derived from each lesson's
 * blueprint assessment record (for example `A-M6-U1-L1#2`). Live work uses the
 * authored demo item bank in `demo-items.ts`.
 */
import { currentTimestamp, nextTimestamp, resetClock } from "@/lib/clock";
import { DEMO_ORGANIZATION, DEMO_SITES, siteDisplayName } from "./demo-identity";
import {
  COURSES,
  courseLessons,
  getCourse,
  interventionId,
  primaryStandards,
  standardCode,
  assessmentId,
  type CatalogCourse,
} from "@/lib/curriculum/catalog";
import { DEFAULT_RETURN_RULE, RULE_VERSIONS } from "@/lib/rules/versions";
import { appendAudit, appendGradeRecord, db, nextId } from "./store";
import { recordEvidence } from "@/lib/evidence/ledger";
import type {
  CourseVersion,
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
  /** Standards this student has struggled with, and the error family shown. */
  weak?: { standard: string; errorCode: string }[];
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
      { title: "Mathematics 6", at: "M6-U1-L2", weak: [{ standard: "6.RP.1", errorCode: "fraction-or-ratio" }] },
      { title: "English 6", at: "E6-U1-L2", weak: [{ standard: "RL.6.1", errorCode: "evidence-without-support" }] },
      { title: "Integrated Science 6", at: "S6-U1-L2" },
      { title: "Grade 6 Ancient World", at: "H6-U1-L2", weak: [{ standard: "HSS-AS.6-8.CST.1", errorCode: "no-temporal-relationship" }] },
    ],
  },
  {
    key: "tobias", first: "Tobias", last: "Ferreira", grade: 7, site: "MESA",
    courses: [
      { title: "Mathematics 7", at: "M7-U1-L2", weak: [{ standard: "7.RP.1", errorCode: "unit-and-scale" }] },
      { title: "English 7", at: "E7-U1-L2" },
      { title: "Integrated Science 7", at: "S7-U1-L2", weak: [{ standard: "MS-PS1-1", errorCode: "model-omits-component" }] },
      { title: "Grade 7 Medieval/Early Modern World", at: "H7-U1-L2" },
    ],
  },
  {
    key: "diego", first: "Diego", last: "Reyes-Marin", grade: 8, site: "ORO",
    courses: [
      { title: "Mathematics 8", at: "M8-U1-L3", weak: [
        { standard: "8.EE.1", errorCode: "distribution-and-like-terms" },
        { standard: "8.EE.2", errorCode: "inverse-operation" }] },
      { title: "English 8", at: "E8-U1-L2", weak: [{ standard: "RL.8.1", errorCode: "ungrounded-inference" }] },
      { title: "Integrated Science 8", at: "S8-U1-L2" },
      { title: "Grade 8 U.S. Growth and Conflict", at: "H8-U1-L2" },
    ],
  },
  {
    key: "priya", first: "Priya", last: "Raghunathan", grade: 9, site: "ORO",
    courses: [
      { title: "Integrated Math 1", at: "IM1-U2-L2", weak: [{ standard: "A-SSE.1.a", errorCode: "variable-interpretation" }] },
      { title: "English 9", at: "E9-U1-L2" },
      { title: "Living Earth", at: "LE-U1-L2" },
      { title: "Grade 9 World Geography and Contemporary Issues", at: "H9-U1-L2" },
    ],
  },
  {
    key: "jamal", first: "Jamal", last: "Ortiz", grade: 9, site: "ORO", transferredFrom: "MESA",
    courses: [
      { title: "Integrated Math 1", at: "IM1-U2-L2", weak: [{ standard: "N-Q.2", errorCode: "unit-and-scale" }] },
      { title: "English 9", at: "E9-U1-L2", weak: [{ standard: "RL.9-10.1", errorCode: "quotation-without-commentary" }] },
      { title: "Living Earth", at: "LE-U1-L2" },
      { title: "Grade 9 World Geography and Contemporary Issues", at: "H9-U1-L2" },
    ],
  },
  {
    key: "marcus", first: "Marcus", last: "Bell", grade: 10, site: "ORO",
    courses: [
      { title: "Integrated Math 2", at: "IM2-U1-L3", weak: [{ standard: "N-RN.2", errorCode: "equality-and-equivalence" }] },
      { title: "English 10", at: "E10-U1-L2" },
      { title: "Chemistry in the Earth System", at: "CHEM-U1-L2" },
      { title: "Grade 10 Modern World", at: "H10-U1-L2", weak: [{ standard: "HSS-10.1", errorCode: "single-cause" }] },
    ],
  },
  {
    key: "sofia", first: "Sofia", last: "Nakamura", grade: 11, site: "MESA",
    courses: [
      { title: "Integrated Math 3", at: "IM3-U1-L2" },
      { title: "English 11", at: "E11-U1-L2", weak: [{ standard: "RL.11-12.1", errorCode: "quotation-without-commentary" }] },
      { title: "Physics of the Universe", at: "PHYS-U1-L2" },
      { title: "Grade 11 U.S. Continuity and Change", at: "H11-U1-L2" },
    ],
  },
  {
    key: "lena", first: "Lena", last: "Whitcomb", grade: 12, site: "MESA",
    courses: [
      { title: "Statistics", at: "STAT-U1-L2" },
      { title: "English 12", at: "E12-U1-L2" },
      { title: "Environmental Science", at: "ENV-U1-L2", weak: [{ standard: "HS-ESS2-2", errorCode: "correlation-as-cause" }] },
      { title: "Grade 12 Government and Economics", at: "H12-U0-L2" },
    ],
  },
];

const SEED_STAFF = [
  { key: "alvarez", first: "Renata", last: "Alvarez", role: "teacher" as const, site: "ORO" as const, subjects: ["Mathematics"], curriculumAuthor: true },
  { key: "adjei", first: "Kwame", last: "Adjei", role: "teacher" as const, site: "ORO" as const, subjects: ["English", "Social science"], curriculumAuthor: false },
  { key: "delacroix", first: "Hana", last: "Delacroix", role: "teacher" as const, site: "ORO" as const, subjects: ["Science"], curriculumAuthor: false },
  { key: "thornbury", first: "Elias", last: "Thornbury", role: "teacher" as const, site: "MESA" as const, subjects: ["Mathematics", "Science"], curriculumAuthor: false },
  { key: "farouk", first: "Nadia", last: "Farouk", role: "teacher" as const, site: "MESA" as const, subjects: ["English", "Social science"], curriculumAuthor: false },
  { key: "salinas", first: "Victor", last: "Salinas", role: "site_admin" as const, site: "ORO" as const, subjects: [], curriculumAuthor: false },
  { key: "petrova", first: "Ingrid", last: "Petrova", role: "site_admin" as const, site: "MESA" as const, subjects: [], curriculumAuthor: false },
  { key: "okonjo", first: "Camille", last: "Okonjo", role: "org_admin" as const, site: null, subjects: [], curriculumAuthor: false },
  { key: "haddad", first: "Yusra", last: "Haddad", role: "curriculum_author" as const, site: null, subjects: [], curriculumAuthor: true },
];

/**
 * Two gradebook categories, matching how the results actually differ in kind:
 * short checks taken along the way, and the assessments a unit is judged on.
 * The weights are a demo default, not an adopted grading policy.
 */
const GRADE_CATEGORY_SHAPE = [
  { suffix: "KC", name: "Knowledge checks", weight: 0.4 },
  { suffix: "AS", name: "Assessments", weight: 0.6 },
];

/**
 * L1 and L2 lessons carry probes, exit tickets, and reasoning checks; L3
 * lessons carry the common assessment and the performance task.
 */
function categorySuffix(lessonCode: string): string {
  return /-(L3)$/.test(lessonCode) ? "AS" : "KC";
}

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
 * Grade 12 mathematics is a branch decision, not a single course: the blueprint
 * lists Precalculus, Statistics, and Quantitative Reasoning as separate
 * approved pathways "selected by placement and graduation plans" (§9). Spreading
 * a cohort across them is what a real roster looks like — and it is what makes
 * some course-at-site slices genuinely small.
 */
const GRADE_12_MATH = ["Precalculus", "Statistics", "Quantitative Reasoning"];

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
  9: ["Integrated Math 1", "English 9", "Living Earth", "Grade 9 World Geography and Contemporary Issues"],
  10: ["Integrated Math 2", "English 10", "Chemistry in the Earth System", "Grade 10 Modern World"],
  11: ["Integrated Math 3", "English 11", "Physics of the Universe", "Grade 11 U.S. Continuity and Change"],
  12: ["Statistics", "English 12", "Environmental Science", "Grade 12 Government and Economics"],
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
      ["English"],
      ["Science"],
      ["Social science"],
      ["Mathematics", "Science"],
      ["English", "Social science"],
      ["Mathematics"],
      ["English"],
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
      categoryId: `gc_${enrollment.courseTitle.replace(/[^A-Za-z0-9]+/g, "_")}_${categorySuffix(lesson.code)}`,
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
  const weakByStandard = new Map(
    (seed.weak ?? []).map((w) => [w.standard, w.errorCode]),
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
      categoryId: `gc_${enrollment.courseTitle.replace(/[^A-Za-z0-9]+/g, "_")}_${categorySuffix(lesson.code)}`,
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
      interventionLessonId: interventionId(found),
      targetSkill: standardCode(primaryStandards(found)[0] ?? `${found.code}-readiness`),
      targetStandard: primaryStandards(found)[0] ?? null,
      severity: "immediate",
      triggerEvidenceIds: triggers,
      triggerSummary: "Two recent misses share the same error pattern.",
      estimatedMinutes: 20,
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

  make("diego", "Mathematics 8", "M8-U1-L3", { status: "in_progress" }, "alvarez");
  make("marcus", "Integrated Math 2", "IM2-U1-L3", {
    status: "escalated",
    cycles: 2,
    severity: "teacher_review",
    triggerSummary:
      "Two support cycles on this skill have not resolved it. The anti-loop rule routed this to teacher review rather than proposing a third retry.",
    readinessPercent: 60,
    transferPassed: false,
    decisionReason: "Two cycles did not resolve it; setting up a conference.",
  }, "alvarez");
  make("priya", "Integrated Math 1", "IM1-U2-L2", {
    status: "returned_to_pathway",
    readinessPercent: 100,
    transferPassed: true,
    cycles: 1,
    decisionReason: "Assigned after a repeated error pattern on variable interpretation.",
  }, "alvarez");
  make("sofia", "English 11", "E11-U1-L2", {
    status: "readiness_check",
    severity: "targeted",
    triggerSummary:
      "This rubric dimension has limited the result on three separate pieces of work.",
    decisionReason: "Quotation integration keeps capping the analysis score.",
  }, "farouk");
  make("jamal", "English 9", "E9-U1-L2", {
    status: "assigned",
    triggerSummary: "Quotations are dropped into the draft without commentary in two recent responses.",
    decisionReason: "Short support before the Unit 1 performance task.",
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
    "Your ratio table in M6-U1-L1 was set up well. Keep labelling the units on each column — that is what made the last row easy to check.");
  push("adjei", "jamal", "Bring your draft Thursday",
    "Bring the Unit 1 draft to class on Thursday and we will work on the quotation commentary together.");
  push("amara", "amara", "I need help with unit rate",
    "I keep getting the division backwards when the question says 'per'. Can we go over it?", true);
  push("alvarez", "diego", "Checking in",
    "You have one short support assigned before we go on. It should take about twenty minutes and then you go straight back to where you were.");
}

export { SEED_REASON };
