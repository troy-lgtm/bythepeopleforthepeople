import { type NextRequest } from "next/server";
import { removeByToken } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

// One-click unsubscribe (RFC 8058) — mail clients POST here automatically.
export async function POST(request: NextRequest) {
  const token =
    request.nextUrl.searchParams.get("token") ??
    (await request
      .formData()
      .then((f) => String(f.get("token") ?? ""))
      .catch(() => ""));
  if (token) await removeByToken(token);
  return new Response("Unsubscribed", { status: 200 });
}

// Human click from an email link.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!token) {
    return htmlPage("Missing token", "This unsubscribe link is incomplete.", 400);
  }
  const email = await removeByToken(token);
  if (!email) {
    return htmlPage(
      "Already removed",
      "This address is not on the list (the link may have already been used).",
    );
  }
  return htmlPage(
    "You're unsubscribed",
    "You will not receive any further digests. No data about this subscription is retained. You can resubscribe any time.",
  );
}

function htmlPage(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title></head>
  <body style="margin:0;font-family:Inter,system-ui,sans-serif;background:#fbfaf7;color:#07111f;">
    <div style="max-width:560px;margin:10vh auto;padding:0 24px;text-align:center;">
      <p style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#175c55;">By The People, For The People</p>
      <h1 style="font-size:28px;margin:8px 0 12px;">${escapeHtml(title)}</h1>
      <p style="font-size:15px;line-height:1.6;color:#27364f;">${escapeHtml(body)}</p>
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
