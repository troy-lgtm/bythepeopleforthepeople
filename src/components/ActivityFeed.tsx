import {
  CalendarClock,
  FileDiff,
  FileText,
  ListChecks,
  Mic2,
  Vote,
} from "lucide-react";
import type { ComponentType } from "react";
import type { PublicEvent, PublicEventType } from "@/data/types";
import { getSourcesByIds } from "@/data/records";
import { publicEventReportSchema } from "@/lib/schema";
import { JsonLd } from "./JsonLd";
import { SourceTrail } from "./SourceTrail";

const eventIcon: Record<PublicEventType, ComponentType<{ className?: string }>> = {
  bill_introduced: FileText,
  amendment_added: FileDiff,
  committee_vote_scheduled: CalendarClock,
  local_ordinance_updated: ListChecks,
  hearing_transcript_published: Mic2,
  final_vote_recorded: Vote,
  meeting_held: CalendarClock,
  document_posted: FileText,
};

type ActivityFeedProps = {
  events: PublicEvent[];
  dense?: boolean;
};

export function ActivityFeed({ events, dense = false }: ActivityFeedProps) {
  const schemas = events.map((event) => {
    const sources = getSourcesByIds(event.sourceIds);
    return publicEventReportSchema({
      id: event.id,
      date: event.date,
      title: event.title,
      description: event.description,
      actor: event.actor,
      sourceUrls: sources.map((s) => s.url),
    });
  });
  return (
    <div className="grid gap-3">
      <JsonLd data={schemas} />
      {events.map((event) => {
        const Icon = eventIcon[event.type];
        const sources = getSourcesByIds(event.sourceIds);

        return (
          <article
            key={event.id}
            className="rounded-lg border border-record-200 bg-white p-4 shadow-line transition hover:border-civic-500"
          >
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="text-sm font-semibold text-ink-950">{event.title}</h3>
                  <time className="font-mono text-xs text-ink-600" dateTime={event.date}>
                    {formatEventDate(event.date)}
                  </time>
                </div>
                <p className="mt-1 text-xs font-medium text-ink-600">{event.actor}</p>
                <p className={dense ? "mt-2 text-sm leading-6 text-ink-700" : "mt-3 text-sm leading-6 text-ink-700"}>
                  {event.description}
                </p>
                <div className="mt-3">
                  <SourceTrail sources={sources} compact />
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: value.includes("T") ? "numeric" : undefined,
    minute: value.includes("T") ? "2-digit" : undefined,
  }).format(new Date(value));
}
