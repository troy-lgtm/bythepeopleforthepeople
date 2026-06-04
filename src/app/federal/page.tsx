import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { STATE_NAMES } from "@/data/states";
import { allFederalReps, repsByState, slugForRep } from "@/lib/federal-reps";

const MEMBER_COUNT = allFederalReps().length;

export const metadata: Metadata = {
  title: "Federal representatives",
  description: `All ${MEMBER_COUNT} current U.S. Congress members — source-anchored civic profiles indexed from the united-states/congress-legislators dataset.`,
  alternates: { canonical: "/federal" },
};

type SearchParams = Promise<{ state?: string }>;

export default async function FederalIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { state: focusedState } = await searchParams;
  const all = allFederalReps();
  const grouped = repsByState();
  const stateKeys = Object.keys(grouped).sort();
  const targetStates = focusedState
    ? [focusedState.toUpperCase()].filter((s) => grouped[s])
    : stateKeys;

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            as="h1"
            eyebrow="Federal representatives"
            title={
              focusedState
                ? `${STATE_NAMES[focusedState.toUpperCase()] ?? focusedState.toUpperCase()} delegation`
                : `All ${all.length} current U.S. Congress members`
            }
            description="Source-anchored profiles. Sourced from the united-states/congress-legislators public dataset, verified at index time. Voting records, sponsorships, and committee actions are added per profile as ingestion lands."
          />
          {focusedState ? (
            <div className="mt-4">
              <Link
                href="/federal"
                className="inline-flex h-9 items-center rounded-md border border-record-200 bg-paper-50 px-3 text-xs font-semibold text-ink-800 hover:border-civic-500"
              >
                ← All states
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8">
          {targetStates.map((stateAbbr) => {
            const list = grouped[stateAbbr];
            const stateName = STATE_NAMES[stateAbbr] ?? stateAbbr;
            return (
              <article key={stateAbbr} id={stateAbbr}>
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-record-200 pb-3">
                  <h2 className="text-xl font-semibold text-ink-950">
                    {stateName}{" "}
                    <span className="text-sm font-normal text-ink-600">
                      ({stateAbbr})
                    </span>
                  </h2>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                    {list.length} {list.length === 1 ? "member" : "members"}
                  </span>
                </div>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((rep) => {
                    const chamber =
                      rep.type === "sen" ? "Senate" : `House ${stateAbbr}-${rep.district}`;
                    return (
                      <li key={`${stateAbbr}-${rep.id ?? rep.name}`}>
                        <Link
                          href={`/federal/${slugForRep(rep)}`}
                          className="flex items-start gap-3 rounded-md border border-record-200 bg-white p-3 shadow-line hover:border-civic-500"
                        >
                          <span
                            className={
                              rep.type === "sen"
                                ? "rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                                : "rounded-full bg-paper-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-700"
                            }
                          >
                            {chamber}
                          </span>
                          <span className="grid">
                            <span className="text-sm font-semibold text-ink-950">
                              {rep.name}
                            </span>
                            {rep.party ? (
                              <span className="text-xs text-ink-600">
                                {rep.party}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </div>
        {!focusedState ? (
          <div className="mt-10 rounded-lg border border-record-200 bg-paper-50 p-5 text-sm leading-6 text-ink-700">
            Coverage note: this index has every current member of the U.S.
            Congress as of the most recent united-states/congress-legislators
            commit. The page is regenerated whenever the bundled dataset is
            refreshed.
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}
