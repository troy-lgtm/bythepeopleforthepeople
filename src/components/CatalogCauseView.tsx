import Link from "next/link";
import { ArrowRight, Bell } from "lucide-react";
import { MovementCard } from "@/components/MovementCard";
import { PageShell } from "@/components/PageShell";
import type { CatalogCause } from "@/lib/cause-catalog";
import type { MovementEvent } from "@/lib/movement-types";
import { PLACES } from "@/lib/place-catalog";

/**
 * Public page for a canonical (catalog) cause: what it watches, what moved,
 * where coverage exists, and how to watch it. Indexable, unlike private
 * user-authored causes.
 */
export function CatalogCauseView({
  cause,
  events,
  placeKey,
  thisWeek = false,
}: {
  cause: CatalogCause;
  events: MovementEvent[];
  /** Active place filter key or ZIP, when scoped. */
  placeKey?: string;
  thisWeek?: boolean;
}) {
  const baseHref = `/causes/${cause.slug}`;
  const scopeLabel = placeKey
    ? PLACES.find((p) => p.key === placeKey)?.name ?? `ZIP ${placeKey}`
    : null;

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <p className="inline-flex rounded-full border border-civic-100 bg-civic-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-civic-700">
            Cause
          </p>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            {cause.name}
            {scopeLabel ? ` in ${scopeLabel}` : ""}
            {thisWeek ? " this week" : ""}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink-700">
            {cause.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-600">
            <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1">
              Coverage: {cause.jurisdictions.join(" + ")}
            </span>
            <Link
              href="/methodology"
              className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-civic-700 hover:border-civic-500"
            >
              Methodology
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={baseHref}
              className={
                !placeKey && !thisWeek
                  ? "rounded-full border border-civic-500 bg-civic-50 px-3 py-1 text-xs font-semibold text-civic-700"
                  : "rounded-full border border-record-200 bg-white px-3 py-1 text-xs font-semibold text-ink-700 hover:border-civic-500"
              }
            >
              Everywhere
            </Link>
            {PLACES.map((p) => (
              <Link
                key={p.key}
                href={`${baseHref}/${p.key}`}
                className={
                  placeKey === p.key && !thisWeek
                    ? "rounded-full border border-civic-500 bg-civic-50 px-3 py-1 text-xs font-semibold text-civic-700"
                    : "rounded-full border border-record-200 bg-white px-3 py-1 text-xs font-semibold text-ink-700 hover:border-civic-500"
                }
              >
                {p.name}
              </Link>
            ))}
            {placeKey ? (
              <Link
                href={`${baseHref}/${placeKey}/this-week`}
                className={
                  thisWeek
                    ? "rounded-full border border-civic-500 bg-civic-50 px-3 py-1 text-xs font-semibold text-civic-700"
                    : "rounded-full border border-record-200 bg-white px-3 py-1 text-xs font-semibold text-ink-700 hover:border-civic-500"
                }
              >
                This week
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-600">
          {thisWeek ? "Moved this week" : "What moved"}
        </h2>
        {events.length === 0 ? (
          <div className="mt-3 rounded-lg border border-record-200 bg-white p-6">
            <p className="text-sm leading-6 text-ink-700">
              No indexed movement on {cause.name.toLowerCase()}
              {scopeLabel ? ` in ${scopeLabel}` : ""}
              {thisWeek ? " this week" : ""}. Quiet is the honest answer; when
              an official record moves, it shows up here with its receipt.
            </p>
            <Link
              href="/what-moved"
              className="mt-3 inline-flex text-sm font-semibold text-civic-700 hover:underline"
            >
              See everything that moved
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            {events.map((e) => (
              <MovementCard key={e.id} event={e} refTag="cause" />
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/digest"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            Watch {cause.name.toLowerCase()} by email
          </Link>
          <Link
            href={`/what-moved${placeKey ? `/${placeKey}` : ""}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-950 hover:border-civic-500"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            What moved{scopeLabel ? ` in ${scopeLabel}` : ""}
          </Link>
        </div>

        <p className="mt-8 text-xs leading-5 text-ink-600">
          Nonpartisan by construction: this page matches official records to a
          topic. It never scores officials and never endorses outcomes.
        </p>
      </section>
    </PageShell>
  );
}
