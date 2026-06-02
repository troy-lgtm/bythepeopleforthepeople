import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ExternalLink,
  MapPinned,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { PageShell } from "@/components/PageShell";
import { ReportCorrection } from "@/components/ReportCorrection";
import { SectionHeader } from "@/components/SectionHeader";
import { WatchButton } from "@/components/WatchButton";
import { allRepSlugs, getRepBySlug } from "@/lib/federal-reps";
import { breadcrumbSchema } from "@/lib/schema";

type FederalRepPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return allRepSlugs();
}

export async function generateMetadata({
  params,
}: FederalRepPageProps): Promise<Metadata> {
  const { slug } = await params;
  const rep = getRepBySlug(slug);
  if (!rep) {
    return { title: "Representative not found" };
  }
  const chamber = rep.type === "sen" ? "U.S. Senate" : "U.S. House";
  const district =
    rep.type === "sen"
      ? rep.state
      : `${rep.state}-${rep.district}`;
  const description = `${rep.name}, ${chamber} (${district}). Source-anchored civic record with contact information and official site.`;
  const ogParams = new URLSearchParams({
    title: rep.name,
    status: chamber,
    jurisdiction: `${rep.state} · ${rep.party ?? "Unknown affiliation"}`,
    type: "person",
    sources: "1",
    subtitle: rep.address ?? "Federal representative profile",
  });
  const ogUrl = `/og/record?${ogParams.toString()}`;

  return {
    title: `${rep.name} — ${chamber} ${district}`,
    description,
    alternates: { canonical: `/federal/${slug}` },
    openGraph: {
      title: `${rep.name} — ${chamber} ${district}`,
      description,
      type: "profile",
      url: `/federal/${slug}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${rep.name} — ${chamber} ${district}`,
      description,
      images: [ogUrl],
    },
  };
}

