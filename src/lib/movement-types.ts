import type { Bill, LocalDecision, PublicEvent, SourceRecord } from "../data/types";
import { matchCausesForText } from "./cause-catalog";
import { placeKeysForJurisdiction, type PlaceKey } from "./place-catalog";

/**
 * Movement detection core: pure types, deterministic templates, and the
 * snapshot differ. No AI generation anywhere — every summary is assembled
 * from structured fields of the official record, and every event carries an
 * evidence stack resolved from indexed sources. When a movement can't cite a
 * source it is marked "uncertain", never dressed up.
 *
 * Pure module (no server-only, no store IO) so unit tests and npx-tsx
 * scripts can exercise it directly.
 */

export type MovementType =
  | "new_record"
  | "status_changed"
  | "hearing_scheduled"
  | "agenda_item_added"
  | "vote_recorded"
  | "committee_referral"
  | "new_document"
  | "amendment_added"
  | "sponsor_added"
  | "bill_advanced"
  | "bill_failed"
  | "bill_signed"
  | "file_closed"
  | "important_date_changed"
  | "meeting_held";

export type MovementConfidence = "confirmed" | "uncertain";

export type MovementEvidence = {
  claim: string;
  /** Where in the official record the claim lives. */
  locator: string;
  /** The indexed description of the underlying entry. */
  excerpt: string;
  verificationNote: string;
  sourceUrl: string;
  sourceLabel: string;
  provenance: string;
};

export type MovementEvent = {
  id: string;
  recordId: string;
  recordSlug: string;
  recordType: "bill" | "local";
  recordTitle: string;
  recordHref: string;
  jurisdiction: string;
  placeKeys: PlaceKey[];
  causeSlugs: string[];
  movementType: MovementType;
  /** Plain-English headline: what the government did. */
  title: string;
  plainEnglishSummary: string;
  whyItMatters: string;
  responsibleBody: string;
  sourceUrl: string;
  sourceLabel: string;
  evidence: MovementEvidence[];
  /** Date of the official action (from the record). */
  occurredAt: string;
  /** When this system indexed or detected the movement. */
  detectedAt: string;
  confidence: MovementConfidence;
  isDigestWorthy: boolean;
  isPublished: boolean;
  /** baseline = derived from indexed history; detected = found by the differ. */
  origin: "baseline" | "detected";
};

export type SnapshotSource = {
  id: string;
  title: string;
  url: string;
  type: string;
  provenance: string;
  date: string;
};

export type SnapshotTimelineEvent = {
  id: string;
  date: string;
  type: string;
  title: string;
  description: string;
  actor: string;
  sourceIds: string[];
};

/** Normalized, comparable projection of a Bill or LocalDecision. */
export type RecordSnapshot = {
  recordId: string;
  recordType: "bill" | "local";
  slug: string;
  title: string;
  jurisdiction: string;
  status: string;
  sponsor?: string;
  nextActionDate?: string;
  nextMeetingDate?: string;
  summary: string;
  topics: string[];
  timeline: SnapshotTimelineEvent[];
  voteIds: string[];
  amendmentIds: string[];
  sourceIds: string[];
  sources: Record<string, SnapshotSource>;
  primaryUrl: string;
  hash: string;
  /** True for live-ingested records (no hand-curated internal page yet). */
  live?: boolean;
  /** Official record URL used instead of an internal page for live records. */
  externalRecordUrl?: string;
};

/** FNV-1a 32-bit — stable, dependency-free content hash for change detection. */
export function contentHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function indexSources(sources: SourceRecord[]): Record<string, SnapshotSource> {
  const out: Record<string, SnapshotSource> = {};
  for (const s of sources) {
    out[s.id] = {
      id: s.id,
      title: s.title,
      url: s.url,
      type: s.type,
      provenance: s.provenance ?? "Official record",
      date: s.date,
    };
  }
  return out;
}

function projectTimeline(timeline: PublicEvent[]): SnapshotTimelineEvent[] {
  return timeline.map((e) => ({
    id: e.id,
    date: e.date,
    type: e.type,
    title: e.title,
    description: e.description,
    actor: e.actor,
    sourceIds: e.sourceIds,
  }));
}

function finalizeSnapshot(
  snap: Omit<RecordSnapshot, "hash">,
): RecordSnapshot {
  // Hash only the officially meaningful fields, in stable order.
  const basis = JSON.stringify({
    status: snap.status,
    sponsor: snap.sponsor ?? null,
    nextActionDate: snap.nextActionDate ?? null,
    nextMeetingDate: snap.nextMeetingDate ?? null,
    timeline: snap.timeline.map((t) => t.id),
    votes: snap.voteIds,
    amendments: snap.amendmentIds,
    sources: snap.sourceIds,
    title: snap.title,
  });
  return { ...snap, hash: contentHash(basis) };
}

