import { type RefKind, normalizeRefTag, refKind } from "./ref-tags";
import { hashGetAll, storeIsDurable } from "./store";

/**
 * Aggregates the anonymous daily counters written by /api/events into the
 * one question the growth loop needs answered: which surface turns a visit
 * into a watcher?
 *
 * Counters live in `evt:<YYYY-MM-DD>` hashes with `<event>:<ref>` fields.
 * There is no per-visitor record to aggregate — only counts.
 */

if (typeof window !== "undefined") {
  throw new Error("growth-metrics is server-side only");
}

export const EVENT_DAY_KEY = (day: string) => `evt:${day}`;

export type RefRow = {
  ref: string;
  /** Whether a click on this tag is an arrival from outside or a move inside. */
  kind: RefKind;
  visits: number;
  subscribes: number;
  confirms: number;
  /** Subscribes per 100 visits. Null when there is no denominator yet. */
  conversionPct: number | null;
};

export type GrowthMetrics = {
  days: number;
  from: string;
  to: string;
  totals: { visits: number; subscribes: number; confirms: number };
  /**
   * The split that answers "did anyone come here from outside?": inbound
   * counts clicks on links that only exist off-site (digest, embed, og,
   * llm, share); internal counts clicks between our own pages (receipt,
   * feed, cause). Only inbound is evidence of an arrival.
   */
  inbound: { visits: number; subscribes: number };
  internal: { visits: number; subscribes: number };
  byRef: RefRow[];
  daily: Array<{ date: string; visits: number; subscribes: number }>;
  /** False when counters live in the ephemeral in-memory store. */
  durable: boolean;
};

function dayKeys(days: number, now: Date): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    out.push(new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10));
  }
  return out.reverse();
}

export async function getGrowthMetrics(
  days = 14,
  now = new Date(),
): Promise<GrowthMetrics> {
  const window = Math.min(Math.max(Math.floor(days), 1), 90);
  const keys = dayKeys(window, now);

  const byRef = new Map<string, RefRow>();
  const daily: GrowthMetrics["daily"] = [];
  const totals = { visits: 0, subscribes: 0, confirms: 0 };

  for (const day of keys) {
    const counters = await hashGetAll(EVENT_DAY_KEY(day));
    let dayVisits = 0;
    let daySubscribes = 0;

    for (const [field, count] of Object.entries(counters)) {
      const [name, rawRef] = field.split(":");
      const ref = normalizeRefTag(rawRef);
      const row =
        byRef.get(ref) ??
        ({
          ref,
          kind: refKind(ref),
          visits: 0,
          subscribes: 0,
          confirms: 0,
          conversionPct: null,
        } as RefRow);

      if (name === "visit") {
        row.visits += count;
        totals.visits += count;
        dayVisits += count;
      } else if (name === "subscribe") {
        row.subscribes += count;
        totals.subscribes += count;
        daySubscribes += count;
      } else if (name === "confirm") {
        row.confirms += count;
        totals.confirms += count;
      } else {
        continue;
      }
      byRef.set(ref, row);
    }
    daily.push({ date: day, visits: dayVisits, subscribes: daySubscribes });
  }

  const inbound = { visits: 0, subscribes: 0 };
  const internal = { visits: 0, subscribes: 0 };
  for (const r of byRef.values()) {
    if (r.kind === "inbound") {
      inbound.visits += r.visits;
      inbound.subscribes += r.subscribes;
    } else if (r.kind === "internal") {
      internal.visits += r.visits;
      internal.subscribes += r.subscribes;
    }
  }

  const rows = Array.from(byRef.values())
    .map((r) => ({
      ...r,
      // No visits means no denominator. Say null, never "0%".
      conversionPct:
        r.visits > 0 ? Math.round((r.subscribes / r.visits) * 1000) / 10 : null,
    }))
    .sort((a, b) => b.visits - a.visits || b.subscribes - a.subscribes);

  return {
    days: window,
    from: keys[0],
    to: keys[keys.length - 1],
    totals,
    inbound,
    internal,
    byRef: rows,
    daily,
    durable: storeIsDurable(),
  };
}
