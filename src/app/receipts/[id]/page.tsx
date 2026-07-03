import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Bell,
  ExternalLink,
  FileCheck2,
  Landmark,
  ScrollText,
} from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { PageShell } from "@/components/PageShell";
import { ShareCopyButtons } from "@/components/ShareCopyButtons";
import { getCatalogCause } from "@/lib/cause-catalog";
import { movementTypeLabel } from "@/lib/movement-digest";
import { baselineMovementEvents } from "@/lib/movement-baseline";
import {
  getMovementEvent,
  listMovementsForRecord,
} from "@/lib/movement-store";
import { siteBaseUrl } from "@/lib/site-url";

export const revalidate = 600;
export const dynamicParams = true;

type ReceiptPageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return baselineMovementEvents().map((e) => ({ id: e.id }));
}

export async function generateMetadata({
  params,
}: ReceiptPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getMovementEvent(decodeURIComponent(id));
  if (!event) return { title: "Receipt not found" };
  const og = `/og/receipt?id=${encodeURIComponent(event.id)}`;
  const title = `Civic receipt: ${event.title}`;
  const description = event.plainEnglishSummary.slice(0, 200);
  return {
    title,
    description,
    alternates: { canonical: `/receipts/${event.id}` },
    openGraph: {
      title,
      description,
      type: "article",
      images: [{ url: og, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [og],
    },
  };
}

/**
 * A Civic Receipt: one official movement, fully sourced. Every section here
 * is assembled from the indexed record — what changed, why it matters, the
 * evidence stack, the timeline, and what a person can do next.
 */
export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;
  const event = await getMovementEvent(decodeURIComponent(id));
  if (!event) notFound();

  const BASE = siteBaseUrl();
  const shareUrl = `${BASE}/receipts/${encodeURIComponent(event.id)}?ref=share`;
  const ogUrl = `${BASE}/og/receipt?id=${encodeURIComponent(event.id)}`;
  const history = (await listMovementsForRecord(event.recordId)).slice(0, 12);
  const causes = event.causeSlugs
    .map((slug) => getCatalogCause(slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <PageShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: event.title,
          datePublished: event.occurredAt,
          dateModified: event.detectedAt,
          about: event.recordTitle,
          isBasedOn: event.sourceUrl,
          publisher: {
            "@type": "Organization",
            name: "By The People, For The People",
          },
        }}
      />

      {/* Header: government moved */}
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="inline-flex rounded-full border border-civic-100 bg-civic-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-civic-700">
            Government moved
          </p>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            {event.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 uppercase tracking-[0.1em] text-ink-700">
              {movementTypeLabel(event.movementType)}
            </span>
            <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-ink-700">
              {event.occurredAt}
            </span>
            <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-ink-700">
              {event.jurisdiction}
            </span>
            {causes.map((c) => (
              <Link
                key={c.slug}
                href={`/causes/${c.slug}`}
                className="rounded-full border border-civic-100 bg-civic-50 px-2.5 py-1 text-civic-700 hover:border-civic-500"
              >
                {c.name}
              </Link>
            ))}
            {event.confidence !== "confirmed" ? (
              <span className="rounded-full border border-notice-100 bg-notice-50 px-2.5 py-1 text-notice-500">
                Confidence: uncertain
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* What changed */}
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-600">
          What changed
        </h2>
        <p className="mt-2 text-base leading-7 text-ink-950">
          {event.plainEnglishSummary}
        </p>

        {/* Why it matters */}
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-ink-600">
          Why it matters
        </h2>
        <p className="mt-2 text-base leading-7 text-ink-700">
          {event.whyItMatters}
        </p>

        {/* Official source */}
        <div className="mt-8 rounded-lg border border-civic-100 bg-civic-50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-civic-700">
            <Landmark className="h-4 w-4" aria-hidden="true" />
            Official source
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            This receipt is built from the official record, not commentary.
          </p>
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-ink-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-800"
          >
            {event.sourceLabel}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        {/* Evidence stack */}
        <h2 className="mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-ink-600">
          Evidence
        </h2>
        {event.evidence.length === 0 ? (
          <p className="mt-2 rounded-md border border-notice-100 bg-notice-50 px-3 py-2 text-sm text-notice-500">
            No evidence rows are attached to this movement. Treat it as
            unverified until the source link confirms it.
          </p>
        ) : (
          <div className="mt-3 grid gap-3">
            {event.evidence.map((ev, i) => (
              <article
                key={`${event.id}-ev-${i}`}
                className="rounded-lg border border-record-200 bg-white p-4 shadow-line"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-civic-50 text-civic-700">
                    <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-6 text-ink-950">
                      {ev.claim}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-ink-600">
                      {ev.locator}
                    </p>
                  </div>
                </div>
                <blockquote className="mt-3 border-l-2 border-civic-500 pl-3 text-sm leading-6 text-ink-700">
                  {ev.excerpt}
                </blockquote>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-600">
                  <span className="rounded-full border border-civic-100 bg-civic-50 px-2 py-0.5 font-semibold text-civic-700">
                    {ev.provenance}
                  </span>
                  <span>{ev.verificationNote}</span>
                  <a
                    href={ev.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-civic-700 hover:underline"
                  >
                    Open source
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Timeline */}
        <h2 className="mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-ink-600">
          Timeline for this record
        </h2>
        <ol className="mt-3 grid gap-0 border-l-2 border-record-200">
          {history.map((h) => (
            <li key={h.id} className="relative pb-5 pl-5">
              <span
                className={
                  h.id === event.id
                    ? "absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-civic-500"
                    : "absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-record-200"
                }
                aria-hidden="true"
              />
              <p className="text-xs font-semibold text-ink-600">
                {h.occurredAt} · {movementTypeLabel(h.movementType)}
              </p>
              {h.id === event.id ? (
                <p className="text-sm font-semibold text-ink-950">{h.title}</p>
              ) : (
                <Link
                  href={`/receipts/${encodeURIComponent(h.id)}?ref=receipt`}
                  className="text-sm font-semibold text-ink-950 hover:text-civic-700"
                >
                  {h.title}
                </Link>
              )}
            </li>
          ))}
        </ol>

        {/* Responsible body */}
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-ink-600">
          Responsible body
        </h2>
        <p className="mt-2 text-base leading-7 text-ink-950">
          {event.responsibleBody}
        </p>

        {/* What you can do */}
        <div className="mt-10 rounded-lg border border-record-200 bg-paper-50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-600">
            What you can do
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link
              href={event.recordHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
            >
              <ScrollText className="h-4 w-4" aria-hidden="true" />
              Open the full record
            </Link>
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-950 hover:border-civic-500"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Read the official source
            </a>
            {causes[0] ? (
              <Link
                href={`/causes/${causes[0].slug}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-950 hover:border-civic-500"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                Watch {causes[0].name.toLowerCase()}
              </Link>
            ) : (
              <Link
                href="/digest"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-950 hover:border-civic-500"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                Get movement alerts
              </Link>
            )}
            <Link
              href={`/what-moved?ref=receipt`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-950 hover:border-civic-500"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              See everything that moved
            </Link>
          </div>
        </div>

        {/* Share */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-600">
            Share this receipt
          </h2>
          <div className="mt-3">
            <ShareCopyButtons
              shareUrl={shareUrl}
              ogUrl={ogUrl}
              tweetText={`${event.title} (${event.occurredAt}). Source: ${event.sourceLabel}.`}
              recordHref={event.recordHref}
            />
          </div>
        </div>

        <p className="mt-8 text-xs leading-5 text-ink-600">
          Nonpartisan, source-anchored. Every claim on this page links to the
          official record; missing data is labeled missing.{" "}
          <Link href="/methodology" className="font-semibold text-civic-700">
            How we work
          </Link>
        </p>
      </section>
    </PageShell>
  );
}
