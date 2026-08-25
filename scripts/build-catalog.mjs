/**
 * Generates the curriculum data in `lib/curriculum/data/` from the curriculum
 * architecture workbook.
 *
 *   node scripts/build-catalog.mjs
 *
 * The workbook at `docs/curriculum/curriculum-architecture.xlsx` is the source
 * of truth for the instructional structure: the course taxonomy, the units, the
 * 5,130-lesson spine, the standards crosswalk, the reusable intervention bank,
 * the per-lesson prerequisite map, and the concept dependency graph.
 *
 * CLAUDE.md §14 forbids inventing curriculum data, so nothing is authored here.
 * Every string this script writes is read out of a cell. What it does add is
 * SHAPE — parsing a semicolon list into an array, a "3 min retrieval | …" cell
 * into phases, and interning the repeated strings so the same fact is not
 * stored 5,130 times.
 *
 * Two identifiers are derived rather than read, and both are system record ids
 * rather than curriculum: a lesson's assessment record (`A-<lesson id>`) and a
 * course's slug. Neither carries meaning the workbook does not already state.
 *
 * The script validates before it writes and exits non-zero on any structural
 * violation, so a workbook that does not hold together cannot become a build.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { openWorkbook, num, list } from "./xlsx.mjs";

const SOURCE = "docs/curriculum/curriculum-architecture.xlsx";
const OUT_DIR = "lib/curriculum/data";

const CONTRACT = {
  pathwayDays: 135,
  interventionCapacity: 40,
  annualTotal: 175,
  unitsPerCourse: 9,
  lessonsPerUnit: 15,
};

const problems = [];
function require(condition, message) {
  if (!condition) problems.push(message);
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

const wb = openWorkbook(SOURCE);

const catalogRows = wb.tableOf("Course Catalog");
const pathwayRows = wb.tableOf("Pathways");
const unitRows = wb.tableOf("Units");
const lessonRows = wb.tableOf("Lesson Sequence");
const standardRows = wb.tableOf("Standards Crosswalk");
const interventionRows = wb.tableOf("Intervention Bank");
const prerequisiteRows = wb.tableOf("Prerequisite Map");
const conceptRows = wb.tableOf("Concept Edges");
const sourceRows = wb.tableOf("Sources");

const readmeRows = wb.rowsOf("README");
const builtAt =
  readmeRows.find((row) => row[0] === "Last built")?.[1] ?? "";

/** `"3 min retrieval | 5 min model"` -> `[{minutes:3,label:"retrieval"},…]`. */
function phases(cell) {
  return list(cell, "|").map((part) => {
    const match = /^(\d+)\s*min\s+(.*)$/i.exec(part);
    if (!match) throw new Error(`Unparseable lesson-structure phase: "${part}"`);
    return { minutes: Number(match[1]), label: match[2].trim() };
  });
}

// ---------------------------------------------------------------------------
// Courses, units, lessons
// ---------------------------------------------------------------------------

const unitsByCourse = new Map();
for (const row of unitRows) {
  const unit = {
    id: row.Unit_ID,
    order: num(row.Unit_Number, `Units.${row.Unit_ID}.Unit_Number`),
    title: row.Unit_Title,
    essentialQuestion: row.Essential_Question,
    concepts: list(row.Concepts, "|"),
    pathwayDays: num(row.Lesson_Count, `Units.${row.Unit_ID}.Lesson_Count`),
    startDay: num(row.Start_Day, `Units.${row.Unit_ID}.Start_Day`),
    endDay: num(row.End_Day, `Units.${row.Unit_ID}.End_Day`),
    standards: list(row.Unit_Standards),
    lessons: [],
  };
  const bucket = unitsByCourse.get(row.Course_ID) ?? [];
  bucket.push(unit);
  unitsByCourse.set(row.Course_ID, bucket);
}

const unitsById = new Map(
  [...unitsByCourse.values()].flat().map((unit) => [unit.id, unit]),
);

/** The 30-minute shape. Identical on every pathway lesson, so it is stored once. */
let lessonStructure = null;

/**
 * The 15-lesson unit arc.
 *
 * Every unit in every course runs the same instructional sequence: launch and
 * diagnose, then vocabulary, explicit instruction, and so on to the performance
 * task. Lesson type and the evidence it produces are therefore a function of a
 * lesson's POSITION in its unit, not of the lesson — so the arc is stored once
 * as fifteen rows instead of 5,130 times, and any lesson that departs from it
 * fails the build rather than being written out silently.
 */
