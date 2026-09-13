import { expect, test } from "@playwright/test";
import { isLikelyBot } from "@/lib/bot-filter";
import {
  buildGrowthDigest,
  renderGrowthDigestHtml,
  renderGrowthDigestSlack,
  renderGrowthDigestText,
} from "@/lib/growth-digest";
import { EVENT_DAY_KEY, getGrowthMetrics } from "@/lib/growth-metrics";
import { parseLaunchFlags } from "@/lib/launch-mode";
import { evaluateRecipient } from "@/lib/notification-guard";
import { refKind } from "@/lib/ref-tags";
import { __resetMemoryStoreForTests, hashIncr } from "@/lib/store";
import {
  type VisitorReport,
  getVisitorReport,
  trendPct,
} from "@/lib/vercel-analytics";

const NOW = new Date("2026-09-13T12:00:00.000Z");
const TODAY = "2026-09-13";

const ENV = {
  VERCEL_ANALYTICS_TOKEN: "tok",
  VERCEL_TEAM_ID: "team_x",
  VERCEL_PROJECT_ID: "prj_x",
};

/** Fake Vercel API keyed on the `by` dimension of each request. */
function fakeVercel(
  handler: (url: URL) => { status: number; body: unknown },
): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const { status, body } = handler(url);
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

const OK_API = fakeVercel((url) => {
  const by = url.searchParams.get("by");
  const since = url.searchParams.get("since");
  if (url.pathname.endsWith("/events/aggregate")) {
    return {
      status: 200,
      body: { data: [{ eventName: "share", count: 3, visitors: 2 }] },
    };
  }
  if (by === "day") {
    // Current window has traffic; the previous window has less.
    const rows =
      since === "2026-09-07"
        ? [
            { timestamp: "2026-09-12T00:00:00.000Z", pageviews: 30, visitors: 10 },
            { timestamp: "2026-09-13T00:00:00.000Z", pageviews: 20, visitors: 8 },
          ]
        : [{ timestamp: "2026-09-01T00:00:00.000Z", pageviews: 25, visitors: 9 }];
    return { status: 200, body: { data: rows } };
  }
  if (by === "requestPath") {
    return {
      status: 200,
      body: {
        data: [
          { requestPath: "/receipts/mv-1", pageviews: 12, visitors: 7 },
          { requestPath: "/", pageviews: 9, visitors: 6 },
        ],
      },
    };
  }
  if (by === "referrerHostname") {
    return {
      status: 200,
      body: { data: [{ referrerHostname: "www.google.com", pageviews: 5, visitors: 4 }] },
    };
  }
  if (by === "country") {
    return { status: 200, body: { data: [{ country: "US", pageviews: 50, visitors: 18 }] } };
  }
  return { status: 400, body: { error: { code: "bad_request", message: "unexpected" } } };
});

