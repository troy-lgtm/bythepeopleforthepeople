import { bills } from "../data/records";
import {
  type RecordSnapshot,
  type SnapshotSource,
  type SnapshotTimelineEvent,
  contentHash,
} from "./movement-types";
import { kvGet, kvSet } from "./store";

/**
 * Live ingest connector: current-session California bills via the Open
 * States v3 API (which normalizes the official LegInfo record system).
 *
 * Honesty rules, enforced in code:
 * - Only data the API actually returns becomes a record. Nothing is invented.
 * - Every snapshot carries its official LegInfo source URL; the Open States
 *   aggregator page is attached separately and labeled a derived summary.
 * - Bills already hand-curated in src/data/records.ts are skipped so the
 *   same official action never reports twice.
 * - No key → the connector reports itself unconfigured and does nothing.
 *
 * Server-side module (also imported by npx-tsx scripts; window check below).
 */

if (typeof window !== "undefined") {
  throw new Error("live-ingest is server-side only");
}

const OS_BASE = "https://v3.openstates.org";
const CA_JURISDICTION = "California";
const CA_SESSION = "20252026";
const TRACKED_KEY = "live:tracked";
const TRACKED_CAP = 40;
const DISCOVER_PER_QUERY = 3;
const REQUEST_GAP_MS = 1100; // stay far under the Open States rate limit

/** One deterministic discovery query per catalog cause. */
export const DISCOVERY_QUERIES: Array<{ causeSlug: string; q: string }> = [
  { causeSlug: "homelessness", q: "homeless" },
  { causeSlug: "housing", q: "housing" },
  { causeSlug: "fires", q: "wildfire" },
  { causeSlug: "crime", q: "crime" },
  { causeSlug: "land-use", q: "zoning" },
  { causeSlug: "transportation", q: "transit" },
  { causeSlug: "small-business", q: "small business" },
  { causeSlug: "taxes", q: "tax" },
  { causeSlug: "schools", q: "school" },
  { causeSlug: "policing", q: "police" },
];

export type OpenStatesAction = {
  description: string;
  date: string;
  classification?: string[];
  order?: number;
  organization?: { name?: string };
};

export type OpenStatesBill = {
  id: string;
  identifier: string;
  title: string;
  session?: string;
  classification?: string[];
  subject?: string[];
  jurisdiction?: { name?: string };
  updated_at?: string;
  first_action_date?: string;
  latest_action_date?: string;
  latest_action_description?: string;
  openstates_url?: string;
  actions?: OpenStatesAction[];
  sources?: Array<{ url: string; note?: string }>;
};

export type TrackedBill = {
  recordId: string;
  osId: string;
  identifier: string;
  causeHint: string;
  trackedAt: string;
};

export function liveIngestConfigured(): boolean {
  return Boolean(process.env.OPENSTATES_API_KEY);
}

/** "SB 79" → "sb-79"; also tolerates "SB79" and "S.B. 79". */
export function normalizeIdentifier(identifier: string): string {
  return identifier
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^([A-Z]+)(\d+)$/, "$1-$2")
    .toLowerCase();
}

/** Identifiers of hand-curated bills (title convention: "SB 79: ..."). */
export function curatedIdentifiers(): Set<string> {
  const out = new Set<string>();
  for (const b of bills) {
    const m = b.title.match(/^([A-Z]{1,3}\.?\s?B?\.?\s?\d+)/i);
    if (m) out.add(normalizeIdentifier(m[1]));
  }
  return out;
}

/**
 * Map one Open States action classification set + text to the timeline event
 * type the movement engine understands. Text regexes in the movement engine
 * still upgrade (e.g. "Approved by the Governor" → bill_signed).
 */
