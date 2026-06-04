import { bills, localDecisions } from "@/data/records";
import { entityProfiles, topicProfiles } from "@/data/product-loop";
import { sourceConnectors } from "@/data/product-loop";
import { buildSitemap, sitemapResponse } from "@/lib/sitemap-builder";

export const dynamic = "force-static";
export const revalidate = 3600;

const BASE = "https://bythepeopleforthepeople.com";

/** ISO string for a date, falling back to `now` when the input is unparseable. */
function safeIso(input: string | undefined, fallback: string): string {
  if (!input) return fallback;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
}

export async function GET() {
  const now = new Date().toISOString();
  const entries = [
    ...bills.map((b) => ({
      loc: `${BASE}/bills/${b.slug}`,
      lastmod:
        b.timeline.length > 0
          ? safeIso(b.timeline[b.timeline.length - 1].date, now)
          : now,
      changefreq: "weekly" as const,
      priority: 0.8,
    })),
    ...localDecisions.map((d) => ({
      loc: `${BASE}/local/${d.slug}`,
      lastmod: safeIso(d.meetingDate, now),
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
