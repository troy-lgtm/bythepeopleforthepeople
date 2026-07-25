import { expect, test } from "@playwright/test";
import { EVENT_DAY_KEY, getGrowthMetrics } from "@/lib/growth-metrics";
import { isEventName, normalizeRefTag } from "@/lib/ref-tags";
import { __resetMemoryStoreForTests, hashIncr } from "@/lib/store";

const NOW = new Date("2026-07-25T12:00:00.000Z");
const TODAY = "2026-07-25";
const YESTERDAY = "2026-07-24";

test.describe("ref tags", () => {
  test("known surfaces pass through, unknown collapse to other", () => {
    expect(normalizeRefTag("receipt")).toBe("receipt");
    expect(normalizeRefTag("DIGEST")).toBe("digest");
    expect(normalizeRefTag("  embed  ")).toBe("embed");
    expect(normalizeRefTag("evil-injection")).toBe("other");
    expect(normalizeRefTag("")).toBe("direct");
    expect(normalizeRefTag(null)).toBe("direct");
    expect(normalizeRefTag(undefined)).toBe("direct");
  });

  test("event names are a closed set", () => {
    expect(isEventName("visit")).toBe(true);
    expect(isEventName("subscribe")).toBe(true);
    expect(isEventName("confirm")).toBe(true);
    expect(isEventName("pageview")).toBe(false);
    expect(isEventName("arbitrary")).toBe(false);
  });
});

test.describe("growth metrics", () => {
  test.beforeEach(() => {
    __resetMemoryStoreForTests();
  });

  test("returns an honest empty shape with no data", async () => {
    const m = await getGrowthMetrics(7, NOW);
    expect(m.totals).toEqual({ visits: 0, subscribes: 0, confirms: 0 });
    expect(m.byRef).toEqual([]);
    expect(m.daily).toHaveLength(7);
    expect(m.to).toBe(TODAY);
  });

  test("aggregates visits, subscribes and confirms per surface", async () => {
    for (let i = 0; i < 10; i++) {
      await hashIncr(EVENT_DAY_KEY(TODAY), "visit:receipt");
    }
    await hashIncr(EVENT_DAY_KEY(TODAY), "subscribe:receipt");
    await hashIncr(EVENT_DAY_KEY(TODAY), "confirm:receipt");
    for (let i = 0; i < 4; i++) {
      await hashIncr(EVENT_DAY_KEY(YESTERDAY), "visit:digest");
    }

    const m = await getGrowthMetrics(7, NOW);
    expect(m.totals).toEqual({ visits: 14, subscribes: 1, confirms: 1 });

    const receipt = m.byRef.find((r) => r.ref === "receipt")!;
    expect(receipt.visits).toBe(10);
    expect(receipt.subscribes).toBe(1);
    expect(receipt.confirms).toBe(1);
    expect(receipt.conversionPct).toBe(10);

    const digest = m.byRef.find((r) => r.ref === "digest")!;
    expect(digest.visits).toBe(4);
    expect(digest.conversionPct).toBe(0);

    // Sorted by volume: receipt (10 visits) leads digest (4).
    expect(m.byRef[0].ref).toBe("receipt");
  });

  test("conversion is null, never 0%, when there is no denominator", async () => {
    // A subscribe with no recorded visit (e.g. direct navigation).
    await hashIncr(EVENT_DAY_KEY(TODAY), "subscribe:direct");
    const m = await getGrowthMetrics(7, NOW);
    const direct = m.byRef.find((r) => r.ref === "direct")!;
    expect(direct.visits).toBe(0);
    expect(direct.subscribes).toBe(1);
    expect(direct.conversionPct).toBeNull();
  });

  test("excludes days outside the window", async () => {
    await hashIncr(EVENT_DAY_KEY("2026-07-01"), "visit:receipt");
    const m = await getGrowthMetrics(7, NOW);
    expect(m.totals.visits).toBe(0);
  });

  test("unknown ref fields fold into other rather than inflating a surface", async () => {
    await hashIncr(EVENT_DAY_KEY(TODAY), "visit:whatever");
    const m = await getGrowthMetrics(7, NOW);
    expect(m.byRef.find((r) => r.ref === "other")?.visits).toBe(1);
  });
});
