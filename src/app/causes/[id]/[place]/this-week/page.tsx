import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogCauseView } from "@/components/CatalogCauseView";
import { CAUSE_CATALOG, getCatalogCause } from "@/lib/cause-catalog";
import { listMovementEvents } from "@/lib/movement-store";
import { PLACES, resolvePlaceParam } from "@/lib/place-catalog";

export const revalidate = 300;
export const dynamicParams = true;

type PageProps = { params: Promise<{ id: string; place: string }> };

export function generateStaticParams() {
  return CAUSE_CATALOG.flatMap((c) =>
    PLACES.map((p) => ({ id: c.slug, place: p.key })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, place } = await params;
  const cause = getCatalogCause(id);
  const resolved = resolvePlaceParam(place);
  if (!cause || !resolved) return { title: "Not found" };
  const placeLabel =
    resolved.kind === "place" ? resolved.place.name : `ZIP ${resolved.zip.zip}`;
  return {
    title: `What moved on ${cause.name.toLowerCase()} in ${placeLabel} this week`,
    description: `${cause.description} Weekly view with source receipts.`,
    alternates: {
      canonical: `/causes/${cause.slug}/${place.toLowerCase()}/this-week`,
    },
  };
}

/** Weekly place-scoped cause page, e.g. /causes/housing/90046/this-week. */
export default async function CausePlaceThisWeekPage({ params }: PageProps) {
  const { id, place } = await params;
  const cause = getCatalogCause(id);
  const resolved = resolvePlaceParam(place);
  if (!cause || !resolved) notFound();

  const placeKeys =
    resolved.kind === "place" ? [resolved.place.key] : resolved.zip.placeKeys;
  const events =
    placeKeys.length > 0
      ? await listMovementEvents({
          places: placeKeys as string[],
          cause: cause.slug,
          sinceDays: 7,
          limit: 20,
        })
      : [];

  return (
    <CatalogCauseView
      cause={cause}
      events={events}
      placeKey={place.toLowerCase()}
      thisWeek
    />
  );
}