const lessonArc = [];
const lessonsByCode = new Map();

for (const row of lessonRows) {
  const structure = phases(row["30_Minute_Structure"]);
  if (lessonStructure === null) lessonStructure = structure;
  require(
    JSON.stringify(structure) === JSON.stringify(lessonStructure),
    `${row.Lesson_ID}: lesson structure differs from the rest of the spine.`,
  );

  const unit = unitsById.get(row.Unit_ID);
  if (!unit) {
    problems.push(`${row.Lesson_ID}: references unknown unit ${row.Unit_ID}.`);
    continue;
  }

  const position = num(row.Lesson_in_Unit, `Lesson Sequence.${row.Lesson_ID}.Lesson_in_Unit`);
  const day = num(row.Day, `Lesson Sequence.${row.Lesson_ID}.Day`);
  require(
    ((day - 1) % CONTRACT.lessonsPerUnit) + 1 === position,
    `${row.Lesson_ID}: day ${day} does not sit at position ${position} of its unit.`,
  );

  const stage = lessonArc[position - 1];
  if (!stage) {
    lessonArc[position - 1] = {
      position,
      type: row.Lesson_Type,
      evidence: row.Evidence_of_Learning,
    };
  } else {
    require(
      stage.type === row.Lesson_Type && stage.evidence === row.Evidence_of_Learning,
      `${row.Lesson_ID}: position ${position} is "${row.Lesson_Type}" here but "${stage.type}" elsewhere in the spine.`,
    );
  }

  const lesson = {
    code: row.Lesson_ID,
    day,
    title: row.Lesson_Title,
    objective: row.Learning_Objective,
    primaryStandard: row.Primary_Standard,
    // The workbook repeats the primary standard in the supporting list; a
    // standard supporting itself is noise on every surface that shows it.
    supportingStandards: list(row.Supporting_Standards).filter(
      (code) => code !== row.Primary_Standard,
    ),
    practice: list(row.Practice_or_Literacy),
  };
  unit.lessons.push(lesson);
  lessonsByCode.set(lesson.code, { lesson, courseId: row.Course_ID, unitId: unit.id });
}

const SUBJECT_ORDER = [
  "Mathematics",
  "English Language Arts",
  "Science",
  "History-Social Science",
];

const courses = catalogRows.map((row) => {
  const units = (unitsByCourse.get(row.Course_ID) ?? []).sort((a, b) => a.order - b.order);
  for (const unit of units) unit.lessons.sort((a, b) => a.day - b.day);
  return {
    id: row.Course_ID,
    title: row.Course_Name,
    subject: row.Subject,
    gradeBand: row.Grade_or_Band,
    order: num(row.Pathway_Order, `Course Catalog.${row.Course_ID}.Pathway_Order`),
    standardsModel: row.Standards_Model,
    pathwayDays: num(row.Pathway_Days, `Course Catalog.${row.Course_ID}.Pathway_Days`),
    interventionCapacity: num(
      row.Intervention_Capacity,
      `Course Catalog.${row.Course_ID}.Intervention_Capacity`,
    ),
    units,
  };
});

courses.sort(
  (a, b) =>
    SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject) ||
    a.order - b.order,
);

// ---------------------------------------------------------------------------
// Standards crosswalk
// ---------------------------------------------------------------------------

const standards = standardRows.map((row) => ({
  courseId: row.Course_ID,
  code: row.Standard_Code,
  group: row.Standard_Group,
  description: row.Short_Description,
  sourceId: row.Source_ID,
  firstLessonCode: row.First_Scheduled_Lesson,
  coverageCount: num(row.Coverage_Count, `Standards Crosswalk.${row.Standard_Code}.Coverage_Count`),
  status: row.Coverage_Status,
}));

// ---------------------------------------------------------------------------
// Intervention bank
// ---------------------------------------------------------------------------

let interventionStructure = null;
const interventions = interventionRows.map((row) => {
  const structure = phases(row["30_Minute_Structure"]);
  if (interventionStructure === null) interventionStructure = structure;
  require(
    JSON.stringify(structure) === JSON.stringify(interventionStructure),
    `${row.Intervention_ID}: support structure differs from the rest of the bank.`,
  );
  return {
    id: row.Intervention_ID,
    subject: row.Subject,
    category: row.Category,
    skill: row.Basic_Skill,
    gradeSpan: row.Grade_Span,
    trigger: row.Diagnostic_Trigger,
    objective: row.Learning_Objective,
    components: row.Core_Components,
    exitCriteria: row.Exit_Criteria,
    standardsSupport: list(row.Standards_Support),
    tags: list(row.Tags, "|"),
    returnCourseIds: list(row.Return_Destinations),
  };
});

