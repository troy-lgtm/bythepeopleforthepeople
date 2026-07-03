import {
  baselineMovementEvents,
  snapshotAllRecords,
} from "./movement-baseline";
import {
  type MovementEvent,
  type RecordSnapshot,
  detectMovements,
  movementFromTimelineEvent,
} from "./movement-types";
import {
  kvGet,
  kvMget,
  kvSet,
  setAdd,
  setMembers,
} from "./store";

/**
 * Persistence for movement detection: stored record versions, detected
 * movement events, and the merged read path (store events + baseline events)
 * every surface uses. Server-side module (also imported by npx-tsx scripts,
 * so no "server-only"; the window check enforces the boundary).
 */

if (typeof window !== "undefined") {
  throw new Error("movement-store is server-side only");
}

const MV_INDEX = "mv:index";
const mvKey = (id: string) => `mv:${id}`;
const verKey = (recordId: string) => `recver:${recordId}`;
const LAST_RUN_KEY = "mv:lastrun";

export type StoredRecordVersion = {
  recordId: string;
  versionHash: string;
  capturedAt: string;
  snapshot: RecordSnapshot;
};

export type DetectionRun = {
  ranAt: string;
  recordsChecked: number;
  recordsChanged: number;
  newEvents: number;
  firstRun: boolean;
  /** Live ingest stats (Open States connector). */
  liveConfigured?: boolean;
  liveTracked?: number;
  liveDiscovered?: number;
  liveRefreshed?: number;
  liveErrors?: string[];
};

export async function getStoredVersion(
  recordId: string,
): Promise<StoredRecordVersion | null> {
  return (await kvGet<StoredRecordVersion>(verKey(recordId))) ?? null;
}

export async function saveMovementEvent(event: MovementEvent): Promise<void> {
  await kvSet(mvKey(event.id), event);
  await setAdd(MV_INDEX, event.id);
}

export async function getStoredMovement(
  id: string,
): Promise<MovementEvent | null> {
  return (await kvGet<MovementEvent>(mvKey(id))) ?? null;
}

export async function listStoredMovements(): Promise<MovementEvent[]> {
  const ids = await setMembers(MV_INDEX);
  if (ids.length === 0) return [];
  const events = await kvMget<MovementEvent>(ids.map(mvKey));
  return events.filter((e): e is MovementEvent => Boolean(e));
}

export async function lastDetectionRun(): Promise<DetectionRun | null> {
  return (await kvGet<DetectionRun>(LAST_RUN_KEY)) ?? null;
}

/**
 * Snapshot every indexed record (curated + live-ingested), diff against the
 * stored version, persist any movements, and update versions.
 *
 * First-sight rules differ by origin, deliberately:
 * - Curated records: store the version silently — the baseline already
 *   derives their history, so emitting here would double-report.
 * - Live records: emit a real new_record movement — entering the index IS
 *   the movement, and their history was never in the baseline.
 */
export async function detectAndStoreMovements(
  now = new Date(),
  opts: { includeLive?: boolean } = {},
): Promise<DetectionRun> {
  const detectedAt = now.toISOString();
  const snapshots: RecordSnapshot[] = [...snapshotAllRecords()];

  let liveStats: {
    configured: boolean;
    tracked: number;
    discovered: number;
    refreshed: number;
    errors: string[];
  } | null = null;

  if (opts.includeLive !== false) {
    // Lazy import keeps the pure differ path free of connector concerns.
    const { fetchLiveSnapshots } = await import("./live-ingest");
    const live = await fetchLiveSnapshots();
    liveStats = {
      configured: live.configured,
      tracked: live.tracked,
      discovered: live.discovered,
      refreshed: live.refreshed,
      errors: live.errors,
    };
    snapshots.push(...live.snapshots);
  }

  let recordsChanged = 0;
  let newEvents = 0;
  let sawAnyVersion = false;

  for (const snap of snapshots) {
    const stored = await getStoredVersion(snap.recordId);
    if (stored) sawAnyVersion = true;

    if (!stored) {
      if (snap.live) {
        const events = detectMovements(null, snap, detectedAt);
        // Also surface the record's RECENT official actions (last 30 days),
        // dated by the official record — discovering a bill that was amended
        // last week should produce last week's amendment, honestly dated.
        const recentCutoff = new Date(now.getTime() - 30 * 86_400_000)
          .toISOString()
          .slice(0, 10);
        for (const entry of snap.timeline) {
          if (entry.date >= recentCutoff) {
            events.push(
              movementFromTimelineEvent(snap, entry, "detected", detectedAt),
            );
          }
        }
        for (const event of events) {
          await saveMovementEvent(event);
          newEvents++;
        }
      }
      await kvSet(verKey(snap.recordId), {
        recordId: snap.recordId,
        versionHash: snap.hash,
        capturedAt: detectedAt,
        snapshot: snap,
      } satisfies StoredRecordVersion);
      continue;
    }

    if (stored.versionHash === snap.hash) continue;

    recordsChanged++;
    const events = detectMovements(stored.snapshot, snap, detectedAt);
    for (const event of events) {
      await saveMovementEvent(event);
      newEvents++;
    }
    await kvSet(verKey(snap.recordId), {
      recordId: snap.recordId,
      versionHash: snap.hash,
      capturedAt: detectedAt,
      snapshot: snap,
    } satisfies StoredRecordVersion);
  }

  const run: DetectionRun = {
    ranAt: detectedAt,
    recordsChecked: snapshots.length,
    recordsChanged,
    newEvents,
    firstRun: !sawAnyVersion,
    liveConfigured: liveStats?.configured,
    liveTracked: liveStats?.tracked,
    liveDiscovered: liveStats?.discovered,
    liveRefreshed: liveStats?.refreshed,
    liveErrors: liveStats?.errors?.slice(0, 5),
  };
  await kvSet(LAST_RUN_KEY, run);
  return run;
}

