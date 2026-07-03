import { type NextRequest } from "next/server";
import type { Cause } from "@/data/types";
import { jsonError, jsonOk, timingSafeEqualStr } from "@/lib/api";
import { logDigest } from "@/lib/digest-log";
import { isEmail, sendEmail } from "@/lib/email";
import {
  buildMovementDigest,
  renderMovementDigestHtml,
  renderMovementDigestText,
} from "@/lib/movement-digest";
import { siteBaseUrl } from "@/lib/site-url";
import { getSubscriber } from "@/lib/subscribers";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type SendRequest = {
  to?: string;
  zip?: string;
  causes?: Cause[];
  dryRun?: boolean;
};

/**
 * Operator-triggered digest send. Requires DIGEST_SEND_SECRET, and delivery
 * goes through sendEmail, which consults the notification guard — so in
 * private test mode this can only ever reach the test user, no matter what
 * `to` says. Blocked attempts are logged, never silently sent.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-digest-send-secret") ?? "";
  const expected = process.env.DIGEST_SEND_SECRET;
  if (!expected) {
    return jsonError(
      503,
      "send_not_configured",
      "DIGEST_SEND_SECRET is not set. Configure it in the deployment environment to enable digest delivery.",
    );
  }
  if (!timingSafeEqualStr(secret, expected)) {
    return jsonError(401, "unauthorized", "Provide a valid x-digest-send-secret header.");
  }

  const body = (await request.json().catch(() => ({}))) as SendRequest;
  if (!isEmail(body.to)) {
    return jsonError(400, "to_required", "Provide a valid recipient email in `to`.");
  }

  const BASE = siteBaseUrl();
  const digest = await buildMovementDigest({
    email: body.to,
    zip: body.zip,
    causes: Array.isArray(body.causes) ? body.causes : undefined,
  });

  // Include manage/unsubscribe links when the recipient is a known watcher.
  const sub = await getSubscriber(body.to);
  const urls = sub
    ? {
        unsubscribeUrl: `${BASE}/api/unsubscribe?token=${encodeURIComponent(sub.token)}`,
        manageUrl: `${BASE}/watchlist/manage?token=${encodeURIComponent(sub.token)}`,
      }
    : undefined;

  const html = renderMovementDigestHtml(digest, BASE, urls);
  const text = renderMovementDigestText(digest, BASE, urls);

  if (body.dryRun) {
    return jsonOk({
      dryRun: true,
      recipient: body.to,
      subject: digest.subject,
      totalMovements: digest.totalMovements,
      preview: { htmlBytes: html.length, textBytes: text.length },
    });
  }

  const result = await sendEmail({
    to: body.to,
    subject: digest.subject,
    html,
    text,
    listUnsubscribeUrl: urls?.unsubscribeUrl,
    metadata: { template: "movement-digest", trigger: "api" },
  });

  await logDigest({
    email: body.to.toLowerCase(),
    zip: body.zip,
    subject: digest.subject,
    itemCount: digest.totalMovements,
    status: result.ok ? "sent" : result.blocked ? "blocked" : "failed",
    trigger: "api",
    providerId: result.id,
    error: result.error,
    at: new Date().toISOString(),
  });

  if (result.blocked) {
    return jsonError(
      403,
      "recipient_blocked",
      "The notification guard blocked this recipient. In private test mode only the test user can receive email. The attempt was logged.",
    );
  }
  if (!result.ok) {
    return jsonError(502, "delivery_error", result.error ?? "Unknown delivery error.");
  }
  return jsonOk({ sent: true, recipient: body.to, providerId: result.id ?? null });
}
