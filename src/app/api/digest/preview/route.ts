import { type NextRequest } from "next/server";
import { jsonOk } from "@/lib/api";
import { readCauses } from "@/lib/causes";
import { buildDigest, renderDigestHtml, renderDigestText } from "@/lib/digest";
import {
  buildMovementDigest,
  renderMovementDigestHtml,
  renderMovementDigestText,
} from "@/lib/movement-digest";
import { readPlace } from "@/lib/place";
import { siteBaseUrl } from "@/lib/site-url";
import { readWatchlist } from "@/lib/watchlist";

export const dynamic = "force-dynamic";

/**
 * Browser preview of the digest, personalized from the same cookies the
 * subscribe flow reads. Default style is the movement digest ("Government
 * moves. You get receipts."); `?style=legacy` keeps the original records
 * digest available for comparison. `?format=html|text|json`.
 */
export async function GET(request: NextRequest) {
  const BASE = siteBaseUrl();
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";
  const style = url.searchParams.get("style") ?? "movement";
  const place = await readPlace();
  const causes = await readCauses();

  if (style === "legacy") {
    const watchedIds = await readWatchlist();
    const payload = buildDigest({ zip: place?.zip, watchedIds, causes });
    if (format === "text") {
      return new Response(renderDigestText(payload, BASE), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    if (format === "html") {
      return new Response(renderDigestHtml(payload, BASE), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return jsonOk(payload);
  }

  const digest = await buildMovementDigest({
    zip: place?.zip,
    causes,
    periodDays: Number(url.searchParams.get("days") ?? 7) || 7,
  });

  if (format === "text") {
    return new Response(renderMovementDigestText(digest, BASE), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (format === "html") {
    return new Response(renderMovementDigestHtml(digest, BASE), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  return jsonOk(digest);
}
