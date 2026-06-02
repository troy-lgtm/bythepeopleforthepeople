import { ExternalLink, History } from "lucide-react";
import type { SourceRecord, SourceType } from "@/data/types";

const sourceLabels: Record<SourceType, string> = {
  bill_text: "Bill text",
  bill_status: "Bill status",
  bill_history: "Bill history",
  compare_versions: "Compare versions",
  amendment_version: "Amendment version",
  committee_agenda: "Committee agenda",
  committee_action: "Committee action",
  roll_call_vote: "Roll call vote",
  hearing_transcript: "Hearing transcript",
  public_filing: "Public filing",
  meeting_minutes: "Meeting minutes",
  action_history: "Action history",
  council_file: "Council file",
  staff_report: "Staff report",
  public_comment: "Public comment",
};

type SourceTrailProps = {
  sources: SourceRecord[];
  compact?: boolean;
};

export function sourceTypeLabel(type: SourceType) {
  return sourceLabels[type];
}

export function sourceProvenanceLabel(source: SourceRecord) {
  if (source.provenance) {
    return source.provenance;
  }

  if (
    source.type === "bill_text" ||
    source.type === "bill_status" ||
    source.type === "bill_history" ||
    source.type === "compare_versions" ||
    source.type === "amendment_version" ||
    source.type === "roll_call_vote" ||
    source.type === "meeting_minutes" ||
    source.type === "action_history" ||
    source.type === "committee_agenda" ||
    source.type === "committee_action" ||
    source.type === "council_file" ||
    source.type === "staff_report"
  ) {
    return "Official record";
  }

  if (source.type === "public_filing" || source.type === "public_comment") {
    return "Public filing";
  }

  return "Primary source";
}

function freshnessLabel(source: SourceRecord): string | null {
  if (!source.verifiedAt) return null;
  const verified = new Date(source.verifiedAt);
  if (Number.isNaN(verified.getTime())) return null;
  return `Verified ${verified.toISOString().slice(0, 10)}`;
}

export function SourceTrail({ sources, compact = false }: SourceTrailProps) {
  return (
    <div className={compact ? "flex flex-wrap gap-2" : "space-y-3"}>
      {sources.map((source) => {
        const fresh = freshnessLabel(source);
        return (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className={
              compact
                ? "inline-flex items-center gap-1.5 rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition hover:border-civic-500 hover:text-civic-700"
                : "group flex items-start justify-between gap-4 rounded-lg border border-record-200 bg-white p-4 shadow-line transition hover:border-civic-500"
            }
          >
            {compact ? (
              <>
                <span>{sourceTypeLabel(source.type)}</span>
                <span className="rounded-full bg-civic-50 px-1.5 py-0.5 text-[10px] font-semibold text-civic-700">
                  {sourceProvenanceLabel(source)}
                </span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </>
            ) : (
              <>
                <span>
                  <span className="block text-sm font-semibold text-ink-900">
                    {source.title}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-2 text-xs text-ink-600">
                    <span className="rounded-full border border-record-200 bg-paper-50 px-2 py-0.5">
                      {sourceTypeLabel(source.type)}
                    </span>
                    <span className="rounded-full border border-civic-100 bg-civic-50 px-2 py-0.5 font-semibold text-civic-700">
                      {sourceProvenanceLabel(source)}
                    </span>
                    <span className="rounded-full border border-record-200 bg-paper-50 px-2 py-0.5">
                      {source.jurisdiction}
                    </span>
                    <span className="rounded-full border border-record-200 bg-paper-50 px-2 py-0.5">
                      {source.date}
                    </span>
                    {fresh ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-civic-100 bg-civic-50 px-2 py-0.5 font-semibold text-civic-700">
                        <History className="h-3 w-3" aria-hidden="true" />
                        {fresh}
                      </span>
                    ) : null}
                    {source.archiveUrl ? (
                      <span className="rounded-full border border-record-200 bg-paper-50 px-2 py-0.5 underline">
                        Wayback snapshot available
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-ink-700">
                    {source.description}
                  </span>
                </span>
                <ExternalLink
                  className="mt-1 h-4 w-4 shrink-0 text-ink-600 transition group-hover:text-civic-700"
                  aria-hidden="true"
                />
              </>
            )}
          </a>
        );
      })}
    </div>
  );
}
