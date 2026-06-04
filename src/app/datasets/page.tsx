import type { Metadata } from "next";
import { Download, Database, FileText } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Datasets",
  description:
    "Bulk CSV + JSON exports of every indexed civic record. Free for newsrooms, researchers, civic technologists, and AI engines.",
  alternates: { canonical: "/datasets" },
};

const DATASETS = [
  {
    id: "records",
    label: "Records (bills + local files)",
    description:
      "Every indexed legislative bill and local council file with status, sponsor, last action, topics, and public URL.",
  },
  {
    id: "sources",
    label: "Source records",
    description:
      "Every indexed primary-source record with URL, type, jurisdiction, provenance, and freshness timestamps.",
  },
  {
    id: "federal-reps",
    label: "Federal representatives",
    description:
      "Current U.S. Congress members — 535 voting members plus non-voting delegates — with chamber, state, district, party, contact info, and Bioguide ID. Sourced from united-states/congress-legislators.",
  },
  {
    id: "topics",
    label: "Topic profiles",
    description:
      "All topic pages with watch prompts, coverage status, and source counts.",
  },
  {
    id: "connectors",
    label: "Source connectors",
    description:
      "Every adapter that pulls official-record updates. Includes status, upstream URL, env-var requirements.",
  },
  {
    id: "cities",
    label: "Cities (top 50 by population)",
    description:
      "Top 50 US cities by 2020 Census population with state, population, and public-records portal URL.",
  },
];

export default function DatasetsPage() {
  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            as="h1"
            eyebrow="Datasets"
            title="Bulk exports for researchers, newsrooms, AI engines."
            description="The whole indexed corpus as CSV or JSON. No API key required at fair-use volumes. Citation required."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/datasets/records.csv"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Quick: records.csv
            </a>
            <a
              href="/datasets/federal-reps.csv"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 shadow-line hover:border-civic-500"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              federal-reps.csv
            </a>
            <a
              href="/.well-known/civic-records.json"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 shadow-line hover:border-civic-500"
            >
              <Database className="h-4 w-4" aria-hidden="true" />
              Machine-readable manifest
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4">
          {DATASETS.map((d) => (
            <article
              key={d.id}
              className="rounded-lg border border-record-200 bg-white p-5 shadow-line"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-ink-950">
                    {d.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-700">
                    {d.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`/datasets/${d.id}.csv`}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-record-200 bg-paper-50 px-3 text-xs font-semibold text-ink-800 hover:border-civic-500"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      {d.id}.csv
                    </a>
                    <a
                      href={`/datasets/${d.id}.json`}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-record-200 bg-paper-50 px-3 text-xs font-semibold text-ink-800 hover:border-civic-500"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      {d.id}.json
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <article className="rounded-lg border border-ink-800 bg-ink-950 p-6 text-white">
            <h2 className="text-2xl font-semibold tracking-tight">
              License + attribution
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-white/80">
              Editorial content and indexed metadata are released under
              Creative Commons Attribution. Cite the record URL. Upstream
              public-record content remains the property of its publishing
              agency. Bulk re-publishing without attribution is not
              authorized.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
              For partnership-tier access (higher rate limits, webhook push,
              custom connectors, real-time deltas), email{" "}
              <a
                href="mailto:partners@bythepeopleforthepeople.com"
                className="underline"
              >
                partners@bythepeopleforthepeople.com
              </a>
              .
            </p>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