export function snapshotFromBill(bill: Bill): RecordSnapshot {
  return finalizeSnapshot({
    recordId: bill.id,
    recordType: "bill",
    slug: bill.slug,
    title: bill.title,
    jurisdiction: bill.jurisdiction,
    status: bill.status,
    sponsor: bill.sponsor,
    nextActionDate: bill.nextActionDate,
    summary: bill.summary,
    topics: bill.topics,
    timeline: projectTimeline(bill.timeline),
    voteIds: bill.votes.map((v) => v.id),
    amendmentIds: bill.amendments.map((a) => a.id),
    sourceIds: bill.sources.map((s) => s.id),
    sources: indexSources(bill.sources),
    primaryUrl: bill.sources[0]?.url ?? "",
  });
}

export function snapshotFromLocalDecision(d: LocalDecision): RecordSnapshot {
  return finalizeSnapshot({
    recordId: d.id,
    recordType: "local",
    slug: d.slug,
    title: d.title,
    jurisdiction: d.jurisdiction,
    status: d.status,
    nextMeetingDate: d.nextMeetingDate,
    summary: d.summary,
    topics: d.topics,
    timeline: projectTimeline(d.timeline),
    voteIds: d.votes.map((v) => v.id),
    amendmentIds: [],
    sourceIds: d.sources.map((s) => s.id),
    sources: indexSources(d.sources),
    primaryUrl: d.sources[0]?.url ?? "",
  });
}

/**
 * Where "open the full record" points. Curated records have internal pages;
 * live-ingested records link straight to the official record system —
 * honest, and never a dead internal link.
 */
export function recordHref(snap: RecordSnapshot): string {
  if (snap.live && snap.externalRecordUrl) return snap.externalRecordUrl;
  return snap.recordType === "bill" ? `/bills/${snap.slug}` : `/local/${snap.slug}`;
}

/** Short label for headlines: "SB 79" from "SB 79: Housing near transit". */
export function shortRecordLabel(title: string): string {
  const head = title.split(":")[0].trim();
  return head.length > 0 && head.length <= 48 ? head : title.slice(0, 48);
}

/**
 * Map an indexed timeline event to a movement type. Starts from the official
 * event type, then upgrades using the official text itself (e.g. a status
 * entry that says "chaptered" is a bill signing). Deterministic keywords only.
 */
export function movementTypeForTimelineEvent(
  recordType: "bill" | "local",
  event: { type: string; title: string; description: string },
): MovementType {
  const text = `${event.title} ${event.description}`.toLowerCase();

  if (recordType === "bill") {
    if (/chaptered|signed by the governor|governor approval|approved by the governor/.test(text)) {
      return "bill_signed";
    }
    if (/vetoed|failed passage|died in committee|inactive file/.test(text)) {
      return "bill_failed";
    }
    if (/passed committee|third reading|passed the (senate|assembly)|advanced/.test(text)) {
      return "bill_advanced";
    }
    if (/referred to .*committee/.test(text)) {
      return "committee_referral";
    }
  } else {
    if (/adopted|file closed|final action/.test(text)) {
      return "file_closed";
    }
  }

  switch (event.type) {
    case "bill_introduced":
      return "new_record";
    case "amendment_added":
      return "amendment_added";
    case "committee_vote_scheduled":
      return "hearing_scheduled";
    case "local_ordinance_updated":
      return "status_changed";
    case "hearing_transcript_published":
      return "new_document";
    case "final_vote_recorded":
      return "vote_recorded";
    case "meeting_held":
      return "meeting_held";
    case "document_posted":
      return "new_document";
    default:
      return "status_changed";
  }
}

const DIGEST_WORTHY: Record<MovementType, boolean> = {
  new_record: true,
  status_changed: true,
  hearing_scheduled: true,
  agenda_item_added: true,
  vote_recorded: true,
  committee_referral: true,
  new_document: false,
  amendment_added: true,
  sponsor_added: true,
  bill_advanced: true,
  bill_failed: true,
  bill_signed: true,
  file_closed: true,
  important_date_changed: true,
  meeting_held: false,
};

export function isDigestWorthyType(type: MovementType): boolean {
  return DIGEST_WORTHY[type];
}

