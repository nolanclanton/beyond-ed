/**
 * Small pure collection helpers.
 *
 * Pure by construction: no I/O, no clock, no randomness, so `/lib/recommend`
 * may import them without breaking its own rule (CLAUDE.md §8).
 */

/**
 * Appends into a keyed bucket in place.
 *
 * The obvious `map.set(k, [...(map.get(k) ?? []), v])` copies the whole bucket
 * on every insert, which is quadratic in the bucket's size. At the catalog's
 * scale one popular key — a support that serves half the mathematics pathway,
 * or a standard taught in eleven courses — is enough for that to dominate a
 * page render.
 */
export function pushInto<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const bucket = map.get(key);
  if (bucket) bucket.push(value);
  else map.set(key, [value]);
}

/** Groups values by a derived key, preserving input order within each bucket. */
export function groupBy<K, V>(values: Iterable<V>, key: (value: V) => K): Map<K, V[]> {
  const out = new Map<K, V[]>();
  for (const value of values) pushInto(out, key(value), value);
  return out;
}
