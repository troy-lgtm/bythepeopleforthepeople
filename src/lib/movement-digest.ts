import type { Cause } from "../data/types";
import { CAUSE_CATALOG, getCatalogCause } from "./cause-catalog";
import { launchFlags } from "./launch-mode";
import { listMovementEvents } from "./movement-store";
import type { MovementEvent } from "./movement-types";
import { getPlace, zipToPlace } from "./place-catalog";

/**
 * Movement digest: "Government moves. You get receipts." Built entirely from
 * detected + baseline movement events, each carrying its own evidence stack.
 * Deterministic templates only — no generated prose.
 *
 * Server-side module (also imported by npx-tsx scripts; window check below).
 */

if (typeof window !== "undefined") {
  throw new Error("movement-digest is server-side only");
}

export type DigestSection = {
  causeSlug: string;
  causeName: string;
  items: MovementEvent[];
};

export type MovementDigest = {
  generatedAt: string;
  email?: string;
  zip?: string;
  placeLabel: string;
  periodStart: string;
  periodEnd: string;
  subject: string;
  previewText: string;
  intro: string;
  sections: DigestSection[];
  /** Coverage note when the watcher's ZIP has no indexed local coverage. */
  coverageNote?: string;
  totalMovements: number;
  privateTestMode: boolean;
};

/** Does a movement event match a user-authored cause? Deterministic text match. */
export function movementMatchesUserCause(
  event: MovementEvent,
  cause: Cause,
): boolean {
  const haystack =
    `${event.recordTitle} ${event.title} ${event.plainEnglishSummary}`.toLowerCase();
  const topicHit = cause.topics.some((t) =>
    event.causeSlugs.some((slug) => {
      const catalog = getCatalogCause(slug);
      return catalog?.topics.some(
        (ct) => ct.toLowerCase() === t.toLowerCase(),
      );
    }),
  );
  if (topicHit) return true;
  return cause.watchTermsAny.some((term) => {
    const t = term.toLowerCase().trim();
    return t.length > 0 && haystack.includes(t);
  });
}

function dedupe(events: MovementEvent[]): MovementEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

