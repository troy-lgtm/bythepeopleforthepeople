import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WhatMovedView } from "@/components/WhatMovedView";
import { CAUSE_CATALOG } from "@/lib/cause-catalog";
import { listMovementEvents } from "@/lib/movement-store";
import { zipToPlace } from "@/lib/place-catalog";

export const revalidate = 300;
export const dynamicParams = true;

const PERIOD_DAYS = 30;

type PageProps = { params: Promise<{ zip: string }> };

export function generateStaticParams(): Array<{ zip: string }> {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { zip } = await params;
  if (!/^\d{5}$/.test(zip)) return { title: "Not found" };
  const zp = zipToPlace(zip);
  const label = zp.known ? `${zp.city} (${zip})` : `ZIP ${zip}`;
  return {
    title: `What moved near ${label}`,
    description: `Official government movement covering ${label}, with a source receipt on every item.`,
    alternates: { canonical: `/gov/${zip}/what-moved` },
  };
}

/**
 * ZIP-scoped movement: the page a digest's "what moved near you" links to.
 * Shows every government level the ZIP belongs to; unknown ZIPs get an
 * honest coverage-gap state, never a guess.
 */
export default async function GovZipWhatMovedPage({ params }: PageProps) {
  const { zip } = await params;
  if (!/^\d{5}$/.test(zip)) notFound();
  const zp = zipToPlace(zip);

  const events =
    zp.placeKeys.length > 0
      ? await listMovementEvents({
          places: zp.placeKeys,
          sinceDays: PERIOD_DAYS,
          limit: 30,
        })
      : [];
  const display =
    events.length > 0 || zp.placeKeys.length === 0
      ? events
      : await listMovementEvents({ places: zp.placeKeys, limit: 30 });

  const label = zp.known ? zp.city : `ZIP ${zip}`;

  return (
    <WhatMovedView
      eyebrow="What moved near you"
      title={`What moved near ${label}`}
      description={
        zp.placeKeys.length > 0
          ? `Official actions at every level covering ${label}: ${zp.placeKeys.includes("la") ? "Los Angeles City Council and the California Legislature" : "the California Legislature"}. Every card links to its receipt and primary source.`
          : `We index official records for Los Angeles and California today. ${label} is outside that coverage, and we say so instead of guessing.`
      }
      events={display}
      periodLabel={
        events.length > 0
          ? `Last ${PERIOD_DAYS} days`
          : zp.placeKeys.length === 0
            ? "No indexed coverage"
            : "Full indexed history (no movement in the last 30 days)"
      }
      emptyNote={
        zp.placeKeys.length === 0
          ? `Adding a jurisdiction means writing a connector against its official record system. ${zp.known ? `${zp.city}, ${zp.state}` : `ZIP ${zip}`} is on the honest side of that line today. Your federal representatives still resolve on the government page for this ZIP.`
          : undefined
      }
      watchHref="/digest"
      watchLabel="Get the digest for this ZIP"
      filters={[
        { label: `Government page for ${zip}`, href: `/gov/${zip}` },
        ...(zp.placeKeys.length > 0
          ? CAUSE_CATALOG.slice(0, 6).map((c) => ({
              label: c.name,
              href: `/what-moved/${zip}/${c.slug}`,
            }))
          : []),
      ]}
    />
  );
}
