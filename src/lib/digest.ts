import { bills, getSourcesByIds, localDecisions } from "@/data/records";
import { dailyChanges, missingDataRecords, watchTargets } from "@/data/product-loop";
import type { Cause } from "@/data/types";
import { matchCause } from "./cause-matcher";

export type CauseDigestSection = {
  causeId: string;
  causeTitle: string;
  causeEmoji?: string;
  causeOutcome: string;
  matchedBills: Array<{ title: string; href: string; status: string; jurisdiction: string }>;
  matchedLocals: Array<{ title: string; href: string; status: string; jurisdiction: string }>;
  matchedTopics: Array<{ name: string; href: string }>;
};

export type DigestPayload = {
  generatedAt: string;
  forZip?: string;
  intro: string;
  causes: CauseDigestSection[];
  watchedTargets: typeof watchTargets;
  recentChanges: typeof dailyChanges;
  upcomingMilestones: Array<{
    title: string;
    href: string;
    date?: string;
    body: string;
  }>;
  missing: typeof missingDataRecords;
  footer: string;
};

export function buildDigest(opts?: {
  zip?: string;
  watchedIds?: string[];
  causes?: Cause[];
}): DigestPayload {
  const watchedIds = opts?.watchedIds ?? [];
  const watched = watchedIds.length
    ? watchTargets.filter((w) => watchedIds.includes(w.id))
    : watchTargets;

  const milestones = [
    ...bills
      .filter((b) => b.nextActionDate)
      .map((b) => ({
        title: b.title,
        href: `/bills/${b.slug}`,
        date: b.nextActionDate,
        body: b.nextAction,
      })),
    ...localDecisions
      .filter((d) => d.nextMeetingDate)
      .map((d) => ({
        title: d.title,
        href: `/local/${d.slug}`,
        date: d.nextMeetingDate,
        body: d.nextMeetingTitle ?? d.nextProceduralStep,
      })),
  ];

  const causes = (opts?.causes ?? []).map<CauseDigestSection>((cause) => {
    const m = matchCause(cause);
    return {
      causeId: cause.id,
      causeTitle: cause.title,
      causeEmoji: cause.emoji,
      causeOutcome: cause.outcome,
      matchedBills: m.bills.slice(0, 5).map(({ bill }) => ({
        title: bill.title,
        href: `/bills/${bill.slug}`,
        status: bill.status,
        jurisdiction: bill.jurisdiction,
      })),
      matchedLocals: m.locals.slice(0, 5).map(({ decision }) => ({
        title: decision.title,
        href: `/local/${decision.slug}`,
        status: decision.status,
        jurisdiction: decision.jurisdiction,
      })),
      matchedTopics: m.topics.slice(0, 5).map(({ topic }) => ({
        name: topic.name,
        href: `/topics/${topic.slug}`,
      })),
    };
  });

  const intro = causes.length
    ? `Civic-records digest for your ${causes.length} cause${causes.length === 1 ? "" : "s"}${opts?.zip ? `, place ${opts.zip}` : ""}. Source-anchored. We never score alignment.`
    : opts?.zip
      ? `Civic-records digest for ${opts.zip}. Source-anchored. Nothing speculative.`
      : "Civic-records digest. Source-anchored. Nothing speculative.";

  return {
    generatedAt: new Date().toISOString(),
    forZip: opts?.zip,
    intro,
    causes,
    watchedTargets: watched,
    recentChanges: dailyChanges,
    upcomingMilestones: milestones,
    missing: missingDataRecords,
    footer:
      "Every item links to the official record. Reply to manage your subscription or report a data error.",
  };
}

