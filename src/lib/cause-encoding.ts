import type { Cause } from "@/data/types";
import { isCause, normalize } from "@/lib/causes";

/**
 * Encode a cause into a URL-safe string for opt-in RSS publishing.
 *
 * Tradeoffs:
 * - No server storage needed; the cause data lives in the URL itself.
 * - The encoded URL is therefore public-facing — that is the point of
 *   opt-in publishing.
 * - If the user edits the cause, they need to re-generate the URL.
 *
 * Base64url with no padding. Reversible.
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  const padded = str
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(str.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf-8");
}

const TRIMMED_KEYS = [
  "id",
  "title",
  "outcome",
  "topics",
  "jurisdictions",
  "watchTermsAny",
  "createdAt",
  "emoji",
] as const;

export function encodeCauseForPublish(cause: Cause): string {
  const trimmed: Record<string, unknown> = {};
  for (const key of TRIMMED_KEYS) {
    const value = cause[key];
    if (value === undefined) continue;
    trimmed[key] = value;
  }
  const json = JSON.stringify(trimmed);
  return base64UrlEncode(json);
}

export function decodeCauseFromPublish(encoded: string): Cause | null {
  try {
    const json = base64UrlDecode(encoded);
    const parsed = JSON.parse(json) as unknown;
    if (!isCause(parsed)) return null;
    return normalize(parsed);
  } catch {
    return null;
  }
}
