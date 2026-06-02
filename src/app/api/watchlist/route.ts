import { type NextRequest, NextResponse } from "next/server";
import { readWatchlist, WATCHLIST_COOKIE } from "@/lib/watchlist";
import { jsonError, jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const ids = await readWatchlist();
  return jsonOk({ watchedIds: ids, count: ids.length });
}

export async function POST(request: NextRequest) {
  const body = (await request
    .json()
    .catch(() => ({}))) as { watchedIds?: unknown };
  if (!Array.isArray(body.watchedIds)) {
    return jsonError(
      400,
      "watched_ids_required",
      "Body must be {watchedIds: string[]}",
    );
  }
  const cleaned = body.watchedIds
    .filter((value): value is string => typeof value === "string")
    .slice(0, 1000);

  const response = NextResponse.json({
    ok: true,
    data: { watchedIds: cleaned, count: cleaned.length },
  });
  response.cookies.set(WATCHLIST_COOKIE, JSON.stringify(cleaned), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(WATCHLIST_COOKIE);
  return response;
}
