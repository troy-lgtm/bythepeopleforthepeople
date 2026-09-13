import { listDigestLog } from "./digest-log";
import { type GrowthMetrics, getGrowthMetrics } from "./growth-metrics";
import { type LaunchFlags, launchFlags, modeLabel } from "./launch-mode";
import { lastDetectionRun, listMovementEvents } from "./movement-store";
import type { DetectionRun } from "./movement-store";
import { listBlockedNotifications } from "./notification-guard";
import { siteBaseUrl } from "./site-url";
import { listAll } from "./subscribers";
import {
  type VisitorReport,
  getVisitorReport,
  trendPct,
} from "./vercel-analytics";

/**
 * The weekly growth digest: one message that answers "did anyone come, and
 * did anyone stay?" without the operator opening a dashboard.
 *
 * Four honest sections, each from the source that actually knows:
 * - People: Vercel Web Analytics (bot-filtered page views, visitors, top
 *   pages, referrers). Says plainly when the layer is off.
 * - Arrivals: our own referral counters, split into clicks from outside the
 *   site versus clicks between our own pages.
 * - Demand: new watchers, and strangers turned away by private mode (each
 *   one is a person who wanted in).
 * - The loop: whether detection ran, how much government moved, whether the
 *   digests went out.
 *
 * Aggregate numbers only. No subscriber addresses, no per-visitor rows.
 *
 * Server-side module (also imported by npx-tsx scripts, so no "server-only";
 * the window check enforces the same boundary).
 */

if (typeof window !== "undefined") {
  throw new Error("growth-digest is server-side only");
}

export type GrowthDigest = {
  periodDays: number;
  from: string;
  to: string;
  generatedAt: string;
  mode: "private-test" | "launch-unlocked" | "partial";
  subject: string;
  /** The one-line answer. */
  headline: string;
  visitors: VisitorReport;
  arrivals: GrowthMetrics;
  demand: {
    watchersTotal: number;
    watchersConfirmed: number;
    /** Rows that are not the test user — the public, once launch opens. */
    watchersPublic: number;
    newSubscribes: number;
    newConfirms: number;
    /** Strangers who tried to subscribe in the window and were turned away. */
    strangersTurnedAway: number;
  };
  loop: {
    lastDetection: DetectionRun | null;
    movementsInWindow: number;
    digestsSent: number;
    digestsFailed: number;
    digestsBlocked: number;
  };
  launchCenterUrl: string;
  siteUrl: string;
};

