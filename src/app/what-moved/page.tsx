import type { Metadata } from "next";
import { WhatMovedView } from "@/components/WhatMovedView";
import { PLACES } from "@/lib/place-catalog";
import { listMovementEvents } from "@/lib/movement-store";

export const revalidate = 300;

const PERIOD_DAYS = 30;

export const metadata: Metadata = {
  title: "What moved in government",
  description:
    "Official government movement, source-attached: bills signed, votes recorded, hearings set, files closed. No punditry, just the record.",
  alternates: { canonical: "/what-moved" },
};

export default async function WhatMovedPage() {
  const events = await listMovementEvents({
    sinceDays: PERIOD_DAYS,
    limit: 30,
  });
  // A quiet month still deserves a real page: fall back to the full indexed
  // history, clearly labeled by the period chip below.
  const display =
    events.length > 0 ? events : await listMovementEvents({ limit: 30 });

  return (
    <WhatMovedView
      title="What moved in government"
      description="Every card is an official action from an indexed record: introduced, amended, voted, signed. Each one links to its receipt and its primary source."
      events={display}
      periodLabel={
        events.length > 0
          ? `Last ${PERIOD_DAYS} days`
          : "Full indexed history (no movement in the last 30 days)"
      }
      filters={[
        { label: "Everywhere", href: "/what-moved", active: true },
        ...PLACES.map((p) => ({
          label: p.name,
          href: `/what-moved/${p.key}`,
        })),
      ]}
    />
  );
}
