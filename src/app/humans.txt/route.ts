export const dynamic = "force-static";
export const revalidate = 86400;

const BODY = `/* TEAM */
  Project: By The People, For The People
  Site: https://bythepeopleforthepeople.com
  Editorial: see /about
  Engineering: open-source contributions tracked publicly. Named contributors credited per release.

/* METHODOLOGY */
  Public records first. No partisan scoring. No endorsements.
  Missing data is labeled missing.
  Every factual claim links to its primary source.
  Read more: https://bythepeopleforthepeople.com/methodology

/* THANKS */
  united-states/congress-legislators — public dataset of current Congress members
  California LegInfo — open access to state legislative records
  Los Angeles City Clerk Council File Management System — open access to council records
  zippopotam.us — open postal-code geocoding
  US Census Bureau Geographies API — congressional-district lookup
  Vercel — hosting and edge runtime
  Next.js / React / TypeScript / Tailwind — the stack
  Geist Sans + Geist Mono — typography
  Lucide — icon set

/* SITE */
  Last update: 2026-05-21
  Standards: HTML5, CSS3, ECMAScript 2017+
  Components: Next.js 15 App Router, React 19, Tailwind 3
  AI grounding: /llms.txt, /.well-known/civic-records.json
  Datasets: /datasets
  Security: /.well-known/security.txt
  Privacy: /privacy
  Terms: /terms
`;

export async function GET() {
  return new Response(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
