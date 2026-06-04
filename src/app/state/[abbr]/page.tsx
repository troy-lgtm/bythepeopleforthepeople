import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Landmark, MapPinned, ScrollText } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { bills, localDecisions } from "@/data/records";
import { sourceConnectors } from "@/data/product-loop";
import { jurisdictionInState, STATE_CAPITAL, STATE_NAMES } from "@/data/states";
import { repsByState, slugForRep } from "@/lib/federal-reps";
import { breadcrumbSchema } from "@/lib/schema";

type StatePageProps = {
  params: Promise<{ abbr: string }>;
};

export function generateStaticParams() {
  return Object.keys(STATE_NAMES).map((abbr) => ({
    abbr: abbr.toLowerCase(),
  }));
}

export async function generateMetadata({
  params,
}: StatePageProps): Promise<Metadata> {
  const { abbr } = await params;
  const upper = abbr.toUpperCase();
  const name = STATE_NAMES[upper];
  if (!name) return { title: "State not found" };
  const description = `${name} place hub: indexed federal delegation, state bills, local council files, and source connectors covering ${name}.`;
  const ogParams = new URLSearchParams({
    title: name,
    status: "Place hub",
    jurisdiction: `${name} (${upper})`,
    type: "topic",
    subtitle: `Capital: ${STATE_CAPITAL[upper] ?? "—"} · Federal delegation indexed`,
  });
  const ogUrl = `/og/record?${ogParams.toString()}`;
  return {
    title: `${name} — civic records`,
    description,
    alternates: { canonical: `/state/${abbr.toLowerCase()}` },
    openGraph: {
      title: `${name} — civic records`,
      description,
      type: "article",
      url: `/state/${abbr.toLowerCase()}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — civic records`,
      description,
      images: [ogUrl],
    },
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const { abbr } = await params;
  const upper = abbr.toUpperCase();
  const stateName = STATE_NAMES[upper];
  if (!stateName) notFound();

  const grouped = repsByState();
  const reps = grouped[upper] ?? [];
  const senators = reps.filter((r) => r.type === "sen");
  const houseMembers = reps.filter((r) => r.type === "rep");

  const stateBills = bills.filter((b) =>
    jurisdictionInState(b.jurisdiction, upper),
  );
  const stateLocal = localDecisions.filter((d) =>
    jurisdictionInState(d.jurisdiction, upper),
  );
  const stateConnectors = sourceConnectors.filter((c) =>
    jurisdictionInState(c.jurisdiction, upper),
  );

  const totalIndexed =
    reps.length + stateBills.length + stateLocal.length + stateConnectors.length;

  return (
    <PageShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "AdministrativeArea",
            name: stateName,
            url: `https://bythepeopleforthepeople.com/state/${abbr.toLowerCase()}`,
            address: {
              "@type": "PostalAddress",
              addressRegion: upper,
              addressCountry: "US",
            },
          },
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: "States", href: "/federal" },
            { name: stateName, href: `/state/${abbr.toLowerCase()}` },
          ]),
        ]}
      />

      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="inline-flex rounded-full border border-record-200 bg-paper-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            Place hub
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink-950 sm:text-6xl">
            {stateName}
          </h1>
          <p className="mt-3 text-base text-ink-700">
            {upper} · Capital: {STATE_CAPITAL[upper] ?? "—"} · {totalIndexed} indexed entities
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/federal?state=${upper}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
            >
              See full {upper} delegation
            </Link>
            <Link
              href="/explore"
              className="inline-flex h-10 items-center justify-center rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 shadow-line hover:border-civic-500"
            >
              Open Explore
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Federal delegation"
          title={`U.S. Senate + U.S. House from ${stateName}`}
          description={`${senators.length} senators, ${houseMembers.length} House members. Each profile is source-anchored from the bundled congress-legislators dataset.`}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {senators.map((sen) => (
            <article
              key={`sen-${sen.id ?? sen.name}`}
              className="rounded-lg border border-record-200 bg-paper-50 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-civic-700">
                U.S. Senate
              </p>
              <h3 className="mt-2 text-lg font-semibold text-ink-950">
                <Link
                  href={`/federal/${slugForRep(sen)}`}
                  className="hover:text-civic-700"
                >
                  {sen.name}
                </Link>
              </h3>
              <p className="mt-1 text-xs text-ink-600">{sen.party ?? ""}</p>
              {sen.address ? (
                <p className="mt-3 text-xs leading-5 text-ink-600">{sen.address}</p>
              ) : null}
            </article>
          ))}
        </div>
        {houseMembers.length > 0 ? (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
              U.S. House — {upper} delegation
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {houseMembers.map((rep) => (
                <li key={`house-${rep.id ?? rep.name}`}>
                  <Link
                    href={`/federal/${slugForRep(rep)}`}
                    className="flex items-start gap-3 rounded-md border border-record-200 bg-white p-3 shadow-line hover:border-civic-500"
                  >
                    <span className="rounded-full bg-paper-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-700">
                      {upper}-{rep.district}
                    </span>
                    <span className="grid">
                      <span className="text-sm font-semibold text-ink-950">
                        {rep.name}
                      </span>
                      {rep.party ? (
                        <span className="text-xs text-ink-600">{rep.party}</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <SectionHeader
              eyebrow="Indexed bills"
              title={`State-level records for ${stateName}`}
              description={
                stateBills.length === 0
                  ? "No state-level legislative records indexed for this state yet. Coverage expands as adapters land."
                  : `${stateBills.length} indexed.`
              }
            />
            <ul className="mt-6 grid gap-3">
              {stateBills.length === 0 ? (
                <li className="rounded-lg border border-record-200 bg-paper-50 p-4 text-sm leading-6 text-ink-700">
                  Missing data labeled missing. Once the state adapter is
                  enabled, indexed bills appear here.
                </li>
              ) : (
                stateBills.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/bills/${b.slug}`}
                      className="block rounded-lg border border-record-200 bg-paper-50 p-4 transition hover:border-civic-500 hover:bg-white"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-ink-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                          {b.status}
                        </span>
                        <span className="text-xs text-ink-600">
                          {b.jurisdiction}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-ink-950">
                        {b.title}
                      </h3>
                      <p className="mt-1 text-xs text-ink-600">{b.lastAction}</p>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <SectionHeader
              eyebrow="Indexed local files"
              title={`Council, city, and county records in ${stateName}`}
              description={
                stateLocal.length === 0
                  ? "No local council files indexed for this state yet."
                  : `${stateLocal.length} indexed.`
              }
            />
            <ul className="mt-6 grid gap-3">
              {stateLocal.length === 0 ? (
                <li className="rounded-lg border border-record-200 bg-paper-50 p-4 text-sm leading-6 text-ink-700">
                  Missing data labeled missing. Local-file adapters expand
                  coverage city-by-city.
                </li>
              ) : (
                stateLocal.map((d) => (
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
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Source connectors"
          title="Where records for this state come from"
          description="Connectors are the adapters that pull official-record updates into the index."
        />
        <ul className="mt-6 grid gap-3 lg:grid-cols-2">
          {stateConnectors.length === 0 ? (
            <li className="rounded-lg border border-record-200 bg-paper-50 p-4 text-sm leading-6 text-ink-700">
              No state-specific connectors yet. Federal coverage applies via
              Congress.gov when enabled.
            </li>
          ) : (
            stateConnectors.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-record-200 bg-paper-50 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700">
                    {c.status}
                  </span>
                  <span className="rounded-full bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700">
                    {c.jurisdiction}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-ink-950">
                  {c.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-700">
                  {c.coverage}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="border-t border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-lg border border-record-200 bg-paper-50 p-5">
              <Landmark className="h-5 w-5 text-civic-700" aria-hidden="true" />
              <h2 className="mt-3 text-base font-semibold text-ink-950">
                State legislature
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-700">
                Coverage of {stateName} state legislature records expands as
                the connector for each state&apos;s official record system is
                enabled.
              </p>
            </article>
            <article className="rounded-lg border border-record-200 bg-paper-50 p-5">
              <MapPinned className="h-5 w-5 text-civic-700" aria-hidden="true" />
              <h2 className="mt-3 text-base font-semibold text-ink-950">
                Set your ZIP
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-700">
                Personalize the rest of the site to your specific district in
                {" "}{stateName} from the place picker in the header.
              </p>
            </article>
            <article className="rounded-lg border border-record-200 bg-paper-50 p-5">
              <ScrollText className="h-5 w-5 text-civic-700" aria-hidden="true" />
              <h2 className="mt-3 text-base font-semibold text-ink-950">
                See what changed
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-700">
                Subscribe to a state-tagged digest{" "}
                <Link href="/digest" className="text-civic-700 underline">
                  (digest preview)
                </Link>{" "}
                to receive state-specific record events as they index.
              </p>
            </article>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

