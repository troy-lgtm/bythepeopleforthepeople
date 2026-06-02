import type { Metadata } from "next";
import { ActivityFeed } from "@/components/ActivityFeed";
import { DecisionCard } from "@/components/DecisionCard";
import { NextWatchPanel } from "@/components/NextWatchPanel";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { bills, getSourcesByIds, localDecisions, publicActivity } from "@/data/records";

export const metadata: Metadata = {
  title: "Upcoming & Recent",
  description: "Next watch points and recent public decision activity with factual source trails.",
  alternates: { canonical: "/activity" },
};

export default function ActivityPage() {
  const bill = bills[0];
  const localDecision = localDecisions[0];

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Upcoming & recent"
            title="Next watch points before the activity stream."
            description="Future votes appear only when an official agenda, calendar, daily file, or vote notice is indexed. Recent events remain tied to dated source records."
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.75fr] lg:px-8">
        <div className="grid content-start gap-6">
          <NextWatchPanel />
          <ActivityFeed events={publicActivity} />
        </div>
        <aside className="grid content-start gap-4">
          <DecisionCard
            title={bill.title}
            href={`/bills/${bill.slug}`}
            jurisdiction={bill.jurisdiction}
            type="Bill"
            status={bill.status}
            date={bill.nextAction}
            summary={bill.summary}
            topics={bill.topics}
            sources={getSourcesByIds(["src-sb79-status", "src-sb79-votes"])}
            meta={bill.currentStage}
          />
          <DecisionCard
            title={localDecision.title}
            href={`/local/${localDecision.slug}`}
            jurisdiction={localDecision.jurisdiction}
            type="Ordinance"
            status={localDecision.status}
            date={localDecision.meetingDate}
            summary={localDecision.motionSummary}
            topics={localDecision.topics}
            sources={localDecision.sources.slice(0, 3)}
            meta={localDecision.departmentOrCommittee}
          />
        </aside>
      </section>
    </PageShell>
  );
}
