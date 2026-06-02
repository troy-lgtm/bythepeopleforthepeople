import { type NextRequest, NextResponse } from "next/server";
import { CAUSES_COOKIE, MAX_CAUSES, isCause, normalize, readCauses } from "@/lib/causes";
import { jsonError, jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const causes = await readCauses();
  return jsonOk({ causes, count: causes.length });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    causes?: unknown;
  };
  if (!Array.isArray(body.causes)) {
    return jsonError(
      400,
      "causes_required",
      "Body must be {causes: Cause[]}.",
    );
  }
  const cleaned = body.causes
    .filter(isCause)
    .slice(0, MAX_CAUSES)
    .map(normalize);
  const response = NextResponse.json({
    ok: true,
    data: { causes: cleaned, count: cleaned.length },
  });
  response.cookies.set(CAUSES_COOKIE, JSON.stringify(cleaned), {
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
  response.cookies.delete(CAUSES_COOKIE);
  return response;
}
