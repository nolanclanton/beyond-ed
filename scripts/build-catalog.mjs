/**
 * Generates `lib/curriculum/data/catalog.json` from `docs/blueprint.md`.
 *
 * CLAUDE.md §14 forbids inventing curriculum data. Every course, unit, lesson,
 * standard code, assessment id, and intervention id in the generated catalog is
 * read out of the blueprint appendices — nothing is authored here.
 *
 * Run: node scripts/build-catalog.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "docs/blueprint.md";
const OUT = "lib/curriculum/data/catalog.json";

const lines = readFileSync(SRC, "utf8").split("\n");

const COL_RULE = /^\s*-{3,}(?:\s+-{3,})+\s*$/;
const FULL_RULE = /^\s*-{3,}\s*$/;

/** Column ranges [start,end) from a pandoc simple-table ruler line. */
function columnsFrom(rule) {
  const ranges = [];
  const re = /-{3,}/g;
  let m;
  while ((m = re.exec(rule)) !== null) ranges.push([m.index, m.index + m[0].length]);
  // Widen every column to the start of the next one so overflowing cells stay put.
  return ranges.map(([s], i) => [s, i + 1 < ranges.length ? ranges[i + 1][0] : Infinity]);
}

function clean(s) {
  return s
    .replace(/\*\*/g, "")
    .replace(/\\(?=\s|$)/g, " ")
    .replace(/\\([[\]*|+])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Reads the pandoc simple table whose column ruler is at `i`.
 *
 * In this dialect the header sits ABOVE the ruler and the body below it, so the
 * header is recovered by scanning back to the table's top rule.
 * Returns { header: string[], rows: string[][], end: number }.
 */
function readTable(i) {
  const cols = columnsFrom(lines[i]);
  const slice = (line) =>
    cols.map(([s, e]) => line.slice(s, e === Infinity ? undefined : e).trim());

  const headerParts = cols.map(() => []);
  for (let k = i - 1; k >= 0; k--) {
    const line = lines[k];
    if (FULL_RULE.test(line) || COL_RULE.test(line) || line.trim() === "") break;
    slice(line).forEach((piece, c) => {
      if (piece) headerParts[c].unshift(piece);
    });
  }
  const header = headerParts.map((parts) => clean(parts.join(" ")));

  const rows = [];
  let cur = null;
  let j = i + 1;
  for (; j < lines.length; j++) {
    const line = lines[j];
    if (FULL_RULE.test(line) || COL_RULE.test(line)) break;
    if (line.trim() === "") {
      if (cur) rows.push(cur);
      cur = null;
      continue;
    }
    if (!cur) cur = cols.map(() => []);
    cols.forEach(([s, e], c) => {
      const piece = line.slice(s, e === Infinity ? undefined : e);
      if (piece && piece.trim()) cur[c].push(piece.trim());
    });
  }
  if (cur) rows.push(cur);
  return {
    header,
    rows: rows.map((r) => r.map((parts) => clean(parts.join(" ")))),
    end: j,
  };
}

// ---------------------------------------------------------------------------
// Walk the document, tracking heading context.
// ---------------------------------------------------------------------------
const budgets = [];        // { course, unit, unitName, pathwayDays }
const matrix = [];         // { course, unitNumber, unitName, unitDays, ...lesson }
const starters = [];       // { lessonId, target, trigger, transfer, subject }
const families = [];       // { subject, family, lessons, targets }
const courseHeadlines = {}; // course -> stats line from Appendix F

let h1 = "", h2 = "", h3 = "";

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith("# ")) { h1 = line.slice(2).trim(); h2 = ""; h3 = ""; continue; }
  if (line.startsWith("## ")) { h2 = line.slice(3).trim(); h3 = ""; continue; }
  if (line.startsWith("### ")) { h3 = line.slice(4).trim(); continue; }

  if (h1.startsWith("Appendix F") && h2 && /^\d+ core lesson days/.test(line.trim())) {
    courseHeadlines[h2] = clean(line);
    continue;
  }

  if (!COL_RULE.test(line)) continue;
  const { header: rawHeader, rows: body, end } = readTable(i);
  i = end - 1;
  if (body.length === 0) continue;

  const header = rawHeader.map((c) => c.toLowerCase());

  // Appendix A-D: course day budgets. The appendix heading names the subject.
  if (h1.startsWith("Appendix") && header[0] === "course" && header[1] === "unit") {
    const subject = /mathematics/i.test(h1)
      ? "Mathematics"
      : /english/i.test(h1)
        ? "English"
        : /social science/i.test(h1)
          ? "Social science"
          : /science/i.test(h1)
            ? "Science"
            : "Unknown";
    for (const r of body) {
      if (!r[0] && !r[2]) continue;
      const course = r[0] || h2;
      if (/course total/i.test(r[2])) continue;
      budgets.push({
        course,
        subject,
        unit: r[1],
        unitName: r[2],
        pathwayDays: Number(r[3]),
      });
    }
    continue;
  }

  // Appendix F: standards-to-lesson alignment.
  if (h1.startsWith("Appendix F") && header[0].startsWith("lesson /")) {
    const unitMatch = /^Unit ([A-Za-z0-9]+)\.\s*(.*?)\s*-\s*(\d+) core days$/.exec(h3);
    if (!unitMatch) continue;
    for (const r of body) {
      const cell = r[0];
      if (!cell) continue;
      const m = /^([A-Za-z0-9-]+)\s+Days?\s+([0-9-]+)\s*\((\d+)\)$/.exec(cell)
        || /^([A-Za-z0-9-]+)\s+Days?\s+([0-9-]+)$/.exec(cell);
      if (!m) continue;
      matrix.push({
        course: h2,
        unitNumber: unitMatch[1],
        unitName: unitMatch[2],
        unitDays: Number(unitMatch[3]),
        lessonCode: m[1],
        dayRange: m[2],
        days: m[3] ? Number(m[3]) : 1,
        sequence: r[1],
        standards: r[2],
        assessment: r[3],
        intervention: r[4],
      });
    }
    continue;
  }

  // Appendix E: starter intervention lessons.
  if (h1.startsWith("Appendix E") && header[0].startsWith("lesson id")) {
    for (const r of body) {
      if (!r[0]) continue;
      starters.push({
        lessonId: r[0],
        target: r[1],
        trigger: r[2],
        transfer: r[3],
        subjectHeading: h2,
      });
    }
    continue;
  }

  // Section 13: cross-subject intervention library.
  if (h1.startsWith("13.") && header[0] === "subject" && header[1].startsWith("intervention")) {
    for (const r of body) {
      if (!r[0]) continue;
      families.push({
        subject: r[0],
        family: r[1],
        lessons: Number(r[2]),
        targets: r[3],
      });
    }
    continue;
  }
}