export function timelineTypeForAction(action: OpenStatesAction): string {
  const cls = action.classification ?? [];
  if (cls.includes("introduction") || cls.includes("filing")) {
    return "bill_introduced";
  }
  if (cls.some((c) => c.startsWith("amendment-"))) return "amendment_added";
  if (cls.includes("passage") || cls.some((c) => c.startsWith("committee-passage"))) {
    return "final_vote_recorded";
  }
  if (cls.includes("executive-signature") || cls.includes("became-law")) {
    // The signing text itself upgrades this to bill_signed in the engine.
    return "document_posted";
  }
  return "";
}

function statusForBill(bill: OpenStatesBill): string {
  const all = (bill.actions ?? []).flatMap((a) => a.classification ?? []);
  const text = `${bill.latest_action_description ?? ""}`.toLowerCase();
  if (all.includes("became-law") || all.includes("executive-signature") || /chaptered/.test(text)) {
    return "Chaptered";
  }
  if (all.includes("executive-veto") || /vetoed/.test(text)) return "Vetoed";
  if (all.includes("passage")) return "Passed Committee";
  if (all.some((c) => c.startsWith("amendment-"))) return "Amended";
  if (all.includes("referral-committee")) return "In Committee";
  if (all.includes("introduction") || all.includes("filing")) return "Introduced";
  return "Pending";
}

