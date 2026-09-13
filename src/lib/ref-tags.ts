/**
 * Referral tags for the growth loop. Pure module: imported by client
 * components, API routes, and the metrics aggregator alike, so it must stay
 * free of server-only imports.
 *
 * A ref tag names the SURFACE a visit came from, never a person. There is no
 * per-visitor id anywhere in this system; the tag is folded into a daily
 * count and nothing else.
 */

export const REF_TAGS = [
  "receipt",
  "digest",
  "embed",
  "og",
  "llm",
  "share",
  "feed",
  "cause",
  "direct",
] as const;

export type RefTag = (typeof REF_TAGS)[number] | "other";

const ALLOWED = new Set<string>(REF_TAGS);

/**
 * Where a tag can be clicked FROM. This is what makes the counters honest:
 * "digest", "embed", "og", "llm" and "share" links only exist outside the
 * site (an email, a third-party embed, a social card, an AI answer, a copied
 * share link), so a click on one is a real arrival from outside. "receipt",
 * "feed" and "cause" links live on our own pages, so a click on one is a
 * person already here moving deeper — engagement, not an arrival.
 */
export type RefKind = "inbound" | "internal" | "direct";

const INBOUND = new Set<string>(["digest", "embed", "og", "llm", "share"]);
const INTERNAL = new Set<string>(["receipt", "feed", "cause"]);

export function refKind(tag: string | null | undefined): RefKind {
  const v = normalizeRefTag(tag);
  if (INBOUND.has(v)) return "inbound";
  if (INTERNAL.has(v)) return "internal";
  return "direct";
}

/** Plain-language label for the Launch Center and the growth digest. */
export function refKindLabel(kind: RefKind): string {
  if (kind === "inbound") return "arrived from outside";
  if (kind === "internal") return "clicked inside the site";
  return "untagged";
}

/** Unknown or malformed tags collapse to "other" — never stored verbatim. */
export function normalizeRefTag(value: string | null | undefined): RefTag {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return "direct";
  return (ALLOWED.has(v) ? v : "other") as RefTag;
}

/** Event names the counter accepts. Keep this list tiny and purposeful. */
export const EVENT_NAMES = ["visit", "subscribe", "confirm"] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export function isEventName(value: string): value is EventName {
  return (EVENT_NAMES as readonly string[]).includes(value);
}

/** sessionStorage key holding the first-touch ref tag for this browser session. */
export const REF_STORAGE_KEY = "btpftp-ref";

/**
 * Read the first-touch ref for this session (client only). Returns null when
 * unavailable — private-mode browsers and storage-blocked contexts must not
 * throw.
 */
export function readStoredRef(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(REF_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Record the first-touch ref for this session. First write wins, so the
 * surface that actually brought someone in gets the credit even if they
 * browse through other ref-tagged links afterward.
 */
export function storeFirstTouchRef(value: string): void {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(REF_STORAGE_KEY)) return;
    window.sessionStorage.setItem(REF_STORAGE_KEY, normalizeRefTag(value));
  } catch {
    /* storage unavailable; attribution is best-effort by design */
  }
}
