import type { MovementEvent } from "./movement-types";
import { siteBaseUrl } from "./site-url";

/**
 * Wire shape for the public civic-records API. Every movement carries its
 * source, provenance, and methodology pointer; absent values are explicit
 * nulls, never guesses.
 */

export type ApiMovement = {
  id: string;
  recordId: string;
  recordUrl: string;
  recordTitle: string;
  jurisdiction: string;
  places: string[];
  causes: string[];
  movementType: string;
  title: string;
  summary: string;
  whyItMatters: string;
  responsibleBody: string | null;
  occurredAt: string;
  detectedAt: string;
  confidence: string;
  source: string | null;
  sourceUrl: string | null;
  evidence: Array<{
    claim: string;
    locator: string;
    excerpt: string;
    verificationNote: string;
    sourceUrl: string;
    provenance: string;
  }>;
  receiptUrl: string;
  methodologyUrl: string;
};

export function serializeMovement(event: MovementEvent): ApiMovement {
  const BASE = siteBaseUrl();
  return {
    id: event.id,
    recordId: event.recordId,
    recordUrl: `${BASE}${event.recordHref}`,
    recordTitle: event.recordTitle,
    jurisdiction: event.jurisdiction,
    places: event.placeKeys,
    causes: event.causeSlugs,
    movementType: event.movementType,
    title: event.title,
    summary: event.plainEnglishSummary,
    whyItMatters: event.whyItMatters,
    responsibleBody: event.responsibleBody || null,
    occurredAt: event.occurredAt,
    detectedAt: event.detectedAt,
    confidence: event.confidence,
    source: event.sourceLabel || null,
    sourceUrl: event.sourceUrl || null,
    evidence: event.evidence.map((e) => ({
      claim: e.claim,
      locator: e.locator,
      excerpt: e.excerpt,
      verificationNote: e.verificationNote,
      sourceUrl: e.sourceUrl,
      provenance: e.provenance,
    })),
    receiptUrl: `${BASE}/receipts/${encodeURIComponent(event.id)}`,
    methodologyUrl: `${BASE}/methodology`,
  };
}

export function clampLimit(raw: string | null, fallback = 25, max = 100): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
}
