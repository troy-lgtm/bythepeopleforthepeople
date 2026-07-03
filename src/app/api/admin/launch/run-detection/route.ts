import { NextResponse, type NextRequest } from "next/server";
import { isValidAdminKey } from "@/lib/admin-auth";
import { detectAndStoreMovements, movementCounts } from "@/lib/movement-store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function back(request: NextRequest, key: string, notice: string, tone = "ok") {
  const url = new URL("/admin/launch", request.nextUrl.origin);
  url.searchParams.set("key", key);
  url.searchParams.set("notice", notice);
  url.searchParams.set("tone", tone);
  return NextResponse.redirect(url, 303);
}

/**
 * Launch Center button: run movement detection now (curated + live ingest).
 * Detection only — persists movement events, sends nothing to anyone.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const key = String(form?.get("key") ?? "");
  if (!isValidAdminKey(key)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const run = await detectAndStoreMovements();
  const counts = await movementCounts();
  const liveNote =
    run.liveConfigured === false
      ? "Live ingest skipped (OPENSTATES_API_KEY unset or empty)."
      : `Live: ${run.liveTracked ?? 0} tracked, ${run.liveDiscovered ?? 0} discovered, ${run.liveRefreshed ?? 0} refreshed${run.liveErrors?.length ? `, ${run.liveErrors.length} errors` : ""}.`;

  return back(
    request,
    key,
    `Detection ran: ${run.recordsChecked} records checked, ${run.newEvents} new events. ${liveNote} Totals: ${counts.total} events, ${counts.digestWorthy} digest-worthy.`,
    run.liveErrors?.length ? "bad" : "ok",
  );
}
