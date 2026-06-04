import type { Amendment } from "@/data/types";
import { getSourcesByIds } from "@/data/records";
import { SourceTrail } from "./SourceTrail";

type AmendmentDiffProps = {
  amendments: Amendment[];
};

export function AmendmentDiff({ amendments }: AmendmentDiffProps) {
  if (!amendments.length) {
    return (
      <div className="rounded-lg border border-dashed border-record-200 bg-paper-50 p-6 text-sm leading-6 text-ink-700">
        No amendment comparison is indexed for this record yet. Removed and
        added language will appear here when an official text version is
        available to compare.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {amendments.map((amendment) => (
        <article key={amendment.id} className="rounded-lg border border-record-200 bg-white shadow-line">
          <div className="border-b border-record-200 p-5">
            <p className="font-mono text-xs font-medium text-ink-600">{amendment.date}</p>
            <h3 className="mt-2 text-lg font-semibold text-ink-950">{amendment.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-700">{amendment.summary}</p>
          </div>
          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-record-200 p-5 md:border-b-0 md:border-r">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">
                Removed language
              </p>
              <ul className="mt-3 grid gap-2" role="list">
                {amendment.removedLanguage.map((line) => (
                  <li key={line}>
                    <del
                      className="block rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 font-mono text-sm leading-6 text-rose-900 no-underline"
                    >
                      <span className="font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700">
                        Removed
                      </span>
                      <span className="mt-1 block">{line}</span>
                    </del>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">
                Added language
              </p>
              <ul className="mt-3 grid gap-2" role="list">
                {amendment.addedLanguage.map((line) => (
                  <li key={line}>
                    <ins
                      className="block rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-mono text-sm leading-6 text-emerald-950 no-underline"
                    >
                      <span className="font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                        Added
                      </span>
                      <span className="mt-1 block">{line}</span>
                    </ins>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-record-200 p-5">
            <SourceTrail sources={getSourcesByIds(amendment.sourceIds)} compact />
          </div>
        </article>
      ))}
    </div>
  );
}
