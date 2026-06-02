type CalendarEvent = {
  uid: string;
  title: string;
  description?: string;
  url?: string;
  start: Date;
  durationMinutes?: number;
  location?: string;
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function toIcsDate(date: Date) {
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

function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildIcs(event: CalendarEvent) {
  const end = new Date(
    event.start.getTime() + (event.durationMinutes ?? 60) * 60 * 1000,
  );
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//bythepeopleforthepeople//EN",
    "BEGIN:VEVENT",
    `UID:${escapeText(event.uid)}@bythepeopleforthepeople.com`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(event.start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }
  if (event.url) {
    lines.push(`URL:${escapeText(event.url)}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export function dataUrlForIcs(ics: string) {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
