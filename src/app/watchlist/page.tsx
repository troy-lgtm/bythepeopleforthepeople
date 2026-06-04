import type { Metadata } from "next";
import Link from "next/link";
import { DailyChangeDigest } from "@/components/DailyChangeDigest";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { WatchlistPanel } from "@/components/WatchlistPanel";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Follow decisions, topics, people, committees, and jurisdictions.",
  alternates: { canonical: "/watchlist" },
};

export default function WatchlistPage() {
  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            as="h1"
            eyebrow="Watchlist"
            title="The return loop: follow the public records that matter to you."
            description="A civic product becomes useful every day when it tells you what changed since the last visit and what to watch next."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="inline-flex h-11 items-center justify-center rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
            >
              Find records to watch
            </Link>
            <Link
              href="/topics/land-use"
              className="inline-flex h-11 items-center justify-center rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-950 hover:border-civic-500"
            >
              Open topic page
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <WatchlistPanel />
        <DailyChangeDigest />
      </section>
    </PageShell>
  );
}
