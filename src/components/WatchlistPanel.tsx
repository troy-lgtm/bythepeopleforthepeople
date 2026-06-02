"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, Inbox } from "lucide-react";
import { getSourcesByIds } from "@/data/records";
import { watchTargets } from "@/data/product-loop";
import { readWatchlist } from "./WatchButton";
import { SourceTrail } from "./SourceTrail";
import { WatchButton } from "./WatchButton";

export function WatchlistPanel() {
  const [watchedIds, setWatchedIds] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => setWatchedIds(readWatchlist());

    refresh();
    window.addEventListener("btpftp-watchlist-change", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("btpftp-watchlist-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const watchedTargets = watchTargets.filter((target) =>
    watchedIds.includes(target.id),
  );

  return (
    <div className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
          <BellRing className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            Watchlist
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink-950">
            Come back when something changes.
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            Watched records are saved in this browser. Source-change alerts can
            be connected to email, RSS, calendar, or app notifications when live
            ingestion is enabled.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {watchTargets.map((target) => (
          <article
            key={target.id}
            className="rounded-lg border border-record-200 bg-paper-50 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                  {target.type}
                </p>
                <Link
                  href={target.href}
                  className="mt-1 block text-sm font-semibold text-ink-950 hover:text-civic-700"
                >
                  {target.title}
                </Link>
              </div>
              <WatchButton targetId={target.id} />
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-700">
              {target.alertReason}
            </p>
            <div className="mt-3">
              <SourceTrail sources={getSourcesByIds(target.sourceIds)} compact />
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-record-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-civic-700" aria-hidden="true" />
          <p className="text-sm font-semibold text-ink-950">
            Local watch inbox
          </p>
        </div>
        {watchedTargets.length ? (
          <div className="mt-3 grid gap-2">
            {watchedTargets.map((target) => (
              <p key={target.id} className="text-sm leading-6 text-ink-700">
                Watching {target.title}. Alert when: {target.alertReason}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-ink-700">
            Nothing watched yet. Choose a decision, topic, person, or committee
            above to create the return loop.
          </p>
        )}
      </div>
    </div>
  );
}
