import { expect, test } from "@playwright/test";

test.describe("Critical-path smoke", () => {
  test("home page loads with hero CTA", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /Government accountability/i,
        level: 1,
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Ask the record/i })).toBeVisible();
  });

  test("universal search modal opens and finds Schiff", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /Search records|Search ⌘K/i })
      .first()
      .click();
    const input = page.getByLabel(/Universal search/i);
    await expect(input).toBeVisible();
    await input.fill("Schiff");
    await expect(
      page.getByRole("link", { name: /Adam B\. Schiff/i }).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("federal rep page renders for Jimmy Gomez", async ({ page }) => {
    await page.goto("/federal/gomez-ca-34");
    await expect(
      page.getByRole("heading", { name: /Jimmy Gomez/i, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/U\.S\. House/i).first()).toBeVisible();
    await expect(page.getByText(/CA-34/i).first()).toBeVisible();
  });

  test("share page renders preview card", async ({ page }) => {
    await page.goto(
      "/share?text=Test+sourced+fact&source=Test+source&date=2026-05-21",
    );
    await expect(
      page.getByRole("heading", { name: /Sourced facts/i, level: 2 }),
    ).toBeVisible();
    await expect(page.getByText("Test sourced fact").first()).toBeVisible();
  });

  test("place API resolves a known ZIP", async ({ request }) => {
    const res = await request.get("/api/place/lookup?zip=90012");
    expect(res.ok()).toBe(true);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.place?.state).toBe("CA");
    expect(json.place?.cd).toBe(34);
    expect(json.reps?.houseRep?.name).toMatch(/Gomez/i);
  });

  test("freshness check pings sources", async ({ request }) => {
    const res = await request.get("/api/sources/check");
    expect(res.ok()).toBe(true);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data?.checked).toBeGreaterThan(0);
  });

  test("llms.txt is served as text", async ({ request }) => {
    const res = await request.get("/llms.txt");
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-type"]).toMatch(/text\/plain/);
    const body = await res.text();
    expect(body).toContain("By The People, For The People");
  });

  test("embed badge route renders an HTML card", async ({ request }) => {
    const res = await request.get("/embed/federal/gomez-ca-34");
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-type"]).toMatch(/text\/html/);
    const body = await res.text();
    expect(body).toContain("Jimmy Gomez");
    expect(body).toContain("Civic profile");
  });
});
