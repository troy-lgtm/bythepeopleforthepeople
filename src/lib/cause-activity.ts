import "server-only";
import type { CauseMatches } from "@/lib/cause-matcher";

export type CauseActivityEvent = {
  date: string;
  type: "bill_action" | "local_meeting" | "topic";
  title: string;
  href: string;
  detail: string;
  sinceCauseCreated: boolean;
};

function parseDate(value: string): Date | null {
  if (!value) return null;
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  if (!match) return null;
  const date = new Date(match[0]);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export type CauseActivitySummary = {
  events: CauseActivityEvent[];
  daysTracked: number;
  totalMatched: number;
  movedSinceCauseCreated: number;
};

export function buildCauseActivity(
  matches: CauseMatches,
  causeCreatedAt: string,
): CauseActivitySummary {
  // Guard unparseable createdAt: fall back to "now" (treat as started today)
  // rather than the epoch, which would inflate daysTracked to ~20000.
  const createdDate = parseDate(causeCreatedAt) ?? new Date();
  const createdDay = createdDate.toISOString().slice(0, 10);
  const events: CauseActivityEvent[] = [];

  for (const m of matches.bills) {
    const lastDate = m.bill.timeline.length
      ? parseDate(m.bill.timeline[m.bill.timeline.length - 1].date)
      : parseDate(m.bill.lastAction);
    if (!lastDate) continue;
    events.push({
      date: lastDate.toISOString().slice(0, 10),
      type: "bill_action",
      title: m.bill.title,
      href: `/bills/${m.bill.slug}`,
      detail: m.bill.lastAction,
      sinceCauseCreated: lastDate.getTime() >= createdDate.getTime(),
    });
  }
  for (const m of matches.locals) {
    const lastDate = parseDate(m.decision.meetingDate);
    if (!lastDate) continue;
    events.push({
      date: lastDate.toISOString().slice(0, 10),
      type: "local_meeting",
      title: m.decision.title,
      href: `/local/${m.decision.slug}`,
      detail: `${m.decision.status} · ${m.decision.departmentOrCommittee}`,
      sinceCauseCreated: lastDate.getTime() >= createdDate.getTime(),
    });
  }
  for (const m of matches.topics) {
    // Topics carry no movement date; stamp them with a stable, record-derived
    // date (when tracking began) instead of a non-deterministic render-time
    // new Date(). A topic dated at the creation day counts as "since you
    // started" under the same inclusive boundary used for bills/locals.
    events.push({
      date: createdDay,
      type: "topic",
      title: m.topic.name,
      href: `/topics/${m.topic.slug}`,
      detail: m.topic.summary.slice(0, 120),
      sinceCauseCreated: true,
    });
  }

  events.sort((a, b) => b.date.localeCompare(a.date));

  const now = new Date();
  const daysTracked = Math.max(
    0,
    Math.floor(
      (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  return {
    events: events.slice(0, 20),
    daysTracked,
    totalMatched: matches.bills.length + matches.locals.length + matches.topics.length,
    movedSinceCauseCreated: events.filter((e) => e.sinceCauseCreated).length,
  };
}
