import { expect, test } from "@playwright/test";
import {
  CAUSE_CATALOG,
  causeMatchesText,
  getCatalogCause,
  matchCausesForText,
} from "@/lib/cause-catalog";
import { baselineMovementEvents } from "@/lib/movement-baseline";

test.describe("cause catalog", () => {
  test("ships the ten canonical causes", () => {
    const slugs = CAUSE_CATALOG.map((c) => c.slug);
    for (const expected of [
      "homelessness",
      "housing",
      "fires",
      "crime",
      "land-use",
      "transportation",
      "small-business",
      "taxes",
      "schools",
      "policing",
    ]) {
      expect(slugs).toContain(expected);
    }
  });

  test("matches at least five causes on representative official text", () => {
    const cases: Array<[string, string]> = [
      ["homelessness", "Motion to fund interim housing and encampment outreach"],
      ["housing", "An act relating to zoning for affordable residential density"],
      ["fires", "Wildfire brush clearance and evacuation route planning"],
      ["crime", "Ordinance addressing retail theft and public safety staffing"],
      ["schools", "Budget allocation for classroom teacher hiring in the district"],
      ["transportation", "Bus rapid transit lanes and pedestrian safety upgrades"],
    ];
    for (const [slug, text] of cases) {
      const cause = getCatalogCause(slug);
      expect(cause, slug).not.toBeNull();
      expect(causeMatchesText(cause!, { text }), `${slug}: ${text}`).toBe(true);
    }
  });

  test("negative keywords cancel false hits", () => {
    const fires = getCatalogCause("fires")!;
    expect(
      causeMatchesText(fires, { text: "Resolution calling for a ceasefire" }),
    ).toBe(false);
    expect(causeMatchesText(fires, { text: "He was fired from the agency" })).toBe(
      false,
    );
    expect(
      causeMatchesText(fires, { text: "Brush fire prevention program" }),
    ).toBe(true);
  });

  test("generic oversight does not trigger policing", () => {
    const slugs = matchCausesForText({
      text: "HCD oversight and implementation dates for housing element law",
    });
    expect(slugs).not.toContain("policing");
    expect(slugs).toContain("housing");
  });

  test("SB 79 baseline events tag housing, land use, transportation and not policing", () => {
    const sb79 = baselineMovementEvents().find(
      (e) => e.recordId === "bill-ca-sb-79",
    )!;
    expect(sb79.causeSlugs).toEqual(
      expect.arrayContaining(["housing", "land-use", "transportation"]),
    );
    expect(sb79.causeSlugs).not.toContain("policing");
  });
});
