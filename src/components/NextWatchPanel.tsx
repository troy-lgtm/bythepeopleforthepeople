import Link from "next/link";
import { CalendarClock, MapPinned, Radar } from "lucide-react";
import { getSourcesByIds } from "@/data/records";
import { upcomingActions, userNeedRecords } from "@/data/product-loop";
import { SourceTrail } from "./SourceTrail";

export function NextWatchPanel() {
  return (
    <section className="rounded-lg border border-record-200 bg-white p-5 shadow-panel">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
          <Radar className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            Next watch
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink-950">
            What people should check next.
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            Future votes appear here only when an agenda, calendar, daily file,
            or official notice is indexed. Until then, the page shows the next
            source-backed watch point.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {upcomingActions.map((action) => (
          <article
            key={action.id}
            className="rounded-lg border border-record-200 bg-paper-50 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                {action.date}
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold leading-6 text-ink-950">
              <Link href={action.href} className="hover:text-civic-700">
                {action.title}
              </Link>
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink-700">{action.body}</p>
            <div className="mt-4">
              <SourceTrail sources={getSourcesByIds(action.sourceIds)} compact />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function UserNeedStrip() {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {userNeedRecords.map((need) => (
        <Link
          key={need.id}
          href={need.href}
          className="rounded-lg border border-record-200 bg-white p-4 shadow-line hover:border-civic-500"
        >
          <div className="flex items-center gap-2 text-civic-700">
            <MapPinned className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
              Common need
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold leading-6 text-ink-950">
            {need.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-700">{need.body}</p>
          <div className="mt-4">
            <SourceTrail sources={getSourcesByIds(need.sourceIds)} compact />
          </div>
        </Link>
      ))}
    </section>
  );
}