/** Plain-English headline per movement type. Assembled, never generated. */
export function movementHeadline(
  type: MovementType,
  snap: Pick<RecordSnapshot, "title" | "recordType">,
): string {
  const label = shortRecordLabel(snap.title);
  switch (type) {
    case "new_record":
      return `${label} was introduced`;
    case "status_changed":
      return `${label} changed status`;
    case "hearing_scheduled":
      return `A hearing is set for ${label}`;
    case "agenda_item_added":
      return `${label} was added to an agenda`;
    case "vote_recorded":
      return `A vote was recorded on ${label}`;
    case "committee_referral":
      return `${label} was sent to committee`;
    case "new_document":
      return `A new official document was posted for ${label}`;
    case "amendment_added":
      return `${label} was amended`;
    case "sponsor_added":
      return `${label} gained a sponsor`;
    case "bill_advanced":
      return `${label} advanced`;
    case "bill_failed":
      return `${label} failed`;
    case "bill_signed":
      return `${label} was signed into law`;
    case "file_closed":
      return `${label} reached final action`;
    case "important_date_changed":
      return `A key date moved for ${label}`;
    case "meeting_held":
      return `A meeting covered ${label}`;
  }
}

/**
 * Why it matters: a nonpartisan, process-true statement per movement type.
 * These describe how the process works, never whether the outcome is good.
 */
export function movementWhyItMatters(type: MovementType): string {
  switch (type) {
    case "new_record":
      return "A new official record just opened. Watching from day one captures the full trail: every amendment, vote, and hearing.";
    case "status_changed":
      return "Status changes are real procedural steps in the official record, not commentary. This is the government's own account of where things stand.";
    case "hearing_scheduled":
      return "Hearings are where the text can change and where public comment lands before any vote. The date is the window to act.";
    case "agenda_item_added":
      return "Once an item is on a posted agenda, a decision can happen at that meeting. The agenda is the official notice.";
    case "vote_recorded":
      return "The vote is the decision itself. The roll call shows where each member landed, on the record.";
    case "committee_referral":
      return "Committees decide what advances and what stalls. The referral names exactly which members hold that power now.";
    case "new_document":
      return "Official documents are primary evidence of what the government is considering. New filings often preview the next move.";
    case "amendment_added":
      return "Amendments change what the words do. The version comparison shows exactly what was added and what was removed.";
    case "sponsor_added":
      return "Sponsorship is on-the-record backing. It often signals enough support to move the item forward.";
    case "bill_advanced":
      return "Each chamber or committee passage narrows what can still change. Fewer steps remain between this text and law.";
    case "bill_failed":
      return "A failure ends this version on the record. The same language can return later, and the trail shows who moved it last.";
    case "bill_signed":
      return "This is law now. What was a proposal is binding policy, with effective dates the record spells out.";
    case "file_closed":
      return "Final action closes the file. What was proposed is now adopted policy in the official record.";
    case "important_date_changed":
      return "Deadlines decide when action is possible. When an official date moves, the window to weigh in moves with it.";
    case "meeting_held":
      return "The meeting record shows what was actually discussed and decided, direct from the official minutes.";
  }
}

function buildEvidence(
  snap: RecordSnapshot,
  claim: string,
  excerpt: string,
  sourceIds: string[],
): MovementEvidence[] {
  const ids = sourceIds.length > 0 ? sourceIds : snap.sourceIds.slice(0, 1);
  return ids
    .map((id) => snap.sources[id])
    .filter((s): s is SnapshotSource => Boolean(s))
    .map((s) => ({
      claim,
      locator: `${s.title} (${s.type.replace(/_/g, " ")})`,
      excerpt,
      verificationNote: `Indexed from the official source dated ${s.date}. Provenance: ${s.provenance}.`,
      sourceUrl: s.url,
      sourceLabel: s.title,
      provenance: s.provenance,
    }));
}

function confidenceFor(evidence: MovementEvidence[]): MovementConfidence {
  if (evidence.length === 0) return "uncertain";
  return evidence.every(
    (e) => e.provenance === "Primary source" || e.provenance === "Official record",
  )
    ? "confirmed"
    : "uncertain";
}

function causesForMovement(
  snap: RecordSnapshot,
  extraText: string,
): string[] {
  return matchCausesForText({
    topics: snap.topics,
    text: `${snap.title} ${snap.summary} ${extraText}`,
  });
}

