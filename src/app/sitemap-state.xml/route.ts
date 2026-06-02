import { STATE_NAMES } from "@/data/states";
import { buildSitemap, sitemapResponse } from "@/lib/sitemap-builder";

export const dynamic = "force-static";
export const revalidate = 3600;

const BASE = "https://bythepeopleforthepeople.com";

export async function GET() {
  const now = new Date().toISOString();
  const entries = Object.keys(STATE_NAMES).map((abbr) => ({
    loc: `${BASE}/state/${abbr.toLowerCase()}`,
    lastmod: now,
    changefreq: "weekly" as const,
    priority: 0.6,
  }));
  return sitemapResponse(buildSitemap(entries));
}
