import { expect, test } from "@playwright/test";
import {
  type OpenStatesBill,
  curatedIdentifiers,
  normalizeIdentifier,
  snapshotFromOpenStatesBill,
  timelineTypeForAction,
} from "@/lib/live-ingest";
import { serializeMovement } from "@/lib/civic-records-api";
import {
  detectMovements,
  movementFromTimelineEvent,
  recordHref,
} from "@/lib/movement-types";

/** Fixture shaped like a real Open States v3 bill response (no network). */
const FIXTURE: OpenStatesBill = {
  id: "ocd-bill/test-1234",
  identifier: "SB 823",
  title: "Housing element compliance: streamlined review near transit",
  session: "20252026",
  subject: ["Housing", "Land use"],
  jurisdiction: { name: "California" },
  updated_at: "2026-06-28T10:00:00+00:00",
  first_action_date: "2026-02-11",
  latest_action_date: "2026-06-25",
  latest_action_description: "Read second time and amended.",
  openstates_url: "https://openstates.org/ca/bills/20252026/SB823/",
  actions: [
    {
      description: "Introduced. Read first time.",
      date: "2026-02-11",
      classification: ["introduction"],
      order: 1,
      organization: { name: "Senate" },
    },
    {
      description: "Referred to Com. on HOUSING.",
      date: "2026-03-02",
      classification: ["referral-committee"],
      order: 2,
      organization: { name: "Senate Rules Committee" },
    },
    {
      description: "Read second time and amended.",
      date: "2026-06-25",
      classification: ["amendment-passage", "reading-2"],
      order: 3,
      organization: { name: "Senate" },
    },
  ],
  sources: [
    {
      url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB823",
      note: "bill page",
    },
  ],
};

test.describe("live ingest mapping", () => {
  test("normalizes identifiers across formats", () => {
    expect(normalizeIdentifier("SB 79")).toBe("sb-79");
    expect(normalizeIdentifier("SB79")).toBe("sb-79");
    expect(normalizeIdentifier("S.B. 79")).toBe("sb-79");
    expect(normalizeIdentifier("AB 130")).toBe("ab-130");
  });

  test("curated identifiers include SB 79 so live discovery skips it", () => {
    expect(curatedIdentifiers().has("sb-79")).toBe(true);
  });

  test("maps a fixture bill to an honest snapshot", () => {
    const snap = snapshotFromOpenStatesBill(FIXTURE);
    expect(snap.recordId).toBe("os-ca-sb-823");
    expect(snap.live).toBe(true);
    expect(snap.title).toBe(
      "SB 823: Housing element compliance: streamlined review near transit",
    );
    expect(snap.jurisdiction).toBe("California Legislature");
    expect(snap.status).toBe("Amended");
    expect(snap.timeline).toHaveLength(3);
    expect(snap.externalRecordUrl).toContain("leginfo.legislature.ca.gov");
    // The official LegInfo source leads; the aggregator is labeled derived.
    const sources = Object.values(snap.sources);
    expect(sources[0].provenance).toBe("Official record");
    expect(sources.find((s) => s.url.includes("openstates.org"))?.provenance).toBe(
      "Derived summary",
    );
    // Deterministic: same fixture, same hash and ids.
    const again = snapshotFromOpenStatesBill(FIXTURE);
    expect(again.hash).toBe(snap.hash);
    expect(again.timeline.map((t) => t.id)).toEqual(
      snap.timeline.map((t) => t.id),
    );
  });

  test("action classifications map to movement-engine event types", () => {
    expect(
      timelineTypeForAction({ description: "x", date: "2026-01-01", classification: ["introduction"] }),
    ).toBe("bill_introduced");
    expect(
      timelineTypeForAction({ description: "x", date: "2026-01-01", classification: ["amendment-passage"] }),
    ).toBe("amendment_added");
    expect(
      timelineTypeForAction({ description: "x", date: "2026-01-01", classification: ["passage"] }),
    ).toBe("final_vote_recorded");
  });

  test("recordHref for live snapshots points at the official record", () => {
    const snap = snapshotFromOpenStatesBill(FIXTURE);
    expect(recordHref(snap)).toContain("leginfo.legislature.ca.gov");
  });

  test("API serialization never double-prefixes live record URLs", () => {
    const snap = snapshotFromOpenStatesBill(FIXTURE);
    const event = movementFromTimelineEvent(snap, snap.timeline[0], "detected");
    const wire = serializeMovement(event);
    expect(wire.recordUrl).toMatch(/^https?:\/\/leginfo/);
    expect(wire.recordUrl).not.toContain(".comhttp");
  });

  test("timeline events become sourced, confirmed movements", () => {
    const snap = snapshotFromOpenStatesBill(FIXTURE);
    const referral = movementFromTimelineEvent(snap, snap.timeline[1], "detected");
    expect(referral.movementType).toBe("committee_referral");
    expect(referral.confidence).toBe("confirmed");
    expect(referral.evidence[0].sourceUrl).toContain("leginfo");
    expect(referral.causeSlugs).toContain("housing");
    const amended = movementFromTimelineEvent(snap, snap.timeline[2], "detected");
    expect(amended.movementType).toBe("amendment_added");
  });

  test("differ detects a new official action on refresh", () => {
    const prev = snapshotFromOpenStatesBill(FIXTURE);
    const next = snapshotFromOpenStatesBill({
      ...FIXTURE,
      latest_action_date: "2026-07-01",
      latest_action_description: "In committee: Hearing postponed by committee.",
      actions: [
        ...(FIXTURE.actions ?? []),
        {
          description: "From committee: Do pass as amended.",
          date: "2026-07-01",
          classification: ["committee-passage-favorable"],
          order: 4,
          organization: { name: "Senate Housing Committee" },
        },
      ],
    });
    const events = detectMovements(prev, next, "2026-07-02T09:00:00.000Z");
    expect(events.length).toBeGreaterThan(0);
    // "From committee: Do pass" text upgrades to bill_advanced.
    expect(
      events.some(
        (e) =>
          e.movementType === "bill_advanced" ||
          e.movementType === "vote_recorded",
      ),
    ).toBe(true);
  });
});
