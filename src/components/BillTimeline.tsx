import type { PublicEvent } from "@/data/types";
import { getSourcesByIds } from "@/data/records";
import { SourceTrail } from "./SourceTrail";

type BillTimelineProps = {
  events: PublicEvent[];
};

export function BillTimeline({ events }: BillTimelineProps) {
  return (
    <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-4 before:top-4 before:w-px before:bg-record-200">
      {events.map((event) => (
        <li key={event.id} className="relative grid gap-3 rounded-lg border border-record-200 bg-white p-4 pl-12 shadow-line">
          <span className="absolute left-[9px] top-5 h-3 w-3 rounded-full border-2 border-white bg-civic-600 shadow-line" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <time className="font-mono text-xs font-medium text-ink-600" dateTime={event.date}>
                {event.date}
              </time>
              <h3 className="mt-1 text-base font-semibold text-ink-950">{event.title}</h3>
            </div>
            <span className="rounded-full bg-paper-50 px-2.5 py-1 text-xs font-medium text-ink-600">
              {event.actor}
            </span>
          </div>
          <p className="text-sm leading-6 text-ink-700">{event.description}</p>
          <SourceTrail sources={getSourcesByIds(event.sourceIds)} compact />
        </li>
      ))}
    </ol>
  );
}
