import Link from "next/link";
import { Clock3 } from "lucide-react";
import { getSourcesByIds } from "@/data/records";
import { dailyChanges } from "@/data/product-loop";
import { SourceTrail } from "./SourceTrail";

export function DailyChangeDigest() {
  return (
    <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
          <Clock3 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            Daily change digest
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink-950">
            New since you last checked
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {dailyChanges.map((change) => (
          <article
            key={change.id}
            className="rounded-lg border border-record-200 bg-paper-50 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700">
                {change.urgency}
              </span>
              <span className="rounded-full bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700">
                {change.label}
              </span>
              <time className="font-mono text-xs text-ink-600" dateTime={change.date}>
                {change.date}
              </time>
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink-950">
              <Link href={change.href} className="hover:text-civic-700">
                {change.title}
              </Link>
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              {change.description}
            </p>
            <div className="mt-4">
              <SourceTrail sources={getSourcesByIds(change.sourceIds)} compact />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