export async function buildMovementDigest(opts: {
  email?: string;
  zip?: string;
  causes?: Cause[];
  periodDays?: number;
  now?: Date;
}): Promise<MovementDigest> {
  const now = opts.now ?? new Date();
  const periodDays = opts.periodDays ?? 7;
  const periodEnd = now.toISOString().slice(0, 10);
  const periodStart = new Date(now.getTime() - periodDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const flags = launchFlags();

  // Resolve the place scope from the ZIP, honestly. A ZIP inside indexed
  // coverage watches every level it belongs to (LA city + CA state).
  let placeKeys: string[] | undefined;
  let placeLabel = "your places";
  let coverageNote: string | undefined;
  if (opts.zip) {
    const zp = zipToPlace(opts.zip);
    if (zp.placeKeys.length > 0) {
      placeKeys = zp.placeKeys;
      placeLabel = getPlace(zp.placeKeys[0])?.shortName ?? zp.city;
    } else {
      placeLabel = zp.known ? zp.city : `ZIP ${opts.zip}`;
      coverageNote = zp.known
        ? `${zp.city}, ${zp.state} is outside indexed local coverage today, so this digest shows state and LA records. Coverage gaps are labeled, never papered over.`
        : `ZIP ${opts.zip} is not in the indexed coverage table yet, so this digest shows state and LA records. Coverage gaps are labeled, never papered over.`;
    }
  } else {
    placeLabel = "California and LA";
  }

  // Recent digest-worthy movement in scope. If the period is quiet, the
  // digest says so instead of stretching the window silently.
  const recent = await listMovementEvents({
    places: placeKeys,
    sinceDays: periodDays,
    digestWorthyOnly: true,
  });

  // Section per cause. User causes first; catalog causes as the default lens.
  const sections: DigestSection[] = [];
  if (opts.causes && opts.causes.length > 0) {
    for (const cause of opts.causes) {
      const items = recent.filter((e) => movementMatchesUserCause(e, cause));
      sections.push({
        causeSlug: cause.id,
        causeName: cause.title,
        items: items.slice(0, 5),
      });
    }
  } else {
    for (const cause of CAUSE_CATALOG) {
      const items = recent.filter((e) => e.causeSlugs.includes(cause.slug));
      if (items.length > 0) {
        sections.push({
          causeSlug: cause.slug,
          causeName: cause.name,
          items: items.slice(0, 5),
        });
      }
    }
  }

  const matchedTotal = dedupe(sections.flatMap((s) => s.items)).length;

  // Deterministic subject templates, honest in the quiet case. The period
  // word tracks the actual window so a 30-day digest never claims "this week".
  const periodWord =
    periodDays <= 1 ? "today" : periodDays <= 7 ? "this week" : "recently";
  const sectionsWithItems = sections.filter((s) => s.items.length > 0);
  let subject: string;
  if (matchedTotal === 0) {
    subject = `Quiet ${periodDays <= 7 ? "week" : "stretch"} on your causes near ${placeLabel}. Here's what we checked.`;
  } else if (sectionsWithItems.length === 1) {
    const s = sectionsWithItems[0];
    subject = `${s.items.length} thing${s.items.length === 1 ? "" : "s"} ${placeLabel} did about ${s.causeName.toLowerCase()} ${periodWord}`;
  } else {
    const names = sectionsWithItems
      .slice(0, 2)
      .map((s) => s.causeName.toLowerCase());
    subject = `Government moved on ${names.join(" and ")}. Here are the receipts.`;
  }

  const intro = opts.zip
    ? `Here's what moved for ZIP ${opts.zip} and your causes between ${periodStart} and ${periodEnd}.`
    : `Here's what moved on your causes between ${periodStart} and ${periodEnd}.`;

  const firstItem = sectionsWithItems[0]?.items[0];

  return {
    generatedAt: now.toISOString(),
    email: opts.email,
    zip: opts.zip,
    placeLabel,
    periodStart,
    periodEnd,
    subject,
    previewText: firstItem
      ? `${firstItem.title}. Source: ${firstItem.sourceLabel}.`
      : "Every claim links to the official record.",
    intro,
    sections,
    coverageNote,
    totalMovements: matchedTotal,
    privateTestMode: flags.privateTestMode,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const TYPE_LABEL: Record<string, string> = {
  new_record: "New record",
  status_changed: "Status changed",
  hearing_scheduled: "Hearing scheduled",
  agenda_item_added: "On the agenda",
  vote_recorded: "Vote recorded",
  committee_referral: "Sent to committee",
  new_document: "New document",
  amendment_added: "Amended",
  sponsor_added: "Sponsor added",
  bill_advanced: "Advanced",
  bill_failed: "Failed",
  bill_signed: "Signed into law",
  file_closed: "Final action",
  important_date_changed: "Key date moved",
  meeting_held: "Meeting held",
};

export function movementTypeLabel(type: string): string {
  return TYPE_LABEL[type] ?? "Movement";
}

export function renderMovementDigestText(
  d: MovementDigest,
  baseUrl: string,
  opts?: { unsubscribeUrl?: string; manageUrl?: string },
): string {
  const lines: string[] = [];
  lines.push("By The People, For The People");
  lines.push("Government moves. You get receipts.");
  lines.push("");
  lines.push(d.intro);
  if (d.coverageNote) {
    lines.push("");
    lines.push(`Coverage note: ${d.coverageNote}`);
  }
  lines.push("");
  if (d.totalMovements === 0) {
    lines.push(
      "No digest-worthy movement matched your causes this period. That is the honest answer, not a missed email.",
    );
    lines.push(
      `See everything we track: ${baseUrl}/what-moved`,
    );
    lines.push("");
  }
  for (const section of d.sections) {
    if (section.items.length === 0) {
      lines.push(`${section.causeName}: no movement this period.`);
      lines.push("");
      continue;
    }
    lines.push(section.causeName.toUpperCase());
    lines.push("-".repeat(section.causeName.length));
    for (const item of section.items) {
      lines.push(`- [${movementTypeLabel(item.movementType)}] ${item.title} (${item.occurredAt})`);
      lines.push(`  ${item.plainEnglishSummary}`);
      lines.push(`  Why it matters: ${item.whyItMatters}`);
      lines.push(`  Receipt: ${baseUrl}/receipts/${item.id}?ref=digest`);
      lines.push(`  Source: ${item.sourceLabel} (${item.sourceUrl})`);
      if (item.confidence !== "confirmed") {
        lines.push(`  Confidence: uncertain — verify against the source link.`);
      }
      lines.push("");
    }
  }
  lines.push(`What moved near you: ${baseUrl}/what-moved`);
  lines.push("");
  lines.push("---");
  if (d.privateTestMode && d.email) {
    lines.push(
      `You are receiving this because ${d.email} is the private test user. Private test mode is on — no one else can receive this email.`,
    );
  }
  if (opts?.manageUrl) lines.push(`Manage watchlist: ${opts.manageUrl}`);
  lines.push(`Methodology: ${baseUrl}/methodology`);
  const mailing = process.env.DIGEST_MAILING_ADDRESS;
  if (mailing) lines.push(mailing);
  if (opts?.unsubscribeUrl) lines.push(`Unsubscribe: ${opts.unsubscribeUrl}`);
  return lines.join("\n");
}

export function renderMovementDigestHtml(
  d: MovementDigest,
  baseUrl: string,
  opts?: { unsubscribeUrl?: string; manageUrl?: string },
): string {
  const item = (m: MovementEvent) => `
    <article style="margin:0 0 14px 0;padding:16px;border:1px solid #d9dde8;border-radius:10px;background:#ffffff;">
      <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#175c55;">${escapeHtml(movementTypeLabel(m.movementType))} · ${escapeHtml(m.occurredAt)}</p>
      <p style="margin:0 0 6px 0;font-size:16px;font-weight:700;color:#07111f;">${escapeHtml(m.title)}</p>
      <p style="margin:0 0 8px 0;font-size:13px;line-height:1.6;color:#27364f;">${escapeHtml(m.plainEnglishSummary)}</p>
      <p style="margin:0 0 10px 0;font-size:12px;line-height:1.6;color:#40516a;"><strong>Why it matters:</strong> ${escapeHtml(m.whyItMatters)}</p>
      ${m.confidence !== "confirmed" ? `<p style="margin:0 0 10px 0;font-size:12px;color:#a26f19;">Confidence: uncertain — verify against the official source.</p>` : ""}
      <a href="${baseUrl}/receipts/${encodeURIComponent(m.id)}?ref=digest" style="display:inline-block;background:#07111f;color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 14px;border-radius:8px;">See the receipt</a>
      <p style="margin:10px 0 0 0;font-size:11px;color:#40516a;">Source: <a href="${m.sourceUrl}" style="color:#175c55;">${escapeHtml(m.sourceLabel)}</a></p>
    </article>`;

  const section = (s: DigestSection) => `
    <h2 style="font-size:14px;margin:22px 0 10px 0;border-bottom:1px solid #eceef4;padding-bottom:6px;color:#07111f;">${escapeHtml(s.causeName)}</h2>
    ${
      s.items.length === 0
        ? `<p style="margin:0 0 12px 0;font-size:13px;color:#40516a;">No movement this period. That is the honest answer.</p>`
        : s.items.map(item).join("")
    }`;

  return `<!doctype html>
<html><body style="margin:0;padding:24px;font-family:Inter,system-ui,sans-serif;background:#fbfaf7;color:#07111f;">
  <div style="max-width:640px;margin:0 auto;">
    <div style="background:#07111f;border-radius:12px 12px 0 0;padding:20px 24px;">
      <p style="margin:0 0 2px 0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#7dd3c0;">By The People, For The People</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">Government moves. You get receipts.</p>
    </div>
    <div style="background:#ffffff;border:1px solid #d9dde8;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
      <p style="margin:0 0 4px 0;font-size:14px;line-height:1.6;color:#27364f;">${escapeHtml(d.intro)}</p>
      ${d.coverageNote ? `<p style="margin:8px 0 0 0;font-size:12px;line-height:1.6;color:#a26f19;">${escapeHtml(d.coverageNote)}</p>` : ""}
      ${
        d.totalMovements === 0
          ? `<p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#27364f;">No digest-worthy movement matched your causes this period. We checked; quiet is the honest answer. <a href="${baseUrl}/what-moved?ref=digest" style="color:#175c55;">See everything we track</a>.</p>`
          : ""
      }
      ${d.sections.map(section).join("")}
      <p style="margin:20px 0 0 0;"><a href="${baseUrl}/what-moved?ref=digest" style="color:#175c55;font-weight:600;font-size:13px;">See everything that moved</a></p>
      <hr style="border:none;border-top:1px solid #eceef4;margin:20px 0 14px 0;">
      ${
        d.privateTestMode && d.email
          ? `<p style="margin:0 0 8px 0;font-size:11px;color:#8190a6;">You are receiving this because ${escapeHtml(d.email)} is the private test user. <strong>Private test mode is on</strong> — no one else can receive this email.</p>`
          : ""
      }
      <p style="margin:0;font-size:11px;color:#8190a6;">
        ${opts?.manageUrl ? `<a href="${opts.manageUrl}" style="color:#8190a6;text-decoration:underline;">Manage watchlist</a> · ` : ""}
        <a href="${baseUrl}/methodology" style="color:#8190a6;text-decoration:underline;">Methodology</a>
        ${opts?.unsubscribeUrl ? ` · <a href="${opts.unsubscribeUrl}" style="color:#8190a6;text-decoration:underline;">Unsubscribe</a>` : ""}
        ${process.env.DIGEST_MAILING_ADDRESS ? `<br>${escapeHtml(process.env.DIGEST_MAILING_ADDRESS)}` : ""}
      </p>
    </div>
  </div>
</body></html>`;
}