test.describe("bot filter", () => {
  test("skips known crawlers and automation, keeps browsers and unknowns", () => {
    expect(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(isLikelyBot("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2)")).toBe(true);
    expect(isLikelyBot("Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0")).toBe(true);
    expect(isLikelyBot("curl/8.4.0")).toBe(true);
    expect(isLikelyBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")).toBe(false);
    expect(isLikelyBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36")).toBe(false);
    expect(isLikelyBot("")).toBe(false);
    expect(isLikelyBot(null)).toBe(false);
  });
});

test.describe("ref kinds", () => {
  test("outside surfaces are inbound, our own pages are internal", () => {
    for (const t of ["digest", "embed", "og", "llm", "share"]) {
      expect(refKind(t)).toBe("inbound");
    }
    for (const t of ["receipt", "feed", "cause"]) {
      expect(refKind(t)).toBe("internal");
    }
    expect(refKind("")).toBe("direct");
    expect(refKind("garbage")).toBe("direct");
  });

  test("growth metrics split totals by kind", async () => {
    __resetMemoryStoreForTests();
    await hashIncr(EVENT_DAY_KEY(TODAY), "visit:digest");
    await hashIncr(EVENT_DAY_KEY(TODAY), "visit:digest");
    await hashIncr(EVENT_DAY_KEY(TODAY), "visit:feed");
    await hashIncr(EVENT_DAY_KEY(TODAY), "subscribe:digest");
    const m = await getGrowthMetrics(7, NOW);
    expect(m.inbound).toEqual({ visits: 2, subscribes: 1 });
    expect(m.internal).toEqual({ visits: 1, subscribes: 0 });
    expect(m.byRef.find((r) => r.ref === "feed")?.kind).toBe("internal");
  });
});

test.describe("vercel analytics reader", () => {
  test("reports not_configured with no token and asks nothing", async () => {
    let calls = 0;
    const r = await getVisitorReport(7, {
      now: NOW,
      env: {},
      fetcher: fakeVercel(() => {
        calls++;
        return { status: 200, body: { data: [] } };
      }),
    });
    expect(r.status).toBe("not_configured");
    expect(r.totals).toBeNull();
    expect(calls).toBe(0);
  });

  test("maps Vercel's not-enabled error to a plain-language status", async () => {
    const r = await getVisitorReport(7, {
      now: NOW,
      env: ENV,
      fetcher: fakeVercel(() => ({
        status: 400,
        body: {
          error: {
            code: "web_analytics_not_enabled",
            message: "Web Analytics is not enabled for this project",
          },
        },
      })),
    });
    expect(r.status).toBe("not_enabled");
    expect(r.message).toMatch(/switched OFF/);
    expect(r.message).toMatch(/Enable/);
  });

  test("aggregates a healthy window with trend, pages, referrers, events", async () => {
    const r = await getVisitorReport(7, { now: NOW, env: ENV, fetcher: OK_API });
    expect(r.status).toBe("ok");
    expect(r.from).toBe("2026-09-07");
    expect(r.to).toBe(TODAY);
    expect(r.totals).toEqual({ pageviews: 50, visitors: 18 });
    expect(r.previous).toEqual({ pageviews: 25, visitors: 9 });
    expect(r.daily.map((d) => d.date)).toEqual(["2026-09-12", "2026-09-13"]);
    expect(r.topPages[0]).toEqual({ path: "/receipts/mv-1", pageviews: 12, visitors: 7 });
    expect(r.topReferrers[0].host).toBe("www.google.com");
    expect(r.topCountries[0].country).toBe("US");
    expect(r.events).toEqual([{ name: "share", count: 3, visitors: 2 }]);
    expect(trendPct(50, 25)).toBe(100);
    expect(trendPct(10, 0)).toBeNull();
  });

  test("an unknown API error is a status, never a throw", async () => {
    const r = await getVisitorReport(7, {
      now: NOW,
      env: ENV,
      fetcher: fakeVercel(() => ({ status: 500, body: {} })),
    });
    expect(r.status).toBe("error");
    expect(r.message).toMatch(/http_500/);
  });
});

test.describe("operator webhook channel", () => {
  const WITH = parseLaunchFlags({ GROWTH_DIGEST_WEBHOOK_URL: "https://hooks.slack.com/services/T/B/x" });
  const WITHOUT = parseLaunchFlags({});

  test("allows exactly the configured URL, even in private mode", () => {
    const d = evaluateRecipient("https://hooks.slack.com/services/T/B/x", "operator_webhook", WITH);
    expect(d).toEqual({ allowed: true, reason: "operator_webhook" });
  });

  test("blocks any other URL and blocks when unconfigured", () => {
    expect(
      evaluateRecipient("https://evil.example/hook", "operator_webhook", WITH).reason,
    ).toBe("operator_webhook_mismatch");
    expect(
      evaluateRecipient("https://hooks.slack.com/services/T/B/x", "operator_webhook", WITHOUT)
        .reason,
    ).toBe("operator_webhook_unconfigured");
  });

  test("refuses a non-https operator webhook", () => {
    const flags = parseLaunchFlags({ GROWTH_DIGEST_WEBHOOK_URL: "http://plain.example/hook" });
    expect(
      evaluateRecipient("http://plain.example/hook", "operator_webhook", flags).allowed,
    ).toBe(false);
  });

  test("the public webhook channel stays blocked in private mode", () => {
    expect(evaluateRecipient("https://hooks.slack.com/services/T/B/x", "webhook", WITH).allowed).toBe(
      false,
    );
  });
});

test.describe("growth digest", () => {
  test.beforeEach(() => {
    __resetMemoryStoreForTests();
  });

  test("says plainly when visitor counting is off, and what our counters saw", async () => {
    await hashIncr(EVENT_DAY_KEY(TODAY), "visit:share");
    await hashIncr(EVENT_DAY_KEY(TODAY), "visit:receipt");
    const off: VisitorReport = {
      status: "not_enabled",
      message: "Web Analytics is switched OFF for this project in Vercel.",
      days: 7,
      from: "2026-09-07",
      to: TODAY,
      totals: null,
      previous: null,
      daily: [],
      topPages: [],
      topReferrers: [],
      topCountries: [],
      events: [],
    };
    const d = await buildGrowthDigest({
      periodDays: 7,
      now: NOW,
      flags: parseLaunchFlags({}),
      visitors: off,
    });
    expect(d.headline).toMatch(/NOT being counted/);
    expect(d.headline).toMatch(/1 click from outside links/);
    expect(d.subject).toMatch(/visitor counting is off/);
    expect(d.mode).toBe("private-test");
    const text = renderGrowthDigestText(d);
    expect(text).toContain("1 click moved between our own pages");
    expect(text).toContain("No stranger tried to subscribe");
    expect(text).toContain("https://bythepeopleforthepeople.com/admin/launch");
  });

  test("renders a healthy week with full URLs and no emoji anywhere", async () => {
    const ok: VisitorReport = {
      status: "ok",
      message: "ok",
      days: 7,
      from: "2026-09-07",
      to: TODAY,
      totals: { pageviews: 50, visitors: 18 },
      previous: { pageviews: 25, visitors: 9 },
      daily: [],
      topPages: [{ path: "/receipts/mv-1", pageviews: 12, visitors: 7 }],
      topReferrers: [{ host: "www.google.com", pageviews: 5, visitors: 4 }],
      topCountries: [{ country: "US", pageviews: 50, visitors: 18 }],
      events: [{ name: "share", count: 3, visitors: 2 }],
    };
    const d = await buildGrowthDigest({ periodDays: 7, now: NOW, visitors: ok });
    expect(d.headline).toBe(
      "About 18 people visited: 50 page views in the last 7 days (up 100% on the 7 days before).",
    );
    expect(d.subject).toBe("Growth: 18 visitors, 0 new watchers (2026-09-07 to 2026-09-13)");

    const text = renderGrowthDigestText(d);
    expect(text).toContain("https://bythepeopleforthepeople.com/receipts/mv-1");
    expect(text).toContain("www.google.com");
    expect(text).toContain("Actions taken: share 3");

    const slack = renderGrowthDigestSlack(d);
    expect(slack.text).toContain("*Growth digest, 2026-09-07 to 2026-09-13*");
    expect(slack.text).toContain("Launch Center: https://bythepeopleforthepeople.com/admin/launch");

    const html = renderGrowthDigestHtml(d);
    expect(html).toContain('<a href="https://bythepeopleforthepeople.com/receipts/mv-1"');

    // No emoji or pictographs in any rendering.
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    expect(emoji.test(text)).toBe(false);
    expect(emoji.test(slack.text)).toBe(false);
    expect(emoji.test(html)).toBe(false);
  });

  test("zero traffic is stated as zero, not hidden", async () => {
    const quiet: VisitorReport = {
      status: "ok",
      message: "ok",
      days: 7,
      from: "2026-09-07",
      to: TODAY,
      totals: { pageviews: 0, visitors: 0 },
      previous: { pageviews: 0, visitors: 0 },
      daily: [],
      topPages: [],
      topReferrers: [],
      topCountries: [],
      events: [],
    };
    const d = await buildGrowthDigest({ periodDays: 7, now: NOW, visitors: quiet });
    expect(d.headline).toBe("Nobody visited in the last 7 days. Zero page views from real people.");
  });
});
