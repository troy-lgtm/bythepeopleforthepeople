import { listLength, listPushCapped, listRange } from "./store";

/**
 * Audit log of digest sends (metadata only, never bodies). Powers the Launch
 * Center's "last digest" status and the proof that only the test user has
 * ever been mailed.
 */

if (typeof window !== "undefined") {
  throw new Error("digest-log is server-side only");
}

const KEY = "digest:log";
const CAP = 200;

export type DigestLogEntry = {
  email: string;
  zip?: string;
  subject: string;
  itemCount: number;
  status: "sent" | "failed" | "blocked" | "preview";
  trigger: "cron" | "confirm" | "test-send" | "api" | "script";
  providerId?: string;
  error?: string;
  at: string;
};

export async function logDigest(entry: DigestLogEntry): Promise<void> {
  try {
    await listPushCapped(KEY, entry, CAP);
  } catch {
    // The log is an audit convenience; failures must not break sending paths.
    console.warn("[digest-log] failed to record entry", entry.status, entry.email);
  }
}

export async function listDigestLog(limit = 20): Promise<DigestLogEntry[]> {
  return listRange<DigestLogEntry>(KEY, 0, limit - 1);
}

export async function countDigestLog(): Promise<number> {
  return listLength(KEY);
}
