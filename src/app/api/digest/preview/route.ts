import { type NextRequest } from "next/server";
import { buildDigest, renderDigestHtml, renderDigestText } from "@/lib/digest";
import { readPlace } from "@/lib/place";
import { readWatchlist } from "@/lib/watchlist";
import { jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";

const BASE = "https://bythepeopleforthepeople.com";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";
  const place = await readPlace();
  const watchedIds = await readWatchlist();
  const payload = buildDigest({ zip: place?.zip, watchedIds });

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
