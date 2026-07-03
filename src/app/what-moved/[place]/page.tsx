import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WhatMovedView } from "@/components/WhatMovedView";
import { CAUSE_CATALOG } from "@/lib/cause-catalog";
import { listMovementEvents } from "@/lib/movement-store";
import { PLACES, resolvePlaceParam } from "@/lib/place-catalog";

export const revalidate = 300;
export const dynamicParams = true;

const PERIOD_DAYS = 30;

type PlacePageProps = { params: Promise<{ place: string }> };

export function generateStaticParams() {
  return PLACES.map((p) => ({ place: p.key }));
}

function describePlace(param: string) {
  const resolved = resolvePlaceParam(param);
  if (!resolved) return null;
  if (resolved.kind === "place") {
    return {
      label: resolved.place.name,
      shortLabel: resolved.place.shortName,
      placeKeys: [resolved.place.key] as string[],
      coverageNote: undefined as string | undefined,
    };
  }
  const zip = resolved.zip;
  return {
    label: zip.known ? `${zip.city} (ZIP ${zip.zip})` : `ZIP ${zip.zip}`,
    shortLabel: zip.known ? zip.city : `ZIP ${zip.zip}`,
    placeKeys: zip.placeKeys as string[],
    coverageNote:
      zip.placeKeys.length === 0
        ? zip.known
          ? `${zip.city}, ${zip.state} has no indexed local coverage yet. Adding a jurisdiction means indexing its official record system; we never fabricate coverage.`
          : `ZIP ${zip.zip} is not in the indexed coverage table yet, so there is nothing to show honestly. Coverage gaps are labeled, never guessed.`
        : undefined,
  };
}

export async function generateMetadata({
  params,
}: PlacePageProps): Promise<Metadata> {
  const { place } = await params;
  const desc = describePlace(place);
  if (!desc) return { title: "Place not found" };
  return {
    title: `What moved in ${desc.label}`,
    description: `Official government movement for ${desc.label}, with a source receipt on every item.`,
    alternates: { canonical: `/what-moved/${place.toLowerCase()}` },
  };
}

export default async function WhatMovedPlacePage({ params }: PlacePageProps) {
  const { place } = await params;
  const desc = describePlace(place);
  if (!desc) notFound();

  const events =
    desc.placeKeys.length > 0
      ? await listMovementEvents({
          places: desc.placeKeys,
          sinceDays: PERIOD_DAYS,
          limit: 30,
        })
      : [];
  const display =
    events.length > 0 || desc.placeKeys.length === 0
      ? events
      : await listMovementEvents({ places: desc.placeKeys, limit: 30 });

  return (
    <WhatMovedView
      title={`What moved in ${desc.shortLabel}`}
      description={`Official actions in records covering ${desc.label}. Every card links to its receipt and its primary source.`}
      events={display}
      periodLabel={
        events.length > 0
          ? `Last ${PERIOD_DAYS} days`
          : desc.placeKeys.length === 0
            ? "No indexed coverage"
            : "Full indexed history (no movement in the last 30 days)"
      }
      emptyNote={desc.coverageNote}
      filters={[
        { label: "Everywhere", href: "/what-moved" },
        ...PLACES.map((p) => ({
          label: p.name,
          href: `/what-moved/${p.key}`,
          active: desc.placeKeys[0] === p.key && desc.placeKeys.length === 1,
        })),
        ...CAUSE_CATALOG.slice(0, 5).map((c) => ({
          label: c.name,
          href: `/what-moved/${place.toLowerCase()}/${c.slug}`,
        })),
      ]}
    />
  );
}
