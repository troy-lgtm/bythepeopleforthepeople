import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPinned, ShieldCheck } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { PageShell } from "@/components/PageShell";
import { ReportCorrection } from "@/components/ReportCorrection";
import { SectionHeader } from "@/components/SectionHeader";
import { localDecisions } from "@/data/records";
import { STATE_NAMES } from "@/data/states";
import { allCities, getCityBySlug } from "@/lib/cities";
import { breadcrumbSchema } from "@/lib/schema";

type CityPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return allCities().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return { title: "City not found" };
  const stateName = STATE_NAMES[city.state] ?? city.state;
  const description = `${city.name}, ${stateName} place hub: indexed local files, the official public-records portal, and federal representation overview. Population ${city.population.toLocaleString()}.`;
  const ogParams = new URLSearchParams({
    title: `${city.name}, ${city.state}`,
    status: "Place hub",
    jurisdiction: stateName,
    type: "topic",
    subtitle: `Population ${city.population.toLocaleString()} · ${city.recordsPortal ? "Records portal indexed" : "Records portal pending"}`,
  });
  const ogUrl = `/og/record?${ogParams.toString()}`;
  return {
    title: `${city.name}, ${city.state} — civic records`,
    description,
    alternates: { canonical: `/city/${slug}` },
    openGraph: {
      title: `${city.name}, ${city.state} — civic records`,
      description,
      type: "article",
      url: `/city/${slug}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${city.name}, ${city.state} — civic records`,
      description,
      images: [ogUrl],
    },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  const stateName = STATE_NAMES[city.state] ?? city.state;
  const cityNameLower = city.name.toLowerCase();
  const indexedFiles = localDecisions.filter((d) =>
    d.jurisdiction.toLowerCase().includes(cityNameLower),
  );

  return (
    <PageShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "City",
            name: `${city.name}, ${city.state}`,
            url: `https://bythepeopleforthepeople.com/city/${slug}`,
            address: {
              "@type": "PostalAddress",
              addressLocality: city.name,
              addressRegion: city.state,
              addressCountry: "US",
            },
          },
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: stateName, href: `/state/${city.state.toLowerCase()}` },
            { name: city.name, href: `/city/${slug}` },
          ]),
        ]}
      />
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
              Place hub
            </span>
            <Link
              href={`/state/${city.state.toLowerCase()}`}
              className="rounded-full border border-civic-100 bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700 hover:border-civic-500"
            >
              {stateName}
            </Link>
            <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-ink-700">
              Pop {city.population.toLocaleString()}
            </span>
            <ReportCorrection
              recordHref={`/city/${slug}`}
              recordTitle={`${city.name}, ${city.state}`}
            />
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink-950 sm:text-6xl">
            {city.name}, {city.state}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink-700">
            Source-anchored civic hub for {city.name}. Local council files,
            agendas, votes, and public-comment opportunities surface here as
            the {city.name} adapter is enabled. Federal representatives for
            {" "}{city.state} are indexed below.
          </p>
          {city.recordsPortal ? (
            <a
              href={city.recordsPortal}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
            >
              Open {city.name} records portal
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <article>
          <SectionHeader
            eyebrow="Indexed local records"
            title={
              indexedFiles.length === 0
                ? "No council files indexed yet"
                : `${indexedFiles.length} ${indexedFiles.length === 1 ? "file" : "files"} indexed`
            }
            description={
              indexedFiles.length === 0
                ? "Coverage being indexed. When the adapter for this city lights up, indexed council files appear here with full timeline, votes, and source trail."
                : "Each card opens the full record with timeline, votes, sources, and take-action surfaces."
            }
          />
          <ul className="mt-6 grid gap-3">
            {indexedFiles.length === 0 ? (
              <li className="rounded-lg border border-record-200 bg-paper-50 p-5 text-sm leading-6 text-ink-700">
                Missing data is labeled missing. Until the adapter for
                {" "}{city.name} ingests records, click through to the
                official records portal above to read primary sources.
              </li>
            ) : (
              indexedFiles.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/local/${d.slug}`}
                    className="block rounded-lg border border-record-200 bg-paper-50 p-4 transition hover:border-civic-500 hover:bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-ink-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                        {d.status}
                      </span>
                      <span className="text-xs text-ink-600">
                        {d.jurisdiction}
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-ink-950">
                      {d.title}
                    </h3>
                    <p className="mt-1 text-xs text-ink-600">
                      {d.departmentOrCommittee} · {d.meetingDate}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </article>
        <aside className="grid content-start gap-4">
          <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
            <MapPinned className="h-5 w-5 text-civic-700" aria-hidden="true" />
            <h2 className="mt-3 text-base font-semibold text-ink-950">
              State context
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              {city.name} is in {stateName}. The state hub aggregates federal
              delegation, state-level bills, and other indexed records.
            </p>
            <Link
              href={`/state/${city.state.toLowerCase()}`}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-record-200 bg-paper-50 px-4 text-sm font-semibold text-ink-900 hover:border-civic-500"
            >
              Open {stateName} hub →
            </Link>
          </article>
          <article className="rounded-lg border border-record-200 bg-paper-50 p-5">
            <ShieldCheck className="h-5 w-5 text-civic-700" aria-hidden="true" />
            <h2 className="mt-3 text-base font-semibold text-ink-950">
              How coverage expands
            </h2>
            <ol className="mt-2 grid list-decimal gap-1 pl-5 text-sm leading-6 text-ink-700">
              <li>City&apos;s public-records portal is added (above).</li>
              <li>
                Connector adapter is written to ingest council agendas, votes,
                and ordinances.
              </li>
              <li>
                Daily cron refreshes records; freshness checks alert on source
                drift.
              </li>
              <li>
                Records appear here with full timeline, votes, sources, and
                take-action surfaces.
              </li>
            </ol>
            <p className="mt-3 text-xs leading-5 text-ink-600">
              Want {city.name} adapter prioritized? Email{" "}
              <a
                href="mailto:partners@bythepeopleforthepeople.com"
                className="text-civic-700 underline"
              >
                partners@bythepeopleforthepeople.com
              </a>
              .
            </p>
          </article>
        </aside>
      </section>
    </PageShell>
  );
}
