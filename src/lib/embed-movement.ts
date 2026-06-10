import { launchFlags } from "./launch-mode";
import { movementTypeLabel } from "./movement-digest";
import type { MovementEvent } from "./movement-types";
import { siteBaseUrl } from "./site-url";

/**
 * Embeddable movement widget (iframe HTML). Latest movements with source
 * labels, a watch CTA, and the "Powered by" footer. Link-only by design —
 * an embed can never message anyone. In private test mode the CTA says so
 * plainly instead of pretending signups are open.
 */

if (typeof window !== "undefined") {
  throw new Error("embed-movement is server-side only");
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderMovementEmbed(opts: {
  heading: string;
  events: MovementEvent[];
  watchPath: string;
  emptyNote?: string;
}): string {
  const BASE = siteBaseUrl();
  const privateMode = launchFlags().privateTestMode;
  const ctaLabel = privateMode
    ? "Private pilot: see it on the site"
    : "Watch this issue";

  const items = opts.events
    .slice(0, 3)
    .map(
      (e) => `
  <a class="item" href="${esc(`${BASE}/receipts/${encodeURIComponent(e.id)}?ref=embed`)}" target="_top">
    <span class="type">${esc(movementTypeLabel(e.movementType))} · ${esc(e.occurredAt)}</span>
    <span class="ititle">${esc(e.title)}</span>
    <span class="src">Source: ${esc(e.sourceLabel)}</span>
  </a>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en"><head>
<title>${esc(opts.heading)}</title>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<style>
html,body{margin:0;padding:0;background:transparent}
.widget{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;border:1px solid #d9dde8;border-radius:10px;background:#fbfaf7;color:#07111f;overflow:hidden}
.head{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#07111f;color:#fff;padding:10px 14px}
.head .h{font-size:13px;font-weight:700}
.head .stamp{font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#7dd3c0}
.item{display:flex;flex-direction:column;gap:2px;padding:10px 14px;border-bottom:1px solid #eceef4;text-decoration:none;color:#07111f}
.item:hover{background:#f5fbf9}
.type{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#175c55}
.ititle{font-size:13px;font-weight:600;line-height:1.35}
.src{font-size:10px;color:#40516a}
.empty{padding:14px;font-size:12px;color:#27364f}
.foot{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;background:#fff}
.cta{font-size:11px;font-weight:700;color:#175c55;text-decoration:none}
.brand{font-size:10px;color:#8190a6;text-decoration:none}
</style></head>
<body>
<div class="widget">
  <div class="head"><span class="h">${esc(opts.heading)}</span><span class="stamp">Receipts inside</span></div>
  ${items || `<p class="empty">${esc(opts.emptyNote ?? "No indexed movement here yet. Quiet is the honest answer.")}</p>`}
  <div class="foot">
    <a class="cta" href="${esc(`${BASE}${opts.watchPath}?ref=embed`)}" target="_top">${esc(ctaLabel)}</a>
    <a class="brand" href="${esc(`${BASE}/?ref=embed`)}" target="_top">Powered by By The People</a>
  </div>
</div>
</body></html>`;
}
