import { ExternalLink, FileCheck2 } from "lucide-react";
import type { EvidenceRecord } from "@/data/types";
import { sourceById } from "@/data/records";
import { sourceProvenanceLabel, sourceTypeLabel } from "./SourceTrail";

type EvidenceStackProps = {
  evidence: EvidenceRecord[];
  compact?: boolean;
};

export function EvidenceStack({ evidence, compact = false }: EvidenceStackProps) {
  if (!evidence.length) {
    return null;
  }

  return (
    <div className={compact ? "grid gap-2" : "grid gap-3"}>
      {evidence.map((item) => {
        const source = sourceById.get(item.sourceId);

        return (
          <article
            key={item.id}
            className={
              compact
                ? "rounded-md border border-record-200 bg-white p-3"
                : "rounded-lg border border-record-200 bg-white p-4 shadow-line"
            }
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-civic-50 text-civic-700">
                <FileCheck2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-6 text-ink-950">
                  {item.claim}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-ink-600">
                  {item.locator}
                </p>
              </div>
            </div>

            <blockquote className="mt-3 border-l-2 border-civic-500 pl-3 text-sm leading-6 text-ink-700">
              {item.excerpt}
            </blockquote>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-600">
              {source ? (
                <>
                  <span className="rounded-full border border-record-200 bg-paper-50 px-2 py-0.5">
                    {sourceTypeLabel(source.type)}
                  </span>
                  <span className="rounded-full border border-civic-100 bg-civic-50 px-2 py-0.5 font-semibold text-civic-700">
                    {sourceProvenanceLabel(source)}
                  </span>
                  <span className="rounded-full border border-record-200 bg-paper-50 px-2 py-0.5">
                    {source.date}
                  </span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open official record: ${source.title}`}
                    className="inline-flex items-center gap-1 rounded-full border border-record-200 bg-white px-2 py-0.5 font-semibold text-ink-700 hover:border-civic-500 hover:text-civic-700"
                  >
                    Official record
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </>
              ) : (
                <span className="rounded-full border border-dashed border-record-200 bg-paper-50 px-2 py-0.5">
                  Source record not available
                </span>
              )}
            </div>

            {!compact ? (
              <p className="mt-3 text-xs leading-5 text-ink-600">
                {item.verificationNote}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
