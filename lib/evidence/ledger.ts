/**
 * The evidence ledger (CLAUDE.md §5).
 *
 * `evidence` is the immutable record of what a student actually did. Insert
 * only. There is no update and no delete in this module, and none anywhere
 * else: `lib/db/store.ts` exposes `appendEvidence` and nothing that mutates.
 *
 * Corrections are new rows linked by `supersedesEvidenceId`. Reads resolve
 * supersession EXPLICITLY through `currentEvidence` — never by assuming the
 * latest row wins.
 */
import { nextTimestamp } from "@/lib/clock";
import { appendEvidence, db, nextId } from "@/lib/db/store";
import type { EvidenceRecord } from "@/lib/db/types";

export type NewEvidence = Omit<EvidenceRecord, "id" | "recordedAt">;

/** Appends one evidence row. The only way evidence enters the system. */
export function recordEvidence(input: NewEvidence): EvidenceRecord {
  return appendEvidence({
    ...input,
    id: nextId("ev"),
    recordedAt: nextTimestamp(),
  });
}

/**
 * `evidence_current` — the view every read must use.
 *
 * A row is current when no later row supersedes it. A teacher observation, a
 * regrade, a proctored result, or an integrity annotation supersedes the
 * original; the original stays readable forever through `allEvidence`.
 */
export function currentEvidence(
  filter: Partial<Pick<EvidenceRecord, "studentId" | "enrollmentId" | "lessonCode" | "skill" | "standard">> = {},
): EvidenceRecord[] {
  const d = db();
  // Narrow by index first where we can. The result is identical to scanning
  // the whole table — the indexes hold the same rows.
  const all = filter.enrollmentId
    ? (d.evidenceByEnrollment.get(filter.enrollmentId) ?? [])
    : filter.studentId
      ? (d.evidenceByStudent.get(filter.studentId) ?? [])
      : d.evidence;
  const superseded = d.supersededEvidenceIds;
  return all.filter((e) => {
    if (superseded.has(e.id)) return false;
    if (filter.studentId && e.studentId !== filter.studentId) return false;
    if (filter.enrollmentId && e.enrollmentId !== filter.enrollmentId) return false;
    if (filter.lessonCode && e.lessonCode !== filter.lessonCode) return false;
    if (filter.skill && e.skill !== filter.skill) return false;
    if (filter.standard && e.standard !== filter.standard) return false;
    return true;
  });
}

/** Every row, superseded ones included. The ledger never forgets. */
export function allEvidence(studentId?: string): EvidenceRecord[] {
  const d = db();
  return studentId ? [...(d.evidenceByStudent.get(studentId) ?? [])] : [...d.evidence];
}

export function evidenceById(id: string): EvidenceRecord | undefined {
  return db().evidence.find((e) => e.id === id);
}

export function evidenceByIds(ids: string[]): EvidenceRecord[] {
  const wanted = new Set(ids);
  return db().evidence.filter((e) => wanted.has(e.id));
}

/** The chain of corrections behind a current row, oldest first. */
export function supersessionChain(id: string): EvidenceRecord[] {
  const chain: EvidenceRecord[] = [];
  let cursor = evidenceById(id);
  while (cursor) {
    chain.unshift(cursor);
    cursor = cursor.supersedesEvidenceId
      ? evidenceById(cursor.supersedesEvidenceId)
      : undefined;
  }
  return chain;
}

/**
 * Meaningful active time (CLAUDE.md §5).
 *
 * Active time responds to substantive interaction, not page-open time. This
 * caps a single item's contribution at the idle-pause threshold so a page left
 * open cannot inflate the record, and it never writes time-based evidence from
 * a timer alone — every row here is attached to an actual response.
 */
export function meaningfulMinutesFor(
  studentId: string,
  filter: { enrollmentId?: string; lessonCode?: string } = {},
): number {
  return currentEvidence({ studentId, ...filter }).reduce(
    (n, e) => n + e.meaningfulMinutes,
    0,
  );
}
