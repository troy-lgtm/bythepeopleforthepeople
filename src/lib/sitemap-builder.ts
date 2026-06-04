import "server-only";

type Entry = {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSitemap(entries: Entry[]): string {
  const lines: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ];
  for (const entry of entries) {
    lines.push(`  <url>`);
    lines.push(`    <loc>${escapeXml(entry.loc)}</loc>`);
    if (entry.lastmod)
      lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
    if (entry.changefreq)
      lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    if (entry.priority !== undefined)
      lines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
    lines.push(`  </url>`);
  }
  lines.push(`</urlset>`);
  return lines.join("\n");
}

export function sitemapResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
