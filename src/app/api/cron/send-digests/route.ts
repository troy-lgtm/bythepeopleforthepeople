import { type NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { buildDigest, renderDigestHtml, renderDigestText } from "@/lib/digest";
import { emailConfigured, sendEmail } from "@/lib/email";
import { isStoreConfigured, listConfirmed, markSent } from "@/lib/subscribers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BASE = "https://bythepeopleforthepeople.com";
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
    request.nextUrl.searchParams.get("secret");
  if (provided !== expected) {
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
    const payload = buildDigest({ zip: sub.zip, causes: sub.causes });
    const result = await sendEmail({
      to: sub.email,
      subject: payload.forZip
        ? `Your civic-records digest · ${payload.forZip}`
        : "Your civic-records digest",
      html: renderDigestHtml(payload, BASE, { unsubscribeUrl: unsubUrl }),
      text: renderDigestText(payload, BASE, { unsubscribeUrl: unsubUrl }),
      listUnsubscribeUrl: unsubUrl,
    });

    if (result.ok) {
      sent++;
      await markSent(sub.email, now.toISOString());
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