// ---------------------------------------------------------------------------
// Fold into courses.
// ---------------------------------------------------------------------------
const byCourse = new Map();
for (const b of budgets) {
  if (!byCourse.has(b.course))
    byCourse.set(b.course, { title: b.course, subject: b.subject, order: byCourse.size, units: new Map() });
  const c = byCourse.get(b.course);
  if (c.units.has(b.unit)) continue;
  c.units.set(b.unit, {
    id: b.unit,
    order: c.units.size,
    name: b.unitName,
    pathwayDays: b.pathwayDays,
    lessons: [],
  });
}
for (const m of matrix) {
  const c = byCourse.get(m.course);
  if (!c) continue;
  const u = c.units.get(m.unitNumber);
  if (!u) continue;
  u.lessons.push({
    code: m.lessonCode,
    dayRange: m.dayRange,
    days: m.days,
    sequence: m.sequence,
    standards: m.standards,
    assessment: m.assessment,
    intervention: m.intervention,
  });
}

const courses = [...byCourse.values()].map((c) => {
  const units = [...c.units.values()].sort((a, b) => a.order - b.order);
  return {
    title: c.title,
    subject: c.subject,
    order: c.order,
    headline: courseHeadlines[c.title] ?? null,
    pathwayDays: units.reduce((n, u) => n + u.pathwayDays, 0),
    units,
  };
});

const catalog = { courses, starterInterventions: starters, interventionFamilies: families };
writeFileSync(OUT, JSON.stringify(catalog, null, 1));

const bad = courses.filter((c) => c.pathwayDays !== 135);
console.log(`matrix rows: ${matrix.length}`);
console.log(`budget rows: ${budgets.length}`);
console.log(`courses: ${courses.length}`);
console.log(`units: ${courses.reduce((n, c) => n + c.units.length, 0)}`);
console.log(`lessons: ${courses.reduce((n, c) => n + c.units.reduce((m, u) => m + u.lessons.length, 0), 0)}`);
console.log(`starter interventions: ${starters.length}`);
console.log(`intervention families: ${families.length} (${families.reduce((n, f) => n + f.lessons, 0)} lessons)`);
console.log(bad.length ? `NOT 135: ${bad.map((c) => `${c.title}=${c.pathwayDays}`).join(", ")}` : "every course totals 135 pathway days");
