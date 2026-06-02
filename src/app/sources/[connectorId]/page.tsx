import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  PlugZap,
  ShieldCheck,
} from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { SourceTrail } from "@/components/SourceTrail";
import { sourceRecords } from "@/data/records";
import { sourceConnectors } from "@/data/product-loop";
import { breadcrumbSchema } from "@/lib/schema";

type ConnectorPageProps = {
  params: Promise<{ connectorId: string }>;
};

export function generateStaticParams() {
  return sourceConnectors.map((c) => ({ connectorId: c.id }));
}

export async function generateMetadata({
  params,
}: ConnectorPageProps): Promise<Metadata> {
  const { connectorId } = await params;
  const connector = sourceConnectors.find((c) => c.id === connectorId);
  if (!connector) return { title: "Connector not found" };
  return {
    title: `${connector.name} — source connector`,
    description: `${connector.name} (${connector.jurisdiction}) connector status, coverage, and freshness. ${connector.coverage}`,
    alternates: { canonical: `/sources/${connector.id}` },
  };
}

const STATUS_TONE: Record<string, string> = {
  "Indexed source":
    "border-civic-100 bg-civic-50 text-civic-700",
  "Ingestion-ready":
    "border-civic-100 bg-civic-50 text-civic-700",
  "Documented adapter":
    "border-notice-100 bg-notice-50 text-notice-500",
  "Planned coverage":
    "border-record-200 bg-paper-50 text-ink-700",
};

export default async function ConnectorPage({ params }: ConnectorPageProps) {
  const { connectorId } = await params;
  const connector = sourceConnectors.find((c) => c.id === connectorId);
  if (!connector) notFound();

  const relatedSources = sourceRecords.filter((s) =>
    s.jurisdiction === connector.jurisdiction,
  );
  const isIngesting =
    connector.status === "Indexed source" ||
    connector.status === "Ingestion-ready";

  return (
    <PageShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: connector.name,
            description: connector.coverage,
            url: `https://bythepeopleforthepeople.com/sources/${connector.id}`,
            sameAs: connector.upstreamUrl,
            creator: {
              "@type": "GovernmentOrganization",
              name: connector.jurisdiction,
            },
            distribution: relatedSources.map((s) => ({
              "@type": "DataDownload",
              contentUrl: s.url,
              encodingFormat: "text/html",
            })),
          },
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: "Sources", href: "/sources" },
            { name: connector.name, href: `/sources/${connector.id}` },
          ]),
        ]}
      />
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                STATUS_TONE[connector.status] ??
                "border-record-200 bg-paper-50 text-ink-700"
              }`}
            >
              {connector.status}
            </span>
            <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-xs font-medium text-ink-700">
              {connector.jurisdiction}
            </span>
            {connector.adapterEnv ? (
              <span className="rounded-full border border-notice-100 bg-notice-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-notice-500">
                env: {connector.adapterEnv}
              </span>
            ) : null}
          </div>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_0.45fr]">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
                {connector.name}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-ink-700">
                {connector.coverage}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {connector.records.map((r) => (
                  <span
                    key={r}
                    className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-xs font-medium text-ink-700"
                  >
                    {r}
                  </span>
                ))}
              </div>
              {connector.upstreamUrl ? (
                <a
                  href={connector.upstreamUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 hover:border-civic-500"
                >
                  Open upstream system
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
            <div className="rounded-lg border border-record-200 bg-paper-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-civic-700">
                Status
              </p>
              <div className="mt-4 grid gap-4 text-sm">
                <Stat
                  icon={isIngesting ? CheckCircle2 : AlertCircle}
                  iconTone={isIngesting ? "text-civic-700" : "text-notice-500"}
                  label="State"
                  value={connector.status}
                />
                <Stat
                  icon={PlugZap}
                  iconTone="text-civic-700"
                  label="Records produced"
                  value={connector.records.join(", ")}
                />
                <Stat
                  icon={ShieldCheck}
                  iconTone="text-civic-700"
                  label="Jurisdiction"
                  value={connector.jurisdiction}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div>
          <SectionHeader
            eyebrow="Indexed source records"
            title={
              relatedSources.length === 0
                ? "No source records ingested through this connector yet."
                : `${relatedSources.length} indexed source ${relatedSources.length === 1 ? "record" : "records"} from this connector`
            }
            description={
              isIngesting
                ? "Each record is verified at index time. Click any to open the official upstream URL."
                : "Connector is documented but not yet pulling records. See env-var requirements."
            }
          />
          {relatedSources.length > 0 ? (
            <div className="mt-6">
              <SourceTrail sources={relatedSources} />
            </div>
          ) : (
            <article className="mt-6 rounded-lg border border-record-200 bg-paper-50 p-5">
              <p className="text-sm leading-6 text-ink-700">
                Missing data labeled missing. Records appear here as the
                connector ingests them.{" "}
                {connector.adapterEnv
                  ? `Set the ${connector.adapterEnv} environment variable and enable the cron to begin ingestion.`
                  : "Coverage is on the roadmap."}
              </p>
            </article>
          )}
        </div>
        <article className="rounded-lg border border-record-200 bg-white p-6 shadow-line">
          <h2 className="text-base font-semibold text-ink-950">
            Enable / extend this connector
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-700">
            Connectors are the adapters that pull source records from an
            official upstream system into the schema. Each one is documented,
            versioned, and reviewable in the open-source repository.
          </p>
          <ul className="mt-4 grid gap-2 text-xs leading-5 text-ink-700">
            {connector.adapterEnv ? (
              <li className="rounded-md border border-record-200 bg-paper-50 p-3 font-mono">
                {connector.adapterEnv}={"<your key>"}
              </li>
            ) : null}
            <li className="rounded-md border border-record-200 bg-paper-50 p-3">
              Cron: configured in <code>vercel.json</code> via the cron
              schedule.
            </li>
            <li className="rounded-md border border-record-200 bg-paper-50 p-3">
              Source pings: <Link href="/api/sources/check" className="text-civic-700 underline">/api/sources/check</Link>
            </li>
          </ul>
          <p className="mt-5 text-xs leading-5 text-ink-600">
            Want partnership-tier ingestion priority for your jurisdiction?
            Email{" "}
            <a
              href="mailto:partners@bythepeopleforthepeople.com"
              className="text-civic-700 underline"
            >
              partners@bythepeopleforthepeople.com
            </a>
            .
          </p>
        </article>
      </section>
    </PageShell>
  );
}

function Stat({
  icon: Icon,
  iconTone,
  label,
  value,
}: {
  icon: typeof CheckCircle2;
  iconTone: string;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
        <Icon className={`h-3.5 w-3.5 ${iconTone}`} aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 leading-6 text-ink-900">{value}</dd>
    </div>
  );
}
