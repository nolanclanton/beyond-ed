/**
 * A minimal, dependency-free reader for the one .xlsx file this repository
 * ingests.
 *
 * CLAUDE.md §1 keeps the dependency list closed, so the curriculum build does
 * not get to add a spreadsheet library. An .xlsx is a ZIP of XML parts, and
 * Node ships both halves of that already: `zlib.inflateRawSync` for the ZIP
 * members and enough string handling for the small, machine-written XML the
 * workbook contains.
 *
 * Scope is deliberately narrow. This reads cell values — shared strings, inline
 * strings, and numbers — and nothing else. Formulas resolve to their cached
 * value, which is what the workbook stores for its validation columns.
 */
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

// ---------------------------------------------------------------------------
// ZIP
// ---------------------------------------------------------------------------

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;

/**
 * Reads the ZIP central directory and returns every member, keyed by name.
 *
 * The central directory rather than a scan of local headers: a local header may
 * declare sizes of zero and defer them to a data descriptor, and the central
 * directory is the copy that is always complete.
 */
function readZip(buffer) {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === EOCD_SIGNATURE) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a ZIP archive: no end-of-central-directory record.");

  const entryCount = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);

  const members = new Map();
  for (let n = 0; n < entryCount; n++) {
    if (buffer.readUInt32LE(offset) !== CENTRAL_SIGNATURE) {
      throw new Error(`Corrupt ZIP: central directory entry ${n} has a bad signature.`);
    }
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);

    members.set(name, { method, compressedSize, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return {
    names: () => [...members.keys()],
    read(name) {
      const member = members.get(name);
      if (!member) throw new Error(`ZIP member not found: ${name}`);
      const { localOffset, method, compressedSize } = member;
      const nameLength = buffer.readUInt16LE(localOffset + 26);
      const extraLength = buffer.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + nameLength + extraLength;
      const raw = buffer.subarray(start, start + compressedSize);
      if (method === 0) return raw;
      if (method === 8) return inflateRawSync(raw);
      throw new Error(`Unsupported ZIP compression method ${method} for ${name}.`);
    },
  };
}

// ---------------------------------------------------------------------------
// XML
// ---------------------------------------------------------------------------

const ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeXml(text) {
  if (!text.includes("&")) return text;
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      return String.fromCodePoint(parseInt(body.slice(2), 16));
    }
    if (body.startsWith("#")) return String.fromCodePoint(parseInt(body.slice(1), 10));
    return ENTITIES[body] ?? whole;
  });
}

/** Every `<tag …>…</tag>` (and `<tag …/>`) at any depth, in document order. */
function* elements(xml, tag) {
  const open = new RegExp(`<${tag}(\\s[^>]*?)?(/)?>`, "g");
  let match;
  while ((match = open.exec(xml)) !== null) {
    const attrs = match[1] ?? "";
    if (match[2] === "/") {
      yield { attrs, inner: "" };
      continue;
    }
    const close = `</${tag}>`;
    const end = xml.indexOf(close, open.lastIndex);
    if (end < 0) return;
    yield { attrs, inner: xml.slice(open.lastIndex, end) };
    open.lastIndex = end + close.length;
  }
}

function attr(attrs, name) {
  const match = new RegExp(`\\s${name}="([^"]*)"`).exec(attrs);
  return match ? decodeXml(match[1]) : undefined;
}

/** The concatenated text of every `<t>` inside a fragment. */
function textOf(fragment) {
  let out = "";
  for (const t of elements(fragment, "t")) out += decodeXml(t.inner);
  return out;
}

// ---------------------------------------------------------------------------
// Workbook
// ---------------------------------------------------------------------------

/** `BC` -> 54. Column letters are base-26 with no zero. */
function columnIndex(cellRef) {
  let n = 0;
  for (const ch of cellRef) {
    const code = ch.charCodeAt(0);
    if (code < 65 || code > 90) break;
    n = n * 26 + (code - 64);
  }
  return n - 1;
}

/**
 * Opens a workbook and exposes each sheet as rows of trimmed strings.
 *
 * Blank cells come back as "" rather than being skipped, so a row is always
 * positionally aligned with its header.
 */
export function openWorkbook(path) {
  const zip = readZip(readFileSync(path));

  const sharedStrings = [];
  if (zip.names().includes("xl/sharedStrings.xml")) {
    const xml = zip.read("xl/sharedStrings.xml").toString("utf8");
    for (const si of elements(xml, "si")) sharedStrings.push(textOf(si.inner));
  }

  const relsXml = zip.read("xl/_rels/workbook.xml.rels").toString("utf8");
  const targets = new Map();
  for (const rel of elements(relsXml, "Relationship")) {
    targets.set(attr(rel.attrs, "Id"), attr(rel.attrs, "Target"));
  }

  const workbookXml = zip.read("xl/workbook.xml").toString("utf8");
  const sheets = [];
  for (const sheet of elements(workbookXml, "sheet")) {
    const name = attr(sheet.attrs, "name");
    const relId = attr(sheet.attrs, "r:id") ?? attr(sheet.attrs, "id");
    const target = targets.get(relId);
    if (!name || !target) continue;
    sheets.push({ name, part: `xl/${target.replace(/^\/?xl\//, "").replace(/^\//, "")}` });
  }

  function rowsOf(sheetName) {
    const sheet = sheets.find((s) => s.name === sheetName);
    if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);
    const xml = zip.read(sheet.part).toString("utf8");

    const rows = [];
    for (const row of elements(xml, "row")) {
      const cells = [];
      let width = 0;
      for (const cell of elements(row.inner, "c")) {
        const ref = attr(cell.attrs, "r") ?? "";
        const type = attr(cell.attrs, "t");
        const at = ref ? columnIndex(ref) : width;

        let value = "";
        if (type === "inlineStr") {
          value = textOf(cell.inner);
        } else {
          const v = /<v[^>]*>([\s\S]*?)<\/v>/.exec(cell.inner);
          const raw = v ? decodeXml(v[1]) : "";
          value = type === "s" && raw !== "" ? (sharedStrings[Number(raw)] ?? "") : raw;
        }

        cells[at] = value.trim();
        width = at + 1;
      }
      for (let i = 0; i < width; i++) if (cells[i] === undefined) cells[i] = "";
      // Spreadsheet editors leave styled-but-empty rows behind. They are not
      // records, and letting them through would silently pad every table.
      if (cells.some((cell) => cell !== "")) rows.push(cells);
    }
    return rows;
  }

  /** A sheet as objects keyed by its first row's headers. */
  function tableOf(sheetName) {
    const rows = rowsOf(sheetName);
    if (rows.length === 0) return [];
    const header = rows[0];
    return rows.slice(1).map((cells) => {
      const record = {};
      header.forEach((key, i) => {
        if (key) record[key] = cells[i] ?? "";
      });
      return record;
    });
  }

  return { sheetNames: () => sheets.map((s) => s.name), rowsOf, tableOf };
}

/** `"135.0"` -> 135. Throws rather than guessing, so a bad cell fails the build. */
export function num(value, where) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Expected a number${where ? ` in ${where}` : ""}, got "${value}".`);
  return n;
}

/** Splits a semicolon or pipe delimited cell into trimmed, non-empty parts. */
export function list(value, separator = ";") {
  return String(value ?? "")
    .split(separator)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
