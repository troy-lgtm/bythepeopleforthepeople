import Link from "next/link";
import { Bell, Share2 } from "lucide-react";
import { MovementCard } from "@/components/MovementCard";
import { PageShell } from "@/components/PageShell";
import type { MovementEvent } from "@/lib/movement-types";

/**
 * Shared layout for every "what moved" surface. Headline, date range,
 * movement cards, watch + share CTAs, methodology link, honest empty state.
 */
export function WhatMovedView({
  eyebrow = "What moved",
  title,
  description,
  events,
  periodLabel,
  watchHref = "/digest",
  watchLabel = "Watch this and get the digest",
  filters,
  emptyNote,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  events: MovementEvent[];
  periodLabel: string;
  watchHref?: string;
  watchLabel?: string;
  /** Active filter chips, e.g. place and cause links. */
  filters?: Array<{ label: string; href: string; active?: boolean }>;
  emptyNote?: string;
}) {
  const lastUpdated = events[0]?.detectedAt ?? null;

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <p className="inline-flex rounded-full border border-civic-100 bg-civic-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-civic-700">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink-700">
            {description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-600">
            <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1">
              {periodLabel}
            </span>
            {lastUpdated ? (
              <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1">
                Last indexed movement: {lastUpdated.slice(0, 10)}
              </span>
            ) : null}
            <Link
              href="/methodology"
              className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-civic-700 hover:border-civic-500"
            >
              Methodology
            </Link>
          </div>
          {filters && filters.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.map((f) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className={
                    f.active
                      ? "rounded-full border border-civic-500 bg-civic-50 px-3 py-1 text-xs font-semibold text-civic-700"
                      : "rounded-full border border-record-200 bg-white px-3 py-1 text-xs font-semibold text-ink-700 hover:border-civic-500"
                  }
                >
                  {f.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {events.length === 0 ? (
          <div className="rounded-lg border border-record-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-ink-950">
              No indexed movement in this view.
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              {emptyNote ??
                "Nothing moved in the official records we index for this filter and period. Quiet is the honest answer, not a missing page."}
            </p>
            <Link
              href="/what-moved"
              className="mt-4 inline-flex text-sm font-semibold text-civic-700 hover:underline"
            >
              See everything that moved
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((e) => (
              <MovementCard key={e.id} event={e} />
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={watchHref}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {watchLabel}
          </Link>
          <Link
            href="/share"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-950 hover:border-civic-500"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Share a receipt
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