function withinWindow(iso: string | undefined, from: string, to: string): boolean {
  if (!iso) return false;
  const day = iso.slice(0, 10);
  return day >= from && day <= to;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

function headlineFor(d: Omit<GrowthDigest, "headline" | "subject">): string {
  const v = d.visitors;
  if (v.status === "ok" && v.totals) {
    if (v.totals.pageviews === 0) {
      return `Nobody visited in the last ${d.periodDays} days. Zero page views from real people.`;
    }
    const t = trendPct(v.totals.pageviews, v.previous?.pageviews);
    const trend =
      t === null
        ? ""
        : t >= 0
          ? ` (up ${t}% on the ${d.periodDays} days before)`
          : ` (down ${Math.abs(t)}% on the ${d.periodDays} days before)`;
    return `About ${plural(v.totals.visitors, "person", "people")} visited: ${plural(v.totals.pageviews, "page view")} in the last ${d.periodDays} days${trend}.`;
  }
  const inbound = d.arrivals.inbound.visits;
  const evidence =
    inbound > 0
      ? ` Our own counters saw ${plural(inbound, "click")} from outside links, so someone found the site.`
      : " Our own counters saw no clicks from outside links either.";
  if (v.status === "not_enabled") {
    return `Real visitors are NOT being counted: Web Analytics is switched off in Vercel.${evidence}`;
  }
  if (v.status === "not_configured") {
    return `Real visitors are not being read yet (the Vercel connection is not set up).${evidence}`;
  }
  return `Real visitor numbers could not be read this week.${evidence}`;
}

export async function buildGrowthDigest(opts: {
  periodDays?: number;
  now?: Date;
  flags?: LaunchFlags;
  /** Injectable for tests; defaults to the live Vercel reader. */
  visitors?: VisitorReport;
} = {}): Promise<GrowthDigest> {
  const periodDays = Math.min(Math.max(opts.periodDays ?? 7, 1), 90);
  const now = opts.now ?? new Date();
  const flags = opts.flags ?? launchFlags();
  const base = siteBaseUrl();

  const [visitors, arrivals, subs, blocked, digestLog, run, movements] =
    await Promise.all([
      opts.visitors ?? getVisitorReport(periodDays, { now }),
      getGrowthMetrics(periodDays, now),
      listAll(),
      listBlockedNotifications(500),
      listDigestLog(500),
      lastDetectionRun(),
      listMovementEvents({ sinceDays: periodDays, digestWorthyOnly: true }),
    ]);

  const from = arrivals.from;
  const to = arrivals.to;

  const strangersTurnedAway = blocked.filter(
    (b) =>
      b.channel === "email" &&
      b.reason === "private_test_mode" &&
      withinWindow(b.createdAt, from, to),
  ).length;

  const inWindowLog = digestLog.filter((e) => withinWindow(e.at, from, to));

  const digest: Omit<GrowthDigest, "headline" | "subject"> = {
    periodDays,
    from,
    to,
    generatedAt: now.toISOString(),
    mode: modeLabel(flags),
    visitors,
    arrivals,
    demand: {
      watchersTotal: subs.length,
      watchersConfirmed: subs.filter((s) => s.confirmed).length,
      watchersPublic: subs.filter(
        (s) => s.email.toLowerCase() !== flags.testUserEmail,
      ).length,
      newSubscribes: arrivals.totals.subscribes,
      newConfirms: arrivals.totals.confirms,
      strangersTurnedAway,
    },
    loop: {
      lastDetection: run,
      movementsInWindow: movements.length,
      digestsSent: inWindowLog.filter((e) => e.status === "sent").length,
      digestsFailed: inWindowLog.filter((e) => e.status === "failed").length,
      digestsBlocked: inWindowLog.filter((e) => e.status === "blocked").length,
    },
    launchCenterUrl: `${base}/admin/launch`,
    siteUrl: base,
  };

  const headline = headlineFor(digest);
  const subject =
    visitors.status === "ok" && visitors.totals
      ? `Growth: ${plural(visitors.totals.visitors, "visitor")}, ${plural(digest.demand.newSubscribes, "new watcher")} (${from} to ${to})`
      : `Growth: visitor counting is ${visitors.status === "not_enabled" ? "off" : "not connected"} (${from} to ${to})`;

  return { ...digest, headline, subject };
}

// ── Renderers ───────────────────────────────────────────────────────────────

function pathUrl(base: string, path: string): string {
  if (path === "Others" || path === "(unknown)") return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function peopleLines(d: GrowthDigest): string[] {
  const v = d.visitors;
  const lines: string[] = [];
  if (v.status !== "ok" || !v.totals) {
    lines.push(v.message);
    return lines;
  }
  const t = trendPct(v.totals.pageviews, v.previous?.pageviews);
  lines.push(
    `${plural(v.totals.pageviews, "page view")}, about ${plural(v.totals.visitors, "unique visitor")} (daily uniques added up, so a ceiling).` +
      (v.previous
        ? ` Previous ${d.periodDays} days: ${v.previous.pageviews} page views` +
          (t === null ? "." : ` (${t >= 0 ? "+" : ""}${t}%).`)
        : ""),
  );
  if (v.topPages.length) {
    lines.push("Most read:");
    for (const p of v.topPages.slice(0, 5)) {
      lines.push(`  ${p.pageviews} - ${pathUrl(d.siteUrl, p.path)}`);
    }
  }
  if (v.topReferrers.length) {
    lines.push("Came from:");
    for (const r of v.topReferrers.slice(0, 5)) {
      lines.push(`  ${r.pageviews} - ${r.host || "(typed the address or no referrer)"}`);
    }
  }
  if (v.topCountries.length) {
    lines.push(
      `Countries: ${v.topCountries
        .slice(0, 5)
        .map((c) => `${c.country} ${c.pageviews}`)
        .join(", ")}`,
    );
  }
  if (v.events.length) {
    lines.push(
      `Actions taken: ${v.events
        .map((e) => `${e.name} ${e.count}`)
        .join(", ")}`,
    );
  }
  return lines;
}

function arrivalLines(d: GrowthDigest): string[] {
  const a = d.arrivals;
  const lines: string[] = [];
  lines.push(
    `${plural(a.inbound.visits, "click")} arrived from outside links (digest emails, embeds, social cards, AI answers, copied share links).`,
  );
  lines.push(
    `${plural(a.internal.visits, "click")} moved between our own pages (receipt to receipt, feed to receipt).`,
  );
  const inbound = a.byRef.filter((r) => r.kind === "inbound" && r.visits > 0);
  if (inbound.length) {
    lines.push(
      `Outside links by surface: ${inbound
        .map((r) => `${r.ref} ${r.visits}`)
        .join(", ")}.`,
    );
  }
  if (!a.durable) {
    lines.push("Counters are in the in-memory store, so they reset on deploy.");
  }
  return lines;
}

function demandLines(d: GrowthDigest): string[] {
  const m = d.demand;
  const lines: string[] = [];
  lines.push(
    `${plural(m.newSubscribes, "new watcher")} signed up, ${m.newConfirms} confirmed. Total watchers: ${m.watchersTotal} (${m.watchersConfirmed} confirmed, ${m.watchersPublic} public).`,
  );
  if (d.mode === "private-test") {
    lines.push(
      m.strangersTurnedAway > 0
        ? `${plural(m.strangersTurnedAway, "stranger")} tried to subscribe and ${m.strangersTurnedAway === 1 ? "was" : "were"} turned away by private test mode. Each one is a person who wanted in.`
        : "No stranger tried to subscribe (private test mode would have turned them away and logged it).",
    );
  }
  return lines;
}

function loopLines(d: GrowthDigest): string[] {
  const l = d.loop;
  const lines: string[] = [];
  lines.push(
    l.lastDetection
      ? `Detection last ran ${l.lastDetection.ranAt.slice(0, 16).replace("T", " ")} UTC: ${l.lastDetection.recordsChecked} records checked, ${l.lastDetection.newEvents} new events.` +
          (l.lastDetection.liveErrors?.length
            ? ` ${plural(l.lastDetection.liveErrors.length, "live-ingest error")}.`
            : "")
      : "Detection has never run.",
  );
  lines.push(
    `Government moved ${plural(l.movementsInWindow, "time")} on tracked records this period.`,
  );
  lines.push(
    `Digests: ${l.digestsSent} sent, ${l.digestsFailed} failed, ${l.digestsBlocked} blocked by the guard.`,
  );
  return lines;
}

/** Plain text: the email text part and the Slack message body. */
export function renderGrowthDigestText(d: GrowthDigest): string {
  const out: string[] = [];
  out.push(`GROWTH DIGEST, ${d.from} to ${d.to}`);
  out.push(d.headline);
  out.push("");
  out.push("PEOPLE (Vercel Web Analytics, bot-filtered)");
  out.push(...peopleLines(d));
  out.push("");
  out.push("ARRIVALS (our referral counters)");
  out.push(...arrivalLines(d));
  out.push("");
  out.push("DEMAND");
  out.push(...demandLines(d));
  out.push("");
  out.push("THE LOOP");
  out.push(...loopLines(d));
  out.push("");
  out.push(
    `Mode: ${d.mode === "private-test" ? "PRIVATE TEST MODE (only the test user can be emailed)" : d.mode}.`,
  );
  out.push(`Launch Center: ${d.launchCenterUrl}`);
  return out.join("\n");
}

/** Slack incoming-webhook payload: one message, mrkdwn, full URLs, no icons. */
export function renderGrowthDigestSlack(d: GrowthDigest): { text: string } {
  const section = (title: string, lines: string[]) =>
    [`*${title}*`, ...lines].join("\n");
  const text = [
    `*Growth digest, ${d.from} to ${d.to}*`,
    d.headline,
    "",
    section("People (Vercel Web Analytics, bot-filtered)", peopleLines(d)),
    "",
    section("Arrivals (our referral counters)", arrivalLines(d)),
    "",
    section("Demand", demandLines(d)),
    "",
    section("The loop", loopLines(d)),
    "",
    `Launch Center: ${d.launchCenterUrl}`,
  ].join("\n");
  return { text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linkify(line: string): string {
  return escapeHtml(line).replace(
    /(https?:\/\/[^\s<]+)/g,
    (m) => `<a href="${m}" style="color:#175c55;">${m}</a>`,
  );
}

export function renderGrowthDigestHtml(d: GrowthDigest): string {
  const block = (title: string, lines: string[]) => `
    <h2 style="margin:22px 0 6px 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#40516a;">${escapeHtml(title)}</h2>
    ${lines
      .map(
        (l) =>
          `<p style="margin:0 0 6px 0;font-size:14px;line-height:1.6;color:#27364f;${l.startsWith("  ") ? "padding-left:16px;" : ""}">${linkify(l.trim())}</p>`,
      )
      .join("")}`;
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e3e7ee;border-radius:8px;padding:28px;">
    <p style="margin:0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#40516a;">Growth digest, ${escapeHtml(d.from)} to ${escapeHtml(d.to)}</p>
    <h1 style="margin:8px 0 0 0;font-size:20px;line-height:1.35;color:#07111f;">${escapeHtml(d.headline)}</h1>
    ${block("People (Vercel Web Analytics, bot-filtered)", peopleLines(d))}
    ${block("Arrivals (our referral counters)", arrivalLines(d))}
    ${block("Demand", demandLines(d))}
    ${block("The loop", loopLines(d))}
    <p style="margin:24px 0 0 0;font-size:12px;line-height:1.6;color:#8190a6;">
      Mode: ${escapeHtml(d.mode === "private-test" ? "private test mode (only the test user can be emailed)" : d.mode)}.
      <a href="${escapeHtml(d.launchCenterUrl)}" style="color:#8190a6;text-decoration:underline;">Launch Center</a>
    </p>
  </div>
</body></html>`;
}
