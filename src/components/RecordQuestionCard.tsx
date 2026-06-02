import type { LucideIcon } from "lucide-react";
import type { SourceRecord } from "@/data/types";
import { SourceTrail } from "./SourceTrail";

type RecordQuestionCardProps = {
  icon: LucideIcon;
  question: string;
  answer: string;
  sources: SourceRecord[];
  label?: string;
};

export function RecordQuestionCard({
  icon: Icon,
  question,
  answer,
  sources,
  label,
}: RecordQuestionCardProps) {
  return (
    <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          {label ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">
              {label}
            </p>
          ) : null}
          <h3 className="text-base font-semibold leading-6 text-ink-950">
            {question}
          </h3>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-ink-700">{answer}</p>
      <div className="mt-4 border-t border-record-200 pt-4">
        <SourceTrail sources={sources} compact />
      </div>
    </article>
  );
}
