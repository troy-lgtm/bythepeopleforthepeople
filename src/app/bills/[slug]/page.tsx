import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarClock,
  FileSearch,
  GitCompareArrows,
  Users,
  Vote,
} from "lucide-react";
import { AmendmentDiff } from "@/components/AmendmentDiff";
import { AskRecord } from "@/components/AskRecord";
import { BillTimeline } from "@/components/BillTimeline";
import { EvidenceStack } from "@/components/EvidenceStack";
import { ImpactCards } from "@/components/ImpactCards";
import { MissingDataPanel } from "@/components/MissingDataPanel";
import { PageShell } from "@/components/PageShell";
import { RecordAccessWorkbench } from "@/components/RecordAccessWorkbench";
import { RecordPageNav } from "@/components/RecordPageNav";
import { RecordQuestionCard } from "@/components/RecordQuestionCard";
import { SectionHeader } from "@/components/SectionHeader";
import { ShareRecordCard } from "@/components/ShareRecordCard";
import { SourceTrail } from "@/components/SourceTrail";
import { JsonLd } from "@/components/JsonLd";
import { PlainLanguageCallout } from "@/components/PlainLanguageCallout";
import { ReportCorrection } from "@/components/ReportCorrection";
import { ShareRecordButtons } from "@/components/ShareRecordButtons";
import { StakeholderList } from "@/components/StakeholderList";
import { StatusBadge } from "@/components/StatusBadge";
import { TakeAction } from "@/components/TakeAction";
import { VoteTable } from "@/components/VoteTable";
import { WatchButton } from "@/components/WatchButton";
import { billLegislationSchema, breadcrumbSchema } from "@/lib/schema";
import { bills, getBillBySlug, getSourcesByIds } from "@/data/records";
import {
  askRecordAnswers,
  incorporatedRecords,
  missingDataRecords,
  shareCards,
  sourceEvidence,
  sourceVerificationRecords,
  upcomingVoteChecks,
} from "@/data/product-loop";

type BillPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return bills.map((bill) => ({ slug: bill.slug }));
}