export type MovementFilter = {
  /** Place key ("la", "ca") — omitted means everywhere. */
  place?: string;
  /**
   * Any-of place keys. A watcher in an LA ZIP gets LA city AND CA state
   * movement, so ZIP-scoped callers pass every key the ZIP belongs to.
   */
  places?: string[];
  /** Catalog cause slug — omitted means every cause. */
  cause?: string;
  /** Only events whose official action date is within the last N days. */
  sinceDays?: number;
  /** Include events below the digest-worthy bar (default true for feeds). */
  digestWorthyOnly?: boolean;
  limit?: number;
};

/**
 * The one read path for movement surfaces: detected events from the store
 * merged with the baseline derived from indexed records, deduped by id,
 * filtered, newest official action first.
 */
export async function listMovementEvents(
  filter: MovementFilter = {},
): Promise<MovementEvent[]> {
  const stored = await listStoredMovements();
  const seen = new Set(stored.map((e) => e.id));
  const merged = [
    ...stored,
    ...baselineMovementEvents().filter((e) => !seen.has(e.id)),
  ];

  const sinceIso = filter.sinceDays
    ? new Date(Date.now() - filter.sinceDays * 86_400_000)
        .toISOString()
        .slice(0, 10)
    : null;

  const filtered = merged.filter((e) => {
    if (!e.isPublished) return false;
    if (filter.digestWorthyOnly && !e.isDigestWorthy) return false;
    if (filter.place && !e.placeKeys.includes(filter.place as never)) {
      return false;
    }
    if (
      filter.places &&
      filter.places.length > 0 &&
      !filter.places.some((p) => e.placeKeys.includes(p as never))
    ) {
      return false;
    }
    if (filter.cause && !e.causeSlugs.includes(filter.cause)) return false;
    if (sinceIso && e.occurredAt < sinceIso) return false;
    return true;
  });

  filtered.sort((a, b) =>
    a.occurredAt === b.occurredAt
      ? a.id.localeCompare(b.id)
      : b.occurredAt.localeCompare(a.occurredAt),
  );

  return filter.limit ? filtered.slice(0, filter.limit) : filtered;
}

/** Single movement by id: store first, baseline fallback. */
export async function getMovementEvent(
  id: string,
): Promise<MovementEvent | null> {
  const stored = await getStoredMovement(id);
  if (stored) return stored;
  return baselineMovementEvents().find((e) => e.id === id) ?? null;
}

/** Full movement history for one record, newest first (receipt timelines). */
export async function listMovementsForRecord(
  recordId: string,
): Promise<MovementEvent[]> {
  const all = await listMovementEvents({});
  return all.filter((e) => e.recordId === recordId);
}

export async function movementCounts(): Promise<{
  total: number;
  detected: number;
  baseline: number;
  digestWorthy: number;
}> {
  const all = await listMovementEvents({});
  return {
    total: all.length,
    detected: all.filter((e) => e.origin === "detected").length,
    baseline: all.filter((e) => e.origin === "baseline").length,
    digestWorthy: all.filter((e) => e.isDigestWorthy).length,
  };
}