// ---------------------------------------------------------------------------
// Prerequisites
// ---------------------------------------------------------------------------

/**
 * Six prior lessons or supports per course lesson, interned.
 *
 * The reason text repeats across tens of thousands of rows, so reasons go in a
 * table and each link holds an index into it. A link's kind is not stored:
 * an intervention id contains `-INT-` and a lesson id does not, so the kind is
 * recoverable from the id itself and cannot drift out of step with it.
 */
const reasonTable = [];
const reasonIndex = new Map();
function internReason(text) {
  const existing = reasonIndex.get(text);
  if (existing !== undefined) return existing;
  const at = reasonTable.length;
  reasonTable.push(text);
  reasonIndex.set(text, at);
  return at;
}

const prerequisitesByLesson = {};
for (const row of prerequisiteRows) {
  const links = [];
  for (let n = 1; n <= 6; n++) {
    const id = row[`Prereq_${n}_ID`];
    if (!id) continue;
    links.push([id, internReason(row[`Prereq_${n}_Reason`])]);
  }
  prerequisitesByLesson[row.Lesson_ID] = links;
}

// ---------------------------------------------------------------------------
// Concept edges and course pathways
// ---------------------------------------------------------------------------

const conceptEdges = conceptRows.map((row) => ({
  courseId: row.Course_ID,
  unitId: row.Unit_ID,
  from: row.From_Concept,
  to: row.To_Concept,
  relationship: row.Relationship,
  strength: num(row.Strength_1_to_5, `Concept Edges.${row.Unit_ID}.Strength_1_to_5`),
  exampleLessonCode: row.Example_Lesson_ID,
}));

const pathways = pathwayRows.map((row) => ({
  subject: row.Subject,
  fromCourseId: row.From_Course_ID,
  toCourseId: row.To_Course_ID,
  relationship: row.Relationship,
  fromCapstoneLessonCode: row.From_Capstone_Lesson,
  toEntryLessonCode: row.To_Entry_Lesson,
  handoffRule: row.Handoff_Rule,
}));

const sources = sourceRows.map((row) => ({
  id: row.Source_ID,
  title: row.Source_Title,
  domain: row.Domain,
  url: row.URL,
  scope: row.Scope_Used,
  authority: row.Authority_or_Date,
  notes: row.Notes,
}));

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

const courseIds = new Set(courses.map((c) => c.id));
const interventionIds = new Set(interventions.map((i) => i.id));

for (const course of courses) {
  const where = `${course.id}`;
  require(
    course.pathwayDays === CONTRACT.pathwayDays,
    `${where}: ${course.pathwayDays} pathway days; the contract is ${CONTRACT.pathwayDays}.`,
  );
  require(
    course.interventionCapacity === CONTRACT.interventionCapacity,
    `${where}: ${course.interventionCapacity} intervention-capacity days; the contract is ${CONTRACT.interventionCapacity}.`,
  );
  require(
    course.units.length === CONTRACT.unitsPerCourse,
    `${where}: ${course.units.length} units; expected ${CONTRACT.unitsPerCourse}.`,
  );
  require(
    SUBJECT_ORDER.includes(course.subject),
    `${where}: unknown subject "${course.subject}".`,
  );

  const days = new Set();
  let lessonCount = 0;
  const courseStandards = new Set(
    standards.filter((s) => s.courseId === course.id).map((s) => s.code),
  );
  require(courseStandards.size > 0, `${where}: no standards in the crosswalk.`);

  for (const unit of course.units) {
    lessonCount += unit.lessons.length;
    require(
      unit.lessons.length === CONTRACT.lessonsPerUnit,
      `${unit.id}: ${unit.lessons.length} lessons; expected ${CONTRACT.lessonsPerUnit}.`,
    );
    require(
      unit.endDay - unit.startDay + 1 === unit.lessons.length,
      `${unit.id}: day span ${unit.startDay}-${unit.endDay} does not match ${unit.lessons.length} lessons.`,
    );
    for (const lesson of unit.lessons) {
      require(!days.has(lesson.day), `${lesson.code}: duplicate course day ${lesson.day}.`);
      days.add(lesson.day);
      require(
        lesson.day >= unit.startDay && lesson.day <= unit.endDay,
        `${lesson.code}: day ${lesson.day} is outside ${unit.id} (${unit.startDay}-${unit.endDay}).`,
      );
      require(
        courseStandards.has(lesson.primaryStandard),
        `${lesson.code}: primary standard ${lesson.primaryStandard} is not in ${course.id}'s crosswalk.`,
      );
      for (const code of lesson.supportingStandards) {
        require(
          courseStandards.has(code),
          `${lesson.code}: supporting standard ${code} is not in ${course.id}'s crosswalk.`,
        );
      }
      require(
        Array.isArray(prerequisitesByLesson[lesson.code]) &&
          prerequisitesByLesson[lesson.code].length === 6,
        `${lesson.code}: expected six prerequisites, found ${prerequisitesByLesson[lesson.code]?.length ?? 0}.`,
      );
    }
  }

  require(
    lessonCount === CONTRACT.pathwayDays,
    `${where}: ${lessonCount} lessons against ${CONTRACT.pathwayDays} pathway days.`,
  );
}

