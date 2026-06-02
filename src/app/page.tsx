import Link from "next/link";
import { ArrowRight, Flame, Shield, ShieldCheck, Sparkles, Tent } from "lucide-react";
import type { ComponentType } from "react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AnswerEngine } from "@/components/AnswerEngine";
import { DailyChangeDigest } from "@/components/DailyChangeDigest";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { MissingDataPanel } from "@/components/MissingDataPanel";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { YourCauses } from "@/components/YourCauses";
import { YourReps } from "@/components/YourReps";
import { publicActivity } from "@/data/records";

export default async function Home() {
  return (
    <PageShell>
      {/* SECTION 1: Hero — causes as the angle */}
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-record-200 bg-paper-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-civic-700">
              Track what matters to you, with proof
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl lg:text-6xl">
              The causes you care about. The records that prove what is
              happening.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink-700">
              Add a cause in your own words: safer streets, the wildfires
              stopping, your rent not rising. The product matches indexed
              public records, votes, and reps. Nonpartisan. Source-anchored.
              We do not score alignment; you judge.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/causes/new"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-ink-950 px-5 text-sm font-semibold text-white transition hover:bg-ink-800"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Add a cause
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex h-12 items-center justify-center rounded-md border border-record-200 bg-white px-5 text-sm font-semibold text-ink-950 shadow-line transition hover:border-civic-500"
              >
                Ask the record instead
              </Link>
            </div>
            <div className="mt-6">
              <FreshnessBadge />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Your causes — the main personal surface */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Causes important to you"
          title="The thing that matters most."
          description="Cookie-private by default. Anonymous to share. Source-anchored throughout."
        />
        <div className="mt-6">
          <YourCauses />
        </div>
      </section>

      {/* SECTION 3: Your place + reps */}
      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Personalize the place"
            title="Set your ZIP, get your reps."
            description="Your causes auto-default to your state and city jurisdictions. Set your ZIP once and the rest of the site personalizes."
          />
          <div className="mt-6">
            <YourReps />
          </div>
        </div>
      </section>

      {/* SECTION 4: Top issues + today's record changes */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Browse by issue"
          title="Three issues people ask about first."
          description="The editorial taxonomy: fires, homelessness, crime. Causes are personal goals; topics are the editorial structure."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <TopIssueCard
            icon={Flame}
            topic="Fires"
            href="/topics/fires"
            body="Fire department reports, wildfire incidents, evacuation orders, fire-code ordinances, and prevention budget actions."
          />
          <TopIssueCard
            icon={Tent}
            topic="Homelessness"
            href="/topics/homelessness"
            body="LAHSA reports, county HHAP actions, council motions on encampments and shelter, ordinance updates, and audit findings."
          />
          <TopIssueCard
            icon={Shield}
            topic="Crime"
            href="/topics/crime"
            body="Police Commission actions, District Attorney charging policies, public-safety motions, court filings on policing, and crime data."
          />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeader
              eyebrow="Today's record changes"
              title="What moved in the public record."
              description="Source-attributed daily changes. No outrage feed; every item links to its primary source."
            />
            <div className="mt-6">
              <DailyChangeDigest />
            </div>
          </div>
          <div>
            <SectionHeader
              eyebrow="Recent activity"
              title="Dated public-record events."
              description="Floor votes, council actions, agenda posts. Avoids live-update claims unless a source change is indexed."
            />
            <div className="mt-6">
              <ActivityFeed events={publicActivity.slice(0, 4)} dense />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Methodology + trust */}
      <section className="border-t border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:px-8">
          <div className="rounded-lg border border-ink-800 bg-ink-950 p-6 text-white">
            <ShieldCheck className="h-6 w-6 text-civic-100" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-semibold tracking-tight">
              Trust is the product.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/78">
              No endorsements. No partisan scoring. No outrage feed. Causes
              are user-defined goals; the product never scores alignment.
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
          <div className="grid gap-6">
            <div className="rounded-lg border border-record-200 bg-paper-50 p-5">
              <AnswerEngine />
            </div>
            <MissingDataPanel />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function TopIssueCard({
  icon: Icon,
  topic,
  body,
  href,
}: {
  icon: ComponentType<{ className?: string }>;
  topic: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-lg border border-record-200 bg-paper-50 p-5 shadow-line transition hover:border-civic-500 hover:bg-white hover:shadow-panel"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="text-xl font-semibold tracking-tight text-ink-950">
          {topic}
        </h3>
      </div>
      <p className="mt-4 text-sm leading-6 text-ink-700">{body}</p>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="rounded-full border border-notice-100 bg-notice-50 px-2.5 py-1 text-xs font-semibold text-notice-500">
          Coverage being indexed
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-civic-700 transition group-hover:gap-2">
          Open topic
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
