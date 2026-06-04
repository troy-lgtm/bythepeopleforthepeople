import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { getSourcesByIds } from "@/data/records";
import { missingDataRecords } from "@/data/product-loop";
import type { MissingDataRecord } from "@/data/types";
import { sourceTypeLabel, SourceTrail } from "./SourceTrail";

type MissingDataPanelProps = {
  records?: MissingDataRecord[];
};

export function MissingDataPanel({ records = missingDataRecords }: MissingDataPanelProps) {
  if (records.length === 0) {
    return (
      <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              Missing data
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink-950">
              Nothing missing flagged
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              No gaps are flagged for these records right now. When the index
              detects an expected source that has not landed, it is listed here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-notice-50 text-notice-500">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-notice-500">
            Missing data
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink-950">
            What the record does not show yet
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            Missing records are labeled instead of guessed. This is part of the
            trust layer, not an error state.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {records.map((record) => (
          <article
            key={record.id}
            className="rounded-lg border border-record-200 bg-paper-50 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700">
                {record.status}
              </span>
              <span className="rounded-full bg-notice-50 px-2.5 py-1 text-xs font-semibold text-notice-500">
                Expected: {sourceTypeLabel(record.expectedSourceType)}
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink-950">
              <Link href={record.relatedHref} className="hover:text-civic-700">
                {record.title}
              </Link>
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              {record.description}
            </p>
            <div className="mt-4">
              <SourceTrail sources={getSourcesByIds(record.relatedSourceIds)} compact />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
