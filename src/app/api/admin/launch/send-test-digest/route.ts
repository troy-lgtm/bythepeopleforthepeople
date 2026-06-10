import { NextResponse, type NextRequest } from "next/server";
import { isValidAdminKey } from "@/lib/admin-auth";
import { logDigest } from "@/lib/digest-log";
import { emailConfigured, sendEmail } from "@/lib/email";
import { launchFlags } from "@/lib/launch-mode";
import {
  buildMovementDigest,
  renderMovementDigestHtml,
  renderMovementDigestText,
} from "@/lib/movement-digest";
import { siteBaseUrl } from "@/lib/site-url";
import { getSubscriber } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

function back(request: NextRequest, key: string, notice: string, tone = "ok") {
  const url = new URL("/admin/launch", request.nextUrl.origin);
  url.searchParams.set("key", key);
  url.searchParams.set("notice", notice);
  url.searchParams.set("tone", tone);
  return NextResponse.redirect(url, 303);
}

/** Launch Center button: send the movement digest to the test user only. */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const key = String(form?.get("key") ?? "");
  if (!isValidAdminKey(key)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const flags = launchFlags();
  const to = flags.testUserEmail;
  const sub = await getSubscriber(to);
  const BASE = siteBaseUrl();

  const digest = await buildMovementDigest({
    email: to,
    zip: sub?.zip ?? "90046",
    causes: sub?.causes,
    periodDays: 30,
  });
  const urls = sub
    ? {
        unsubscribeUrl: `${BASE}/api/unsubscribe?token=${encodeURIComponent(sub.token)}`,
        manageUrl: `${BASE}/watchlist/manage?token=${encodeURIComponent(sub.token)}`,
      }
    : undefined;
  const html = renderMovementDigestHtml(digest, BASE, urls);
  const text = renderMovementDigestText(digest, BASE, urls);

  if (!emailConfigured()) {
    await logDigest({
      email: to,
      zip: digest.zip,
      subject: digest.subject,
      itemCount: digest.totalMovements,
      status: "preview",
      trigger: "test-send",
      at: new Date().toISOString(),
    });
    return back(
      request,
      key,
      `Email is not configured (RESEND_API_KEY unset). Recorded a preview: "${digest.subject}" with ${digest.totalMovements} movements. Open /api/digest/preview?format=html to read it.`,
    );
  }

  const result = await sendEmail({
    to,
    subject: digest.subject,
    html,
    text,
    listUnsubscribeUrl: urls?.unsubscribeUrl,
    metadata: { template: "movement-digest", trigger: "test-send" },
  });

  await logDigest({
    email: to,
    zip: digest.zip,
    subject: digest.subject,
    itemCount: digest.totalMovements,
    status: result.ok ? "sent" : result.blocked ? "blocked" : "failed",
    trigger: "test-send",
    providerId: result.id,
    error: result.error,
    at: new Date().toISOString(),
  });

  if (result.ok) {
    return back(request, key, `Test digest sent to ${to}: "${digest.subject}".`);
  }
  return back(
    request,
    key,
    `Send failed: ${result.error ?? "unknown error"}.`,
    "bad",
  );
}
