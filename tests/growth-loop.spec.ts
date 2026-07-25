import { expect, test } from "@playwright/test";

const ADMIN_SECRET = process.env.ADMIN_LAUNCH_SECRET ?? "test-admin-secret";
const RECEIPT_ID = "mv-bill-ca-sb-79-sb79-t5";

test.describe("Private growth loop", () => {
  test("subscribe blocks a non-test email with the calm pilot message", async ({
    request,
  }) => {
    const res = await request.post("/api/subscribe", {
      data: {
        email: "stranger@example.com",
        cadence: "weekly",
        consent: true,
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.status).toBe("private_pilot");
    expect(json.data.message).toContain("Private test mode");
  });

  test("subscribe accepts the test user", async ({ request }) => {
    const res = await request.post("/api/subscribe", {
      data: {
        email: "troy@wearewarp.com",
        cadence: "weekly",
        consent: true,
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    // pending (new) or updated (already confirmed in this server's store)
    expect(["pending", "updated"]).toContain(json.data.status);
  });

  test("what-moved feed renders movement cards", async ({ page }) => {
    await page.goto("/what-moved");
    await expect(
      page.getByRole("heading", { name: /what moved in government/i, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /see the receipt/i }).first(),
    ).toBeVisible();
  });

  test("receipt page shows the full source trail", async ({ page }) => {
    await page.goto(`/receipts/${RECEIPT_ID}`);
    await expect(page.getByText(/government moved/i).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /signed into law/i, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/why it matters/i).first()).toBeVisible();
    await expect(page.getByText(/evidence/i).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /official source|sb 79/i }).first(),
    ).toBeVisible();
    await expect(page.getByText(/what you can do/i)).toBeVisible();
  });

  test("zip what-moved page renders for 90046", async ({ page }) => {
    await page.goto("/gov/90046/what-moved");
    await expect(
      page.getByRole("heading", { name: /what moved near los angeles/i }),
    ).toBeVisible();
  });

  test("catalog cause page renders with movement", async ({ page }) => {
    await page.goto("/causes/housing");
    await expect(
      page.getByRole("heading", { name: /^housing$/i, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /see the receipt/i }).first(),
    ).toBeVisible();
  });

  test("cause place this-week page renders honestly", async ({ page }) => {
    await page.goto("/causes/homelessness/la/this-week");
    await expect(
      page.getByRole("heading", { name: /homelessness in los angeles this week/i }),
    ).toBeVisible();
    // No indexed homelessness movement: the empty state must say so.
    await expect(page.getByText(/honest answer/i).first()).toBeVisible();
  });

  test("civic-records API returns provenance on every movement", async ({
    request,
  }) => {
    const res = await request.get("/api/civic-records/latest?limit=5");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.movements.length).toBeGreaterThan(0);
    for (const m of json.data.movements) {
      expect(m.sourceUrl).toMatch(/^https?:\/\//);
      expect(m.methodologyUrl).toContain("/methodology");
      expect(m.evidence.length).toBeGreaterThan(0);
      expect(m.receiptUrl).toContain("/receipts/");
    }
  });

  test("zip API labels coverage gaps instead of guessing", async ({
    request,
  }) => {
    const res = await request.get("/api/civic-records/gov/10001");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.indexedCoverage).toEqual([]);
    expect(json.data.coverageGap).toContain("outside indexed coverage");
  });

  test("receipt API serves the evidence stack", async ({ request }) => {
    const res = await request.get(`/api/civic-records/receipts/${RECEIPT_ID}`);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.receipt.movementType).toBe("bill_signed");
    expect(json.data.receipt.evidence.length).toBeGreaterThan(0);
  });

  test("digest preview renders the movement digest", async ({ request }) => {
    const res = await request.get("/api/digest/preview?format=html");
    expect(res.ok()).toBeTruthy();
    const html = await res.text();
    expect(html).toContain("Government moves. You get receipts.");
    expect(html).toContain("/methodology");
  });

  test("embed widget renders link-only with the powered-by footer", async ({
    page,
  }) => {
    await page.goto("/embed/cause/housing");
    await expect(page.getByText(/what moved on housing/i)).toBeVisible();
    await expect(page.getByText(/powered by by the people/i)).toBeVisible();
    await expect(page.getByText(/private pilot/i)).toBeVisible();
  });

  test("launch center refuses without the admin key", async ({ page }) => {
    await page.goto("/admin/launch");
    await expect(
      page.getByRole("heading", { name: /admin key required/i }),
    ).toBeVisible();
  });

  test("launch center opens with the key and shows private mode + locked launch", async ({
    page,
  }) => {
    await page.goto(`/admin/launch?key=${encodeURIComponent(ADMIN_SECRET)}`);
    await expect(
      page.getByRole("heading", { name: /launch center/i, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/private test mode/i).first()).toBeVisible();
    await expect(page.getByText(/launch checklist/i)).toBeVisible();
    const launchButton = page.getByRole("button", {
      name: /begin public organic launch/i,
    });
    await expect(launchButton).toBeDisabled();
    await expect(page.getByText(/PRIVATE_TEST_MODE is on/i)).toBeVisible();
  });

  test("growth counters accept a visit and stay operator-only", async ({
    request,
  }) => {
    // Public write path (what RefTracker calls).
    const post = await request.post("/api/events", {
      data: { name: "visit", ref: "receipt" },
    });
    expect(post.ok()).toBeTruthy();

    // Unknown event names are rejected, so the counter can't be stuffed.
    const bad = await request.post("/api/events", {
      data: { name: "arbitrary", ref: "receipt" },
    });
    expect(bad.status()).toBe(400);

    // Reads require the admin key.
    const anon = await request.get("/api/events");
    expect(anon.status()).toBe(401);

    const admin = await request.get(
      `/api/events?key=${encodeURIComponent(ADMIN_SECRET)}&days=7`,
    );
    expect(admin.ok()).toBeTruthy();
    const json = await admin.json();
    expect(json.data.totals.visits).toBeGreaterThan(0);
    expect(json.data.byRef.some((r: { ref: string }) => r.ref === "receipt")).toBe(
      true,
    );
  });

  test("launch center shows the growth signals panel", async ({ page }) => {
    await page.goto(`/admin/launch?key=${encodeURIComponent(ADMIN_SECRET)}`);
    await expect(page.getByText(/growth signals/i)).toBeVisible();
  });

  test("privacy page discloses both analytics layers", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByText(/vercel web analytics/i)).toBeVisible();
    await expect(page.getByText(/referral counter/i)).toBeVisible();
  });

  test("og receipt card responds with an image", async ({ request }) => {
    const res = await request.get(`/og/receipt?id=${RECEIPT_ID}`);
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["content-type"]).toContain("image/png");
  });

  test("llms.txt and civic-records manifest expose the movement surfaces", async ({
    request,
  }) => {
    const llms = await (await request.get("/llms.txt")).text();
    expect(llms).toContain("/what-moved");
    expect(llms).toContain("/api/civic-records/latest");
    expect(llms).toContain("/causes/homelessness");

    const manifest = await (
      await request.get("/.well-known/civic-records.json")
    ).json();
    expect(manifest.endpoints.latestMovements).toContain(
      "/api/civic-records/latest",
    );
    expect(manifest.counts.movementEvents).toBeGreaterThan(0);
  });

  test("movement sitemap is registered and serves receipt URLs", async ({
    request,
  }) => {
    const index = await (await request.get("/sitemap.xml")).text();
    expect(index).toContain("sitemap-movement.xml");
    const movement = await (await request.get("/sitemap-movement.xml")).text();
    expect(movement).toContain("/what-moved");
    expect(movement).toContain("/receipts/");
    expect(movement).toContain("/causes/housing/la/this-week");
  });
});