for (const standard of standards) {
  require(
    courseIds.has(standard.courseId),
    `Standard ${standard.code}: unknown course ${standard.courseId}.`,
  );
  require(
    standard.status === "COVERED" && standard.coverageCount > 0,
    `Standard ${standard.code} in ${standard.courseId} is ${standard.status} with ${standard.coverageCount} lessons.`,
  );
}

for (const [lessonCode, links] of Object.entries(prerequisitesByLesson)) {
  require(lessonsByCode.has(lessonCode), `Prerequisite map: unknown lesson ${lessonCode}.`);
  for (const [id] of links) {
    require(
      lessonsByCode.has(id) || interventionIds.has(id),
      `${lessonCode}: prerequisite ${id} resolves to neither a lesson nor a support.`,
    );
  }
}

for (const edge of pathways) {
  require(courseIds.has(edge.fromCourseId), `Pathway: unknown course ${edge.fromCourseId}.`);
  require(courseIds.has(edge.toCourseId), `Pathway: unknown course ${edge.toCourseId}.`);
  require(
    lessonsByCode.has(edge.fromCapstoneLessonCode),
    `Pathway ${edge.fromCourseId} -> ${edge.toCourseId}: unknown capstone ${edge.fromCapstoneLessonCode}.`,
  );
  require(
    lessonsByCode.has(edge.toEntryLessonCode),
    `Pathway ${edge.fromCourseId} -> ${edge.toCourseId}: unknown entry ${edge.toEntryLessonCode}.`,
  );
}

for (const intervention of interventions) {
  for (const courseId of intervention.returnCourseIds) {
    require(
      courseIds.has(courseId),
      `${intervention.id}: return destination ${courseId} is not a course.`,
    );
  }
}

for (const edge of conceptEdges) {
  require(unitsById.has(edge.unitId), `Concept edge: unknown unit ${edge.unitId}.`);
  require(
    lessonsByCode.has(edge.exampleLessonCode),
    `Concept edge in ${edge.unitId}: unknown example lesson ${edge.exampleLessonCode}.`,
  );
}

if (problems.length > 0) {
  console.error(`\nThe workbook does not validate. ${problems.length} problem(s):\n`);
  for (const problem of problems.slice(0, 40)) console.error(`  - ${problem}`);
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more.`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });

const files = {
  "catalog.json": {
    builtAt,
    source: SOURCE,
    contract: CONTRACT,
    lessonStructure,
    lessonArc,
    subjects: SUBJECT_ORDER,
    courses,
  },
  "standards.json": { standards, sources },
  "interventions.json": { structure: interventionStructure, interventions },
  "prerequisites.json": { reasons: reasonTable, byLesson: prerequisitesByLesson },
  "concepts.json": { edges: conceptEdges },
  "pathways.json": { pathways },
};

let total = 0;
for (const [name, payload] of Object.entries(files)) {
  const json = JSON.stringify(payload);
  writeFileSync(`${OUT_DIR}/${name}`, `${json}\n`);
  total += json.length;
  console.log(`  ${name.padEnd(20)} ${(json.length / 1024).toFixed(0).padStart(6)} KB`);
}

const lessonCount = [...lessonsByCode.keys()].length;
console.log(`
Built from ${SOURCE} (workbook dated ${builtAt}).
  ${courses.length} courses · ${unitsById.size} units · ${lessonCount} lessons
  ${standards.length} standards · ${interventions.length} supports
  ${Object.values(prerequisitesByLesson).reduce((n, l) => n + l.length, 0)} prerequisite links · ${conceptEdges.length} concept edges
  ${pathways.length} course-to-course pathways
  ${(total / 1024 / 1024).toFixed(2)} MB total
`);