export async function generateMetadata({ params }: BillPageProps): Promise<Metadata> {
  const { slug } = await params;
  const bill = getBillBySlug(slug);

  if (!bill) {
    return { title: "Bill not found" };
  }

  const ogParams = new URLSearchParams({
    title: bill.title,
    status: bill.status,
    jurisdiction: bill.jurisdiction,
    type: "bill",
    sources: String(bill.sources.length),
  });
  if (bill.nextActionDate) ogParams.set("nextDate", bill.nextActionDate);
  if (bill.sponsor) ogParams.set("subtitle", `Sponsor: ${bill.sponsor}`);
  const ogUrl = `/og/record?${ogParams.toString()}`;

  return {
    title: bill.title,
    description: bill.summary,
    alternates: { canonical: `/bills/${bill.slug}` },
    openGraph: {
      title: bill.title,
      description: bill.summary,
      type: "article",
      url: `/bills/${bill.slug}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: bill.title,
      description: bill.summary,
      images: [ogUrl],
    },
  };
}

export default async function BillDetailPage({ params }: BillPageProps) {
  const { slug } = await params;
  const bill = getBillBySlug(slug);

  if (!bill) {
    notFound();
  }

  const amendmentSources = getSourcesByIds([
    "src-sb79-compare",
    "src-sb79-text",
  ]);
  const voteSources = getSourcesByIds(["src-sb79-votes"]);
  const statusSources = getSourcesByIds(["src-sb79-status", "src-sb79-history"]);
  const recordFilter = (record: { recordId: string }) =>
    record.recordId === "sb79" || record.recordId === "global";

  return (
    <PageShell>
      <JsonLd
        data={[
          billLegislationSchema(bill),
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: "Records", href: "/explore" },
            { name: bill.title, href: `/bills/${bill.slug}` },
          ]),
        ]}
      />
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={bill.status} />
            <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-xs font-medium text-ink-700">
              {bill.jurisdiction}
            </span>
            <WatchButton targetId={bill.watchTargetId} label="Watch record" />
            <ShareRecordButtons
              recordTitle={bill.title}
              recordHref={`/bills/${bill.slug}`}
              presets={buildBillSharePresets(bill)}
            />
            <ReportCorrection
              recordHref={`/bills/${bill.slug}`}
              recordTitle={bill.title}
            />
          </div>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_0.42fr]">
            <div>
              <h1 className="max-w-4xl text-2xl font-semibold leading-tight tracking-tight text-ink-950 sm:text-4xl lg:text-5xl">
                {bill.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-ink-700">
                {bill.summary}
              </p>
              {bill.plainLanguage ? (
                <PlainLanguageCallout text={bill.plainLanguage} />
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/people/senator-scott-wiener"
                  className="rounded-full border border-record-200 bg-paper-50 px-3 py-1.5 text-sm font-semibold text-ink-700 hover:border-civic-500"
                >
                  Author profile
                </Link>
                <Link
                  href="/topics/land-use"
                  className="rounded-full border border-record-200 bg-paper-50 px-3 py-1.5 text-sm font-semibold text-ink-700 hover:border-civic-500"
                >
                  Land use topic
                </Link>
                <Link
                  href="/topics/housing"
                  className="rounded-full border border-record-200 bg-paper-50 px-3 py-1.5 text-sm font-semibold text-ink-700 hover:border-civic-500"
                >
                  Housing topic
                </Link>
              </div>
            </div>
            <div className="rounded-lg border border-record-200 bg-paper-50 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-civic-700">
                At a glance
              </p>
              <dl className="grid gap-4 text-sm">
                <Fact label="Who introduced it" value={bill.sponsor} />
                <Fact label="Who decides next" value={bill.currentStage} />
                <Fact label="What just changed" value={bill.lastAction} />
                <Fact label="What happens next" value={bill.nextAction} />
              </dl>
              <div className="mt-5 border-t border-record-200 pt-4">
                <SourceTrail sources={getSourcesByIds(["src-sb79-status"])} compact />
              </div>
            </div>
          </div>
        </div>
      </section>

      <RecordPageNav
        items={[
          { href: "#brief", label: "Brief" },
          { href: "#proof", label: "Proof" },
          { href: "#amendments", label: "What changed" },
          { href: "#votes", label: "Votes" },
          { href: "#timeline", label: "Timeline" },
          { href: "#missing", label: "Missing data" },
          { href: "#sources", label: "Sources" },
        ]}
      />

      <section id="brief" className="mx-auto max-w-7xl scroll-mt-32 px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Decision brief"
          title="The common questions before the full record."
          description="The detailed bill file stays source-first, but the first pass answers what changed, who decides next, who voted, and which records prove it."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <RecordQuestionCard
            icon={GitCompareArrows}
            question="What changed?"
            answer={bill.whatChanged[0]}
            sources={amendmentSources}
          />
          <RecordQuestionCard
            icon={CalendarClock}
            question="What happens next?"
            answer={bill.nextAction}
            sources={statusSources}
          />
          <RecordQuestionCard
            icon={Vote}
            question="Who voted?"
            answer="The official vote page records Senate concurrence as 21 ayes, 8 noes, and 11 no vote recorded; the Assembly third reading vote is also listed."
            sources={voteSources}
          />
          <RecordQuestionCard
            icon={Users}
            question="Who is involved?"
            answer="The status page lists Senator Scott Wiener as lead author and Assemblymember Wicks as principal coauthor, with Haney and Lee listed as coauthors."
            sources={getSourcesByIds(["src-sb79-status"])}
          />
          <RecordQuestionCard
            icon={FileSearch}
            question="Which records prove it?"
            answer="The source trail includes LegInfo bill text, status, history, votes, and compare versions."
            sources={bill.sources.slice(0, 3)}
          />
          <RecordQuestionCard
            icon={FileSearch}
            question="What is missing?"
            answer="Downstream implementation records and a computed line diff across every bill version are not indexed yet."
            sources={getSourcesByIds(["src-sb79-compare", "src-sb79-status"])}
          />
        </div>
      </section>

      <section id="proof" className="scroll-mt-32 border-y border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <RecordAccessWorkbench
              title="Read SB 79 without leaving the record file."
              description="The page separates upcoming vote status, incorporated chaptered text, and official-source proof so users can understand the record before opening LegInfo."
              voteItems={upcomingVoteChecks.filter(recordFilter)}
              incorporatedItems={incorporatedRecords.filter(recordFilter)}
              sourceItems={sourceVerificationRecords.filter(recordFilter)}
            />
            <section className="rounded-lg border border-record-200 bg-paper-50 p-5">
              <SectionHeader
                eyebrow="Claim proof"
                title="The evidence behind the short answer."
                description="The record summary stays readable, but the proof remains visible on the same page."
              />
              <div className="mt-5">
                <EvidenceStack
                  evidence={sourceEvidence.filter((item) =>
                    [
                      "evidence-sb79-status-chaptered",
                      "evidence-sb79-vote-count",
                      "evidence-sb79-no-votes",
                      "evidence-sb79-text-incorporated",
                    ].includes(item.id),
                  )}
                  compact
                />
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <TakeAction
            record={{
              title: bill.title,
              href: `/bills/${bill.slug}`,
              jurisdiction: bill.jurisdiction,
              status: bill.status,
              nextActionDate: bill.nextActionDate,
              nextActionTitle: bill.nextAction,
              contactUrl: bill.sponsorContactUrl,
              publicCommentUrl: bill.publicCommentUrl,
              cpraEntity: "California Legislative Counsel",
              cpraScope:
                "all communications, fiscal analyses, amendment markups, hearing transcripts, and related staff reports",
            }}
          />
        </div>
      </section>

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <AskRecord answers={askRecordAnswers} />
          <div className="grid content-start gap-4">
            <ShareRecordCard card={shareCards[0]} />
            <ShareRecordCard card={shareCards[1]} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Why it matters procedurally"
          title="Plain-English stakes without persuasion."
          description="These are not endorsements or predictions. They translate what the public record changes in process terms."
        />
        <div className="mt-8">
          <ImpactCards variant="bill" />
        </div>
      </section>

      <section id="missing" className="scroll-mt-32 border-y border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <MissingDataPanel
            records={missingDataRecords.filter((record) =>
              record.relatedHref.includes("/bills/"),
            )}
          />
        </div>
      </section>

      <section id="timeline" className="mx-auto grid max-w-7xl scroll-mt-32 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <SectionHeader
          eyebrow="Timeline"
          title="Public record events"
          description="Each timeline item is tied to at least one source record. Dates describe record events, not forecasts."
        />
        <BillTimeline events={bill.timeline} />
      </section>

      <section id="amendments" className="scroll-mt-32 border-y border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionHeader
            eyebrow="Amendment diff"
            title="What changed?"
            description="Removed and added language is shown as a factual comparison between public text versions."
          />
          <AmendmentDiff amendments={bill.amendments} />
        </div>
      </section>

      <section id="votes" className="mx-auto grid max-w-7xl scroll-mt-32 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <SectionHeader
          eyebrow="Vote tracker"
          title="Motion, counts, and member votes"
          description="Vote records show the motion and the published member-level votes without assigning scores."
        />
        <VoteTable votes={bill.votes} />
      </section>

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionHeader
            eyebrow="Hearing intelligence"
          title="Source intelligence"
          description="Segments summarize official source material and retain a source trail for each claim."
          />
          <div className="grid gap-4">
            {bill.hearings.map((segment) => (
              <article key={segment.id} className="rounded-lg border border-record-200 bg-paper-50 p-5">
                <p className="font-mono text-xs font-medium text-ink-600">{segment.date}</p>
                <h3 className="mt-2 text-base font-semibold text-ink-950">{segment.title}</h3>
                <p className="mt-1 text-sm font-medium text-ink-600">
                  {segment.speaker} - {segment.speakerRole}
                </p>
                <p className="mt-3 text-sm leading-6 text-ink-700">{segment.summary}</p>
                <div className="mt-4">
                  <SourceTrail sources={getSourcesByIds(segment.sourceIds)} compact />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <SectionHeader
          eyebrow="Stakeholders"
          title="Who is named in the record"
          description="Stakeholder positions are taken from official source context. Missing or unclear positions are labeled as informational or not stated."
        />
        <StakeholderList stakeholders={bill.stakeholders} />
      </section>

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <InfoList title="What changed?" items={bill.whatChanged} />
          <InfoList title="What happens next?" items={bill.whatHappensNext} />
        </div>
      </section>

      <section id="sources" className="mx-auto grid max-w-7xl scroll-mt-32 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <SectionHeader
          eyebrow="Source trail"
          title="Primary records behind this bill file"
          description="Source records are the provenance layer for title, status, timeline, amendment, vote, hearing, and stakeholder claims."
        />
        <SourceTrail sources={bill.sources} />
      </section>
    </PageShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">{label}</dt>
      <dd className="mt-1 leading-6 text-ink-900">{value}</dd>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-record-200 bg-paper-50 p-5">
      <h2 className="text-lg font-semibold text-ink-950">{title}</h2>
      <ul className="mt-4 grid gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-ink-700">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-civic-500" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function buildBillSharePresets(bill: ReturnType<typeof getBillBySlug>) {
  if (!bill) return [];
  const statusSource = bill.sources.find((s) => s.type === "bill_status");
  const voteSource = bill.sources.find((s) => s.type === "roll_call_vote");
  const textSource = bill.sources.find((s) => s.type === "bill_text");
  const presets: Array<{
    text: string;
    source: string;
    sourceUrl?: string;
    date?: string;
  }> = [];

  presets.push({
    text: `${bill.title} (${bill.jurisdiction}) — status: ${bill.status}. ${bill.lastAction}`,
    source: statusSource?.title ?? `${bill.jurisdiction} record`,
    sourceUrl: statusSource?.url,
    date: statusSource?.date,
  });

  const senateVote = bill.votes.find((v) =>
    v.chamberOrBody.toLowerCase().includes("senate"),
  );
  if (senateVote && senateVote.yes !== null && senateVote.no !== null) {
    presets.push({
      text: `${bill.title} — ${senateVote.chamberOrBody} ${senateVote.motion}: ${senateVote.yes} ayes, ${senateVote.no} noes${senateVote.absent ? `, ${senateVote.absent} absent / no vote recorded` : ""}.`,
      source: voteSource?.title ?? "Official vote record",
      sourceUrl: voteSource?.url,
      date: senateVote.date,
    });
  }
  if (bill.amendments.length > 0) {
    const amendment = bill.amendments[0];
    presets.push({
      text: `${bill.title} — ${amendment.title}: ${amendment.summary}`,
      source: textSource?.title ?? "Official bill text",
      sourceUrl: textSource?.url,
      date: amendment.date,
    });
  }
  presets.push({
    text: `${bill.title} (${bill.jurisdiction}) — sponsor: ${bill.sponsor}. Next: ${bill.nextAction}`,
    source: statusSource?.title ?? `${bill.jurisdiction} record`,
    sourceUrl: statusSource?.url,
    date: statusSource?.date,
  });

  return presets;
}
