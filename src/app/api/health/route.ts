import { NextResponse, type NextRequest } from "next/server";
import { bills, localDecisions, sourceRecords } from "@/data/records";
import { sourceConnectors, topicProfiles } from "@/data/product-loop";
import { timingSafeEqualStr } from "@/lib/api";
import { repCount } from "@/lib/reps";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.nextUrl.searchParams.get("secret") ??
    "";
  return timingSafeEqualStr(provided, expected);
}

export async function GET(request: NextRequest) {
  // Minimal, non-revealing payload for anonymous callers (uptime probes etc.).
  const now = new Date().toISOString();
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: true, status: "healthy", time: now },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  // Authorized: include the full diagnostics.
  const counts = {
    bills: bills.length,
    localDecisions: localDecisions.length,
    topics: topicProfiles.length,
    sources: sourceRecords.length,
    connectors: sourceConnectors.length,
    federalLegislators: repCount(),
  };

  const status = {
    ok: true,
    status: "healthy",
    service: "By The People, For The People",
    version: "1.0.0",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    region: process.env.VERCEL_REGION ?? "local",
    runtime: "nodejs",
    counts,
    envConfigured: {
      RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
      DIGEST_FROM_ADDRESS: Boolean(process.env.DIGEST_FROM_ADDRESS),
      DIGEST_SEND_SECRET: Boolean(process.env.DIGEST_SEND_SECRET),
      CONGRESS_API_KEY: Boolean(process.env.CONGRESS_API_KEY),
      CORRECTIONS_WEBHOOK_URL: Boolean(process.env.CORRECTIONS_WEBHOOK_URL),
      PLAUSIBLE_DOMAIN: Boolean(process.env.PLAUSIBLE_DOMAIN),
      SENTRY_DSN: Boolean(process.env.SENTRY_DSN),
    },
    generatedAt: now,
  };

  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
