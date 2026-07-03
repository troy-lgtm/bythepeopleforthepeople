import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WhatMovedView } from "@/components/WhatMovedView";
import { CAUSE_CATALOG, getCatalogCause } from "@/lib/cause-catalog";
import { listMovementEvents } from "@/lib/movement-store";
import { PLACES, resolvePlaceParam } from "@/lib/place-catalog";

export const revalidate = 300;
export const dynamicParams = true;

const PERIOD_DAYS = 30;

type PageProps = { params: Promise<{ place: string; cause: string }> };

export function generateStaticParams() {
  return PLACES.flatMap((p) =>
    CAUSE_CATALOG.map((c) => ({ place: p.key, cause: c.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { place, cause } = await params;
  const resolved = resolvePlaceParam(place);
  const catalogCause = getCatalogCause(cause);
  if (!resolved || !catalogCause) return { title: "Not found" };
  const placeLabel =
    resolved.kind === "place" ? resolved.place.name : `ZIP ${resolved.zip.zip}`;
  return {
    title: `What moved on ${catalogCause.name.toLowerCase()} in ${placeLabel}`,
    description: `${catalogCause.description} Source receipts on every item.`,
    alternates: {
      canonical: `/what-moved/${place.toLowerCase()}/${catalogCause.slug}`,
    },
  };
}

export default async function WhatMovedPlaceCausePage({ params }: PageProps) {
  const { place, cause } = await params;
  const resolved = resolvePlaceParam(place);
  const catalogCause = getCatalogCause(cause);
  if (!resolved || !catalogCause) notFound();

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
          cause: catalogCause.slug,
          sinceDays: PERIOD_DAYS,
          limit: 30,
        })
      : [];
  const display =
    events.length > 0 || placeKeys.length === 0
      ? events
      : await listMovementEvents({
          places: placeKeys as string[],
          cause: catalogCause.slug,
          limit: 30,
        });

  return (
    <WhatMovedView
      title={`What moved on ${catalogCause.name.toLowerCase()} in ${placeLabel}`}
      description={catalogCause.description}
      events={display}
      periodLabel={
        events.length > 0
          ? `Last ${PERIOD_DAYS} days`
          : placeKeys.length === 0
            ? "No indexed coverage"
            : "Full indexed history (no movement in the last 30 days)"
      }
      watchHref="/digest"
      watchLabel={`Watch ${catalogCause.name.toLowerCase()} and get the digest`}
      filters={[
        {
          label: `All ${placeLabel} movement`,
          href: `/what-moved/${place.toLowerCase()}`,
        },
        ...CAUSE_CATALOG.map((c) => ({
          label: c.name,
          href: `/what-moved/${place.toLowerCase()}/${c.slug}`,
          active: c.slug === catalogCause.slug,
        })),
      ]}
    />
  );
}
