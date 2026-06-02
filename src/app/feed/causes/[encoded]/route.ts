import { type NextRequest, NextResponse } from "next/server";
import { matchCause } from "@/lib/cause-matcher";
import { decodeCauseFromPublish } from "@/lib/cause-encoding";

export const dynamic = "force-dynamic";
export const revalidate = 600;

const BASE = "https://bythepeopleforthepeople.com";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ encoded: string }> },
) {
  const { encoded } = await context.params;
  const trimmed = encoded.replace(/\.xml$/, "");
  const cause = decodeCauseFromPublish(trimmed);
  if (!cause) {
    return new NextResponse("Invalid or expired cause token.", {
      status: 404,
    });
  }
  const matches = matchCause(cause);
  const feedSelf = `${BASE}/feed/causes/${trimmed}.xml`;
  const generated = new Date().toISOString();

  const entries: string[] = [];
  for (const m of matches.bills.slice(0, 25)) {
    entries.push(
      `  <entry>\n` +
        `    <id>tag:bythepeopleforthepeople.com,2026:bill/${escapeXml(m.bill.slug)}</id>\n` +
        `    <title>${escapeXml(`${m.bill.title} (${m.bill.status})`)}</title>\n` +
        `    <link href="${escapeXml(`${BASE}/bills/${m.bill.slug}`)}" />\n` +
        `    <updated>${new Date(m.bill.lastAction.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? generated).toISOString()}</updated>\n` +
        `    <category term="bill" />\n` +
        `    <summary>${escapeXml(`Match: ${m.reasons.join(" · ")}. ${m.bill.summary}`)}</summary>\n` +
        `  </entry>\n`,
    );
  }
  for (const m of matches.locals.slice(0, 25)) {
    entries.push(
      `  <entry>\n` +
        `    <id>tag:bythepeopleforthepeople.com,2026:local/${escapeXml(m.decision.slug)}</id>\n` +
        `    <title>${escapeXml(`${m.decision.title} (${m.decision.status})`)}</title>\n` +
        `    <link href="${escapeXml(`${BASE}/local/${m.decision.slug}`)}" />\n` +
        `    <updated>${new Date(m.decision.meetingDate).toISOString()}</updated>\n` +
        `    <category term="local" />\n` +
        `    <summary>${escapeXml(`Match: ${m.reasons.join(" · ")}. ${m.decision.summary}`)}</summary>\n` +
        `  </entry>\n`,
    );
  }
  for (const m of matches.topics.slice(0, 10)) {
    entries.push(
      `  <entry>\n` +
        `    <id>tag:bythepeopleforthepeople.com,2026:topic/${escapeXml(m.topic.slug)}</id>\n` +
        `    <title>${escapeXml(`Topic: ${m.topic.name}`)}</title>\n` +
        `    <link href="${escapeXml(`${BASE}/topics/${m.topic.slug}`)}" />\n` +
        `    <updated>${generated}</updated>\n` +
        `    <category term="topic" />\n` +
        `    <summary>${escapeXml(`Match: ${m.reasons.join(" · ")}. ${m.topic.summary}`)}</summary>\n` +
        `  </entry>\n`,
    );
  }

  const xml =
    `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<feed xmlns="http://www.w3.org/2005/Atom">\n` +
    `  <title>${escapeXml(`Cause feed: ${cause.title}`)}</title>\n` +
    `  <subtitle>${escapeXml(`Matched records for the cause "${cause.title}" indexed at bythepeopleforthepeople.com. Source-anchored. We do not score alignment.`)}</subtitle>\n` +
    `  <link href="${feedSelf}" rel="self" type="application/atom+xml" />\n` +
    `  <link href="${BASE}/" />\n` +
    `  <id>${feedSelf}</id>\n` +
    `  <updated>${generated}</updated>\n` +
    `  <rights>Editorial content licensed Creative Commons Attribution. Cause encoded by the subscriber; data is theirs.</rights>\n` +
    entries.join("") +
    `</feed>\n`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
