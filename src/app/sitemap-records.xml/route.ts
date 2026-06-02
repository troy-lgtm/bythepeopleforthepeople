import { bills, localDecisions } from "@/data/records";
import { entityProfiles, topicProfiles } from "@/data/product-loop";
import { sourceConnectors } from "@/data/product-loop";
import { buildSitemap, sitemapResponse } from "@/lib/sitemap-builder";

export const dynamic = "force-static";
export const revalidate = 3600;

const BASE = "https://bythepeopleforthepeople.com";

export async function GET() {
  const now = new Date().toISOString();
  const entries = [
    ...bills.map((b) => ({
      loc: `${BASE}/bills/${b.slug}`,
      lastmod:
        b.timeline.length > 0
          ? new Date(b.timeline[b.timeline.length - 1].date).toISOString()
          : now,
      changefreq: "weekly" as const,
      priority: 0.8,
    })),
    ...localDecisions.map((d) => ({
      loc: `${BASE}/local/${d.slug}`,
      lastmod: new Date(d.meetingDate).toISOString(),
      changefreq: "weekly" as const,
      priority: 0.8,
    })),
    ...topicProfiles.map((t) => ({
      loc: `${BASE}/topics/${t.slug}`,
      lastmod: now,
      changefreq: "weekly" as const,
      priority: 0.7,
    })),
    ...entityProfiles.map((e) => ({
      loc: `${BASE}/${e.kind === "person" ? "people" : "committees"}/${e.slug}`,
      lastmod: now,
      changefreq: "weekly" as const,
      priority: 0.6,
    })),
    ...sourceConnectors.map((c) => ({
      loc: `${BASE}/sources/${c.id}`,
      lastmod: now,
      changefreq: "weekly" as const,
      priority: 0.6,
    })),
  ];
  return sitemapResponse(buildSitemap(entries));
}