export function renderDigestText(
  d: DigestPayload,
  baseUrl: string,
  opts?: { unsubscribeUrl?: string },
): string {
  const lines: string[] = [];
  lines.push("By The People, For The People");
  lines.push(`Generated ${new Date(d.generatedAt).toUTCString()}`);
  if (d.forZip) lines.push(`For ZIP ${d.forZip}`);
  lines.push("");
  lines.push(d.intro);
  lines.push("");
  if (d.causes.length) {
    lines.push("Causes you are tracking");
    lines.push("-----------------------");
    d.causes.forEach((c) => {
      lines.push(`- ${c.causeEmoji ? c.causeEmoji + " " : ""}${c.causeTitle}`);
      lines.push(`  ${c.causeOutcome}`);
      c.matchedBills.forEach((b) =>
        lines.push(
          `    BILL · ${b.status} · ${b.jurisdiction}: ${b.title} (${baseUrl}${b.href})`,
        ),
      );
      c.matchedLocals.forEach((l) =>
        lines.push(
          `    LOCAL · ${l.status} · ${l.jurisdiction}: ${l.title} (${baseUrl}${l.href})`,
        ),
      );
      c.matchedTopics.forEach((t) =>
        lines.push(`    TOPIC: ${t.name} (${baseUrl}${t.href})`),
      );
      lines.push("");
    });
  }
  lines.push("New since you last checked");
  lines.push("--------------------------");
  d.recentChanges.forEach((c) => {
    lines.push(`- [${c.urgency}] ${c.title}`);
    lines.push(`  ${c.description}`);
    lines.push(`  ${baseUrl}${c.href}`);
    const sources = getSourcesByIds(c.sourceIds);
    sources.forEach((s) => lines.push(`  Source: ${s.title} (${s.url})`));
    lines.push("");
  });
  if (d.upcomingMilestones.length) {
    lines.push("Upcoming milestones");
    lines.push("-------------------");
    d.upcomingMilestones.forEach((m) => {
      lines.push(`- ${m.date ? m.date + ": " : ""}${m.title}`);
      lines.push(`  ${m.body}`);
      lines.push(`  ${baseUrl}${m.href}`);
      lines.push("");
    });
  }
  if (d.watchedTargets.length) {
    lines.push("Your watchlist");
    lines.push("--------------");
    d.watchedTargets.forEach((w) => {
      lines.push(`- ${w.title}`);
      lines.push(`  ${w.alertReason}`);
      lines.push(`  ${baseUrl}${w.href}`);
      lines.push("");
    });
  }
  lines.push("Missing data");
  lines.push("------------");
  d.missing.forEach((m) => {
    lines.push(`- ${m.title} (${m.status})`);
    lines.push(`  ${m.description}`);
    lines.push("");
  });
  lines.push(d.footer);
  lines.push("");
  lines.push("---");
  lines.push("By The People, For The People — nonpartisan, source-anchored.");
  const mailing = process.env.DIGEST_MAILING_ADDRESS;
  if (mailing) lines.push(mailing);
  if (opts?.unsubscribeUrl) {
    lines.push(`Unsubscribe: ${opts.unsubscribeUrl}`);
  }
  return lines.join("\n");
}

