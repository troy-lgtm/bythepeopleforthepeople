import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { GovCardShare } from "@/components/GovCardShare";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { readCauses } from "@/lib/causes";
import { readPlace } from "@/lib/place";
import { buildWrapped } from "@/lib/wrapped";

export const dynamic = "force-dynamic";

const BASE = "https://bythepeopleforthepeople.com";

type WrappedView = {
  causesCount: number;
  totalMatched: number;
  movedRecently: number;
  topTopics: string[];
  placeLabel: string;
};

type WrappedPageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

function fromParams(sp: Record<string, string | undefined>): WrappedView | null {
  if (!sp.c) return null;
  return {
    causesCount: Number(sp.c) || 0,
    totalMatched: Number(sp.m) || 0,
    movedRecently: Number(sp.mv) || 0,
    topTopics: (sp.t ?? "").split("|").filter(Boolean),
    placeLabel: sp.p ?? "",
  };
}

function ogUrl(v: WrappedView, format?: "story"): string {
  const p = new URLSearchParams({
    causes: String(v.causesCount),
    matched: String(v.totalMatched),
    moved: String(v.movedRecently),
    topics: v.topTopics.join("|"),
    place: v.placeLabel,
  });
  if (format) p.set("format", format);
  return `${BASE}/og/wrapped?${p.toString()}`;
}

function shareUrl(v: WrappedView): string {
  const p = new URLSearchParams({
    c: String(v.causesCount),
    m: String(v.totalMatched),
    mv: String(v.movedRecently),
    t: v.topTopics.join("|"),
    p: v.placeLabel,
  });
  return `${BASE}/wrapped?${p.toString()}`;
}

export async function generateMetadata({
  searchParams,
}: WrappedPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const shared = fromParams(sp);
  if (shared) {
    const title = `A civic wrapped — ${shared.causesCount} cause${shared.causesCount === 1 ? "" : "s"} tracked`;
    const og = ogUrl(shared);
    return {
      title,
      description:
        "Someone's civic recap — the issues they track and what moved. Make your own. Nonpartisan, source-anchored.",
      alternates: { canonical: "/wrapped" },
      openGraph: {
        title,
        description: "Make your own civic wrapped.",
        images: [{ url: og, width: 1200, height: 630 }],
      },
      twitter: { card: "summary_large_image", title, images: [og] },
    };
  }
  return {
    title: "Your civic wrapped",
    description:
      "A shareable recap of the causes you track and what moved. Nonpartisan, source-anchored.",
    alternates: { canonical: "/wrapped" },
    robots: { index: false, follow: true },
  };
}

export default async function WrappedPage({ searchParams }: WrappedPageProps) {
  const sp = await searchParams;
  const shared = fromParams(sp);

  let view: WrappedView | null = shared;
  let isSelf = false;

  if (!view) {
    const causes = await readCauses();
    if (causes.length === 0) {
      return (
        <PageShell>
          <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <Sparkles
              className="mx-auto h-8 w-8 text-civic-700"
              aria-hidden="true"
            />
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink-950">
              Your civic wrapped is waiting.
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-700">
              Track a few issues you care about and we&apos;ll build a shareable
              recap — the causes you follow and what actually moved.
            </p>
            <Link
              href="/causes/new"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink-950 px-5 text-sm font-semibold text-white hover:bg-ink-800"
            >
              Track your first issue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        </PageShell>
      );
    }
    const place = await readPlace();
    const w = buildWrapped(causes);
    view = {
      ...w,
      placeLabel: place ? `${place.city}, ${place.state}` : "",
    };
    isSelf = true;
  }

  const cardImg = ogUrl(view);
  const storyImg = ogUrl(view, "story");
  const text = `My civic wrapped: ${view.causesCount} cause${view.causesCount === 1 ? "" : "s"} I track${view.placeLabel ? ` in ${view.placeLabel}` : ""}, ${view.totalMatched} records connected. Make yours — nonpartisan, every claim sourced:`;

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-start lg:px-8">
          <div>
            <SectionHeader
              eyebrow={isSelf ? "Your civic wrapped" : "A civic wrapped"}
              title={
                isSelf
                  ? "Here's what you're tracking."
                  : "Here's what they're tracking."
              }
              description={`${view.causesCount} cause${view.causesCount === 1 ? "" : "s"} · ${view.totalMatched} records connected · ${view.movedRecently} moved since tracking began. Nonpartisan; every claim links to its source.`}
            />
            {view.topTopics.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {view.topTopics.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-civic-100 bg-civic-50 px-3 py-1 text-xs font-semibold text-civic-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-6">
              {isSelf ? (
                <GovCardShare
                  shareUrl={shareUrl(view)}
                  text={text}
                  storyUrl={storyImg}
                  surface="wrapped"
                />
              ) : (
                <Link
                  href="/causes/new"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-ink-950 px-5 text-sm font-semibold text-white hover:bg-ink-800"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Make your own civic wrapped
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-record-200 shadow-panel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardImg}
              alt="Civic wrapped card"
              width={1200}
              height={630}
              className="w-full"
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
