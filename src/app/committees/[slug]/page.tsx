import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DecisionCard } from "@/components/DecisionCard";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { SourceTrail } from "@/components/SourceTrail";
import { WatchButton } from "@/components/WatchButton";
import { getSourcesByIds } from "@/data/records";
import {
  entityProfiles,
  getEntityBySlug,
  getExploreItemsByIds,
} from "@/data/product-loop";

type CommitteePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return entityProfiles
    .filter((entity) => entity.kind === "committee")
    .map((entity) => ({ slug: entity.slug }));
}

export async function generateMetadata({
  params,
}: CommitteePageProps): Promise<Metadata> {
  const { slug } = await params;
  const entity = getEntityBySlug(slug);

  if (!entity || entity.kind !== "committee") {
    return { title: "Committee not found" };
  }

  const ogParams = new URLSearchParams({
    title: entity.name,
    status: entity.role,
    jurisdiction: entity.jurisdiction,
    type: "committee",
    sources: String(entity.sourceIds.length),
    subtitle: entity.watchedFor.slice(0, 3).join(" · "),
  });
  const ogUrl = `/og/record?${ogParams.toString()}`;

  return {
    title: entity.name,
    description: entity.summary,
    alternates: { canonical: `/committees/${entity.slug}` },
    openGraph: {
      title: entity.name,
      description: entity.summary,
      type: "article",
      url: `/committees/${entity.slug}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: entity.name,
      description: entity.summary,
      images: [ogUrl],
    },
  };
}

export default async function CommitteePage({ params }: CommitteePageProps) {
  const { slug } = await params;
  const entity = getEntityBySlug(slug);

  if (!entity || entity.kind !== "committee") {
    notFound();
  }

  const relatedItems = getExploreItemsByIds(entity.relatedDecisionIds);

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-civic-700">
            Committee profile
          </p>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
                {entity.name}
              </h1>
              <p className="mt-3 text-base font-medium text-ink-600">
                {entity.role}
                <span aria-hidden="true" className="px-1.5">
                  ·
                </span>
                {entity.jurisdiction}
              </p>
              <p className="mt-5 max-w-3xl text-base leading-7 text-ink-700">
                {entity.summary}
              </p>
            </div>
            <WatchButton targetId={entity.watchTargetId} label="Watch committee" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
        <div>
          <SectionHeader
            eyebrow="Watch for"
            title="What makes a committee page useful?"
            description="People come back when agenda posts, votes, transcripts, and next actions appear in one place."
          />
          <div className="mt-6 grid gap-2">
            {entity.watchedFor.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-record-200 bg-white px-4 py-3 text-sm font-semibold text-ink-800"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6">
            <SourceTrail sources={getSourcesByIds(entity.sourceIds)} />
          </div>
        </div>
        <div className="grid gap-4">
          {relatedItems.length ? (
            relatedItems.map((item) => (
              <DecisionCard
                key={item.id}
                title={item.title}
                href={item.href}
                jurisdiction={item.jurisdiction}
                type={item.type}
                status={item.status}
                date={item.date}
                summary={item.summary}
                topics={[item.topic]}
                sources={getSourcesByIds(item.sourceIds)}
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-record-200 bg-paper-50 p-6 text-sm leading-6 text-ink-700">
              No indexed records are linked to this committee yet. Agenda posts,
              committee actions, and staff reports will appear here as they are
              indexed.
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
