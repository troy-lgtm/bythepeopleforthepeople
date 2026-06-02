import { buildSitemap, sitemapResponse } from "@/lib/sitemap-builder";

export const dynamic = "force-static";
export const revalidate = 3600;

const BASE = "https://bythepeopleforthepeople.com";
const PATHS = [
  "",
  "/causes",
  "/causes/new",
  "/causes/starters",
  "/explore",
  "/search",
  "/activity",
  "/near-me",
  "/watchlist",
  "/sources",
  "/methodology",
  "/about",
  "/corrections",
  "/changelog",
  "/privacy",
  "/terms",
  "/digest",
  "/federal",
  "/developers",
  "/share",
  "/datasets",
  "/compare",
];

export async function GET() {
  const now = new Date().toISOString();
  return sitemapResponse(
    buildSitemap(
      PATHS.map((path) => ({
        loc: `${BASE}${path}`,
        lastmod: now,
        changefreq: "daily",
        priority: path === "" ? 1 : 0.7,
      })),
    ),
  );
}
