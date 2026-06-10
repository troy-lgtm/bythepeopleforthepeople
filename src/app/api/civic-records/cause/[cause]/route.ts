import { type NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { CAUSE_CATALOG, getCatalogCause } from "@/lib/cause-catalog";
import { clampLimit, serializeMovement } from "@/lib/civic-records-api";
import { listMovementEvents } from "@/lib/movement-store";

export const dynamic = "force-dynamic";

/** Movement scoped to a catalog cause (homelessness, housing, fires, ...). */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ cause: string }> },
) {
  const { cause } = await ctx.params;
  const catalog = getCatalogCause(cause);
  if (!catalog) {
    return jsonError(
      404,
      "cause_not_found",
      `Unknown cause. Available: ${CAUSE_CATALOG.map((c) => c.slug).join(", ")}.`,
    );
  }
  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get("limit"));
  const events = await listMovementEvents({
    cause: catalog.slug,
    digestWorthyOnly: url.searchParams.get("all") !== "true",
    limit,
  });
  return jsonOk({
    cause: {
      slug: catalog.slug,
      name: catalog.name,
      description: catalog.description,
      jurisdictions: catalog.jurisdictions,
    },
    movements: events.map(serializeMovement),
    count: events.length,
    lastUpdated: events[0]?.detectedAt ?? null,
  });
}