function makeMovement(opts: {
  id: string;
  snap: RecordSnapshot;
  type: MovementType;
  summary: string;
  evidence: MovementEvidence[];
  occurredAt: string;
  detectedAt: string;
  origin: "baseline" | "detected";
  extraCauseText?: string;
  responsibleBody?: string;
  /** Overrides the type template when it would misstate the event. */
  titleOverride?: string;
}): MovementEvent {
  const { snap } = opts;
  const primaryEvidence = opts.evidence[0];
  return {
    id: opts.id,
    recordId: snap.recordId,
    recordSlug: snap.slug,
    recordType: snap.recordType,
    recordTitle: snap.title,
    recordHref: recordHref(snap),
    jurisdiction: snap.jurisdiction,
    placeKeys: placeKeysForJurisdiction(snap.jurisdiction),
    causeSlugs: causesForMovement(snap, opts.extraCauseText ?? opts.summary),
    movementType: opts.type,
    title: opts.titleOverride ?? movementHeadline(opts.type, snap),
    plainEnglishSummary: opts.summary,
    whyItMatters: movementWhyItMatters(opts.type),
    responsibleBody: opts.responsibleBody ?? snap.jurisdiction,
    sourceUrl: primaryEvidence?.sourceUrl ?? snap.primaryUrl,
    sourceLabel: primaryEvidence?.sourceLabel ?? snap.jurisdiction,
    evidence: opts.evidence,
    occurredAt: opts.occurredAt,
    detectedAt: opts.detectedAt,
    confidence: confidenceFor(opts.evidence),
    isDigestWorthy: isDigestWorthyType(opts.type),
    isPublished: true,
    origin: opts.origin,
  };
}

/**
 * Movement derived from one indexed timeline entry. Used for the baseline
 * (real history already verified into the record data) and by the differ when
 * a new timeline entry appears.
 */
export function movementFromTimelineEvent(
  snap: RecordSnapshot,
  event: SnapshotTimelineEvent,
  origin: "baseline" | "detected",
  detectedAt?: string,
): MovementEvent {
  const type = movementTypeForTimelineEvent(snap.recordType, event);
  const summary = `${event.title}. ${event.description}`;
  return makeMovement({
    id: `mv-${snap.recordId}-${event.id}`,
    snap,
    type,
    summary,
    evidence: buildEvidence(snap, event.title, event.description, event.sourceIds),
    occurredAt: event.date,
    detectedAt: detectedAt ?? event.date,
    origin,
    responsibleBody: event.actor || snap.jurisdiction,
    extraCauseText: `${event.title} ${event.description}`,
  });
}

/**
 * Compare two snapshots of the same record and emit movements for every
 * official change. Deterministic field comparison only.
 */
