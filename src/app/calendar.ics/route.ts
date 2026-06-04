import { bills, localDecisions } from "@/data/records";
import { upcomingActions } from "@/data/product-loop";
import { foldIcsLine } from "@/lib/ics";

export const dynamic = "force-static";
export const revalidate = 1800;

const BASE = "https://bythepeopleforthepeople.com";

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toIcsDate(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

type Event = {
  uid: string;
  start: Date;
  title: string;
  description: string;
  url: string;
  location: string;
};

export async function GET() {
  const events: Event[] = [];

  for (const bill of bills) {
    if (!bill.nextActionDate) continue;
    const start = new Date(bill.nextActionDate);
    if (Number.isNaN(start.getTime())) continue;
    events.push({
      uid: `bill-${bill.slug}-${bill.nextActionDate}`,
      start,
      title: `${bill.title} — ${bill.nextAction}`,
      description: `${bill.summary}\n\nStatus: ${bill.status}\nSource record: ${BASE}/bills/${bill.slug}`,
      url: `${BASE}/bills/${bill.slug}`,
      location: bill.jurisdiction,
    });
  }
  for (const decision of localDecisions) {
    if (!decision.nextMeetingDate) continue;
    const start = new Date(decision.nextMeetingDate);
    if (Number.isNaN(start.getTime())) continue;
    events.push({
      uid: `local-${decision.slug}-${decision.nextMeetingDate}`,
      start,
      title: `${decision.title} — ${decision.nextMeetingTitle ?? decision.nextProceduralStep}`,
      description: `${decision.summary}\n\nStatus: ${decision.status}\nSource record: ${BASE}/local/${decision.slug}`,
      url: `${BASE}/local/${decision.slug}`,
      location: decision.jurisdiction,
    });
  }
  for (const upcoming of upcomingActions) {
    const start = new Date(upcoming.date);
    if (Number.isNaN(start.getTime())) continue;
    events.push({
      uid: `upcoming-${upcoming.id}`,
      start,
      title: upcoming.title,
      description: `${upcoming.body}\nSource record: ${BASE}${upcoming.href}`,
      url: `${BASE}${upcoming.href}`,
      location: "By The People, For The People",
    });
  }

  events.sort((a, b) => a.start.getTime() - b.start.getTime());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//bythepeopleforthepeople//civic-calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Civic-record milestones",
    "X-WR-CALDESC:Upcoming legislative + council file milestones indexed by By The People\\, For The People.",
  ];
  const now = new Date();
  for (const event of events) {
    const end = new Date(event.start.getTime() + 60 * 60 * 1000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeIcs(event.uid)}@bythepeopleforthepeople.com`,
      `DTSTAMP:${toIcsDate(now)}`,
      `DTSTART:${toIcsDate(event.start)}`,
      `DTEND:${toIcsDate(end)}`,
      foldIcsLine(`SUMMARY:${escapeIcs(event.title)}`),
      foldIcsLine(`DESCRIPTION:${escapeIcs(event.description)}`),
      `URL:${escapeIcs(event.url)}`,
      foldIcsLine(`LOCATION:${escapeIcs(event.location)}`),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control":
        "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
