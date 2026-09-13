"use client";

import { Analytics } from "@vercel/analytics/next";
import { operatorOptedOut } from "@/lib/operator-opt-out";

/**
 * Vercel Web Analytics: first-party (served from this domain under
 * /_vercel/insights), cookieless, no persistent visitor id, no cross-site
 * tracking. Counts page views including App Router client navigations.
 *
 * beforeSend drops every event from a browser where the operator has
 * pressed "Don't count this browser" in the Launch Center, so the numbers
 * describe the public, not the person running the site.
 */
export function SiteAnalytics() {
  return (
    <Analytics beforeSend={(event) => (operatorOptedOut() ? null : event)} />
  );
}
