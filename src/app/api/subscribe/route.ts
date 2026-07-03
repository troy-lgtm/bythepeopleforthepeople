import { type NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { readCauses } from "@/lib/causes";
import { readPlace } from "@/lib/place";
import { EMAIL_RE, emailConfigured, sendEmail } from "@/lib/email";
import { isTestUserEmail, launchFlags } from "@/lib/launch-mode";
import { assertCanNotifyRecipient } from "@/lib/notification-guard";
import { siteBaseUrl } from "@/lib/site-url";
import {
  type Cadence,
  type Subscriber,
  getSubscriber,
  newToken,
  rateLimit,
  upsertSubscriber,
} from "@/lib/subscribers";

export const dynamic = "force-dynamic";

const RL_MAX = 3;
const RL_WINDOW_SECONDS = 60;

export async function POST(request: NextRequest) {
  const BASE = siteBaseUrl();
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    cadence?: string;
    consent?: boolean;
  };

  if (!body.email || !EMAIL_RE.test(body.email)) {
    return jsonError(400, "email_required", "Provide a valid email address.");
  }
  if (body.consent !== true) {
    return jsonError(
      400,
      "consent_required",
      "Explicit consent is required to subscribe.",
    );
  }

  // Private-pilot gate. While private test mode is on, only the designated
  // test user can join the list. Nothing is stored and nothing is sent for
  // anyone else; the attempt is logged by the guard for the Launch Center.
  const gate = await assertCanNotifyRecipient(body.email, "email", {
    payloadSummary: "subscribe_attempt",
  });
  if (!gate.allowed) {
    return jsonOk({
      status: "private_pilot",
      confirmed: false,
      message:
        "Private test mode is active. This pilot is currently limited to the test user. Public signups open at launch.",
    });
  }

  // Best-effort rate limit per address (no-op when Redis is unconfigured).
  const rl = await rateLimit(
    `rl:subscribe:${body.email.toLowerCase()}`,
    RL_MAX,
    RL_WINDOW_SECONDS,
  );
  if (!rl.ok) {
    return jsonError(
      429,
      "rate_limited",
      "Too many subscribe attempts for this address. Try again in a minute.",
    );
  }

  const cadence: Cadence = body.cadence === "daily" ? "daily" : "weekly";
  // ZIP and causes ride along in the request cookies (same-origin fetch).
  const place = await readPlace();
  const causes = await readCauses();

  const existing = await getSubscriber(body.email);
  const token = existing?.token ?? newToken();
  const sub: Subscriber = {
    email: body.email.toLowerCase(),
    zip: place?.zip,
    causes,
    cadence,
    token,
    confirmed: existing?.confirmed ?? false,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    confirmedAt: existing?.confirmedAt,
    lastSentAt: existing?.lastSentAt,
    lastSeenMovementAt: existing?.lastSeenMovementAt,
    isTestUser: isTestUserEmail(body.email, launchFlags()),
    source: existing?.source ?? "site",
  };
  await upsertSubscriber(sub);

  // Already confirmed → treat as a preference update, no new email.
  if (sub.confirmed) {
    return jsonOk({ status: "updated", confirmed: true });
  }

  // Double opt-in: the only message sent to an unconfirmed address.
  if (emailConfigured()) {
    const confirmUrl = `${BASE}/api/subscribe/confirm?token=${encodeURIComponent(token)}`;
    const unsubUrl = `${BASE}/api/unsubscribe?token=${encodeURIComponent(token)}`;
    const sent = await sendEmail({
      to: sub.email,
      subject: "Confirm your civic-records digest",
      html: confirmHtml(confirmUrl, cadence),
      text: confirmText(confirmUrl, cadence),
      listUnsubscribeUrl: unsubUrl,
    });
    if (!sent.ok) {
      return jsonOk({
        status: "pending",
        confirmed: false,
        note: `Saved, but the confirmation email could not be sent: ${sent.error}`,
      });
    }
  }

  return jsonOk({ status: "pending", confirmed: false });
}

function confirmHtml(confirmUrl: string, cadence: Cadence): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;font-family:Inter,system-ui,sans-serif;background:#fbfaf7;color:#07111f;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #d9dde8;border-radius:12px;padding:24px;">
    <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#175c55;">By The People, For The People</p>
    <h1 style="margin:0 0 8px 0;font-size:20px;">Confirm your ${cadence} digest</h1>
    <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#27364f;">You (or someone using this address) asked for a source-anchored civic-records digest. Confirm to start delivery. If this was not you, ignore this email and nothing will be sent.</p>
    <a href="${confirmUrl}" style="display:inline-block;background:#07111f;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 18px;border-radius:8px;">Confirm subscription</a>
    <p style="margin:18px 0 0 0;font-size:12px;color:#40516a;">Or paste this link: ${confirmUrl}</p>
  </div></body></html>`;
}

function confirmText(confirmUrl: string, cadence: Cadence): string {
  return [
    "By The People, For The People",
    "",
    `Confirm your ${cadence} civic-records digest.`,
    "",
    "You (or someone using this address) asked for a source-anchored civic-records digest. Confirm to start delivery. If this was not you, ignore this email and nothing will be sent.",
    "",
    `Confirm: ${confirmUrl}`,
  ].join("\n");
}
