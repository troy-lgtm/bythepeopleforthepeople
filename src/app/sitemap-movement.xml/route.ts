import { buildSitemap, sitemapResponse } from "@/lib/sitemap-builder";
import { CAUSE_CATALOG } from "@/lib/cause-catalog";
import { baselineMovementEvents } from "@/lib/movement-baseline";
import { PLACES } from "@/lib/place-catalog";

export const dynamic = "force-static";
export const revalidate = 3600;

const BASE = "https://bythepeopleforthepeople.com";

/**
 * Movement surfaces: what-moved feeds, catalog cause pages (with place and
 * weekly variants), and every baseline receipt. Detected receipts join the
 * sitemap on rebuild; the API and feeds expose them immediately either way.
 */
export async function GET() {
  const now = new Date().toISOString();
  const entries = [
    { loc: `${BASE}/what-moved`, lastmod: now, changefreq: "daily" as const, priority: 0.9 },
    ...PLACES.map((p) => ({
      loc: `${BASE}/what-moved/${p.key}`,
      lastmod: now,
      changefreq: "daily" as const,
      priority: 0.8,
    })),
    ...PLACES.flatMap((p) =>
      CAUSE_CATALOG.map((c) => ({
        loc: `${BASE}/what-moved/${p.key}/${c.slug}`,
        lastmod: now,
        changefreq: "daily" as const,
        priority: 0.7,
      })),
    ),
    ...CAUSE_CATALOG.map((c) => ({
      loc: `${BASE}/causes/${c.slug}`,
      lastmod: now,
      changefreq: "daily" as const,
      priority: 0.8,
    })),
    ...CAUSE_CATALOG.flatMap((c) =>
      PLACES.flatMap((p) => [
        {
          loc: `${BASE}/causes/${c.slug}/${p.key}`,
          lastmod: now,
          changefreq: "daily" as const,
          priority: 0.7,
        },
        {
          loc: `${BASE}/causes/${c.slug}/${p.key}/this-week`,
          lastmod: now,
          changefreq: "daily" as const,
          priority: 0.6,
        },
      ]),
    ),
    ...baselineMovementEvents().map((e) => ({
      loc: `${BASE}/receipts/${encodeURIComponent(e.id)}`,
      lastmod: e.occurredAt,
      changefreq: "weekly" as const,
      priority: 0.6,
    })),
  ];
  return sitemapResponse(buildSitemap(entries));
}
