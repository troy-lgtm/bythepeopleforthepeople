import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GovCardShare } from "@/components/GovCardShare";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { getSourcesByIds } from "@/data/records";
import { dailyChanges } from "@/data/product-loop";

export const dynamic = "force-static";
export const revalidate = 3600;

const BASE = "https://bythepeopleforthepeople.com";

const sorted = [...dailyChanges].sort((a, b) => b.date.localeCompare(a.date));

function ogUrl(format?: "story"): string {
  const p = new URLSearchParams({
    count: String(sorted.length),
    top: sorted[0]?.title ?? "",
    date: sorted[0]?.date ?? "",
  });
  if (format) p.set("format", format);
  return `${BASE}/og/today?${p.toString()}`;
}

export const metadata: Metadata = {
  title: "What moved in the public record",
  description:
    "The latest indexed changes across government — bills chaptered, votes recorded, council actions. Source-attributed, not speculation.",
  alternates: { canonical: "/today" },
  openGraph: {
    title: "What moved in the public record",
    description: "The latest indexed government changes, every item sourced.",
    images: [{ url: ogUrl(), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "What moved in the public record",
    images: [ogUrl()],
  },
};

export default function TodayPage() {
  const text = `What moved in the public record: ${sorted.length} indexed change${sorted.length === 1 ? "" : "s"} — bills, votes, council actions. Source-attributed, not speculation:`;

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-start lg:px-8">
          <div>
            <SectionHeader
              eyebrow="What's moving"
              title="What moved in the public record."
              description="The latest indexed changes — bills chaptered, votes recorded, council actions. Source-attributed, never breaking-news speculation."
            />
            <div className="mt-6">
              <GovCardShare
                shareUrl={`${BASE}/today`}
                text={text}
                storyUrl={ogUrl("story")}
                surface="today"
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-record-200 shadow-panel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ogUrl()}
              alt="What moved in the public record"
              width={1200}
              height={630}
              className="w-full"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <ol className="grid gap-4">
          {sorted.map((change) => {
            const sources = getSourcesByIds(change.sourceIds);
            return (
              <li key={change.id}>
                <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-civic-100 bg-civic-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-civic-700">
                      {change.urgency}
                    </span>
                    <span className="font-mono text-xs text-ink-600">
                      {change.date}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-ink-950">
                    <Link
                      href={change.href}
                      className="hover:text-civic-700"
                    >
                      {change.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-ink-700">
                    {change.description}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Link
                      href={change.href}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-civic-700 hover:gap-2"
                    >
                      Open record →
                    </Link>
                    {sources.map((s) => (
                      <a
                        key={s.url}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-ink-600 hover:text-civic-700"
                      >
                        {s.title}
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </section>
    </PageShell>
  );
}
