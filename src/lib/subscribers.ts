import { randomBytes } from "node:crypto";
import type { Cause } from "../data/types";
import {
  kvDel,
  kvGet,
  kvMget,
  kvSet,
  setAdd,
  setMembers,
  setRemove,
  storeIsDurable,
  windowIncr,
} from "./store";

/**
 * Persistent subscribers = the account-tier watchlist. A subscriber row holds
 * the ZIP + causes being watched, double-opt-in state, and audit fields.
 *
 * Storage rides on the store facade: Upstash Redis when configured, explicit
 * in-memory fallback otherwise so the full loop runs env-less in local dev.
 * Memory mode is ephemeral and surfaced as such wherever store status shows.
 *
 * Server-side module (also imported by npx-tsx scripts, so no "server-only";
 * the window check enforces the same boundary).
 */

if (typeof window !== "undefined") {
  throw new Error("subscribers is server-side only");
}

export type Cadence = "daily" | "weekly";

export type Subscriber = {
  email: string;
  zip?: string;
  causes?: Cause[];
  cadence: Cadence;
  token: string;
  confirmed: boolean;
  createdAt: string;
  confirmedAt?: string;
  lastSentAt?: string;
  /** Last time a digest covered movement for this watcher. */
  lastSeenMovementAt?: string;
  /** True when this is the designated private-pilot test user. */
  isTestUser?: boolean;
  /** How the row was created: "site", "seed-script", "admin-seed". */
  source?: string;
  /**
   * First-touch referral surface that produced this subscriber ("receipt",
   * "digest", "embed", "og", "llm", "share", "direct"). This is the growth
   * loop's attribution: which surface turns a reader into a watcher. A
   * surface name only — never anything identifying the person.
   */
  refSource?: string;
};

/**
 * Whether subscriber writes survive restarts. Memory mode still works for
 * local testing; production sending requires the durable store.
 */
export function isStoreConfigured(): boolean {
  return storeIsDurable();
}

const KEY_INDEX = "subs:index";
const subKey = (email: string) => `sub:${email.toLowerCase()}`;
const tokKey = (token: string) => `subtoken:${token}`;

export function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function getSubscriber(email: string): Promise<Subscriber | null> {
  return (await kvGet<Subscriber>(subKey(email))) ?? null;
}

export async function upsertSubscriber(sub: Subscriber): Promise<void> {
  const email = sub.email.toLowerCase();
  await kvSet(subKey(email), { ...sub, email });
  await kvSet(tokKey(sub.token), email);
  await setAdd(KEY_INDEX, email);
}

export async function emailForToken(token: string): Promise<string | null> {
  return (await kvGet<string>(tokKey(token))) ?? null;
}

export async function getSubscriberByToken(
  token: string,
): Promise<Subscriber | null> {
  const email = await emailForToken(token);
  if (!email) return null;
  return getSubscriber(email);
}

export async function confirmByToken(
  token: string,
): Promise<Subscriber | null> {
  const email = await emailForToken(token);
  if (!email) return null;
  const sub = await getSubscriber(email);
  if (!sub) return null;
  if (sub.confirmed) return sub;
  const updated: Subscriber = {
    ...sub,
    confirmed: true,
    confirmedAt: new Date().toISOString(),
  };
  await upsertSubscriber(updated);
  return updated;
}

export async function removeByToken(token: string): Promise<string | null> {
  const email = await emailForToken(token);
  if (!email) return null;
  await kvDel(subKey(email));
  await kvDel(tokKey(token));
  await setRemove(KEY_INDEX, email);
  return email;
}

export async function listAll(): Promise<Subscriber[]> {
  const emails = await setMembers(KEY_INDEX);
  if (!emails.length) return [];
  const subs = await kvMget<Subscriber>(emails.map((e) => subKey(e)));
  return subs.filter((s): s is Subscriber => Boolean(s));
}

export async function listConfirmed(): Promise<Subscriber[]> {
  return (await listAll()).filter((s) => s.confirmed);
}

export async function markSent(email: string, when: string): Promise<void> {
  const sub = await getSubscriber(email);
  if (!sub) return;
  await upsertSubscriber({
    ...sub,
    lastSentAt: when,
    lastSeenMovementAt: when,
  });
}

/**
 * Best-effort fixed-window rate limit. Fails open — never block a legit
 * subscriber because the store hiccupped.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ ok: boolean; count: number }> {
  const count = await windowIncr(key, windowSeconds);
  return { ok: count === 0 || count <= limit, count };
}

/**
 * Real count of confirmed subscribers in a ZIP — for honest local social
 * proof ("N people near you get updates"). Returns 0 when no one has
 * subscribed; callers must not invent a number.
 */
export async function countConfirmedByZip(zip: string): Promise<number> {
  const trimmed = zip.trim();
  if (!trimmed) return 0;
  const subs = await listConfirmed();
  return subs.filter((s) => s.zip === trimmed).length;
}
