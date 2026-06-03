import { type NextRequest } from "next/server";
import { buildDigest, renderDigestHtml, renderDigestText } from "@/lib/digest";
import { emailConfigured, sendEmail } from "@/lib/email";
import { confirmByToken } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

const BASE = "https://bythepeopleforthepeople.com";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!token) return htmlPage("Missing token", "This confirmation link is incomplete.", 400);

  const sub = await confirmByToken(token);
  if (!sub) {
    return htmlPage(
      "Link not found",
      "This confirmation link is invalid or has already been used. Subscribe again if you still want the digest.",
      404,
    );
  }

  // Send the first digest immediately as the welcome.
  if (emailConfigured()) {
    const unsubUrl = `${BASE}/api/unsubscribe?token=${encodeURIComponent(sub.token)}`;
    const payload = buildDigest({ zip: sub.zip, causes: sub.causes });
    await sendEmail({
      to: sub.email,
      subject: payload.forZip
        ? `Your civic-records digest · ${payload.forZip}`
        : "Your civic-records digest",
      html: renderDigestHtml(payload, BASE, { unsubscribeUrl: unsubUrl }),
      text: renderDigestText(payload, BASE, { unsubscribeUrl: unsubUrl }),
      listUnsubscribeUrl: unsubUrl,
    });
  }

  return htmlPage(
    "You're subscribed ✓",
    `Confirmed for the <strong>${sub.cadence}</strong> digest${sub.zip ? ` for ${escapeHtml(sub.zip)}` : ""}. Your first digest is on its way. You can unsubscribe from any email in one click.`,
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
