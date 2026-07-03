import { NextResponse, type NextRequest } from "next/server";
import { getCatalogCause } from "@/lib/cause-catalog";
import { renderMovementEmbed } from "@/lib/embed-movement";
import { listMovementEvents } from "@/lib/movement-store";

export const dynamic = "force-dynamic";

/** Embeddable widget: latest movement for a catalog cause. */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ cause: string }> },
) {
  const { cause } = await context.params;
  const catalog = getCatalogCause(cause);
  if (!catalog) return new NextResponse("Not found", { status: 404 });

  const events = await listMovementEvents({ cause: catalog.slug, limit: 3 });
  const body = renderMovementEmbed({
    heading: `What moved on ${catalog.name.toLowerCase()}`,
    events,
    watchPath: `/causes/${catalog.slug}`,
  });
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