export default async function FederalRepPage({ params }: FederalRepPageProps) {
  const { slug } = await params;
  const rep = getRepBySlug(slug);
  if (!rep) notFound();

  const chamber = rep.type === "sen" ? "U.S. Senate" : "U.S. House";
  const district =
    rep.type === "sen"
      ? `${rep.state}, At-large`
      : `${rep.state}-${rep.district}`;
  const watchTargetId = `watch-federal-${slug}`;

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: rep.name,
    jobTitle: `${chamber} member representing ${district}`,
    affiliation: rep.party
      ? { "@type": "PoliticalParty", name: rep.party }
      : undefined,
    worksFor: { "@type": "GovernmentOrganization", name: chamber },
    address: rep.address,
    telephone: rep.phone,
    url: rep.url ?? `https://bythepeopleforthepeople.com/federal/${slug}`,
    identifier: rep.id ?? undefined,
  };

  return (
    <PageShell>
      <JsonLd
        data={[
          personSchema,
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: "Federal representatives", href: "/federal" },
            { name: rep.name, href: `/federal/${slug}` },
          ]),
        ]}
      />
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-ink-800 bg-ink-900 px-2.5 py-1 text-xs font-medium text-white">
              {chamber}
            </span>
            <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-xs font-medium text-ink-700">
              {district}
            </span>
            {rep.party ? (
              <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-xs font-medium text-ink-700">
                {rep.party}
              </span>
            ) : null}
            <WatchButton targetId={watchTargetId} label="Watch profile" />
            <ReportCorrection
              recordHref={`/federal/${slug}`}
              recordTitle={rep.name}
            />
          </div>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_0.45fr]">
            <div>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
                {rep.name}
              </h1>
              <p className="mt-3 text-base text-ink-600">
                {chamber}, representing {district}.
              </p>
              <p className="mt-5 max-w-3xl text-base leading-7 text-ink-700">
                This is a source-anchored civic profile. The bundled
                congress-legislators dataset (United States Project) is the
                primary source for name, party, state, district, contact
                information, and Bioguide identifier. Profile updates land
                in the public{" "}
                <Link href="/corrections" className="text-civic-700 underline">
                  corrections log
                </Link>{" "}
                whenever official records change.
              </p>
            </div>
            <div className="rounded-lg border border-record-200 bg-paper-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-civic-700">
                Contact
              </p>
              <dl className="mt-4 grid gap-4 text-sm">
                {rep.address ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                      Office
                    </dt>
                    <dd className="mt-1 leading-6 text-ink-900">
                      {rep.address}
                    </dd>
                  </div>
                ) : null}
                {rep.phone ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                      Phone
                    </dt>
                    <dd className="mt-1 leading-6 text-ink-900">
                      <a
                        href={`tel:${rep.phone.replace(/[^0-9]/g, "")}`}
                        className="inline-flex items-center gap-2 text-ink-900 hover:text-civic-700"
                      >
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                        {rep.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {rep.url ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                      Official site
                    </dt>
                    <dd className="mt-1 leading-6">
                      <a
                        href={rep.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-ink-900 hover:text-civic-700"
                      >
                        {rep.url}
                        <ExternalLink
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      </a>
                    </dd>
                  </div>
                ) : null}
                {rep.id ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                      Bioguide ID
                    </dt>
                    <dd className="mt-1 font-mono text-xs text-ink-700">
                      {rep.id}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
        <div>
          <SectionHeader
            eyebrow="Watch for"
            title="What this page surfaces as ingestion lands"
            description="Federal voting records, bill sponsorships, committee actions, and statements join this profile as the Congress.gov adapter is enabled."
          />
          <div className="mt-6 grid gap-2 text-sm">
            <Cue label="Roll call votes" />
            <Cue label="Bill sponsorships and cosponsorships" />
            <Cue label="Committee memberships and hearings" />
            <Cue label="Public statements on the official site" />
          </div>
        </div>
        <article className="rounded-lg border border-record-200 bg-white p-6 shadow-line">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
              <MapPinned className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
                State context
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink-950">
                Other federal representatives in {rep.state}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-700">
                Both U.S. senators and every member of the U.S. House from
                {" "}{rep.state} are indexed.
              </p>
              <Link
                href={`/state/${(rep.state ?? "").toLowerCase()}`}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-record-200 bg-paper-50 px-4 text-sm font-semibold text-ink-900 hover:border-civic-500"
              >
                Open {rep.state} place hub
              </Link>
            </div>
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-record-200 bg-paper-50 p-4">
            <ShieldCheck className="h-5 w-5 shrink-0 text-civic-700" aria-hidden="true" />
            <p className="text-sm leading-6 text-ink-700">
              Methodology: this profile is a source-linked navigation point,
              not a candidate score. We do not assign partisan ratings, do
              not rank effectiveness, and do not endorse. Vote records, when
              they land, are presented verbatim with the official roll-call
              source attached.
            </p>
          </div>
        </article>
      </section>

      <section className="border-t border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
          <article className="rounded-lg border border-record-200 bg-paper-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              Voting record
            </p>
            <h2 className="mt-2 text-lg font-semibold text-ink-950">
              Roll-call votes
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              No roll-call vote records indexed for {rep.name} yet. Each vote
              will appear here verbatim from the Congress.gov roll-call API
              once the CONGRESS_API_KEY env var is set and the cron is
              enabled. Member-vote rows on indexed bills already link back to
              this profile.
            </p>
            <p className="mt-3 inline-flex rounded-full border border-notice-100 bg-notice-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-notice-500">
              Pending: CONGRESS_API_KEY
            </p>
          </article>
          <article className="rounded-lg border border-record-200 bg-paper-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              Bill sponsorship
            </p>
            <h2 className="mt-2 text-lg font-semibold text-ink-950">
              Sponsored + cosponsored
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              No sponsored or cosponsored bills indexed yet for {rep.name}.
              Sponsorship records land here from the same Congress.gov
              adapter and link to each bill&apos;s indexed record page.
            </p>
            <p className="mt-3 inline-flex rounded-full border border-notice-100 bg-notice-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-notice-500">
              Pending: CONGRESS_API_KEY
            </p>
          </article>
          <article className="rounded-lg border border-record-200 bg-paper-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              Committee membership
            </p>
            <h2 className="mt-2 text-lg font-semibold text-ink-950">
              Committees + subcommittees
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              No committee assignments indexed yet for {rep.name}. The
              connector pulls assignments from the united-states/congress
              committee-membership feed during each refresh.
            </p>
            <p className="mt-3 inline-flex rounded-full border border-notice-100 bg-notice-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-notice-500">
              Pending: connector enable
            </p>
          </article>
        </div>
      </section>

      <section className="border-t border-record-200 bg-paper-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              Embed
            </p>
            <h2 className="mt-2 text-lg font-semibold text-ink-950">
              Cite {rep.name} in your story
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              Drop this snippet anywhere on your site to render a verified
              civic-profile citation badge. No tracking pixels. No JS hooks.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-md border border-record-200 bg-paper-50 p-3 font-mono text-xs leading-5 text-ink-800">{`<div data-btpftp-embed data-type="federal" data-slug="${slug}"></div>
<script async src="https://bythepeopleforthepeople.com/embed.js"></script>`}</pre>
          </article>
        </div>
      </section>
    </PageShell>
  );
}

function Cue({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-record-200 bg-white px-4 py-3 text-sm font-semibold text-ink-800">
      {label}
    </div>
  );
}

