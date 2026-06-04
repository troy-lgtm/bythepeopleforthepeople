import { publicActivity, getSourcesByIds } from "@/data/records";
import { dailyChanges } from "@/data/product-loop";

export const dynamic = "force-static";
export const revalidate = 1800;

const BASE = "https://bythepeopleforthepeople.com";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

type FeedEntry = {
  id: string;
  href: string;
  title: string;
  summary: string;
  updated: string;
  category: string;
  sourceLinks: Array<{ href: string; title: string }>;
};

export async function GET() {
  const entries: FeedEntry[] = [];

  for (const change of dailyChanges) {
    const sources = getSourcesByIds(change.sourceIds);
    entries.push({
      id: `change:${change.id}`,
      href: `${BASE}${change.href}`,
      title: change.title,
      summary: change.description,
      updated: new Date(change.date).toISOString(),
      category: change.label,
      sourceLinks: sources.map((s) => ({ href: s.url, title: s.title })),
    });
  }
  for (const event of publicActivity) {
    const sources = getSourcesByIds(event.sourceIds);
    entries.push({
      id: `event:${event.id}`,
      // Prefer the official source URL; otherwise the real on-site activity
      // record. Never a dead homepage anchor.
      href: sources[0]?.url ?? `${BASE}/activity`,
      title: event.title,
      summary: event.description,
      updated: new Date(event.date).toISOString(),
      category: event.type,
      sourceLinks: sources.map((s) => ({ href: s.url, title: s.title })),
    });
  }

  entries.sort(
    (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime(),
  );

  const generated = new Date().toISOString();

  const xml =
    `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<feed xmlns="http://www.w3.org/2005/Atom">\n` +
    `  <title>By The People, For The People — Public-record changes</title>\n` +
    `  <subtitle>Source-anchored civic record activity. Every entry links back to the official record.</subtitle>\n` +
    `  <link href="${BASE}/feed.xml" rel="self" type="application/atom+xml" />\n` +
    `  <link href="${BASE}/" />\n` +
    `  <id>${BASE}/feed.xml</id>\n` +
    `  <updated>${generated}</updated>\n` +
    `  <author><name>By The People, For The People</name><uri>${BASE}</uri></author>\n` +
    `  <rights>Editorial content licensed Creative Commons Attribution. Cite the record URL.</rights>\n` +
    entries
      .map(
        (entry) =>
          `  <entry>\n` +
          `    <id>${escapeXml(entry.id)}</id>\n` +
          `    <title>${escapeXml(entry.title)}</title>\n` +
          `    <link href="${escapeXml(entry.href)}" />\n` +
          `    <updated>${entry.updated}</updated>\n` +
          `    <category term="${escapeXml(entry.category)}" />\n` +
          `    <summary>${escapeXml(entry.summary)}</summary>\n` +
          entry.sourceLinks
            .map(
              (s) =>
                `    <link rel="related" href="${escapeXml(s.href)}" title="${escapeXml(s.title)}" />\n`,
            )
            .join("") +
          `  </entry>\n`,
      )
      .join("") +
    `</feed>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control":
        "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
