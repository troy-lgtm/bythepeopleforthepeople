import { type NextRequest } from "next/server";
import { jsonError, jsonOk, timingSafeEqualStr } from "@/lib/api";
import { detectAndStoreMovements, movementCounts } from "@/lib/movement-store";
import { storeMode } from "@/lib/store";

export const dynamic = "force-dynamic";
// Paced Open States requests (~10/min limit) need headroom: the full run is
// ~12 requests with 6.5s gaps, plus store writes.
export const maxDuration = 300;

/**
 * Vercel Cron: snapshot every indexed record, diff against the stored
 * version, and persist movement events for any official change. Detection
 * only — sending happens separately in send-digests, behind the notification
 * guard. Protected by CRON_SECRET like the other cron routes.
 */
async function handle(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return jsonOk({
      skipped: true,
      reason: "cron_secret_unset",
      note: "CRON_SECRET is not set. Refusing to run until it is configured.",
    });
  }
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.nextUrl.searchParams.get("secret") ??
    "";
  if (!timingSafeEqualStr(provided, expected)) {
    return jsonError(401, "unauthorized", "Provide CRON_SECRET to invoke.");
  }

  const run = await detectAndStoreMovements();
  const counts = await movementCounts();
  return jsonOk({
    run,
    counts,
    store: storeMode(),
    note: run.firstRun
      ? "First run: stored record versions as the comparison baseline. Diffs emit from the next run on."
      : undefined,
  });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
