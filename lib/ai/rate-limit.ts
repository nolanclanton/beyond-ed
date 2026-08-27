/**
 * Abuse and cost controls (vision §26).
 *
 * Two limits, both per person, both in memory.
 *
 * **A rolling request window.** Twenty requests in five minutes is generous for
 * someone genuinely authoring and immediate for a loop. It is the backstop for
 * the case this architecture cannot otherwise produce: there is no way for one
 * operation to start another, so a runaway can only come from a person or their
 * browser, and both are bounded here.
 *
 * **A duplicate guard.** The same person asking for the same thing twice within
 * a few seconds is a double click, not a decision. The second one returns the
 * limiter's refusal rather than spending a second call — which is the
 * "protection against repeated accidental submissions" the brief asks for, and
 * the same instinct as the idempotency keys on every consequential write.
 *
 * In-memory, per server instance, like the data store this beta runs on
 * (ADR 0002). That is a real limitation and worth stating: with several
 * instances the effective ceiling is the limit times the instance count. It
 * bounds accidents, which is what it is for; it is not a defence against a
 * determined authenticated attacker, and the authorization checks in the
 * gateway are what stand between the assistant and someone who should not reach
 * it at all.
 */
import { AI_CONFIG } from "./config";

type Bucket = { timestamps: number[]; lastSignature: string; lastAt: number };

const LIMITER_KEY = Symbol.for("beyond-ed.ai-rate-limit");
type GlobalWithLimiter = typeof globalThis & { [LIMITER_KEY]?: Map<string, Bucket> };

function buckets(): Map<string, Bucket> {
  const g = globalThis as GlobalWithLimiter;
  if (!g[LIMITER_KEY]) g[LIMITER_KEY] = new Map();
  return g[LIMITER_KEY];
}

/** A double click is anything identical within this window. */
const DUPLICATE_WINDOW_MS = 4000;

export type LimitDecision = { ok: true } | { ok: false; message: string };

/**
 * Wall-clock is read here on purpose.
 *
 * The demo clock in `lib/clock.ts` is a counter that advances one minute per
 * recorded event, which is exactly right for reproducible records and exactly
 * wrong for a rate limit — a limiter on a logical clock would never expire
 * between two rapid clicks. Nothing about a rate-limit decision is stored, so
 * reading real time here cannot make a record non-reproducible.
 */
export function checkRateLimit(userId: string, signature: string): LimitDecision {
  const now = Date.now();
  const map = buckets();
  const bucket = map.get(userId) ?? { timestamps: [], lastSignature: "", lastAt: 0 };

  if (
    bucket.lastSignature === signature &&
    now - bucket.lastAt < DUPLICATE_WINDOW_MS
  ) {
    return {
      ok: false,
      message:
        "That request was just sent. Waiting for the first answer rather than asking twice.",
    };
  }

  const cutoff = now - AI_CONFIG.limits.windowMs;
  const recent = bucket.timestamps.filter((t) => t > cutoff);
  if (recent.length >= AI_CONFIG.limits.requestsPerWindow) {
    const minutes = Math.ceil(AI_CONFIG.limits.windowMs / 60_000);
    return {
      ok: false,
      message: `You have made ${AI_CONFIG.limits.requestsPerWindow} assistance requests in the last ${minutes} minutes. Wait a moment before asking again — nothing was changed.`,
    };
  }

  recent.push(now);
  map.set(userId, { timestamps: recent, lastSignature: signature, lastAt: now });
  return { ok: true };
}

/** Clears the limiter. Used only by tests. */
export function resetRateLimit(): void {
  buckets().clear();
}
