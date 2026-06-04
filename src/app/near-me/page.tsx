import type { Metadata } from "next";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  Building2,
  ExternalLink,
  Landmark,
  MapPinned,
  Phone,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { bills, localDecisions } from "@/data/records";
import { STATE_NAMES } from "@/data/states";
import {
  congressConfigured,
  getMemberLegislation,
  type MemberLegislation,
} from "@/lib/congress";
import { slugForRep } from "@/lib/federal-reps";
import { geocodeZip } from "@/lib/geo";
import {
  getOfficialsByPoint,
  openStatesConfigured,
  type Official,
} from "@/lib/openstates";
import { readCauses } from "@/lib/causes";
import { readPlace } from "@/lib/place";
import { getRepsForPlace, type FederalRep } from "@/lib/reps";

export const metadata: Metadata = {
  title: "Near me",
  description:
    "Enter your ZIP and see who represents you at every level — US senators, your House member, your state legislators, and local officials — with the records that affect your place.",
  alternates: { canonical: "/near-me" },
};

export const dynamic = "force-dynamic";

export default async function NearMePage() {
  const place = await readPlace();

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Your government, by level"
            title="Who represents you — and what they're doing."
            description="One ZIP. Everyone from your city council up to your US senators, with the indexed records that hit close to home. Federal is live now; state and local fill in from official data, never invented."
          />
          <div className="mt-6 max-w-xl">
            <LocationAutocomplete
              currentZip={place?.zip}
              currentLabel={
                place ? `${place.city}, ${place.state} ${place.zip}` : null
              }
            />
          </div>
          {place ? (
            <Link
              href={`/gov/${place.zip}`}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-civic-100 bg-civic-50 px-4 text-sm font-semibold text-civic-700 transition hover:border-civic-500"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Get a shareable card of your government →
            </Link>
          ) : null}
        </div>
      </section>

      {place ? (
        <Levels place={place} />
      ) : (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-record-200 bg-white p-8 text-center shadow-line">
            <MapPinned
              className="mx-auto h-8 w-8 text-civic-700"
              aria-hidden="true"
            />
            <h2 className="mt-4 text-xl font-semibold text-ink-950">
              Enter your ZIP to build your ladder.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-700">
              We resolve your district and surface your representatives at each
              level of government, plus the records that affect your place.
            </p>
          </div>
        </section>
      )}
    </PageShell>
  );
}

