import type { Stakeholder } from "@/data/types";
import { getSourcesByIds } from "@/data/records";
import { SourceTrail } from "./SourceTrail";

type StakeholderListProps = {
  stakeholders: Stakeholder[];
};

export function StakeholderList({ stakeholders }: StakeholderListProps) {
  if (!stakeholders.length) {
    return (
      <div className="rounded-lg border border-dashed border-record-200 bg-paper-50 p-6 text-sm leading-6 text-ink-700">
        No stakeholders are named in the indexed record yet. Named positions
        appear here only when an official source states them.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {stakeholders.map((stakeholder) => (
        <article key={stakeholder.id} className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-paper-50 px-2.5 py-1 text-xs font-medium text-ink-700">
              {stakeholder.type}
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold text-ink-950">{stakeholder.name}</h3>
          <blockquote className="mt-2 border-l-2 border-civic-500 pl-3 text-sm leading-6 text-ink-700">
            {stakeholder.publicStatement}
          </blockquote>
          <p className="mt-2 text-xs text-ink-600">
            Verbatim from the public record. No partisan tagging applied.
          </p>
          <div className="mt-4">
            <SourceTrail sources={getSourcesByIds(stakeholder.sourceIds)} compact />
          </div>
        </article>
      ))}
    </div>
  );
}
