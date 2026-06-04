import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, Plus, Sparkles } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { matchCause, matchCount } from "@/lib/cause-matcher";
import { readCauses } from "@/lib/causes";

export const metadata: Metadata = {
  title: "Your causes",
  description:
    "Track the issues you care about. See the bills, votes, and officials behind each — and get alerts when they move.",
  alternates: { canonical: "/causes" },
};

export default async function CausesIndexPage() {
  const causes = await readCauses();

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Causes important to you"
            title="Track what actually matters to you, with proof."
            description="Pick something you care about. We surface the bills, votes, and officials behind it — and alert you when it moves. Nonpartisan; you decide what to make of each record."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/causes/new"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-ink-950 px-5 text-sm font-semibold text-white hover:bg-ink-800"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a cause
            </Link>
            <Link
              href="/causes/starters"
              className="inline-flex h-12 items-center justify-center rounded-md border border-record-200 bg-white px-5 text-sm font-semibold text-ink-950 shadow-line hover:border-civic-500"
            >
              Browse starter causes
            </Link>
            {causes.length > 0 ? (
              <Link
                href="/wrapped"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-civic-100 bg-civic-50 px-5 text-sm font-semibold text-civic-700 hover:border-civic-500"
              >
                Your civic wrapped →
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {causes.length === 0 ? (
          <article className="rounded-lg border border-record-200 bg-paper-50 p-8 text-sm leading-7 text-ink-800">
            <Sparkles className="h-6 w-6 text-civic-700" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-semibold text-ink-950">
              You don&apos;t have any causes yet.
            </h2>
            <p className="mt-3 max-w-2xl">
              A cause is what you want — &ldquo;safer streets for my kids,&rdquo;
              &ldquo;the wildfires to stop,&rdquo; &ldquo;my rent to stop
              going up.&rdquo; The product surfaces indexed records, votes,
              and reps that touch your cause. The cause stays private to your
              browser cookie unless you choose to share it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/causes/new"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add your first cause
              </Link>
              <Link
                href="/causes/starters"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 hover:border-civic-500"
              >
                Pick from 12 starter cards
              </Link>
            </div>
          </article>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {causes.map((cause) => {
              const matches = matchCause(cause);
              const total = matchCount(matches);
              return (
                <li key={cause.id}>
                  <Link
                    href={`/causes/${cause.id}`}
                    className="block rounded-lg border border-record-200 bg-white p-5 shadow-line transition hover:border-civic-500 hover:bg-paper-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {cause.emoji ? (
                          <span
                            className="text-2xl"
                            aria-hidden="true"
                          >
                            {cause.emoji}
                          </span>
                        ) : null}
                        <h3 className="text-lg font-semibold text-ink-950">
                          {cause.title}
                        </h3>
                      </div>
                      <Bell
                        className="h-4 w-4 shrink-0 text-civic-700"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink-700">
                      {cause.outcome}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-civic-100 bg-civic-50 px-2.5 py-1 font-semibold text-civic-700">
                        {total} matched {total === 1 ? "record" : "records"}
                      </span>
                      {matches.reps.length > 0 ? (
                        <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 font-semibold text-ink-700">
                          {matches.reps.length} matched reps
                        </span>
                      ) : null}
                      <span className="ml-auto inline-flex items-center gap-1 text-civic-700">
                        Open cause
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="border-t border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <article className="rounded-lg border border-record-200 bg-paper-50 p-6">
            <h2 className="text-lg font-semibold text-ink-950">
              How causes work, what we will not do
            </h2>
            <ul className="mt-4 grid list-disc gap-2 pl-5 text-sm leading-7 text-ink-700">
              <li>
                Your causes live in a first-party cookie. Private to your
                browser unless you share a specific cause publicly.
              </li>
              <li>
                We match indexed records, votes, and reps to your cause by
                topic, jurisdiction, and keyword overlap. The user judges
                alignment. The product never scores it.
              </li>
              <li>
                We do not say a representative is &ldquo;aligned&rdquo; or
                &ldquo;opposed&rdquo; to your cause. We show the records and
                votes; you read them.
              </li>
              <li>
                We do not aggregate cause data into partisan profiles or sell
                it. We do not run mobilization campaigns from the cause data.
              </li>
              <li>
                You can delete any cause at any time. Clearing the cookie
                clears everything.
              </li>
            </ul>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
