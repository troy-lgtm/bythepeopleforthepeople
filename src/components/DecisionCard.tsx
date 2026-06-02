import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import type { DecisionStatus, SourceRecord } from "@/data/types";
import { SourceTrail } from "./SourceTrail";
import { StatusBadge } from "./StatusBadge";

type DecisionCardProps = {
  title: string;
  href: string;
  jurisdiction: string;
  type: string;
  status: DecisionStatus;
  date: string;
  summary: string;
  topics: string[];
  sources: SourceRecord[];
  meta?: string;
};

export function DecisionCard({
  title,
  href,
  jurisdiction,
  type,
  status,
  date,
  summary,
  topics,
  sources,
  meta,
}: DecisionCardProps) {
  return (
    <article className="group rounded-lg border border-record-200 bg-white p-5 shadow-line transition hover:border-civic-500 hover:shadow-panel">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-xs font-medium text-ink-600">
          {type}
        </span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">
            {jurisdiction}
          </p>
          <h3 className="mt-2 text-lg font-semibold leading-7 text-ink-950">
            <Link href={href} className="outline-none">
              {title}
            </Link>
          </h3>
        </div>
        <ArrowUpRight
          className="h-5 w-5 shrink-0 text-ink-600 transition group-hover:text-civic-700"
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-ink-700">{summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-600">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          {date}
        </span>
        {meta ? <span className="text-xs text-ink-600">- {meta}</span> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {topics.map((topic) => (
          <span
            key={topic}
            className="rounded-full bg-record-50 px-2.5 py-1 text-xs font-medium text-ink-700"
          >
            {topic}
          </span>
        ))}
      </div>
      <div className="mt-4 border-t border-record-200 pt-4">
        <SourceTrail sources={sources} compact />
      </div>
    </article>
  );
}
