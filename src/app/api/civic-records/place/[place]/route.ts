import { type NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { clampLimit, serializeMovement } from "@/lib/civic-records-api";
import { listMovementEvents } from "@/lib/movement-store";
import { resolvePlaceParam } from "@/lib/place-catalog";

export const dynamic = "force-dynamic";

/** Movement scoped to a place key (la, ca) or a 5-digit ZIP. */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ place: string }> },
) {
  const { place } = await ctx.params;
  const resolved = resolvePlaceParam(place);
  if (!resolved) {
    return jsonError(
      404,
      "place_not_found",
      "Unknown place. Use a place key (la, ca) or a 5-digit ZIP.",
    );
  }
  const placeKeys =
    resolved.kind === "place" ? [resolved.place.key] : resolved.zip.placeKeys;
  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get("limit"));
  const events =
    placeKeys.length > 0
      ? await listMovementEvents({
          places: placeKeys as string[],
          digestWorthyOnly: url.searchParams.get("all") !== "true",
          limit,
        })
      : [];

  return jsonOk({
    place:
      resolved.kind === "place"
        ? { kind: "place", key: resolved.place.key, name: resolved.place.name }
        : {
            kind: "zip",
            zip: resolved.zip.zip,
            city: resolved.zip.city || null,
            state: resolved.zip.state || null,
            indexedCoverage: resolved.zip.placeKeys,
          },
    coverageGap:
      placeKeys.length === 0
        ? "No indexed coverage for this place yet. Coverage is labeled, never guessed."
        : null,
    movements: events.map(serializeMovement),
    count: events.length,
    lastUpdated: events[0]?.detectedAt ?? null,
  });
}
