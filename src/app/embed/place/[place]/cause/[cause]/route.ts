import { NextResponse, type NextRequest } from "next/server";
import { getCatalogCause } from "@/lib/cause-catalog";
import { renderMovementEmbed } from "@/lib/embed-movement";
import { listMovementEvents } from "@/lib/movement-store";
import { resolvePlaceParam } from "@/lib/place-catalog";

export const dynamic = "force-dynamic";

/** Embeddable widget: latest movement for a cause in a place. */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ place: string; cause: string }> },
) {
  const { place, cause } = await context.params;
  const catalog = getCatalogCause(cause);
  const resolved = resolvePlaceParam(place);
  if (!catalog || !resolved) {
    return new NextResponse("Not found", { status: 404 });
  }

  const placeKeys =
    resolved.kind === "place" ? [resolved.place.key] : resolved.zip.placeKeys;
  const placeLabel =
    resolved.kind === "place"
      ? resolved.place.shortName
      : resolved.zip.known
        ? resolved.zip.city
        : `ZIP ${resolved.zip.zip}`;

  const events =
    placeKeys.length > 0
      ? await listMovementEvents({
          places: placeKeys as string[],
          cause: catalog.slug,
          limit: 3,
        })
      : [];

  const body = renderMovementEmbed({
    heading: `${catalog.name} in ${placeLabel}`,
    events,
    watchPath: `/causes/${catalog.slug}/${place.toLowerCase()}`,
    emptyNote:
      placeKeys.length === 0
        ? `No indexed coverage for ${placeLabel} yet. Coverage gaps are labeled, never guessed.`
        : undefined,
  });
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
