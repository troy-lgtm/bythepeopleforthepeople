import { type NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { serializeMovement } from "@/lib/civic-records-api";
import { getMovementEvent } from "@/lib/movement-store";

export const dynamic = "force-dynamic";

/** Full receipt for one movement, evidence stack included. */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const event = await getMovementEvent(decodeURIComponent(id));
  if (!event) {
    return jsonError(404, "receipt_not_found", "No movement with that id.");
  }
  return jsonOk({ receipt: serializeMovement(event) });
}
