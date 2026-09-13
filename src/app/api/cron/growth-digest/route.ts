import { type NextRequest } from "next/server";
import { jsonError, jsonPrivate, timingSafeEqualStr } from "@/lib/api";
import { buildGrowthDigest, renderGrowthDigestText } from "@/lib/growth-digest";
import { sendGrowthDigest } from "@/lib/growth-digest-delivery";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron (Mondays): tell the operator whether anyone came. Posts the
 * growth digest to the operator's Slack webhook and emails the test user,
 * each only when configured, each through the notification guard.
 *
 * `?dry=1` renders the digest as text and sends nothing — safe to open by
 * hand. Refuses to run at all unless CRON_SECRET is set and matches.
 */
async function handle(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return jsonPrivate({
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

  const periodDays = Number(request.nextUrl.searchParams.get("days")) || 7;

  if (request.nextUrl.searchParams.get("dry") === "1") {
    const digest = await buildGrowthDigest({ periodDays });
    return jsonPrivate({
      dry: true,
      subject: digest.subject,
      headline: digest.headline,
      text: renderGrowthDigestText(digest),
    });
  }

  const run = await sendGrowthDigest({ trigger: "cron", periodDays });
  return jsonPrivate(run);
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
