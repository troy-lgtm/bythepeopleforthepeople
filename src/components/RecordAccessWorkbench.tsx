import Link from "next/link";
import { CheckCircle2, FileCheck2, ListChecks } from "lucide-react";
import type { RecordAccessItem } from "@/data/types";
import { getSourcesByIds } from "@/data/records";
import { SourceTrail } from "./SourceTrail";

type RecordAccessWorkbenchProps = {
  title?: string;
  description?: string;
  voteItems: RecordAccessItem[];
  incorporatedItems: RecordAccessItem[];
  sourceItems: RecordAccessItem[];
};

export function RecordAccessWorkbench({
  title = "Stay on this site, but keep the source trail visible.",
  description = "The practical answer appears first, followed by exactly which public record supports it.",
  voteItems,
  incorporatedItems,
  sourceItems,
}: RecordAccessWorkbenchProps) {
  return (
    <section className="rounded-lg border border-record-200 bg-white p-5 shadow-panel">
      <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            Record reader
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-700">{description}</p>
          <div className="mt-5 grid gap-2 text-sm font-semibold text-ink-800">
            <WorkbenchCue icon={CheckCircle2} text="Upcoming vote status" />
            <WorkbenchCue icon={ListChecks} text="What is incorporated" />
            <WorkbenchCue icon={FileCheck2} text="Source verification" />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <WorkbenchColumn
            title="Upcoming votes"
            items={voteItems}
            emptyText="No vote records in this view."
          />
          <WorkbenchColumn
            title="What's incorporated"
            items={incorporatedItems}
            emptyText="No incorporated-record entries in this view."
          />
          <WorkbenchColumn
            title="Verify from source"
            items={sourceItems}
            emptyText="No source checks in this view."
          />
        </div>
      </div>
    </section>
  );
}

function WorkbenchCue({
  icon: Icon,
  text,
}: {
  icon: typeof CheckCircle2;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-record-200 bg-paper-50 px-3 py-2">
      <Icon className="h-4 w-4 text-civic-700" aria-hidden="true" />
      {text}
    </div>
  );
}

function WorkbenchColumn({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: RecordAccessItem[];
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-record-200 bg-paper-50 p-4">
      <h3 className="text-sm font-semibold text-ink-950">{title}</h3>
      <div className="mt-3 grid gap-3">
        {items.length ? (
          items.map((item) => <WorkbenchCard key={item.id} item={item} />)
        ) : (
          <p className="text-sm leading-6 text-ink-700">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function WorkbenchCard({ item }: { item: RecordAccessItem }) {
  return (
    <article className="rounded-lg border border-record-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-civic-100 bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700">
          {item.label}
        </span>
        <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
          {item.status}
        </span>
      </div>
      <h4 className="mt-3 text-sm font-semibold leading-6 text-ink-950">
        <Link href={item.href} className="hover:text-civic-700">
          {item.title}
        </Link>
      </h4>
      <p className="mt-2 text-sm leading-6 text-ink-700">{item.body}</p>
      <ul className="mt-3 grid gap-2">
        {item.proofPoints.map((point) => (
          <li key={point} className="flex gap-2 text-xs leading-5 text-ink-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-civic-500" />
            {point}
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-record-200 pt-3">
        <SourceTrail sources={getSourcesByIds(item.sourceIds)} compact />
      </div>
    </article>
  );
}
