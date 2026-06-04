import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Share2 } from "lucide-react";
import { CopyCommentButton } from "@/components/CopyCommentButton";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { matchCause } from "@/lib/cause-matcher";
import { encodeCauseForPublish } from "@/lib/cause-encoding";
import { readCauseById } from "@/lib/causes";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

const BASE = "https://bythepeopleforthepeople.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cause = await readCauseById(id);
  if (!cause) return { title: "Cause not found" };
  return {
    title: `Share: ${cause.title}`,
    description: cause.outcome,
    robots: { index: false, follow: false },
  };
}

export default async function CauseSharePage({ params }: Props) {
  const { id } = await params;
  const cause = await readCauseById(id);
  if (!cause) notFound();

  const matches = matchCause(cause);
  const totalRecords =
    matches.bills.length + matches.locals.length + matches.exploreItems.length;

  // Build the public "source" link from the ENCODED cause snapshot, not the
  // real cause id. The real-id page (/causes/{id}) is private to the owner's
  // cookie and lists every other cause; the encoded feed exposes only this
  // cause's matched records, keeping the share anonymous as claimed.
  const encoded = encodeCauseForPublish(cause);
  const publicSourceUrl = `${BASE}/feed/causes/${encoded}.xml`;

  const sharePathParams = new URLSearchParams({
    text: `${cause.title} — ${cause.outcome}`,
    source: `${totalRecords} indexed civic records currently match this cause`,
    sourceUrl: publicSourceUrl,
  });
  const shareUrl = `${BASE}/share?${sharePathParams.toString()}`;
  const ogParams = new URLSearchParams({
    text: `${cause.title}: ${cause.outcome}`,
    source: `${totalRecords} indexed civic records currently match this cause`,
  });
  const ogUrl = `${BASE}/og/share?${ogParams.toString()}`;
  const tweetText = `${cause.title}\n\n${cause.outcome}\n\nTracking this on @bythepeoplefor — ${totalRecords} records matched.\n${shareUrl}`;
  const tweetIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  const blueskyIntent = `https://bsky.app/intent/compose?text=${encodeURIComponent(tweetText)}`;

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href={`/causes/${cause.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-civic-700 hover:text-civic-600"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Back to cause
          </Link>
          <SectionHeader
            eyebrow="Share your cause"
            title="Anonymous by default. Source-anchored by default."
            description="The shared card carries the cause title, the outcome in your words, and a count of matched indexed records. Your identity is not attached. Your other causes are not exposed."
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <article className="rounded-lg border border-record-200 bg-white p-6 shadow-line">
          <Share2 className="h-5 w-5 text-civic-700" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-ink-950">
            Preview card
          </h2>
          <div className="mt-5 overflow-hidden rounded-md border border-record-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ogUrl}
              alt="Generated share card"
              width={1200}
              height={630}
              className="block h-auto w-full"
            />
          </div>
        </article>
        <article className="rounded-lg border border-record-200 bg-white p-6 shadow-line">
          <h2 className="text-lg font-semibold text-ink-950">
            Copy + share
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            The link goes to a public /share card with the cause text and the
            indexed-record count. The link does not reveal your other causes
            or any identifying cookie.
          </p>
          <div className="mt-5 grid gap-3">
            <CopyCommentButton text={shareUrl} />
            <a
              href={tweetIntent}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-3 text-sm font-semibold text-ink-900 hover:border-civic-500"
            >
              Tweet
            </a>
            <a
              href={blueskyIntent}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-3 text-sm font-semibold text-ink-900 hover:border-civic-500"
            >
              Bluesky
            </a>
          </div>
        </article>
      </section>
    </PageShell>
  );
}
