import { type NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { hashIncr } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Lightweight, anonymous event counter for the growth loop. Stores only a
 * daily tally per (event, ref) pair — no IPs, no user agents, no IDs, no
 * cookies. Exists so the Launch Center can show which surfaces drive visits
 * (digest, receipt, embed, og, llm, share) without invasive tracking.
 */

const EVENT_RE = /^[a-z0-9_-]{1,40}$/;
const ALLOWED_REFS = new Set([
  "receipt",
  "digest",
  "embed",
  "og",
  "llm",
  "share",
  "feed",
  "cause",
  "direct",
]);

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    ref?: string;
  };
  const name = (body.name ?? "").trim().toLowerCase();
  const ref = (body.ref ?? "direct").trim().toLowerCase();
  if (!EVENT_RE.test(name)) {
    return jsonError(400, "invalid_event", "Event name must match [a-z0-9_-]{1,40}.");
  }
  const safeRef = ALLOWED_REFS.has(ref) ? ref : "other";
  const day = new Date().toISOString().slice(0, 10);
  await hashIncr(`evt:${day}`, `${name}:${safeRef}`);
  return jsonOk({ recorded: true });
}
