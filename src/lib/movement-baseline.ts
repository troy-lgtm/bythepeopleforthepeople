import { bills, localDecisions } from "../data/records";
import {
  type MovementEvent,
  type RecordSnapshot,
  movementFromTimelineEvent,
  snapshotFromBill,
  snapshotFromLocalDecision,
} from "./movement-types";

/**
 * Baseline movement events: derived deterministically from the indexed
 * record timelines. These are REAL official actions (introductions,
 * amendments, votes, signings) already verified into the record data with
 * source IDs — not samples, not fabrications. They make every movement
 * surface render honestly even with an empty store.
 *
 * Pure module (no server-only) so npx-tsx scripts can use it.
 */

export function snapshotAllRecords(): RecordSnapshot[] {
  return [
    ...bills.map(snapshotFromBill),
    ...localDecisions.map(snapshotFromLocalDecision),
  ];
}

let cache: MovementEvent[] | null = null;

export function baselineMovementEvents(): MovementEvent[] {
  if (cache) return cache;
  const events: MovementEvent[] = [];
  for (const snap of snapshotAllRecords()) {
    for (const entry of snap.timeline) {
      events.push(movementFromTimelineEvent(snap, entry, "baseline"));
    }
  }
  // Newest official action first; stable tiebreak on id.
  events.sort((a, b) =>
    a.occurredAt === b.occurredAt
      ? a.id.localeCompare(b.id)
      : b.occurredAt.localeCompare(a.occurredAt),
  );
  cache = events;
  return events;
}

export function baselineMovementById(id: string): MovementEvent | null {
  return baselineMovementEvents().find((e) => e.id === id) ?? null;
}
