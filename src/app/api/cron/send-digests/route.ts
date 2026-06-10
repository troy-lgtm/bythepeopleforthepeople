import { type NextRequest } from "next/server";
import { jsonError, jsonOk, timingSafeEqualStr } from "@/lib/api";
import { logDigest } from "@/lib/digest-log";
import { emailConfigured, sendEmail } from "@/lib/email";
import {
  buildMovementDigest,
  renderMovementDigestHtml,
  renderMovementDigestText,
} from "@/lib/movement-digest";
import { siteBaseUrl } from "@/lib/site-url";
import { isStoreConfigured, listConfirmed, markSent } from "@/lib/subscribers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BASE = siteBaseUrl();
const MAX_PER_RUN = 100;

/**
 * Vercel Cron: send the recurring digest to confirmed subscribers.
 *
 * Cadence: weekly subscribers receive a send only on Mondays (UTC); daily
 * subscribers receive one every run. Same-day dedupe via lastSentAt so a
 * re-triggered cron never double-sends. Hard-refuses to send unless
 * CRON_SECRET is set and matches — never an open trigger for bulk mail.
 */
async function handle(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return jsonOk({
      skipped: true,
      reason: "cron_secret_unset",
      note: "CRON_SECRET is not set. Refusing to send until it is configured.",
    });
  }
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.nextUrl.searchParams.get("secret") ??
    "";
  if (!timingSafeEqualStr(provided, expected)) {
    return jsonError(401, "unauthorized", "Provide CRON_SECRET to invoke.");
  }

  if (!isStoreConfigured()) {
    return jsonOk({ skipped: true, reason: "store_not_configured", sent: 0 });
  }
  if (!emailConfigured()) {
    return jsonOk({ skipped: true, reason: "email_not_configured", sent: 0 });
  }

  const now = new Date();
  const isMonday = now.getUTCDay() === 1;
  const today = now.toISOString().slice(0, 10);

  const subscribers = await listConfirmed();
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let blocked = 0;
  const errors: string[] = [];
  let capped = false;

  for (const sub of subscribers) {
    if (sent + failed >= MAX_PER_RUN) {
      capped = true;
      break;
    }
    if (sub.cadence === "weekly" && !isMonday) {
      skipped++;
      continue;
    }
    if (sub.lastSentAt && sub.lastSentAt.slice(0, 10) === today) {
      skipped++;
      continue;
    }

    const unsubUrl = `${BASE}/api/unsubscribe?token=${encodeURIComponent(sub.token)}`;
    const manageUrl = `${BASE}/watchlist/manage?token=${encodeURIComponent(sub.token)}`;
    const digest = await buildMovementDigest({
      email: sub.email,
      zip: sub.zip,
      causes: sub.causes,
      periodDays: sub.cadence === "daily" ? 1 : 7,
      now,
    });
    // Daily cadence with zero movement: skip the send entirely. Quiet days
    // earn silence, not filler. Weekly always sends (the honest quiet note).
    if (sub.cadence === "daily" && digest.totalMovements === 0) {
      skipped++;
      continue;
    }
    const result = await sendEmail({
      to: sub.email,
      subject: digest.subject,
      html: renderMovementDigestHtml(digest, BASE, {
        unsubscribeUrl: unsubUrl,
        manageUrl,
      }),
      text: renderMovementDigestText(digest, BASE, {
        unsubscribeUrl: unsubUrl,
        manageUrl,
      }),
      listUnsubscribeUrl: unsubUrl,
      metadata: { template: "movement-digest", trigger: "cron" },
    });

    await logDigest({
      email: sub.email,
      zip: sub.zip,
      subject: digest.subject,
      itemCount: digest.totalMovements,
      status: result.ok ? "sent" : result.blocked ? "blocked" : "failed",
      trigger: "cron",
      providerId: result.id,
      error: result.error,
      at: now.toISOString(),
    });

    if (result.ok) {
      sent++;
      await markSent(sub.email, now.toISOString());
    } else if (result.blocked) {
      // Guard refusal (private test mode): logged by the guard, counted here.
      blocked++;
    } else {
      failed++;
      if (errors.length < 5) errors.push(`${sub.email}: ${result.error}`);
    }
  }

  return jsonOk({
    ranAt: now.toISOString(),
    cadenceDay: isMonday ? "monday" : "weekday",
    eligible: subscribers.length,
    sent,
    skipped,
    failed,
    blocked,
    capped,
    errors,
  });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
