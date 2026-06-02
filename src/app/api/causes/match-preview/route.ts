import { type NextRequest } from "next/server";
import type { Cause } from "@/data/types";
import { jsonError, jsonOk } from "@/lib/api";
import { matchCause, matchCount, tokenize } from "@/lib/cause-matcher";

export const dynamic = "force-dynamic";

/**
 * Live cause match-preview for the home hero. Accepts a free-text query and
 * returns how many indexed records would match if it became a cause, plus a
 * few top hits. No cookie state, no storage — pure read of the index so the
 * hero can show the payoff before the user commits.
 *
 *   GET /api/causes/match-preview?q=safer+streets&jur=Los+Angeles|California
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 140);
  if (q.length < 3) {
    return jsonError(
      400,
      "query_too_short",
      "Provide ?q= with at least 3 characters.",
    );
  }

  const jurParam = request.nextUrl.searchParams.get("jur") ?? "";
  const jurisdictions = jurParam
    ? jurParam
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const cause: Cause = {
    id: "preview",
    title: q,
    outcome: q,
    topics: [],
    jurisdictions,
    watchTermsAny: Array.from(new Set([q.toLowerCase(), ...tokenize(q)])).slice(
      0,
      20,
    ),
    createdAt: new Date(0).toISOString(),
  };

  const matches = matchCause(cause);
  const count = matchCount(matches);
  const top = [
    ...matches.bills.slice(0, 3).map((m) => ({
      type: "bill" as const,
      title: m.bill.title,
      href: `/bills/${m.bill.slug}`,
    })),
    ...matches.locals.slice(0, 3).map((m) => ({
      type: "local" as const,
      title: m.decision.title,
      href: `/local/${m.decision.slug}`,
    })),
    ...matches.topics.slice(0, 3).map((m) => ({
      type: "topic" as const,
      title: m.topic.name,
      href: `/topics/${m.topic.slug}`,
    })),
  ].slice(0, 4);

  return jsonOk({ count, top, reps: matches.reps.length });
}
