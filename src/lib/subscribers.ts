import "server-only";
import { randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { Cause } from "@/data/types";

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
};

let client: Redis | null | undefined;

/**
 * Lazily construct the Redis client. Supports both the Vercel KV naming
 * (KV_REST_API_*) and the native Upstash naming (UPSTASH_REDIS_REST_*) so it
 * works regardless of how the store is provisioned. Returns null when no
 * store is configured — every caller degrades gracefully on null.
 */
function redis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

export function isStoreConfigured(): boolean {
  return redis() !== null;
}

const KEY_INDEX = "subs:index";
const subKey = (email: string) => `sub:${email.toLowerCase()}`;
const tokKey = (token: string) => `subtoken:${token}`;

export function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function getSubscriber(email: string): Promise<Subscriber | null> {
  const r = redis();
  if (!r) return null;
  return (await r.get<Subscriber>(subKey(email))) ?? null;
}

export async function upsertSubscriber(sub: Subscriber): Promise<void> {
  const r = redis();
  if (!r) throw new Error("store_not_configured");
  const email = sub.email.toLowerCase();
  await r.set(subKey(email), { ...sub, email });
  await r.set(tokKey(sub.token), email);
  await r.sadd(KEY_INDEX, email);
}

export async function emailForToken(token: string): Promise<string | null> {
  const r = redis();
  if (!r) return null;
  return (await r.get<string>(tokKey(token))) ?? null;
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
  const r = redis();
  if (!r) return null;
  const email = await emailForToken(token);
  if (!email) return null;
  await r.del(subKey(email));
  await r.del(tokKey(token));
  await r.srem(KEY_INDEX, email);
  return email;
}

export async function listConfirmed(): Promise<Subscriber[]> {
  const r = redis();
  if (!r) return [];
  const emails = await r.smembers(KEY_INDEX);
  if (!emails.length) return [];
  const subs = await r.mget<Subscriber[]>(...emails.map((e) => subKey(e)));
  return subs.filter((s): s is Subscriber => Boolean(s) && s!.confirmed);
}

export async function markSent(email: string, when: string): Promise<void> {
  const sub = await getSubscriber(email);
  if (!sub) return;
  await upsertSubscriber({ ...sub, lastSentAt: when });
}
