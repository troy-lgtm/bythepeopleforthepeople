import { type NextRequest } from "next/server";
import { jsonOk } from "@/lib/api";
import { clampLimit, serializeMovement } from "@/lib/civic-records-api";
import { listMovementEvents } from "@/lib/movement-store";

export const dynamic = "force-dynamic";

/** Latest official movement across every indexed jurisdiction. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get("limit"));
  const sinceDays = Number(url.searchParams.get("sinceDays")) || undefined;
  const events = await listMovementEvents({
    sinceDays,
    digestWorthyOnly: url.searchParams.get("all") !== "true",
    limit,
  });
  return jsonOk({
    movements: events.map(serializeMovement),
    count: events.length,
    lastUpdated: events[0]?.detectedAt ?? null,
    coverage: ["California Legislature", "Los Angeles City Council"],
  });
}
