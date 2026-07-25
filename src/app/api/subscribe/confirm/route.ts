import { type NextRequest } from "next/server";
import { logDigest } from "@/lib/digest-log";
import { emailConfigured, sendEmail } from "@/lib/email";
import {
  buildMovementDigest,
  renderMovementDigestHtml,
  renderMovementDigestText,
} from "@/lib/movement-digest";
import { confirmByToken, getSubscriberByToken } from "@/lib/subscribers";
import { EVENT_DAY_KEY } from "@/lib/growth-metrics";
import { normalizeRefTag } from "@/lib/ref-tags";
import { siteBaseUrl } from "@/lib/site-url";
import { hashIncr } from "@/lib/store";

export const dynamic = "force-dynamic";

const BASE = siteBaseUrl();

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!token) return htmlPage("Missing token", "This confirmation link is incomplete.", 400);

  const alreadyConfirmed = (await getSubscriberByToken(token))?.confirmed;
  const sub = await confirmByToken(token);
  if (!sub) {
    return htmlPage(
      "Link not found",
      "This confirmation link is invalid or has already been used. Subscribe again if you still want the digest.",
      404,
    );
  }

  // Completing double opt-in is the real "watcher gained" moment. Count it
  // once, against the surface that first brought this person in.
  if (!alreadyConfirmed) {
    await hashIncr(
      EVENT_DAY_KEY(new Date().toISOString().slice(0, 10)),
      `confirm:${normalizeRefTag(sub.refSource)}`,
    );
  }

  // Send the first digest immediately as the welcome.
  if (emailConfigured()) {
    const unsubUrl = `${BASE}/api/unsubscribe?token=${encodeURIComponent(sub.token)}`;
    const manageUrl = `${BASE}/watchlist/manage?token=${encodeURIComponent(sub.token)}`;
    const digest = await buildMovementDigest({
      email: sub.email,
      zip: sub.zip,
      causes: sub.causes,
    });
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
      metadata: { template: "movement-digest", trigger: "confirm" },
    });
    await logDigest({
      email: sub.email,
      zip: sub.zip,
      subject: digest.subject,
      itemCount: digest.totalMovements,
      status: result.ok ? "sent" : result.blocked ? "blocked" : "failed",
      trigger: "confirm",
      providerId: result.id,
      error: result.error,
      at: new Date().toISOString(),
    });
  }

  const manageUrl = `/watchlist/manage?token=${encodeURIComponent(sub.token)}`;
  return htmlPage(
    "You're subscribed ✓",
    `Confirmed for the <strong>${sub.cadence}</strong> digest${sub.zip ? ` for ${escapeHtml(sub.zip)}` : ""}. Your first digest is on its way. You can unsubscribe from any email in one click.<br><br><a href="${manageUrl}" style="color:#175c55;font-weight:600;">Open your watchlist</a>`,
  );
}

function htmlPage(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title></head>
  <body style="margin:0;font-family:Inter,system-ui,sans-serif;background:#fbfaf7;color:#07111f;">
    <div style="max-width:560px;margin:10vh auto;padding:0 24px;text-align:center;">
      <p style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#175c55;">By The People, For The People</p>
      <h1 style="font-size:28px;margin:8px 0 12px;">${escapeHtml(title)}</h1>
      <p style="font-size:15px;line-height:1.6;color:#27364f;">${body}</p>
      <p style="margin-top:24px;"><a href="/" style="color:#175c55;font-weight:600;">← Back to the site</a></p>
    </div>
  </body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