export function detectMovements(
  prev: RecordSnapshot | null,
  next: RecordSnapshot,
  detectedAt: string,
): MovementEvent[] {
  const events: MovementEvent[] = [];
  const day = detectedAt.slice(0, 10);

  if (!prev) {
    // First sight of a record mid-life: the honest headline is "now indexed",
    // not "was introduced" — introduction may be months in the past and gets
    // its own correctly dated event from the record's timeline.
    events.push(
      makeMovement({
        id: `mv-${next.recordId}-first-indexed-${contentHash(next.hash)}`,
        snap: next,
        type: "new_record",
        titleOverride: `${shortRecordLabel(next.title)} is now indexed`,
        summary: `${next.title} is now indexed with ${next.sourceIds.length} official sources. Current status: ${next.status}.`,
        evidence: buildEvidence(
          next,
          `${next.title} entered the index`,
          next.summary,
          next.sourceIds.slice(0, 2),
        ),
        occurredAt: day,
        detectedAt,
        origin: "detected",
      }),
    );
    return events;
  }

  if (prev.hash === next.hash) return events;

  // New timeline entries (the richest official signal).
  const prevTimelineIds = new Set(prev.timeline.map((t) => t.id));
  for (const entry of next.timeline) {
    if (!prevTimelineIds.has(entry.id)) {
      events.push(movementFromTimelineEvent(next, entry, "detected", detectedAt));
    }
  }

  // Status change (skip if a new timeline entry already carries it).
  if (prev.status !== next.status) {
    const already = events.some((e) =>
      ["status_changed", "bill_signed", "bill_failed", "bill_advanced", "file_closed"].includes(
        e.movementType,
      ),
    );
    if (!already) {
      events.push(
        makeMovement({
          id: `mv-${next.recordId}-status-${contentHash(prev.status + next.status + day)}`,
          snap: next,
          type: "status_changed",
          summary: `Official status moved from "${prev.status}" to "${next.status}".`,
          evidence: buildEvidence(
            next,
            `Status changed to ${next.status}`,
            `The indexed record now reports status "${next.status}" (previously "${prev.status}").`,
            next.sourceIds.slice(0, 1),
          ),
          occurredAt: day,
          detectedAt,
          origin: "detected",
        }),
      );
    }
  }

  // New votes.
  const prevVotes = new Set(prev.voteIds);
  for (const voteId of next.voteIds) {
    if (!prevVotes.has(voteId)) {
      const carried = events.some((e) => e.movementType === "vote_recorded");
      if (carried) continue;
      events.push(
        makeMovement({
          id: `mv-${next.recordId}-vote-${voteId}`,
          snap: next,
          type: "vote_recorded",
          summary: `A new roll-call vote (${voteId}) appears in the official record.`,
          evidence: buildEvidence(
            next,
            "A new vote was recorded",
            `Vote ${voteId} was added to the indexed record.`,
            next.sourceIds.slice(0, 1),
          ),
          occurredAt: day,
          detectedAt,
          origin: "detected",
        }),
      );
    }
  }

  // New amendments.
  const prevAmendments = new Set(prev.amendmentIds);
  for (const amendmentId of next.amendmentIds) {
    if (!prevAmendments.has(amendmentId)) {
      const carried = events.some((e) => e.movementType === "amendment_added");
      if (carried) continue;
      events.push(
        makeMovement({
          id: `mv-${next.recordId}-amend-${amendmentId}`,
          snap: next,
          type: "amendment_added",
          summary: `A new amendment (${amendmentId}) appears in the official record.`,
          evidence: buildEvidence(
            next,
            "An amendment was added",
            `Amendment ${amendmentId} was added to the indexed record.`,
            next.sourceIds.slice(0, 1),
          ),
          occurredAt: day,
          detectedAt,
          origin: "detected",
        }),
      );
    }
  }

  // Sponsor change.
  if (prev.sponsor !== next.sponsor && next.sponsor) {
    events.push(
      makeMovement({
        id: `mv-${next.recordId}-sponsor-${contentHash(next.sponsor + day)}`,
        snap: next,
        type: "sponsor_added",
        summary: prev.sponsor
          ? `Sponsorship changed from ${prev.sponsor} to ${next.sponsor}.`
          : `${next.sponsor} is now the sponsor of record.`,
        evidence: buildEvidence(
          next,
          `Sponsor of record: ${next.sponsor}`,
          `The indexed record lists ${next.sponsor} as sponsor.`,
          next.sourceIds.slice(0, 1),
        ),
        occurredAt: day,
        detectedAt,
        origin: "detected",
      }),
    );
  }

  // Key date changes (next action or next meeting).
  const dateChanges: Array<[string | undefined, string | undefined, string]> = [
    [prev.nextActionDate, next.nextActionDate, "next action date"],
    [prev.nextMeetingDate, next.nextMeetingDate, "next meeting date"],
  ];
  for (const [before, after, label] of dateChanges) {
    if (before !== after && after) {
      events.push(
        makeMovement({
          id: `mv-${next.recordId}-date-${contentHash(label + after)}`,
          snap: next,
          type: before ? "important_date_changed" : "hearing_scheduled",
          summary: before
            ? `The ${label} moved from ${before} to ${after}.`
            : `A ${label} of ${after} was set.`,
          evidence: buildEvidence(
            next,
            `${label} is now ${after}`,
            `The indexed record reports the ${label} as ${after}.`,
            next.sourceIds.slice(0, 1),
          ),
          occurredAt: day,
          detectedAt,
          origin: "detected",
        }),
      );
    }
  }

  // New official documents (sources).
  const prevSources = new Set(prev.sourceIds);
  const addedSources = next.sourceIds.filter((id) => !prevSources.has(id));
  if (addedSources.length > 0) {
    const first = next.sources[addedSources[0]];
    events.push(
      makeMovement({
        id: `mv-${next.recordId}-doc-${contentHash(addedSources.join(","))}`,
        snap: next,
        type: "new_document",
        summary: `${addedSources.length} new official document${addedSources.length === 1 ? "" : "s"} indexed${first ? `, including "${first.title}"` : ""}.`,
        evidence: buildEvidence(
          next,
          "New official documents were indexed",
          first?.title ?? "New source records were attached to this record.",
          addedSources.slice(0, 2),
        ),
        occurredAt: day,
        detectedAt,
        origin: "detected",
      }),
    );
  }

  return events;
}