async function Levels({
  place,
}: {
  place: NonNullable<Awaited<ReturnType<typeof readPlace>>>;
}) {
  const stateName = STATE_NAMES[place.state] ?? place.state;
  const districtLabel = place.cd === 0 ? "At-large" : `${place.state}-${place.cd}`;

  const { houseRep, senators } = getRepsForPlace(place.state, place.cd);
  const federal = [houseRep, ...senators].filter(Boolean) as FederalRep[];

  const latlng = await geocodeZip(place.zip);
  const officialsRes = latlng
    ? await getOfficialsByPoint(latlng.lat, latlng.lng)
    : { configured: openStatesConfigured(), officials: [] as Official[] };
  const stateOfficials = officialsRes.officials.filter((o) => o.level === "state");
  const localOfficials = officialsRes.officials.filter(
    (o) => o.level === "municipality" || o.level === "county",
  );

  const legByBioguide = new Map<string, MemberLegislation>();
  if (congressConfigured()) {
    const results = await Promise.all(
      federal.map((r) => getMemberLegislation(r.id ?? "")),
    );
    federal.forEach((r, i) => {
      if (r.id) legByBioguide.set(r.id, results[i]);
    });
  }

  const stateBills = bills
    .filter((b) => b.jurisdiction.toLowerCase().includes(stateName.toLowerCase()))
    .slice(0, 6);
  const localFiles = localDecisions
    .filter((d) => d.jurisdiction.toLowerCase().includes(place.city.toLowerCase()))
    .slice(0, 6);

  const causes = await readCauses();
  const nearbyCauses = causes
    .filter((c) =>
      c.jurisdictions.some(
        (j) =>
          j.toLowerCase().includes(place.city.toLowerCase()) ||
          j.toLowerCase().includes(stateName.toLowerCase()),
      ),
    )
    .slice(0, 4);

  return (
    <>
      {/* FEDERAL */}
      <LevelSection
        icon={Landmark}
        eyebrow="Federal · live"
        title={`Your US delegation`}
        sub={`2 senators for ${stateName} + your House member (${districtLabel}).`}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {senators.map((s) => (
            <FederalCard
              key={s.id ?? s.name}
              rep={s}
              role={`U.S. Senate · ${place.state}`}
              leg={s.id ? legByBioguide.get(s.id) : undefined}
            />
          ))}
          {houseRep ? (
            <FederalCard
              rep={houseRep}
              role={`U.S. House · ${districtLabel}`}
              leg={houseRep.id ? legByBioguide.get(houseRep.id) : undefined}
            />
          ) : (
            <Missing text={`U.S. House seat for ${districtLabel} is not in the current dataset.`} />
          )}
        </div>
        {!congressConfigured() ? (
          <ConnectNote
            what="Congress.gov"
            why="to show each member's sponsored bills and votes."
            href="https://api.congress.gov/sign-up/"
          />
        ) : null}
      </LevelSection>

      {/* STATE */}
      <LevelSection
        icon={Building2}
        eyebrow={`State · ${stateName}`}
        title="Your state legislators"
        sub="The people writing state law for your district."
        alt
      >
        {stateOfficials.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {stateOfficials.map((o) => (
              <OfficialCard key={o.id} official={o} />
            ))}
          </div>
        ) : !officialsRes.configured ? (
          <ConnectNote
            what="OpenStates"
            why="to show your real state senators and assembly/house members by district."
            href="https://open.pluralpolicy.com/accounts/signup/"
          />
        ) : (
          <Missing
            text={`OpenStates returned no state legislators for this point${officialsRes.error ? ` (${officialsRes.error})` : ""}.`}
            href={`/state/${place.state.toLowerCase()}`}
            hrefLabel={`Open the ${stateName} hub`}
          />
        )}
        {stateBills.length > 0 ? (
          <RecordList
            heading={`Indexed ${stateName} bills`}
            items={stateBills.map((b) => ({
              title: b.title,
              meta: `${b.status}`,
              href: `/bills/${b.slug}`,
            }))}
          />
        ) : null}
      </LevelSection>

      {/* LOCAL */}
      <LevelSection
        icon={MapPinned}
        eyebrow={`Local · ${place.city}, ${place.county} County`}
        title="City & county"
        sub="Council and county officials where the data exists — plus your local records."
      >
        {localOfficials.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {localOfficials.map((o) => (
              <OfficialCard key={o.id} official={o} />
            ))}
          </div>
        ) : (
          <Missing
            text="No free national roster covers every city/county official, so we don't invent them. Where OpenStates covers your town, they appear here; otherwise use your indexed local records and the state hub."
            href={`/state/${place.state.toLowerCase()}`}
            hrefLabel={`Open the ${stateName} hub`}
          />
        )}
        {localFiles.length > 0 ? (
          <RecordList
            heading={`Indexed ${place.city} files`}
            items={localFiles.map((d) => ({
              title: d.title,
              meta: d.status,
              href: `/local/${d.slug}`,
            }))}
          />
        ) : null}
      </LevelSection>

      {/* CAUSES */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Causes for your place"
          title="Track what matters here"
          description="Your causes scoped to this place. New matching records surface on the cause and in your digest."
        />
        {nearbyCauses.length > 0 ? (
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {nearbyCauses.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/causes/${c.id}`}
                  className="flex items-center gap-3 rounded-lg border border-record-200 bg-white p-4 shadow-line transition hover:border-civic-500"
                >
                  {c.emoji ? (
                    <span className="text-xl" aria-hidden="true">
                      {c.emoji}
                    </span>
                  ) : null}
                  <span className="text-sm font-semibold text-ink-950">
                    {c.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Link
            href="/causes/new"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink-950 px-5 text-sm font-semibold text-white hover:bg-ink-800"
          >
            Track a cause for {place.city}
          </Link>
        )}
      </section>
    </>
  );
}

function LevelSection({
  icon: Icon,
  eyebrow,
  title,
  sub,
  alt,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  sub: string;
  alt?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={alt ? "border-y border-record-200 bg-white" : ""}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-950">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-700">{sub}</p>
          </div>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

function FederalCard({
  rep,
  role,
  leg,
}: {
  rep: FederalRep;
  role: string;
  leg?: MemberLegislation;
}) {
  const slug = slugForRep(rep);
  const recent = leg ? [...leg.sponsored].slice(0, 2) : [];
  return (
    <article className="rounded-lg border border-record-200 bg-paper-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
        {role}
      </p>
      <h3 className="mt-2 text-base font-semibold text-ink-950">
        <Link href={`/federal/${slug}`} className="hover:text-civic-700">
          {rep.name}
        </Link>
      </h3>
      {rep.party ? (
        <p className="mt-0.5 text-xs text-ink-600">{rep.party}</p>
      ) : null}
      {recent.length > 0 ? (
        <div className="mt-3 border-t border-record-200 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-600">
            Recent sponsored
          </p>
          <ul className="mt-1 grid gap-1">
            {recent.map((b, i) => (
              <li key={i} className="text-xs leading-5 text-ink-700">
                {b.url ? (
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-civic-700"
                  >
                    {b.title.slice(0, 80)}
                  </a>
                ) : (
                  b.title.slice(0, 80)
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/federal/${slug}`}
          className="inline-flex items-center gap-1 rounded-full border border-civic-100 bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700 hover:border-civic-500"
        >
          Civic profile →
        </Link>
        {rep.phone ? (
          <a
            href={`tel:${rep.phone.replace(/[^0-9]/g, "")}`}
            className="inline-flex items-center gap-1 rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 hover:border-civic-500"
          >
            <Phone className="h-3 w-3" aria-hidden="true" />
            Call
          </a>
        ) : null}
      </div>
    </article>
  );
}

function OfficialCard({ official }: { official: Official }) {
  return (
    <article className="rounded-lg border border-record-200 bg-paper-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
        {official.title}
        {official.district ? ` · District ${official.district}` : ""}
      </p>
      <h3 className="mt-2 text-base font-semibold text-ink-950">
        {official.url ? (
          <a
            href={official.url}
            target="_blank"
            rel="noreferrer"
            className="hover:text-civic-700"
          >
            {official.name}
          </a>
        ) : (
          official.name
        )}
      </h3>
      <p className="mt-0.5 text-xs text-ink-600">
        {official.party ? `${official.party} · ` : ""}
        {official.jurisdiction}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {official.url ? (
          <a
            href={official.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 hover:border-civic-500"
          >
            Profile
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ) : null}
        {official.email ? (
          <a
            href={`mailto:${official.email}`}
            className="inline-flex items-center gap-1 rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 hover:border-civic-500"
          >
            Email
          </a>
        ) : null}
      </div>
    </article>
  );
}

function RecordList({
  heading,
  items,
}: {
  heading: string;
  items: Array<{ title: string; meta: string; href: string }>;
}) {
  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">
        {heading}
      </p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className="block rounded-md border border-record-200 bg-white p-3 transition hover:border-civic-500"
            >
              <p className="text-sm font-semibold text-ink-950">{it.title}</p>
              <p className="mt-0.5 text-xs text-ink-600">{it.meta}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Missing({
  text,
  href,
  hrefLabel,
}: {
  text: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-record-200 bg-paper-50 p-4 text-sm leading-6 text-ink-700">
      {text}
      {href && hrefLabel ? (
        <Link
          href={href}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-civic-700 hover:gap-2"
        >
          {hrefLabel} →
        </Link>
      ) : null}
    </div>
  );
}

function ConnectNote({
  what,
  why,
  href,
}: {
  what: string;
  why: string;
  href: string;
}) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-lg border border-notice-100 bg-notice-50 p-4">
      <ShieldCheck
        className="mt-0.5 h-5 w-5 shrink-0 text-notice-500"
        aria-hidden="true"
      />
      <p className="text-xs leading-5 text-ink-700">
        <span className="font-semibold text-ink-950">Connect {what}</span> {why}{" "}
        The integration is built; it lights up the moment the API key is set.{" "}
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-civic-700 underline"
        >
          Get a free key
        </a>
        .
      </p>
    </div>
  );
}
