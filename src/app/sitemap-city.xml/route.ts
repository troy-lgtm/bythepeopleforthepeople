import { allCities } from "@/lib/cities";
import { buildSitemap, sitemapResponse } from "@/lib/sitemap-builder";

export const dynamic = "force-static";
export const revalidate = 3600;

const BASE = "https://bythepeopleforthepeople.com";

export async function GET() {
  const now = new Date().toISOString();
  const entries = allCities().map((city) => ({
    loc: `${BASE}/city/${city.slug}`,
    lastmod: now,
    changefreq: "weekly" as const,
    priority: 0.6,
  }));
  return sitemapResponse(buildSitemap(entries));
}
