export const dynamic = "force-static";
export const revalidate = 3600;

const BASE = "https://bythepeopleforthepeople.com";

const SECTIONS = [
  "sitemap-core.xml",
  "sitemap-records.xml",
  "sitemap-federal.xml",
  "sitemap-state.xml",
  "sitemap-city.xml",
];

export async function GET() {
  const now = new Date().toISOString();
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    SECTIONS.map(
      (path) =>
        `  <sitemap><loc>${BASE}/${path}</loc><lastmod>${now}</lastmod></sitemap>\n`,
    ).join("") +
    `</sitemapindex>\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
