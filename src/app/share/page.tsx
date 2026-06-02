import type { Metadata } from "next";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { ShareCopyButtons } from "@/components/ShareCopyButtons";

type SearchParams = Promise<{
  text?: string;
  source?: string;
  sourceUrl?: string;
  date?: string;
  recordHref?: string;
}>;

const BASE = "https://bythepeopleforthepeople.com";

const DEFAULT_TEXT =
  "Government accountability the public can actually use. Source-anchored, nonpartisan, missing data labeled.";

const DEMO_QUOTES = [
  {
    text:
      "On the SB 79 Senate concurrence motion, eight senators voted no: Blakespear, Jones, Niello, Richardson, Seyarto, Stern, Strickland, and Valladares.",
    source: "California LegInfo, SB 79 vote record",
    sourceUrl:
      "https://leginfo.legislature.ca.gov/faces/billVotesClient.xhtml?bill_id=202520260SB79",
    date: "2025-09-12",
    recordHref: "/bills/ca-sb-79#votes",
  },
  {
    text:
      "Council File 22-0617, Downtown Los Angeles Community Plan Update 2040, reached Council action final on June 18, 2025.",
    source: "LA City Clerk Council File Management System",
    sourceUrl:
      "https://cityclerk.lacity.org/lacityclerkconnect/index.cfm?cfnumber=22-0617&fa=vcfi.dsp_CFMS_Report&rptid=99",
    date: "2025-06-18",
    recordHref: "/local/la-downtown-community-plan-update",
  },
  {
    text:
      "SB 79 was approved by the Governor and chaptered by the Secretary of State as Chapter 512, Statutes of 2025 on October 10, 2025.",
    source: "California LegInfo status page",
    sourceUrl:
      "https://leginfo.legislature.ca.gov/faces/billStatusClient.xhtml?bill_id=202520260SB79",
    date: "2025-10-10",
    recordHref: "/bills/ca-sb-79",
  },
];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { text, source, date } = await searchParams;
  const safeText = (text ?? DEFAULT_TEXT).slice(0, 280);
  const ogParams = new URLSearchParams({
    text: safeText,
    source: source ?? "By The People, For The People",
  });
  if (date) ogParams.set("date", date);
  const ogUrl = `/og/share?${ogParams.toString()}`;

  return {
    title: "Share a sourced fact",
    description: safeText,
    alternates: { canonical: "/share" },
    openGraph: {
      title: "Source-verified civic fact",
      description: safeText,
      type: "article",
      url: "/share",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Source-verified civic fact",
      description: safeText,
      images: [ogUrl],
    },
  };
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const text = params.text ?? DEFAULT_TEXT;
  const source = params.source ?? "By The People, For The People";
  const sourceUrl = params.sourceUrl ?? "";
  const date = params.date ?? "";
  const recordHref = params.recordHref ?? "/";

  const ogParams = new URLSearchParams({ text, source });
  if (date) ogParams.set("date", date);
  const ogUrl = `${BASE}/og/share?${ogParams.toString()}`;

  const shareUrlParams = new URLSearchParams({ text, source });
  if (sourceUrl) shareUrlParams.set("sourceUrl", sourceUrl);
  if (date) shareUrlParams.set("date", date);
  if (recordHref && recordHref !== "/")
    shareUrlParams.set("recordHref", recordHref);
  const shareUrl = `${BASE}/share?${shareUrlParams.toString()}`;
  const tweetText = `${text}\n\nSource: ${source}\n${shareUrl}`;

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Share with proof"
            title="Sourced facts, beautifully packaged."
            description="Hand journalists, organizers, and curious citizens a single sourced fact in a shareable card. Every share carries the official-source citation; nothing detached from its primary record."
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <article className="rounded-lg border border-record-200 bg-white p-6 shadow-line">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
                The card
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink-950">
                Preview
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-700">
                The exact 1200x630 card that will render in Twitter, Bluesky,
                LinkedIn, iMessage, Slack, and any modern OpenGraph surface.
              </p>
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-md border border-record-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ogUrl}
              alt="Generated share card preview"
              width={1200}
              height={630}
              className="block h-auto w-full"
            />
          </div>

          <div className="mt-6 grid gap-3 rounded-lg border border-record-200 bg-paper-50 p-4 text-sm leading-6 text-ink-800">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-civic-700">
              The fact
            </p>
            <blockquote className="border-l-2 border-civic-500 pl-3 text-base leading-7 text-ink-900">
              {text}
            </blockquote>
            <p className="text-xs text-ink-600">
              Source: {source}
              {date ? ` · Verified ${date}` : ""}
            </p>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-civic-700 hover:text-civic-600"
              >
                Open official source
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </article>

        <article className="rounded-lg border border-record-200 bg-white p-6 shadow-line">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
              <Copy className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
                Share
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink-950">
                Anywhere you publish
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-700">
                Copy a link, tweet, or the OG image URL. Recipients see the
                card with the source attached.
              </p>
            </div>
          </div>

          <ShareCopyButtons
            shareUrl={shareUrl}
            ogUrl={ogUrl}
            tweetText={tweetText}
            recordHref={recordHref}
          />

          <div className="mt-6 rounded-lg border border-record-200 bg-paper-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className="h-5 w-5 shrink-0 text-civic-700"
                aria-hidden="true"
              />
              <p className="text-sm leading-6 text-ink-700">
                Methodology: every share card requires a named source. We do
                not generate cards for unsourced opinions, anonymous claims,
                or partisan framings. If a card&apos;s claim is wrong, file a
                correction in the public{" "}
                <Link
                  href="/corrections"
                  className="text-civic-700 underline"
                >
                  corrections log
                </Link>
                .
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Try a real one"
            title="Source-verified facts from indexed records."
            description="Each is generated from an indexed record. Click any to load it into the share preview."
          />
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {DEMO_QUOTES.map((quote) => {
              const qp = new URLSearchParams({
                text: quote.text,
                source: quote.source,
                sourceUrl: quote.sourceUrl,
                date: quote.date,
                recordHref: quote.recordHref,
              });
              return (
                <Link
                  key={quote.recordHref + quote.text.slice(0, 20)}
                  href={`/share?${qp.toString()}`}
                  className="group rounded-lg border border-record-200 bg-paper-50 p-4 shadow-line hover:border-civic-500 hover:bg-white"
                >
                  <blockquote className="border-l-2 border-civic-500 pl-3 text-sm leading-6 text-ink-900">
                    {quote.text}
                  </blockquote>
                  <p className="mt-3 text-xs text-ink-600">
                    {quote.source} · {quote.date}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-civic-700">
                    Load into share card →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
