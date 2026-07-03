import { expect, test } from "@playwright/test";
import { bills, localDecisions } from "@/data/records";
import { baselineMovementEvents } from "@/lib/movement-baseline";
import {
  detectMovements,
  snapshotFromBill,
  snapshotFromLocalDecision,
} from "@/lib/movement-types";
import type { Bill } from "@/data/types";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

test.describe("baseline movement events", () => {
  test("derive from every indexed record timeline", () => {
    const events = baselineMovementEvents();
    const timelineTotal =
      bills.reduce((n, b) => n + b.timeline.length, 0) +
      localDecisions.reduce((n, d) => n + d.timeline.length, 0);
    expect(events.length).toBe(timelineTotal);
  });

  test("every event carries a source trail", () => {
    for (const e of baselineMovementEvents()) {
      expect(e.evidence.length, `${e.id} has evidence`).toBeGreaterThan(0);
      expect(e.sourceUrl, `${e.id} has sourceUrl`).toMatch(/^https?:\/\//);
      for (const ev of e.evidence) {
        expect(ev.sourceUrl).toMatch(/^https?:\/\//);
        expect(ev.provenance.length).toBeGreaterThan(0);
      }
    }
  });

  test("ids are deterministic across calls", () => {
    const a = baselineMovementEvents().map((e) => e.id);
    const b = baselineMovementEvents().map((e) => e.id);
    expect(a).toEqual(b);
  });

  test("SB 79 chaptering maps to bill_signed with confirmed confidence", () => {
    const signed = baselineMovementEvents().find(
      (e) => e.id === "mv-bill-ca-sb-79-sb79-t5",
    );
    expect(signed?.movementType).toBe("bill_signed");
    expect(signed?.confidence).toBe("confirmed");
    expect(signed?.isDigestWorthy).toBe(true);
  });
});

test.describe("movement differ", () => {
  const detectedAt = "2026-06-10T12:00:00.000Z";

  test("emits nothing when snapshots are identical", () => {
    const snap = snapshotFromBill(bills[0]);
    expect(detectMovements(snap, snap, detectedAt)).toEqual([]);
  });

  test("new record emits new_record", () => {
    const snap = snapshotFromBill(bills[0]);
    const events = detectMovements(null, snap, detectedAt);
    expect(events).toHaveLength(1);
    expect(events[0].movementType).toBe("new_record");
  });

  test("status change emits status_changed", () => {
    const prev = snapshotFromBill(bills[0]);
    const mutated = clone(bills[0]) as Bill;
    mutated.status = "Amended";
    const events = detectMovements(prev, snapshotFromBill(mutated), detectedAt);
    const status = events.find((e) => e.movementType === "status_changed");
    expect(status?.plainEnglishSummary).toContain('"Chaptered"');
    expect(status?.plainEnglishSummary).toContain('"Amended"');
  });

  test("new timeline hearing emits hearing_scheduled and suppresses bare status change", () => {
    const prev = snapshotFromBill(bills[0]);
    const mutated = clone(bills[0]) as Bill;
    mutated.timeline.push({
      id: "t-test-hearing",
      date: "2026-06-09",
      type: "committee_vote_scheduled",
      title: "Hearing scheduled",
      description: "The committee posted a hearing date.",
      actor: "Senate Housing Committee",
      sourceIds: [mutated.sources[0].id],
    });
    const events = detectMovements(prev, snapshotFromBill(mutated), detectedAt);
    expect(events.some((e) => e.movementType === "hearing_scheduled")).toBe(true);
  });

  test("new vote and amendment emit their movement types", () => {
    const prev = snapshotFromBill(bills[0]);
    const mutated = clone(bills[0]) as Bill;
    mutated.votes.push({ ...mutated.votes[0], id: "v-test-new" });
    mutated.amendments.push({ ...mutated.amendments[0], id: "a-test-new" });
    const events = detectMovements(prev, snapshotFromBill(mutated), detectedAt);
    expect(events.some((e) => e.movementType === "vote_recorded")).toBe(true);
    expect(events.some((e) => e.movementType === "amendment_added")).toBe(true);
  });

  test("moved meeting date emits important_date_changed", () => {
    const prev = snapshotFromLocalDecision(localDecisions[0]);
    const mutated = clone(localDecisions[0]);
    mutated.nextMeetingDate = "2026-07-01";
    const events = detectMovements(
      prev,
      snapshotFromLocalDecision(mutated),
      detectedAt,
    );
    const typed = events.map((e) => e.movementType);
    expect(
      typed.includes("important_date_changed") ||
        typed.includes("hearing_scheduled"),
    ).toBe(true);
  });

  test("sponsor change emits sponsor_added", () => {
    const prev = snapshotFromBill(bills[0]);
    const mutated = clone(bills[0]) as Bill;
    mutated.sponsor = "Senator Test Person";
    const events = detectMovements(prev, snapshotFromBill(mutated), detectedAt);
    expect(events.some((e) => e.movementType === "sponsor_added")).toBe(true);
  });

  test("detected events carry evidence and source URLs", () => {
    const prev = snapshotFromBill(bills[0]);
    const mutated = clone(bills[0]) as Bill;
    mutated.status = "Amended";
    const events = detectMovements(prev, snapshotFromBill(mutated), detectedAt);
    for (const e of events) {
      expect(e.evidence.length).toBeGreaterThan(0);
      expect(e.sourceUrl).toMatch(/^https?:\/\//);
    }
  });
});
