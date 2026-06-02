import { allFederalReps, slugForRep } from "@/lib/federal-reps";
import { buildSitemap, sitemapResponse } from "@/lib/sitemap-builder";

export const dynamic = "force-static";
export const revalidate = 3600;

const BASE = "https://bythepeopleforthepeople.com";

export async function GET() {
  const now = new Date().toISOString();
  const entries = allFederalReps().map((rep) => ({
    loc: `${BASE}/federal/${slugForRep(rep)}`,
    lastmod: now,
    changefreq: "weekly" as const,
    priority: 0.5,
  }));
  return sitemapResponse(buildSitemap(entries));
}