/** Deterministic snapshot from an Open States bill. Pure and fixture-testable. */
export function snapshotFromOpenStatesBill(
  bill: OpenStatesBill,
): RecordSnapshot {
  const norm = normalizeIdentifier(bill.identifier);
  const recordId = `os-ca-${norm}`;
  const legInfo = (bill.sources ?? []).find((s) =>
    s.url.includes("leginfo.legislature.ca.gov"),
  );
  const officialUrl = legInfo?.url ?? bill.openstates_url ?? "";

  const sources: Record<string, SnapshotSource> = {};
  const sourceIds: string[] = [];
  if (legInfo) {
    const id = `${recordId}-src-leginfo`;
    sources[id] = {
      id,
      title: `${bill.identifier} on CA LegInfo (via Open States)`,
      url: legInfo.url,
      type: "bill_status",
      provenance: "Official record",
      date: bill.latest_action_date ?? bill.updated_at?.slice(0, 10) ?? "",
    };
    sourceIds.push(id);
  }
  if (bill.openstates_url) {
    const id = `${recordId}-src-openstates`;
    sources[id] = {
      id,
      title: `${bill.identifier} on Open States`,
      url: bill.openstates_url,
      type: "bill_status",
      provenance: "Derived summary",
      date: bill.updated_at?.slice(0, 10) ?? "",
    };
    sourceIds.push(id);
  }

  // Timeline events cite the official LegInfo source when present; the
  // aggregator page is the fallback, and its weaker provenance is what
  // downgrades confidence to "uncertain" automatically.
  const eventSourceIds = legInfo ? [sourceIds[0]] : sourceIds.slice(0, 1);

  const timeline: SnapshotTimelineEvent[] = (bill.actions ?? [])
    .slice()
    .sort((a, b) =>
      a.date === b.date
        ? (a.order ?? 0) - (b.order ?? 0)
        : a.date.localeCompare(b.date),
    )
    .map((action) => ({
      id: `os-act-${contentHash(`${action.date}|${action.description}`)}`,
      date: action.date.slice(0, 10),
      type: timelineTypeForAction(action),
      title: action.description,
      description: `${action.organization?.name ? `${action.organization.name}: ` : ""}${action.description}`,
      actor: action.organization?.name ?? "California Legislature",
      sourceIds: eventSourceIds,
    }));

  const base: Omit<RecordSnapshot, "hash"> = {
    recordId,
    recordType: "bill",
    slug: norm,
    title: `${bill.identifier}: ${bill.title}`,
    jurisdiction: "California Legislature",
    status: statusForBill(bill),
    summary: bill.title,
    topics: bill.subject ?? [],
    timeline,
    voteIds: [],
    amendmentIds: [],
    sourceIds,
    sources,
    primaryUrl: officialUrl,
    live: true,
    externalRecordUrl: officialUrl,
  };
  const basis = JSON.stringify({
    status: base.status,
    timeline: base.timeline.map((t) => t.id),
    sources: base.sourceIds,
    title: base.title,
  });
  return { ...base, hash: contentHash(basis) };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function osFetch(path: string): Promise<unknown | null> {
  const key = process.env.OPENSTATES_API_KEY;
  if (!key) return null;
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${OS_BASE}${path}${sep}apikey=${encodeURIComponent(key)}`, {
    headers: { "User-Agent": "bythepeopleforthepeople-ingest/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`openstates ${path.split("?")[0]}: status ${res.status}`);
  }
  return res.json();
}

export async function getTrackedBills(): Promise<TrackedBill[]> {
  return (await kvGet<TrackedBill[]>(TRACKED_KEY)) ?? [];
}

async function setTrackedBills(tracked: TrackedBill[]): Promise<void> {
  await kvSet(TRACKED_KEY, tracked.slice(0, TRACKED_CAP));
}

export type LiveIngestResult = {
  configured: boolean;
  snapshots: RecordSnapshot[];
  tracked: number;
  discovered: number;
  refreshed: number;
  errors: string[];
};

/**
 * Fetch live snapshots: refresh every tracked bill, then discover new
 * current-session bills per cause query. Bounded, paced, and isolated —
 * a failing request never takes down the run.
 */
export async function fetchLiveSnapshots(): Promise<LiveIngestResult> {
  const result: LiveIngestResult = {
    configured: liveIngestConfigured(),
    snapshots: [],
    tracked: 0,
    discovered: 0,
    refreshed: 0,
    errors: [],
  };
  if (!result.configured) return result;

  const curated = curatedIdentifiers();
  const tracked = await getTrackedBills();
  const byRecordId = new Map(tracked.map((t) => [t.recordId, t]));
  const seenThisRun = new Set<string>();

  // 1. Refresh tracked bills by their Open States id.
  for (const entry of tracked) {
    try {
      const data = (await osFetch(
        `/bills/${encodeURIComponent(entry.osId)}?include=actions&include=sources`,
      )) as OpenStatesBill | null;
      if (data) {
        const snap = snapshotFromOpenStatesBill(data);
        result.snapshots.push(snap);
        seenThisRun.add(snap.recordId);
        result.refreshed++;
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }
    await sleep(REQUEST_GAP_MS);
  }

  // 2. Discover new bills per cause query.
  for (const { causeSlug, q } of DISCOVERY_QUERIES) {
    if (byRecordId.size >= TRACKED_CAP) break;
    try {
      const data = (await osFetch(
        `/bills?jurisdiction=${encodeURIComponent(CA_JURISDICTION)}&session=${CA_SESSION}&q=${encodeURIComponent(q)}&sort=updated_desc&include=actions&include=sources&per_page=${DISCOVER_PER_QUERY}`,
      )) as { results?: OpenStatesBill[] } | null;
      for (const bill of data?.results ?? []) {
        const norm = normalizeIdentifier(bill.identifier);
        const recordId = `os-ca-${norm}`;
        if (curated.has(norm)) continue; // hand-curated record owns this bill
        if (byRecordId.has(recordId) || seenThisRun.has(recordId)) continue;
        if (byRecordId.size >= TRACKED_CAP) break;
        const snap = snapshotFromOpenStatesBill(bill);
        result.snapshots.push(snap);
        seenThisRun.add(recordId);
        byRecordId.set(recordId, {
          recordId,
          osId: bill.id,
          identifier: bill.identifier,
          causeHint: causeSlug,
          trackedAt: new Date().toISOString(),
        });
        result.discovered++;
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }
    await sleep(REQUEST_GAP_MS);
  }

  await setTrackedBills(Array.from(byRecordId.values()));
  result.tracked = byRecordId.size;
  return result;
}
