"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, SlidersHorizontal } from "lucide-react";
import { getSourcesByIds } from "@/data/records";
import { localSignals } from "@/data/product-loop";
import { SourceTrail } from "./SourceTrail";

const topics = ["All", "Housing", "Land use", "Votes"];

export function LocalPulse() {
  const [location, setLocation] = useState("90012");
  const [topic, setTopic] = useState("All");

  const visibleSignals = useMemo(() => {
    if (topic === "All") {
      return localSignals;
    }

    return localSignals.filter((signal) => signal.topic === topic);
  }, [topic]);

  return (
    <section className="rounded-lg border border-record-200 bg-white p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            Near me
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950">
            What changed around my area?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
            Enter a ZIP or city to shape the feed. The current index includes
            Los Angeles and California records; unmatched areas show coverage
            gaps instead of invented local results.
          </p>
        </div>
        <div className="grid gap-2 sm:min-w-72">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
            ZIP or city
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="h-11 w-full rounded-md border border-record-200 bg-paper-50 pl-9 pr-3 text-sm font-medium text-ink-950 outline-none transition focus:border-civic-500 focus:bg-white"
              aria-label="ZIP or city"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink-700">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Topic
        </span>
        {topics.map((topicOption) => (
          <button
            key={topicOption}
            type="button"
            onClick={() => setTopic(topicOption)}
            className={
              topic === topicOption
                ? "rounded-full border border-civic-500 bg-civic-50 px-3 py-1.5 text-sm font-semibold text-civic-700"
                : "rounded-full border border-record-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 hover:border-civic-500"
            }
          >
            {topicOption}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {visibleSignals.map((signal) => (
          <article
            key={signal.id}
            className="rounded-lg border border-record-200 bg-paper-50 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
              {location || signal.locationLabel} - {signal.topic}
            </p>
            <h3 className="mt-2 text-base font-semibold leading-6 text-ink-950">
              <Link href={signal.href} className="hover:text-civic-700">
                {signal.title}
              </Link>
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              {signal.description}
            </p>
            <div className="mt-4">
              <SourceTrail sources={getSourcesByIds(signal.sourceIds)} compact />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
