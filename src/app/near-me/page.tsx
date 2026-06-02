import type { Metadata } from "next";
import { DailyChangeDigest } from "@/components/DailyChangeDigest";
import { LocalPulse } from "@/components/LocalPulse";
import { MissingDataPanel } from "@/components/MissingDataPanel";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { WatchlistPanel } from "@/components/WatchlistPanel";

export const metadata: Metadata = {
  title: "Near Me",
  description: "Local and state public decision changes by location and topic.",
  alternates: { canonical: "/near-me" },
};

export default function NearMePage() {
  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Local records"
            title="Start with place, then open the source."
            description="The current place index includes Los Angeles and California records. The location control shows relevant signals and coverage gaps without inventing local results."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <LocalPulse />
      </section>

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <DailyChangeDigest />
          <WatchlistPanel />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <MissingDataPanel />
      </section>
    </PageShell>
  );
}
