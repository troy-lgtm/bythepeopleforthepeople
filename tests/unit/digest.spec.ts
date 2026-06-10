import { expect, test } from "@playwright/test";
import type { Cause } from "@/data/types";
import {
  buildMovementDigest,
  movementMatchesUserCause,
  renderMovementDigestHtml,
  renderMovementDigestText,
} from "@/lib/movement-digest";
import { baselineMovementEvents } from "@/lib/movement-baseline";

const TROY = "troy@wearewarp.com";

const housingCause: Cause = {
  id: "c-housing",
  title: "More housing near transit",
  outcome: "I want more homes built near transit.",
  topics: ["Housing"],
  jurisdictions: ["California"],
  watchTermsAny: ["housing", "transit", "zoning"],
  createdAt: "2026-06-01T00:00:00.000Z",
};

test.describe("movement digest", () => {
  test("builds with movements for the test user in 90046", async () => {
    const d = await buildMovementDigest({
      email: TROY,
      zip: "90046",
      causes: [housingCause],
      periodDays: 365,
    });
    expect(d.totalMovements).toBeGreaterThan(0);
    expect(d.placeLabel).toBe("LA");
    expect(d.privateTestMode).toBe(true);
    expect(d.subject.toLowerCase()).toContain("housing");
  });

  test("html and text renderers include receipts, sources, and the private footer", async () => {
    const d = await buildMovementDigest({
      email: TROY,
      zip: "90046",
      causes: [housingCause],
      periodDays: 365,
    });
    const html = renderMovementDigestHtml(d, "https://example.test", {
      manageUrl: "https://example.test/watchlist/manage?token=x",
      unsubscribeUrl: "https://example.test/api/unsubscribe?token=x",
    });
    const text = renderMovementDigestText(d, "https://example.test");
    for (const body of [html, text]) {
      expect(body).toContain("/receipts/");
      expect(body).toContain("Source:");
      expect(body).toContain("Government moves. You get receipts.");
      expect(body).toContain("private test user");
    }
    expect(html).toContain("Manage watchlist");
    expect(html).toContain("Unsubscribe");
  });

  test("quiet periods get an honest subject, not filler", async () => {
    const d = await buildMovementDigest({
      email: TROY,
      zip: "90046",
      causes: [housingCause],
      periodDays: 1,
    });
    expect(d.totalMovements).toBe(0);
    expect(d.subject).toContain("Quiet");
  });

  test("out-of-coverage ZIP carries an explicit coverage note", async () => {
    const d = await buildMovementDigest({
      email: TROY,
      zip: "10001",
      causes: [housingCause],
      periodDays: 365,
    });
    expect(d.coverageNote).toBeTruthy();
    expect(d.coverageNote).toContain("outside indexed local coverage");
  });

  test("movementMatchesUserCause matches by watch terms", () => {
    const signed = baselineMovementEvents().find(
      (e) => e.id === "mv-bill-ca-sb-79-sb79-t5",
    )!;
    expect(movementMatchesUserCause(signed, housingCause)).toBe(true);
    const unrelated: Cause = {
      ...housingCause,
      topics: ["Schools"],
      watchTermsAny: ["classroom", "teacher"],
    };
    expect(movementMatchesUserCause(signed, unrelated)).toBe(false);
  });
});
