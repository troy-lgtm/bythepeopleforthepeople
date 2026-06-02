import { NextResponse, type NextRequest } from "next/server";
import { lookupZip, PLACE_COOKIE, readPlace } from "@/lib/place";
import { liveLookupZip } from "@/lib/place-fallback";
import { getRepsForPlace } from "@/lib/reps";

export const dynamic = "force-dynamic";

async function resolveZip(zip: string) {
  const fromTable = lookupZip(zip);
  if (fromTable) return { place: fromTable, source: "static" as const };
  const live = await liveLookupZip(zip);
  if (live) return { place: live, source: "census-live" as const };
  return null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const zip = url.searchParams.get("zip");
  if (zip) {
    const resolved = await resolveZip(zip);
    if (!resolved) {
      return NextResponse.json(
        {
          ok: false,
          error: "zip_not_resolved",
          message:
            "Could not resolve this ZIP. Verify the ZIP is a valid US postal code; if so, the upstream lookup service is temporarily unavailable.",
        },
        { status: 404 },
      );
    }
    const reps = getRepsForPlace(resolved.place.state, resolved.place.cd);
    return NextResponse.json({
      ok: true,
      place: resolved.place,
      reps,
      source: resolved.source,
    });
  }
  const current = await readPlace();
  if (!current) {
    return NextResponse.json({ ok: true, place: null, reps: null });
  }
  const reps = getRepsForPlace(current.state, current.cd);
  return NextResponse.json({ ok: true, place: current, reps });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { zip?: string };
  const resolved = body.zip ? await resolveZip(body.zip) : null;
  if (!resolved) {
    return NextResponse.json(
      {
        ok: false,
        error: "zip_not_resolved",
        message:
          "Could not resolve this ZIP. Verify it is a valid US postal code; if so, the upstream lookup service is temporarily unavailable. Try again or check the format.",
      },
      { status: 400 },
    );
  }
  const reps = getRepsForPlace(resolved.place.state, resolved.place.cd);
  const response = NextResponse.json({
    ok: true,
    place: resolved.place,
    reps,
    source: resolved.source,
  });
  response.cookies.set(PLACE_COOKIE, JSON.stringify(resolved.place), {
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
  response.cookies.delete(PLACE_COOKIE);
  return response;
}