export function renderDigestHtml(
  d: DigestPayload,
  baseUrl: string,
  opts?: { unsubscribeUrl?: string },
): string {
  const change = (c: (typeof d.recentChanges)[number]) => {
    const sources = getSourcesByIds(c.sourceIds);
    return `
      <li style="margin:0 0 14px 0;">
        <strong style="color:#07111f;">[${c.urgency}] ${escapeHtml(c.title)}</strong><br>
        <span style="color:#27364f;">${escapeHtml(c.description)}</span><br>
        <a href="${baseUrl}${c.href}" style="color:#175c55;">Open record</a>
        ${sources
          .map(
            (s) =>
              `<br><span style="color:#40516a;font-size:12px;">Source: <a style="color:#175c55;" href="${s.url}">${escapeHtml(s.title)}</a></span>`,
          )
          .join("")}
      </li>`;
  };
  const milestone = (m: (typeof d.upcomingMilestones)[number]) => `
    <li style="margin:0 0 12px 0;">
      <strong>${m.date ? escapeHtml(m.date) + ": " : ""}${escapeHtml(m.title)}</strong><br>
      <span style="color:#27364f;">${escapeHtml(m.body)}</span><br>
      <a href="${baseUrl}${m.href}" style="color:#175c55;">Open record</a>
    </li>`;
  const watched = (w: (typeof d.watchedTargets)[number]) => `
    <li style="margin:0 0 12px 0;">
      <strong>${escapeHtml(w.title)}</strong><br>
      <span style="color:#27364f;">${escapeHtml(w.alertReason)}</span><br>
      <a href="${baseUrl}${w.href}" style="color:#175c55;">Open</a>
    </li>`;
  const missing = (m: (typeof d.missing)[number]) => `
    <li style="margin:0 0 12px 0;">
      <strong>${escapeHtml(m.title)}</strong> <span style="color:#a26f19;">(${escapeHtml(m.status)})</span><br>
      <span style="color:#27364f;">${escapeHtml(m.description)}</span>
    </li>`;

  return `<!doctype html>
<html><body style="margin:0;padding:24px;font-family:Inter,system-ui,sans-serif;background:#fbfaf7;color:#07111f;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #d9dde8;border-radius:12px;padding:24px;">
    <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#175c55;">By The People, For The People</p>
    <h1 style="margin:0 0 8px 0;font-size:20px;color:#07111f;">${escapeHtml(d.intro)}</h1>
    <p style="margin:0 0 18px 0;font-size:12px;color:#40516a;">Generated ${new Date(d.generatedAt).toUTCString()}${d.forZip ? ` for ZIP ${escapeHtml(d.forZip)}` : ""}.</p>

    ${d.causes.length ? `<h2 style="font-size:14px;margin:18px 0 8px 0;border-bottom:1px solid #eceef4;padding-bottom:4px;">Causes you are tracking</h2>${d.causes
      .map(
        (c) => `
      <article style="margin:0 0 18px 0;padding:14px;border:1px solid #d8f1eb;border-radius:8px;background:#f5fbf9;">
        <p style="margin:0 0 4px 0;font-weight:700;color:#07111f;">${c.causeEmoji ? escapeHtml(c.causeEmoji) + " " : ""}${escapeHtml(c.causeTitle)}</p>
        <p style="margin:0 0 8px 0;font-size:13px;color:#27364f;">${escapeHtml(c.causeOutcome)}</p>
        ${c.matchedBills
          .map(
            (b) =>
              `<p style="margin:4px 0;font-size:12px;"><strong>Bill</strong> · ${escapeHtml(b.status)} · ${escapeHtml(b.jurisdiction)}<br><a href="${baseUrl}${b.href}" style="color:#175c55;">${escapeHtml(b.title)}</a></p>`,
          )
          .join("")}
        ${c.matchedLocals
          .map(
            (l) =>
              `<p style="margin:4px 0;font-size:12px;"><strong>Local</strong> · ${escapeHtml(l.status)} · ${escapeHtml(l.jurisdiction)}<br><a href="${baseUrl}${l.href}" style="color:#175c55;">${escapeHtml(l.title)}</a></p>`,
          )
          .join("")}
        ${c.matchedTopics
          .map(
            (t) =>
              `<p style="margin:4px 0;font-size:12px;"><strong>Topic</strong> <a href="${baseUrl}${t.href}" style="color:#175c55;">${escapeHtml(t.name)}</a></p>`,
          )
          .join("")}
      </article>`,
      )
      .join("")}` : ""}

    <h2 style="font-size:14px;margin:18px 0 8px 0;border-bottom:1px solid #eceef4;padding-bottom:4px;">New since you last checked</h2>
    <ul style="margin:0;padding-left:18px;">${d.recentChanges.map(change).join("")}</ul>

    ${d.upcomingMilestones.length ? `<h2 style="font-size:14px;margin:18px 0 8px 0;border-bottom:1px solid #eceef4;padding-bottom:4px;">Upcoming milestones</h2><ul style="margin:0;padding-left:18px;">${d.upcomingMilestones.map(milestone).join("")}</ul>` : ""}

    ${d.watchedTargets.length ? `<h2 style="font-size:14px;margin:18px 0 8px 0;border-bottom:1px solid #eceef4;padding-bottom:4px;">Your watchlist</h2><ul style="margin:0;padding-left:18px;">${d.watchedTargets.map(watched).join("")}</ul>` : ""}

    <h2 style="font-size:14px;margin:18px 0 8px 0;border-bottom:1px solid #eceef4;padding-bottom:4px;">Missing data</h2>
    <ul style="margin:0;padding-left:18px;">${d.missing.map(missing).join("")}</ul>

    <p style="margin:24px 0 0 0;font-size:11px;color:#40516a;">${escapeHtml(d.footer)}</p>
    <hr style="border:none;border-top:1px solid #eceef4;margin:18px 0 12px 0;">
    <p style="margin:0;font-size:11px;color:#8190a6;">By The People, For The People — nonpartisan, source-anchored.${process.env.DIGEST_MAILING_ADDRESS ? `<br>${escapeHtml(process.env.DIGEST_MAILING_ADDRESS)}` : ""}${opts?.unsubscribeUrl ? `<br><a href="${opts.unsubscribeUrl}" style="color:#8190a6;text-decoration:underline;">Unsubscribe</a>` : ""}</p>
  </div>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
