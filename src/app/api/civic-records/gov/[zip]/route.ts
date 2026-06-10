import { type NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { clampLimit, serializeMovement } from "@/lib/civic-records-api";
import { slugForRep } from "@/lib/federal-reps";
import { listMovementEvents } from "@/lib/movement-store";
import { zipToPlace } from "@/lib/place-catalog";
import { lookupZip } from "@/lib/place";
import { getRepsForPlace } from "@/lib/reps";
import { siteBaseUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/**
 * Everything the system knows for a ZIP: indexed coverage, federal reps
 * (bundled official data), and recent movement. Missing levels are explicit
 * nulls with a labeled gap, never approximations.
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ zip: string }> },
) {
  const { zip } = await ctx.params;
  if (!/^\d{5}$/.test(zip)) {
    return jsonError(400, "invalid_zip", "Provide a 5-digit ZIP.");
  }
  const BASE = siteBaseUrl();
  const zp = zipToPlace(zip);
  const place = lookupZip(zip);
  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get("limit"));

  let reps: Array<{
    name: string;
    role: string;
    url: string;
  }> | null = null;
  if (place) {
    const { houseRep, senators } = getRepsForPlace(place.state, place.cd);
    reps = [
      ...senators.map((s) => ({
        name: s.name,
        role: `U.S. Senate, ${s.state}`,
        url: `${BASE}/federal/${slugForRep(s)}`,
      })),
      ...(houseRep
        ? [
            {
              name: houseRep.name,
              role: `U.S. House, ${place.state}-${place.cd}`,
              url: `${BASE}/federal/${slugForRep(houseRep)}`,
            },
          ]
        : []),
    ];
  }

  const events =
    zp.placeKeys.length > 0
      ? await listMovementEvents({ places: zp.placeKeys, limit })
      : [];

  return jsonOk({
    zip,
    city: zp.city || null,
    state: zp.state || null,
    county: zp.county || null,
    indexedCoverage: zp.placeKeys,
    coverageGap:
      zp.placeKeys.length === 0
        ? zp.known
          ? "State and local records for this ZIP are outside indexed coverage today."
          : "ZIP not in the indexed coverage table. Federal lookup may still resolve via the live geocoder on the site."
        : null,
    federalReps: reps,
    federalRepsNote: reps
      ? null
      : "missing: ZIP not in the bundled district table; the site's live lookup may still resolve it",
    movements: events.map(serializeMovement),
    movementIds: events.map((e) => e.id),
    lastUpdated: events[0]?.detectedAt ?? null,
    govPageUrl: `${BASE}/gov/${zip}`,
    whatMovedUrl: `${BASE}/gov/${zip}/what-moved`,
  });
}
