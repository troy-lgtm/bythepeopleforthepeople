import { knownZips } from "@/lib/place";
import { buildSitemap, sitemapResponse } from "@/lib/sitemap-builder";

export const dynamic = "force-static";
export const revalidate = 3600;

const BASE = "https://bythepeopleforthepeople.com";

export async function GET() {
  const now = new Date().toISOString();
  const entries = knownZips().map((zip) => ({
    loc: `${BASE}/gov/${zip}`,
    lastmod: now,
    changefreq: "weekly" as const,
    priority: 0.6,
  }));
  return sitemapResponse(buildSitemap(entries));
}
