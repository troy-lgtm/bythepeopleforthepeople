import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { DecisionCard } from "@/components/DecisionCard";
import { JsonLd } from "@/components/JsonLd";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { SourceTrail } from "@/components/SourceTrail";
import { WatchButton } from "@/components/WatchButton";
import { getSourcesByIds } from "@/data/records";
import {
  getExploreItemsByIds,
  getTopicBySlug,
  topicProfiles,
} from "@/data/product-loop";
import { breadcrumbSchema, topicCollectionSchema } from "@/lib/schema";

type TopicPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return topicProfiles.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);

  if (!topic) {
    return { title: "Topic not found" };
  }

  const statusLabel =
    topic.relatedItemIds.length > 0
      ? `${topic.relatedItemIds.length} indexed`
      : "Coverage being indexed";
  const ogParams = new URLSearchParams({
    title: topic.name,
    status: statusLabel,
    jurisdiction: "Topic page",
    type: "topic",
    sources: String(topic.sourceIds.length),
    subtitle: topic.watchPrompts.slice(0, 3).join(" · "),
  });
  const ogUrl = `/og/record?${ogParams.toString()}`;

  return {
    title: topic.name,
    description: topic.summary,
    alternates: { canonical: `/topics/${topic.slug}` },
    openGraph: {
      title: `${topic.name} | Public records`,
      description: topic.summary,
      type: "article",
      url: `/topics/${topic.slug}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${topic.name} | Public records`,
      description: topic.summary,
      images: [ogUrl],
    },
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);

  if (!topic) {
    notFound();
  }

  const relatedItems = getExploreItemsByIds(topic.relatedItemIds);

  return (
    <PageShell>
      <JsonLd
        data={[
          topicCollectionSchema(topic),
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: "Topics", href: "/explore" },
            { name: topic.name, href: `/topics/${topic.slug}` },
          ]),
        ]}
      />
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-civic-700">
            Topic page
          </p>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
                {topic.name}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-ink-700">
                {topic.summary}
              </p>
            </div>
            <WatchButton
              targetId={topic.watchTargetId}
              label="Watch topic"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
        <div>
          <SectionHeader
            eyebrow="Watch prompts"
            title="Why people would return to this topic"
            description="Topic pages should show new text, votes, hearings, filings, and source records without forcing users to know the bill number first."
          />
          <div className="mt-6 grid gap-2">
            {topic.watchPrompts.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-record-200 bg-white px-4 py-3 text-sm font-semibold text-ink-800"
              >
                {item}
              </div>
            ))}
          </div>
          {topic.sourceIds.length ? (
            <div className="mt-6">
              <SourceTrail sources={getSourcesByIds(topic.sourceIds)} />
            </div>
          ) : null}
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
            <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-notice-50 text-notice-500">
                  <AlertCircle className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-notice-500">
                    Coverage being indexed
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-ink-950">
                    No indexed records on this topic yet.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-700">
                    The watch prompts on the left describe the record types this
                    page will surface once ingestion is enabled. Missing data is
                    labeled, not guessed. Add this topic to your watchlist to be
                    notified when the first indexed record lands.
                  </p>
                </div>
              </div>
            </article>
          )}
        </div>
      </section>
    </PageShell>
  );
}
