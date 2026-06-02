import { NextResponse, type NextRequest } from "next/server";
import { getBillBySlug, getLocalDecisionBySlug } from "@/data/records";
import { getRepBySlug } from "@/lib/federal-reps";

export const dynamic = "force-static";
export const revalidate = 600;

const BASE = "https://bythepeopleforthepeople.com";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function html(title: string, subtitle: string, href: string, badge: string) {
  return `<!doctype html>
<html lang="en"><head>
<title>${esc(title)}</title>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<style>
html,body{margin:0;padding:0;background:transparent}
.card{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;gap:12px;align-items:flex-start;border:1px solid #d9dde8;border-radius:10px;background:#fbfaf7;padding:14px 16px;color:#07111f;box-shadow:0 0 0 1px rgba(7,17,31,0.04);text-decoration:none}
.badge{display:inline-flex;align-items:center;gap:6px;background:#07111f;color:white;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;flex-shrink:0}
.dot{width:7px;height:7px;border-radius:99px;background:#4ade80}
.body{flex:1;min-width:0}
.title{margin:0;font-size:15px;font-weight:700;line-height:1.3}
.subtitle{margin:4px 0 0;font-size:12px;color:#27364f}
.meta{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:11px;color:#40516a;font-family:ui-monospace,monospace}
.link{color:#175c55;font-weight:700}
</style></head>
<body>
<a class="card" href="${esc(`${BASE}${href}?utm_source=embed&utm_medium=citation-badge`)}" target="_top">
  <span class="badge"><span class="dot"></span>${esc(badge)}</span>
  <span class="body">
    <h2 class="title">${esc(title)}</h2>
    <p class="subtitle">${esc(subtitle)}</p>
    <p class="meta">Verified at <span class="link">bythepeopleforthepeople.com</span> · open the record →</p>
  </span>
</a>
</body></html>`;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ type: string; slug: string }> },
) {
  const { type, slug } = await context.params;
  let body = "";
  if (type === "bills") {
    const bill = getBillBySlug(slug);
    if (!bill) return new NextResponse("Not found", { status: 404 });
    body = html(
      bill.title,
      `${bill.jurisdiction} · ${bill.status}`,
      `/bills/${bill.slug}`,
      "Source-anchored bill",
    );
  } else if (type === "local") {
    const decision = getLocalDecisionBySlug(slug);
    if (!decision) return new NextResponse("Not found", { status: 404 });
    body = html(
      decision.title,
      `${decision.jurisdiction} · ${decision.status}`,
      `/local/${decision.slug}`,
      "Source-anchored local record",
    );
  } else if (type === "federal") {
    const rep = getRepBySlug(slug);
    if (!rep) return new NextResponse("Not found", { status: 404 });
    const chamber = rep.type === "sen" ? "U.S. Senate" : "U.S. House";
    const district =
      rep.type === "sen" ? rep.state : `${rep.state}-${rep.district}`;
    body = html(
      rep.name,
      `${chamber} ${district}${rep.party ? " · " + rep.party : ""}`,
      `/federal/${slug}`,
      "Civic profile",
    );
  } else {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
