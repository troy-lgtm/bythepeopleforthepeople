import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { SourceType } from "@/data/types";
import {
  CalendarClock,
  FileSearch,
  ListChecks,
  MessageSquareText,
  Vote,
} from "lucide-react";
import { AskRecord } from "@/components/AskRecord";
import { BillTimeline } from "@/components/BillTimeline";
import { EvidenceStack } from "@/components/EvidenceStack";
import { ImpactCards, type ImpactCardItem } from "@/components/ImpactCards";
import { MissingDataPanel } from "@/components/MissingDataPanel";
import { PageShell } from "@/components/PageShell";
import { RecordAccessWorkbench } from "@/components/RecordAccessWorkbench";
import { RecordPageNav } from "@/components/RecordPageNav";
import { RecordQuestionCard } from "@/components/RecordQuestionCard";
import { SectionHeader } from "@/components/SectionHeader";
import { ShareRecordCard } from "@/components/ShareRecordCard";
import { SourceTrail, sourceTypeLabel } from "@/components/SourceTrail";
import { JsonLd } from "@/components/JsonLd";
import { PlainLanguageCallout } from "@/components/PlainLanguageCallout";
import { ReportCorrection } from "@/components/ReportCorrection";
import { ShareRecordButtons } from "@/components/ShareRecordButtons";
import { StatusBadge } from "@/components/StatusBadge";
import { TakeAction } from "@/components/TakeAction";
import { TrackAsCauseButton } from "@/components/TrackAsCauseButton";
import { VoteTable } from "@/components/VoteTable";
import { WatchButton } from "@/components/WatchButton";
import { breadcrumbSchema, localDecisionSchema } from "@/lib/schema";
import {
  getLocalDecisionBySlug,
  getSourcesByIds,
  localDecisions,
} from "@/data/records";
import {
  incorporatedRecords,
  localAskAnswers,
  missingDataRecords,
  shareCards,
  sourceEvidence,
  sourceVerificationRecords,
  upcomingVoteChecks,
} from "@/data/product-loop";

type LocalPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return localDecisions.map((decision) => ({ slug: decision.slug }));
}

