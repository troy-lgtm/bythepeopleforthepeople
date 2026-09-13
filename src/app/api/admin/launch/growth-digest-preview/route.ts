import { NextResponse, type NextRequest } from "next/server";
import { isValidAdminKey } from "@/lib/admin-auth";
import {
  buildGrowthDigest,
  renderGrowthDigestHtml,
  renderGrowthDigestText,
} from "@/lib/growth-digest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Read the growth digest without sending it. Admin-key gated, never cached.
 * `?format=html` shows the email; default is the plain text that Slack gets.
 */
export async function GET(request: NextRequest) {
  const key =
    request.nextUrl.searchParams.get("key") ??
    request.headers.get("x-admin-key");
  if (!isValidAdminKey(key)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const periodDays = Number(request.nextUrl.searchParams.get("days")) || 7;
  const digest = await buildGrowthDigest({ periodDays });
  const html = request.nextUrl.searchParams.get("format") === "html";
  return new NextResponse(
    html ? renderGrowthDigestHtml(digest) : renderGrowthDigestText(digest),
    {
      headers: {
        "Content-Type": html ? "text/html; charset=utf-8" : "text/plain; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
