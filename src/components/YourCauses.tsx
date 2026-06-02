import Link from "next/link";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { matchCause, matchCount } from "@/lib/cause-matcher";
import { readCauses } from "@/lib/causes";

export async function YourCauses() {
  const causes = await readCauses();

  if (causes.length === 0) {
    return (
      <section className="rounded-lg border border-record-200 bg-white p-6 shadow-line">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              Start with what you want
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-950">
              What do you actually care about?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-700">
              Safer streets. Wildfires stopping. Rent stabilizing. A school
              that funds your kid&apos;s teacher. Pick a cause and the
              product matches indexed records, votes, and reps. We do not
              score alignment. You judge.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/causes/new"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add your first cause
              </Link>
              <Link
                href="/causes/starters"
                className="inline-flex h-11 items-center justify-center rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-950 shadow-line hover:border-civic-500"
              >
                Browse 12 starter cards
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-record-200 bg-white p-6 shadow-line">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            Causes important to you
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-950">
            What you&apos;re tracking right now
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
            Source-anchored matches for each cause. Click any cause to see
            matched records, reps, and a pre-filled action surface.
          </p>
        </div>
        <Link
          href="/causes/new"
          className="inline-flex h-10 items-center gap-2 rounded-md border border-record-200 bg-white px-3 text-xs font-semibold text-ink-800 shadow-line hover:border-civic-500"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add another
        </Link>
      </div>

      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {causes.map((cause) => {
          const matches = matchCause(cause);
          const total = matchCount(matches);
          return (
            <li key={cause.id}>
              <Link
                href={`/causes/${cause.id}`}
                className="block rounded-lg border border-record-200 bg-paper-50 p-4 transition hover:border-civic-500 hover:bg-white"
              >
                <div className="flex items-start gap-3">
                  {cause.emoji ? (
                    <span className="text-2xl" aria-hidden="true">
                      {cause.emoji}
                    </span>
                  ) : null}
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-ink-950">
                      {cause.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-700">
                      {cause.outcome}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-civic-100 bg-civic-50 px-2 py-0.5 font-semibold text-civic-700">
                        {total} matched
                      </span>
                      {matches.reps.length > 0 ? (
                        <span className="rounded-full border border-record-200 bg-white px-2 py-0.5 font-semibold text-ink-700">
                          {matches.reps.length} reps
                        </span>
                      ) : null}
                      <span className="ml-auto inline-flex items-center gap-1 text-civic-700">
                        Open
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
