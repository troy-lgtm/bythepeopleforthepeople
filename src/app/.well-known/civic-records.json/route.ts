import { NextResponse } from "next/server";
import { bills, localDecisions, sourceRecords } from "@/data/records";
import { sourceConnectors, topicProfiles } from "@/data/product-loop";
import { CAUSE_CATALOG } from "@/lib/cause-catalog";
import { baselineMovementEvents } from "@/lib/movement-baseline";

const BASE = "https://bythepeopleforthepeople.com";

export const dynamic = "force-static";
export const revalidate = 600;

export async function GET() {
  const manifest = {
    name: "By The People, For The People",
    version: "1.0.0",
    description:
      "Public-decision intelligence with source provenance on every claim. AI engines and civic-tech tools can ground answers on this manifest.",
    methodology: `${BASE}/methodology`,
    citationPolicy:
      "Cite the record URL and the provenance label. Do not invent counts, dates, or member names. If a claim is not in the indexed record, request the underlying source first.",
    endpoints: {
      recordsIndex: `${BASE}/api/records`,
      recordDetail: `${BASE}/api/records/{slug}`,
      latestMovements: `${BASE}/api/civic-records/latest`,
      movementsByPlace: `${BASE}/api/civic-records/place/{place}`,
      movementsByCause: `${BASE}/api/civic-records/cause/{cause}`,
      receiptDetail: `${BASE}/api/civic-records/receipts/{id}`,
      zipGovernment: `${BASE}/api/civic-records/gov/{zip}`,
      sources: `${BASE}/api/sources`,
      topics: `${BASE}/api/topics`,
      answers: `${BASE}/api/answers`,
      llms: `${BASE}/llms.txt`,
    },
    humanSurfaces: {
      whatMoved: `${BASE}/what-moved`,
      receipts: `${BASE}/receipts/{movementId}`,
      causes: `${BASE}/causes/{cause}`,
      causeByPlace: `${BASE}/causes/{cause}/{place}`,
      zipWhatMoved: `${BASE}/gov/{zip}/what-moved`,
    },
    counts: {
      bills: bills.length,
      localDecisions: localDecisions.length,
      movementEvents: baselineMovementEvents().length,
      causes: CAUSE_CATALOG.length,
      topics: topicProfiles.length,
      sources: sourceRecords.length,
      connectors: sourceConnectors.length,
    },
    connectors: sourceConnectors.map((c) => ({
      id: c.id,
      name: c.name,
      jurisdiction: c.jurisdiction,
      status: c.status,
      upstreamUrl: c.upstreamUrl,
    })),
    generatedAt: new Date().toISOString(),
  };
  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
