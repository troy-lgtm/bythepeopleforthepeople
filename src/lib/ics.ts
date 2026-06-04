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

/**
 * RFC 5545 §3.1 content-line folding: lines longer than 75 octets MUST be
 * folded by inserting CRLF followed by a single space. Folds on octet
 * boundaries (UTF-8) without ever splitting a multi-byte code point.
 */
export function foldIcsLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let start = 0;
  // First physical line: up to 75 octets. Continuations get a leading space,
  // so they carry 74 octets of payload to stay within the 75-octet limit.
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Don't split inside a UTF-8 continuation byte (0b10xxxxxx).
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end--;
    }
    const chunk = bytes.subarray(start, end).toString("utf8");
    parts.push(start === 0 ? chunk : ` ${chunk}`);
    start = end;
    limit = 74;
  }
  return parts.join("\r\n");
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
    foldIcsLine(`SUMMARY:${escapeText(event.title)}`),
  ];
  if (event.description) {
    lines.push(foldIcsLine(`DESCRIPTION:${escapeText(event.description)}`));
  }
  if (event.location) {
    lines.push(foldIcsLine(`LOCATION:${escapeText(event.location)}`));
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