export async function generateMetadata({ params }: LocalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const decision = getLocalDecisionBySlug(slug);

  if (!decision) {
    return { title: "Local decision not found" };
  }

  const ogParams = new URLSearchParams({
    title: decision.title,
    status: decision.status,
    jurisdiction: decision.jurisdiction,
    type: "local",
    sources: String(decision.sources.length),
  });
  if (decision.nextMeetingDate) ogParams.set("nextDate", decision.nextMeetingDate);
  if (decision.departmentOrCommittee)
    ogParams.set("subtitle", decision.departmentOrCommittee);
  const ogUrl = `/og/record?${ogParams.toString()}`;

  return {
    title: decision.title,
    description: decision.summary,
    alternates: { canonical: `/local/${decision.slug}` },
    openGraph: {
      title: decision.title,
      description: decision.summary,
      type: "article",
      url: `/local/${decision.slug}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: decision.title,
      description: decision.summary,
      images: [ogUrl],
    },
  };
}

export default async function LocalDecisionPage({ params }: LocalPageProps) {
  const { slug } = await params;
  const decision = getLocalDecisionBySlug(slug);

  if (!decision) {
    notFound();
  }

  const dedupe = (ids: string[]) => Array.from(new Set(ids));
  const byType = (...types: SourceType[]) =>
    decision.sources
      .filter((source) => types.includes(source.type))
      .map((source) => source.id);

  // Action-history sources from the decision's own records, falling back to the
  // sources its timeline events cite, then to the whole source trail.
  const actionSourceIds = byType("action_history");
  const actionSources = getSourcesByIds(
    actionSourceIds.length
      ? actionSourceIds
      : dedupe(decision.timeline.flatMap((event) => event.sourceIds)).length
        ? dedupe(decision.timeline.flatMap((event) => event.sourceIds))
        : decision.sources.map((source) => source.id),
  );
  // Motion sources: the council-file + staff-report records, or the full trail.
  const motionSourceIds = byType("council_file", "staff_report");
  const motionSources = getSourcesByIds(
    motionSourceIds.length
      ? motionSourceIds
      : decision.sources.map((source) => source.id),
  );
  // Public-comment sources from the decision's own filing records.
  const commentSourceIds = byType("public_comment", "public_filing");
  const commentSources = getSourcesByIds(commentSourceIds);
  // First council-file/source record, used for the "at a glance" trail and gaps.
  const primarySource =
    decision.sources.find((source) => source.type === "council_file") ??
    decision.sources[0];
  const primarySources = getSourcesByIds(
    primarySource ? [primarySource.id] : [],
  );

  // Keep record-loop rows that share a source with this decision plus global rows.
  const decisionSourceIds = new Set(decision.sources.map((source) => source.id));
  const recordFilter = (record: { recordId: string; sourceIds: string[] }) =>
    record.recordId === "global" ||
    record.sourceIds.some((sourceId) => decisionSourceIds.has(sourceId));

  // Claim-proof evidence for this decision: evidence rows whose source belongs
  // to this decision's source trail.
  const decisionEvidence = sourceEvidence.filter((item) =>
    decisionSourceIds.has(item.sourceId),
  );

  // "Which documents prove it?" answer derived from the decision's documents.
  const whichDocumentsAnswer = decision.relatedDocuments.length
    ? `The file links ${decision.relatedDocuments
        .map((source) => sourceTypeLabel(source.type).toLowerCase())
        .filter((label, index, all) => all.indexOf(label) === index)
        .join(", ")} records.`
    : "Related documents for this record are being indexed.";

  // Procedural impact cards tied to this decision's records.
  const committeeActionSourceIds = byType("action_history", "committee_action");
  const impactCards: ImpactCardItem[] = [
    {
      title: "Record effect",
      body: decision.motionSummary,
      sourceIds: motionSourceIds.length ? motionSourceIds : motionSources.map((s) => s.id),
    },
    {
      title: "Procedural effect",
      body: `The file records ${decision.status.toLowerCase()} status rather than an open pending vote. ${decision.nextProceduralStep}`,
      sourceIds: committeeActionSourceIds.length
        ? committeeActionSourceIds
        : actionSources.map((s) => s.id),
    },
    {
      title: "Watch next",
      body: decision.nextProceduralStep,
      sourceIds: motionSourceIds.length ? motionSourceIds : motionSources.map((s) => s.id),
    },
  ];

  // "Who voted?" answer derived from the decision's own vote records.
  const decisionVoteWithCounts = decision.votes.find(
    (vote) => vote.yes !== null || vote.no !== null,
  );
  const whoVotedAnswer = decisionVoteWithCounts
    ? `${decisionVoteWithCounts.chamberOrBody} ${decisionVoteWithCounts.motion}: ${decisionVoteWithCounts.yes ?? 0} yes, ${decisionVoteWithCounts.no ?? 0} no.`
    : decision.votes[0]?.note ??
      "The indexed report records the action but does not expose member-level vote counts in this extract.";

  return (
    <PageShell>
      <JsonLd
        data={[
          localDecisionSchema(decision),
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: "Local records", href: "/near-me" },
            { name: decision.title, href: `/local/${decision.slug}` },
          ]),
        ]}
      />
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={decision.status} />
            <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-xs font-medium text-ink-700">
              {decision.jurisdiction}
            </span>
            <WatchButton targetId={decision.watchTargetId} label="Watch file" />
            <ShareRecordButtons
              recordTitle={decision.title}
              recordHref={`/local/${decision.slug}`}
              presets={buildLocalSharePresets(decision)}
            />
            <ReportCorrection
              recordHref={`/local/${decision.slug}`}
              recordTitle={decision.title}
            />
            <TrackAsCauseButton
              suggestedTitle={`Track ${decision.title.split(":")[0]?.trim() ?? decision.title.slice(0, 60)}`}
              suggestedOutcome={`I want to follow ${decision.title} (${decision.jurisdiction}) and related ordinances as they move.`}
              suggestedTopics={decision.topics}
              suggestedJurisdictions={[decision.jurisdiction]}
              suggestedKeywords={decision.topics.concat([
                decision.departmentOrCommittee,
                decision.slug.replace(/-/g, " "),
              ])}
              emoji="🏛"
            />
          </div>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_0.42fr]">
            <div>
              <h1 className="max-w-4xl text-2xl font-semibold leading-tight tracking-tight text-ink-950 sm:text-4xl lg:text-5xl">
                {decision.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-ink-700">
                {decision.summary}
              </p>
              {decision.plainLanguage ? (
                <PlainLanguageCallout text={decision.plainLanguage} />
              ) : null}
            </div>
            <div className="rounded-lg border border-record-200 bg-paper-50 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-civic-700">
                At a glance
              </p>
              <dl className="grid gap-4 text-sm">
                <Fact label="Who is handling it" value={decision.departmentOrCommittee} />
                <Fact label="When did it move" value={decision.meetingDate} />
                <Fact label="What is being decided" value={decision.motionSummary} />
                <Fact label="What happens next" value={decision.nextProceduralStep} />
              </dl>
              <div className="mt-5 border-t border-record-200 pt-4">
                <SourceTrail sources={primarySources} compact />
              </div>
            </div>
          </div>
        </div>
      </section>

      <RecordPageNav
        items={[
          { href: "#brief", label: "Brief" },
          { href: "#proof", label: "Proof" },
          { href: "#timeline", label: "Timeline" },
          { href: "#votes", label: "Votes" },
          { href: "#comments", label: "Public comment" },
          { href: "#documents", label: "Documents" },
          { href: "#next", label: "Next step" },
        ]}
      />

      <section id="brief" className="mx-auto max-w-7xl scroll-mt-32 px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Decision brief"
          title="The common questions before the council file."
          description="Local decisions can be hard to parse, so the first layer separates the motion, vote, public comment, documents, and next procedural step."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <RecordQuestionCard
            icon={ListChecks}
            question="What is being decided?"
            answer={decision.motionSummary}
            sources={motionSources}
          />
          <RecordQuestionCard
            icon={CalendarClock}
            question="What happens next?"
            answer={decision.nextProceduralStep}
            sources={actionSources}
          />
          <RecordQuestionCard
            icon={Vote}
            question="Who voted?"
            answer={whoVotedAnswer}
            sources={actionSources}
          />
          <RecordQuestionCard
            icon={MessageSquareText}
            question="What did public comments focus on?"
            answer={decision.publicCommentSummary}
            sources={commentSources}
          />
          <RecordQuestionCard
            icon={FileSearch}
            question="Which documents prove it?"
            answer={whichDocumentsAnswer}
            sources={decision.sources.slice(0, 3)}
          />
          <RecordQuestionCard
            icon={FileSearch}
            question="What is missing?"
            answer="Underlying attachments and member-level vote details are not indexed yet; the page labels those gaps instead of guessing."
            sources={primarySources}
          />
        </div>
      </section>

      <section id="proof" className="scroll-mt-32 border-y border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <RecordAccessWorkbench
              title="Read the council file without losing the source trail."
              description="The page shows vote posture, what the file incorporates, and City Clerk proof points so users can stay here for the answer and still verify the official record."
              voteItems={upcomingVoteChecks.filter(recordFilter)}
              incorporatedItems={incorporatedRecords.filter(recordFilter)}
              sourceItems={sourceVerificationRecords.filter(recordFilter)}
            />
            <section className="rounded-lg border border-record-200 bg-paper-50 p-5">
              <SectionHeader
                eyebrow="Claim proof"
                title="What the City Clerk record supports."
                description="The local summary keeps adoption, final action, file scope, and public-comment gaps separate."
              />
              <div className="mt-5">
                <EvidenceStack evidence={decisionEvidence} compact />
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <TakeAction
            record={{
              title: decision.title,
              href: `/local/${decision.slug}`,
              jurisdiction: decision.jurisdiction,
              status: decision.status,
              nextActionDate: decision.nextMeetingDate,
              nextActionTitle: decision.nextMeetingTitle ?? decision.nextProceduralStep,
              contactUrl: decision.contactUrl,
              contactEmail: decision.contactEmail,
              publicCommentUrl: decision.publicCommentUrl,
              cpraEntity: decision.jurisdiction,
              cpraScope:
                "all communications, attachments, staff reports, public comment filings, and related correspondence",
            }}
          />
        </div>
      </section>

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <AskRecord answers={localAskAnswers} title="Ask the council file" />
          <ShareRecordCard card={shareCards[2]} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Why it matters procedurally"
          title="What the record changes in process terms."
          description="The page explains record posture in neutral procedural language and keeps the source trail attached."
        />
        <div className="mt-8">
          <ImpactCards cards={impactCards} />
        </div>
      </section>

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <MissingDataPanel
            records={missingDataRecords.filter((record) =>
              record.relatedHref.includes("/local/"),
            )}
          />
        </div>
      </section>

      <section id="timeline" className="mx-auto grid max-w-7xl scroll-mt-32 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <SectionHeader
          eyebrow="Timeline"
          title="Council file activity"
          description="The timeline links the motion, staff report, public comment packet, and committee meeting record."
        />
        <BillTimeline events={decision.timeline} />
      </section>

      <section id="votes" className="scroll-mt-32 border-y border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionHeader
            eyebrow="Vote table"
            title="Committee vote"
            description="The vote table reflects the published motion and member votes in the committee minutes."
          />
          <VoteTable votes={decision.votes} />
        </div>
      </section>

      <section id="comments" className="mx-auto grid max-w-7xl scroll-mt-32 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <SectionHeader
          eyebrow="Public comment"
          title="Public comment summary"
          description="The summary reports themes present in the public comment packet and avoids persuasion language."
        />
        <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
          <p className="text-base leading-7 text-ink-700">{decision.publicCommentSummary}</p>
          <div className="mt-5">
            <SourceTrail
              sources={commentSources.length ? commentSources : primarySources}
              compact
            />
          </div>
        </article>
      </section>

      <section id="documents" className="scroll-mt-32 border-y border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionHeader
            eyebrow="Related documents"
            title="Agenda, minutes, motion, and staff records"
            description="Each related document is retained as a source record with date, type, jurisdiction, and description."
          />
          <SourceTrail sources={decision.relatedDocuments} />
        </div>
      </section>

      <section id="next" className="mx-auto grid max-w-7xl scroll-mt-32 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <SectionHeader
          eyebrow="Next procedural step"
          title="What happens next?"
          description="The procedural view states what the record shows next without predicting the outcome."
        />
        <article className="rounded-lg border border-record-200 bg-paper-50 p-5">
          <p className="text-base leading-7 text-ink-800">{decision.nextProceduralStep}</p>
          <div className="mt-5">
            <SourceTrail sources={actionSources} compact />
          </div>
        </article>
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

function buildLocalSharePresets(decision: ReturnType<typeof getLocalDecisionBySlug>) {
  if (!decision) return [];
  const actionSource = decision.sources.find(
    (s) => s.type === "action_history",
  );
  const motionSource = decision.sources.find((s) => s.type === "council_file");
  const commentSource = decision.sources.find(
    (s) => s.type === "public_comment",
  );
  const presets: Array<{
    text: string;
    source: string;
    sourceUrl?: string;
    date?: string;
  }> = [];

  presets.push({
    text: `${decision.title} — status: ${decision.status} (${decision.jurisdiction}, ${decision.departmentOrCommittee}). Meeting: ${decision.meetingDate}.`,
    source: actionSource?.title ?? "Official council file",
    sourceUrl: actionSource?.url,
    date: decision.meetingDate,
  });
  presets.push({
    text: `${decision.title} — what is being decided: ${decision.motionSummary}`,
    source: motionSource?.title ?? "Council file report",
    sourceUrl: motionSource?.url,
    date: decision.meetingDate,
  });
  if (decision.publicCommentSummary) {
    presets.push({
      text: `${decision.title} — public comment summary: ${decision.publicCommentSummary}`,
      source: commentSource?.title ?? "Public-comment filings",
      sourceUrl: commentSource?.url,
      date: commentSource?.date,
    });
  }
  presets.push({
    text: `${decision.title} — next procedural step: ${decision.nextProceduralStep}`,
    source: actionSource?.title ?? "Council file action history",
    sourceUrl: actionSource?.url,
    date: actionSource?.date,
  });

  return presets;
}
