import { Redis } from "@upstash/redis";

/**
 * Thin persistence facade for the growth loop: movement events, record
 * versions, launch state, blocked notifications, subscribers, digest log,
 * and anonymous ref counters all ride on it.
 *
 * Backend selection:
 * - Upstash Redis when KV_REST_API_* or UPSTASH_REDIS_REST_* env vars exist
 *   (the same convention subscribers.ts established).
 * - Otherwise an explicit in-memory store, so the full loop runs env-less in
 *   local dev and tests. Memory mode is EPHEMERAL and is surfaced as such in
 *   /api/health and the Launch Center — never silently treated as durable.
 *
 * Server-side module (also imported by npx-tsx scripts, so no "server-only";
 * the window check enforces the same boundary).
 */

if (typeof window !== "undefined") {
  throw new Error("store is server-side only");
}

export type StoreMode = "redis" | "memory";

type MemoryStore = {
  kv: Map<string, unknown>;
  sets: Map<string, Set<string>>;
  lists: Map<string, unknown[]>;
  hashes: Map<string, Map<string, number>>;
  counters: Map<string, { value: number; expiresAt: number | null }>;
};

// globalThis-scoped so Next.js dev hot reloads and route handlers share state.
const g = globalThis as typeof globalThis & { __btpftpMemStore?: MemoryStore };

function mem(): MemoryStore {
  if (!g.__btpftpMemStore) {
    g.__btpftpMemStore = {
      kv: new Map(),
      sets: new Map(),
      lists: new Map(),
      hashes: new Map(),
      counters: new Map(),
    };
  }
  return g.__btpftpMemStore;
}

let client: Redis | null | undefined;

function redis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

export function storeMode(): StoreMode {
  return redis() ? "redis" : "memory";
}

/** True when writes survive process restarts (real Redis behind the facade). */
export function storeIsDurable(): boolean {
  return storeMode() === "redis";
}

/** Deep-clone helper so memory-mode callers can't mutate stored state. */
function clone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  return structuredClone(value);
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const r = redis();
  if (r) return (await r.get<T>(key)) ?? null;
  const v = mem().kv.get(key);
  return v === undefined ? null : (clone(v) as T);
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const r = redis();
  if (r) {
    await r.set(key, value);
    return;
  }
  mem().kv.set(key, clone(value));
}

export async function kvDel(key: string): Promise<void> {
  const r = redis();
  if (r) {
    await r.del(key);
    return;
  }
  mem().kv.delete(key);
}

export async function kvMget<T>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) return [];
  const r = redis();
  if (r) {
    const values = await r.mget<T[]>(...keys);
    return values.map((v) => v ?? null);
  }
  return keys.map((k) => {
    const v = mem().kv.get(k);
    return v === undefined ? null : (clone(v) as T);
  });
}

export async function setAdd(key: string, member: string): Promise<void> {
  const r = redis();
  if (r) {
    await r.sadd(key, member);
    return;
  }
  const s = mem().sets.get(key) ?? new Set<string>();
  s.add(member);
  mem().sets.set(key, s);
}

export async function setRemove(key: string, member: string): Promise<void> {
  const r = redis();
  if (r) {
    await r.srem(key, member);
    return;
  }
  mem().sets.get(key)?.delete(member);
}

export async function setMembers(key: string): Promise<string[]> {
  const r = redis();
  if (r) return await r.smembers(key);
  return Array.from(mem().sets.get(key) ?? []);
}

/**
 * Prepend to a capped list (newest first). Used for append-only logs like
 * blocked notifications and digest sends, where only the recent tail matters.
 */
export async function listPushCapped(
  key: string,
  value: unknown,
  cap: number,
): Promise<void> {
  const r = redis();
  if (r) {
    await r.lpush(key, value);
    await r.ltrim(key, 0, cap - 1);
    return;
  }
  const list = mem().lists.get(key) ?? [];
  list.unshift(clone(value));
  if (list.length > cap) list.length = cap;
  mem().lists.set(key, list);
}

export async function listRange<T>(
  key: string,
  start = 0,
  stop = -1,
): Promise<T[]> {
  const r = redis();
  if (r) return await r.lrange<T>(key, start, stop);
  const list = mem().lists.get(key) ?? [];
  const end = stop === -1 ? list.length : stop + 1;
  return list.slice(start, end).map((v) => clone(v) as T);
}

export async function listLength(key: string): Promise<number> {
  const r = redis();
  if (r) return await r.llen(key);
  return (mem().lists.get(key) ?? []).length;
}

/** Increment a named counter inside a hash (anonymous ref/event tallies). */
export async function hashIncr(
  key: string,
  field: string,
  by = 1,
): Promise<number> {
  const r = redis();
  if (r) return await r.hincrby(key, field, by);
  const h = mem().hashes.get(key) ?? new Map<string, number>();
  const next = (h.get(field) ?? 0) + by;
  h.set(field, next);
  mem().hashes.set(key, h);
  return next;
}

export async function hashGetAll(
  key: string,
): Promise<Record<string, number>> {
  const r = redis();
  if (r) {
    const raw = (await r.hgetall<Record<string, number>>(key)) ?? {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) out[k] = Number(v) || 0;
    return out;
  }
  return Object.fromEntries(mem().hashes.get(key) ?? []);
}

/**
 * Fixed-window counter for rate limiting. Mirrors the prior subscribers.ts
 * semantics: fails open (allowed) on backend errors so a Redis hiccup never
 * blocks a legitimate subscriber.
 */
export async function windowIncr(
  key: string,
  windowSeconds: number,
): Promise<number> {
  const r = redis();
  if (r) {
    try {
      const count = await r.incr(key);
      if (count === 1) await r.expire(key, windowSeconds);
      return count;
    } catch {
      return 0;
    }
  }
  const now = Date.now();
  const entry = mem().counters.get(key);
  if (!entry || (entry.expiresAt !== null && entry.expiresAt <= now)) {
    mem().counters.set(key, {
      value: 1,
      expiresAt: now + windowSeconds * 1000,
    });
    return 1;
  }
  entry.value += 1;
  return entry.value;
}

/** Test-only escape hatch: wipe memory mode between unit tests. */
export function __resetMemoryStoreForTests(): void {
  g.__btpftpMemStore = undefined;
}
