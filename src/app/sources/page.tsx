import type { Metadata } from "next";
import Link from "next/link";
import { Database, PlugZap } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { SourceTrail } from "@/components/SourceTrail";
import { sourceRecords } from "@/data/records";
import { sourceConnectors } from "@/data/product-loop";

export const metadata: Metadata = {
  title: "Sources",
  description: "Public source records, provenance labels, and ingestion coverage.",
  alternates: { canonical: "/sources" },
};

export default function SourcesPage() {
  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            as="h1"
            eyebrow="Sources"
            title="The provenance layer behind every answer."
            description="Every claim should point back to a source record. This page shows the indexed source records and the official systems the product is shaped to ingest."
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <div className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
                <PlugZap className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
                  Source systems
              </p>
                <h2 className="mt-1 text-xl font-semibold text-ink-950">
                  Official systems to monitor
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-700">
                  The record model is built around official source ingestion,
                  source-specific change detection, and claim-level provenance.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {sourceConnectors.map((connector) => (
                <article
                  key={connector.id}
                  className="rounded-lg border border-record-200 bg-paper-50 p-4 transition hover:border-civic-500"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700">
                      {connector.status}
                    </span>
                    <span className="rounded-full bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700">
                      {connector.jurisdiction}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-ink-950">
                    <Link
                      href={`/sources/${connector.id}`}
                      className="hover:text-civic-700"
                    >
                      {connector.name}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-700">
                    {connector.coverage}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {connector.records.map((record) => (
                      <span
                        key={record}
                        className="rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-700"
                      >
                        {record}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {connector.adapterEnv ? (
                      <span className="rounded-full border border-notice-100 bg-notice-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-notice-500">
                        env: {connector.adapterEnv}
                      </span>
                    ) : null}
                    {connector.upstreamUrl ? (
                      <a
                        href={connector.upstreamUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 hover:border-civic-500"
                      >
                        Upstream
                      </a>
                    ) : null}
                    <Link
                      href={`/sources/${connector.id}`}
                      className="rounded-full border border-civic-100 bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700 hover:border-civic-500"
                    >
                      Connector page →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
              <Database className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
                Indexed source records
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink-950">
                Public records currently backing the answer layer
              </h2>
            </div>
          </div>
          <div className="mt-5">
            <SourceTrail sources={sourceRecords} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
