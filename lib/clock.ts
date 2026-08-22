/**
 * Demo logical clock.
 *
 * The beta runs on a seeded, in-memory store (ADR 0002). Wall-clock reads would
 * make every seeded record, every calculation, and every screenshot different on
 * each boot, which defeats the point of a reviewable build and would violate the
 * determinism requirement in CLAUDE.md §8 if it ever leaked into `/lib/recommend`.
 *
 * So time is a counter. It starts at a fixed demo epoch and advances one minute
 * per recorded event. `/lib/recommend` does not import this module — it must not
 * read time at all.
 */

/** Fixed start of the demo school year. Not a real date for any real student. */
const DEMO_EPOCH_MS = Date.UTC(2026, 7, 17, 15, 0, 0); // 2026-08-17T15:00:00Z

let tick = 0;

/** The next timestamp in the demo timeline. Monotonic, never repeats. */
export function nextTimestamp(): string {
  const t = new Date(DEMO_EPOCH_MS + tick * 60_000);
  tick += 1;
  return t.toISOString();
}

/** The current demo timestamp without advancing the clock. */
export function currentTimestamp(): string {
  return new Date(DEMO_EPOCH_MS + tick * 60_000).toISOString();
}

/** Resets the clock. Used only by the seeder and by tests. */
export function resetClock(): void {
  tick = 0;
}

/** Human-readable day/time for a stored timestamp. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  });
}
