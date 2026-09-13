/**
 * Reader for Vercel Web Analytics — the layer that counts real people.
 *
 * The @vercel/analytics script mounted in the root layout only produces data
 * once Web Analytics is switched ON for the project in the Vercel dashboard;
 * before that the script loads fine and every page view is dropped. This
 * module reads the collected numbers back through Vercel's public Web
 * Analytics API so the Launch Center and the weekly growth digest can show
 * page views, unique visitors, top pages, referrers and countries — all
 * bot-filtered by Vercel, all aggregate, nothing per person.
 *
 * Every failure mode is a status, never a throw: not configured (no token),
 * not enabled (Vercel is discarding page views), or an API error. Callers
 * render the message; they never have to guess why a number is missing.
 *
 * Server-side module (also imported by npx-tsx scripts, so no "server-only";
 * the window check enforces the same boundary).
 */

if (typeof window !== "undefined") {
  throw new Error("vercel-analytics is server-side only");
}

const API = "https://api.vercel.com/v1/query/web-analytics";
const TIMEOUT_MS = 8_000;
// One Launch Center render asks for the same window from several places
// (panel, checklist, digest headline). Memoize briefly per process so that
// costs one round of API calls, not three.
const MEMO_MS = 60_000;
const memo = new Map<string, { at: number; report: VisitorReport }>();

export type VisitorReportStatus = "ok" | "not_configured" | "not_enabled" | "error";

export type CountRow = { pageviews: number; visitors: number };

export type VisitorReport = {
  status: VisitorReportStatus;
  /** Plain-language explanation of the status, always set. */
  message: string;
  days: number;
  from: string;
  to: string;
  /** Page views and unique visitors in the window. Null unless status is ok. */
  totals: CountRow | null;
  /** Same metrics for the window immediately before, for the trend. */
  previous: CountRow | null;
  daily: Array<{ date: string } & CountRow>;
  topPages: Array<{ path: string } & CountRow>;
  topReferrers: Array<{ host: string } & CountRow>;
  topCountries: Array<{ country: string } & CountRow>;
  /** Custom events sent with track() — share, subscribe, cause_created. */
  events: Array<{ name: string; count: number; visitors: number }>;
};

export type VercelAnalyticsConfig = {
  token: string;
  projectId: string;
  teamId?: string;
};

/**
 * VERCEL_ANALYTICS_TOKEN is a Vercel access token scoped to the team.
 * VERCEL_PROJECT_ID falls back to the value Vercel injects at build time.
 * VERCEL_TEAM_ID is required for team-owned projects.
 */
export function vercelAnalyticsConfig(
  env: Record<string, string | undefined> = process.env,
): VercelAnalyticsConfig | null {
  const token = env.VERCEL_ANALYTICS_TOKEN?.trim();
  const projectId = env.VERCEL_PROJECT_ID?.trim();
  if (!token || !projectId) return null;
  const teamId = env.VERCEL_TEAM_ID?.trim();
  return { token, projectId, teamId: teamId || undefined };
}

export function vercelAnalyticsConfigured(): boolean {
  return vercelAnalyticsConfig() !== null;
}

type Fetcher = typeof fetch;

type QueryResult =
  | { ok: true; rows: Array<Record<string, unknown>> }
  | { ok: false; code: string; message: string };

