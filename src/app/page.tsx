import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { DailyChangeDigest } from "@/components/DailyChangeDigest";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { HeroCauseMatch } from "@/components/HeroCauseMatch";
import { MissingDataPanel } from "@/components/MissingDataPanel";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { YourCauses } from "@/components/YourCauses";
import { YourReps } from "@/components/YourReps";

export default async function Home() {
  return (
    <PageShell>
      {/* Hero — pick an issue, see your government */}
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-record-200 bg-paper-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-civic-700">
                See your government clearly
              </p>
              <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
                What is your government doing about the things you care about?
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-ink-700">
                Tap an issue. We show you the real bills, votes, and the
                officials behind it — and tell you the moment something moves.
              </p>
            </div>
            <div>
              <HeroCauseMatch />
            </div>
          </div>
          <div className="mt-8">
            <FreshnessBadge />
          </div>
        </div>
      </section>

      {/* Your causes */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Your causes"
          title="What you're tracking."
          description="Private to you by default. Each cause matches real records and pings you when they move."
        />
        <div className="mt-6">
          <YourCauses />
        </div>
      </section>

      {/* Your place + reps */}
      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Your place"
            title="Set your ZIP, meet your reps."
            description="One ZIP personalizes the whole site to your district — your senators, House member, and the records near you."
          />
          <div className="mt-6">
            <YourReps />
          </div>
        </div>
      </section>

      {/* What's moving — single feed */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="What's moving"
          title="Latest in the public record."
          description="Source-attributed changes. Every item links to its primary source — no outrage feed."
        />
        <div className="mt-6">
          <DailyChangeDigest />
        </div>
      </section>

      {/* Trust + missing data */}
      <section className="border-t border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div className="rounded-lg border border-ink-800 bg-ink-950 p-6 text-white">
            <ShieldCheck className="h-6 w-6 text-civic-100" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-semibold tracking-tight">
              Trust is the product.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/78">
              No endorsements. No partisan scoring. No outrage feed. We match
              records to what you care about; we never tell you who is right.
              Missing data is labeled missing. Operators, funding, and
              corrections are public.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/about"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-civic-50"
              >
                Governance
              </Link>
              <Link
                href="/methodology"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-civic-50"
              >
                Methodology
              </Link>
              <Link
                href="/corrections"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-civic-50"
              >
                Corrections log
              </Link>
              <Link
                href="/sources"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-civic-50"
              >
                Sources
              </Link>
            </div>
          </div>
          <MissingDataPanel />
        </div>
      </section>
    </PageShell>
  );
}
