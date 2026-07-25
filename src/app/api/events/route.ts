import { type NextRequest } from "next/server";
import { isValidAdminKey } from "@/lib/admin-auth";
import { jsonError, jsonOk } from "@/lib/api";
import { EVENT_DAY_KEY, getGrowthMetrics } from "@/lib/growth-metrics";
import { isEventName, normalizeRefTag } from "@/lib/ref-tags";
import { hashIncr } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Lightweight, anonymous event counter for the growth loop. Stores only a
 * daily tally per (event, ref) pair — no IPs, no user agents, no ids, no
 * cookies, nothing that identifies a person.
 *
 * POST is public (the page fires it); GET is admin-gated because the
 * aggregate is operator information, not public data.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    ref?: string;
  };
  const name = (body.name ?? "").trim().toLowerCase();
  if (!isEventName(name)) {
    return jsonError(400, "invalid_event", "Unsupported event name.");
  }
  const ref = normalizeRefTag(body.ref);
  const day = new Date().toISOString().slice(0, 10);
  await hashIncr(EVENT_DAY_KEY(day), `${name}:${ref}`);
  return jsonOk({ recorded: true });
}

/** Operator read: aggregated counters by referral surface. */
export async function GET(request: NextRequest) {
  const key =
    request.nextUrl.searchParams.get("key") ??
    request.headers.get("x-admin-key");
  if (!isValidAdminKey(key)) {
    return jsonError(
      401,
      "unauthorized",
      "Growth counters are operator-only. Provide the admin key.",
    );
  }
  const days = Number(request.nextUrl.searchParams.get("days")) || 14;
  return jsonOk(await getGrowthMetrics(days));
}