async function query(
  cfg: VercelAnalyticsConfig,
  dataset: "visits" | "events",
  params: Record<string, string>,
  fetcher: Fetcher,
): Promise<QueryResult> {
  const url = new URL(`${API}/${dataset}/aggregate`);
  url.searchParams.set("projectId", cfg.projectId);
  if (cfg.teamId) url.searchParams.set("teamId", cfg.teamId);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetcher(url, {
      headers: { Authorization: `Bearer ${cfg.token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const json = (await res.json().catch(() => ({}))) as {
      data?: unknown;
      error?: { code?: string; message?: string };
    };
    if (!res.ok) {
      return {
        ok: false,
        code: json.error?.code ?? `http_${res.status}`,
        message: json.error?.message ?? `Vercel responded ${res.status}.`,
      };
    }
    const rows = Array.isArray(json.data)
      ? (json.data as Array<Record<string, unknown>>)
      : json.data && typeof json.data === "object"
        ? [json.data as Record<string, unknown>]
        : [];
    return { ok: true, rows };
  } catch (err) {
    return {
      ok: false,
      code: "network_error",
      message: err instanceof Error ? err.message : "request failed",
    };
  }
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0;
}

function counts(row: Record<string, unknown>): CountRow {
  return { pageviews: num(row.pageviews), visitors: num(row.visitors) };
}

/** The grouped dimension's value: the first string field that is not a metric. */
function dimension(row: Record<string, unknown>, preferred: string): string {
  const direct = row[preferred];
  if (typeof direct === "string") return direct;
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "string" && !["timestamp"].includes(k)) return v;
  }
  return "(unknown)";
}

function sumRows(rows: Array<Record<string, unknown>>): CountRow {
  const acc: CountRow = { pageviews: 0, visitors: 0 };
  for (const r of rows) {
    acc.pageviews += num(r.pageviews);
    acc.visitors += num(r.visitors);
  }
  return acc;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function empty(
  status: VisitorReportStatus,
  message: string,
  days: number,
  from: string,
  to: string,
): VisitorReport {
  return {
    status,
    message,
    days,
    from,
    to,
    totals: null,
    previous: null,
    daily: [],
    topPages: [],
    topReferrers: [],
    topCountries: [],
    events: [],
  };
}

export const NOT_CONFIGURED_MESSAGE =
  "Not connected. Add VERCEL_ANALYTICS_TOKEN (a Vercel access token), VERCEL_TEAM_ID and VERCEL_PROJECT_ID to the deployment environment, then redeploy.";

export const NOT_ENABLED_MESSAGE =
  "Web Analytics is switched OFF for this project in Vercel, so page views are being discarded, not counted. Turn it on: Vercel dashboard, this project, Analytics tab, Enable. Counting starts the day it is switched on; there is no history before that.";

/**
 * Page views and visitors for the last `days` days (ending today, UTC),
 * plus the window before it. `fetcher` is injectable for tests.
 */
export async function getVisitorReport(
  days = 7,
  opts: {
    now?: Date;
    env?: Record<string, string | undefined>;
    fetcher?: Fetcher;
  } = {},
): Promise<VisitorReport> {
  const window = Math.min(Math.max(Math.floor(days), 1), 90);
  const now = opts.now ?? new Date();
  const to = isoDay(now);
  const from = isoDay(new Date(now.getTime() - (window - 1) * 86_400_000));
  const prevTo = isoDay(new Date(now.getTime() - window * 86_400_000));
  const prevFrom = isoDay(
    new Date(now.getTime() - (2 * window - 1) * 86_400_000),
  );

  const cfg = vercelAnalyticsConfig(opts.env);
  if (!cfg) {
    return empty("not_configured", NOT_CONFIGURED_MESSAGE, window, from, to);
  }
  const memoKey = opts.fetcher ? null : `${cfg.projectId}:${window}:${from}:${to}`;
  if (memoKey) {
    const hit = memo.get(memoKey);
    if (hit && Date.now() - hit.at < MEMO_MS) return hit.report;
  }
  const report = await fetchVisitorReport(cfg, window, from, to, prevFrom, prevTo, opts.fetcher ?? fetch);
  if (memoKey && report.status === "ok") {
    memo.set(memoKey, { at: Date.now(), report });
  }
  return report;
}

async function fetchVisitorReport(
  cfg: VercelAnalyticsConfig,
  window: number,
  from: string,
  to: string,
  prevFrom: string,
  prevTo: string,
  fetcher: Fetcher,
): Promise<VisitorReport> {

  // Daily rows first (the aggregate endpoint always needs a `by`): they
  // give the totals, and their error code tells us whether anything else
  // is worth asking.
  const daily = await query(
    cfg,
    "visits",
    { since: from, until: to, by: "day" },
    fetcher,
  );
  if (!daily.ok) {
    if (daily.code === "web_analytics_not_enabled") {
      return empty("not_enabled", NOT_ENABLED_MESSAGE, window, from, to);
    }
    return empty(
      "error",
      `Vercel Web Analytics could not be read (${daily.code}: ${daily.message}).`,
      window,
      from,
      to,
    );
  }

  const [previous, pages, referrers, countries, events] =
    await Promise.all([
      query(
        cfg,
        "visits",
        { since: prevFrom, until: prevTo, by: "day" },
        fetcher,
      ),
      query(
        cfg,
        "visits",
        { since: from, until: to, by: "requestPath", limit: "8" },
        fetcher,
      ),
      query(
        cfg,
        "visits",
        { since: from, until: to, by: "referrerHostname", limit: "8" },
        fetcher,
      ),
      query(
        cfg,
        "visits",
        { since: from, until: to, by: "country", limit: "5" },
        fetcher,
      ),
      query(
        cfg,
        "events",
        { since: from, until: to, by: "eventName", limit: "10" },
        fetcher,
      ),
    ]);

  // Unique visitors do not sum across days (one person, several days), so
  // the window total for visitors is the best-effort daily sum: an upper
  // bound, labeled as such by the callers.
  return {
    status: "ok",
    message: `Vercel Web Analytics, bot-filtered, ${from} to ${to}.`,
    days: window,
    from,
    to,
    totals: sumRows(daily.rows),
    previous: previous.ok ? sumRows(previous.rows) : null,
    daily: daily.rows.map((r) => ({
      date:
        typeof r.timestamp === "string"
          ? r.timestamp.slice(0, 10)
          : dimension(r, "day"),
      ...counts(r),
    })),
    topPages: pages.ok
      ? pages.rows.map((r) => ({ path: dimension(r, "requestPath"), ...counts(r) }))
      : [],
    topReferrers: referrers.ok
      ? referrers.rows.map((r) => ({
          host: dimension(r, "referrerHostname") || "(direct)",
          ...counts(r),
        }))
      : [],
    topCountries: countries.ok
      ? countries.rows.map((r) => ({ country: dimension(r, "country"), ...counts(r) }))
      : [],
    // Custom events need the Pro plan; an error here just means none.
    events: events.ok
      ? events.rows.map((r) => ({
          name: dimension(r, "eventName"),
          count: num(r.count),
          visitors: num(r.visitors),
        }))
      : [],
  };
}

/** Percent change between windows; null when there is no baseline. */
export function trendPct(current: number, previous: number | null | undefined): number | null {
  if (previous === null || previous === undefined || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
