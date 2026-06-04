import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Landmark, MapPinned, Phone, Users } from "lucide-react";
import { GovCardShare } from "@/components/GovCardShare";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { bills, localDecisions } from "@/data/records";
import { STATE_NAMES } from "@/data/states";
import { slugForRep } from "@/lib/federal-reps";
import { lookupZip, type Place } from "@/lib/place";
import { liveLookupZip } from "@/lib/place-fallback";
import { getRepsForPlace } from "@/lib/reps";
import { countConfirmedByZip } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

const BASE = "https://bythepeopleforthepeople.com";

type GovPageProps = { params: Promise<{ zip: string }> };

type Snapshot = {
  place: Place;
  district: string;
  reps: Array<{ name: string; role: string; slug: string; phone: string | null; party: string | null }>;
  recordsNear: number;
};

function buildSnapshot(place: Place): Snapshot {
  const { houseRep, senators } = getRepsForPlace(place.state, place.cd);
  const district = place.cd === 0 ? "At-large" : `${place.state}-${place.cd}`;
  const reps: Snapshot["reps"] = [];
  for (const s of senators) {
    reps.push({
      name: s.name,
      role: `U.S. Senate · ${s.state}`,
      slug: slugForRep(s),
      phone: s.phone,
      party: s.party,
    });
  }
  if (houseRep) {
    reps.push({
      name: houseRep.name,
      role: `U.S. House · ${district}`,
      slug: slugForRep(houseRep),
      phone: houseRep.phone,
      party: houseRep.party,
    });
  }
  const stateName = STATE_NAMES[place.state] ?? place.state;
  const recordsNear =
    bills.filter((b) =>
      b.jurisdiction.toLowerCase().includes(stateName.toLowerCase()),
    ).length +
    localDecisions.filter((d) =>
      d.jurisdiction.toLowerCase().includes(place.city.toLowerCase()),
    ).length;
  return { place, district, reps, recordsNear };
}

function ogUrl(snap: Snapshot, format?: "story"): string {
  const params = new URLSearchParams({
    city: snap.place.city,
    state: snap.place.state,
    zip: snap.place.zip,
    district: snap.district,
    records: String(snap.recordsNear),
    reps: snap.reps.map((r) => `${r.name}~${r.role}`).join("|"),
  });
  if (format) params.set("format", format);
  return `${BASE}/og/gov?${params.toString()}`;
}

async function resolvePlace(zip: string): Promise<Place | null> {
  const trimmed = zip.trim().slice(0, 5);
  if (!/^\d{5}$/.test(trimmed)) return null;
  return lookupZip(trimmed) ?? (await liveLookupZip(trimmed));
}

export async function generateMetadata({
  params,
}: GovPageProps): Promise<Metadata> {
  const { zip } = await params;
  const place = lookupZip(zip.trim().slice(0, 5));
  if (!place) {
    return {
      title: `Your government · ${zip}`,
      alternates: { canonical: `/gov/${zip}` },
    };
  }
  const snap = buildSnapshot(place);
  const og = ogUrl(snap);
  const title = `What ${place.city}, ${place.state}'s government is doing`;
  const description = `Your US senators, your House member (${snap.district}), and the records affecting ${place.city} ${place.zip}. Nonpartisan, source-anchored.`;
  return {
    title,
    description,
    alternates: { canonical: `/gov/${place.zip}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: og, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

export default async function GovPage({ params }: GovPageProps) {
  const { zip } = await params;
  const place = await resolvePlace(zip);
  if (!place) notFound();

  const snap = buildSnapshot(place);
  const nearbyCount = await countConfirmedByZip(place.zip);
  const shareUrl = `${BASE}/gov/${place.zip}`;
  const cardImg = ogUrl(snap);
  const storyImg = ogUrl(snap, "story");
  const shareText = `What ${place.city}, ${place.state}'s government is actually doing — my senators, my House rep, and the records near me. Nonpartisan, every claim sourced:`;

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-start lg:px-8">
          <div>
            <SectionHeader
              eyebrow="Your government, by level"
              title={`${place.city}, ${place.state}`}
              description={`District ${snap.district} · ${place.county} County · ${snap.recordsNear} indexed records affecting your area. Nonpartisan; every claim links to its official source.`}
            />
            <div className="mt-6">
              <GovCardShare
                shareUrl={shareUrl}
                text={shareText}
                storyUrl={storyImg}
              />
            </div>
            <p className="mt-4 text-xs leading-5 text-ink-600">
              {nearbyCount > 0
                ? `${nearbyCount} ${nearbyCount === 1 ? "person" : "people"} near ${place.zip} get civic updates.`
                : `Be the first near ${place.zip} to get updates.`}{" "}
              <Link
                href="/digest"
                className="font-semibold text-civic-700 hover:text-civic-600"
              >
                Get the digest →
              </Link>
            </p>
          </div>

          {/* Live preview of the shareable card */}
          <div className="overflow-hidden rounded-lg border border-record-200 shadow-panel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardImg}
              alt={`Government snapshot card for ${place.city}, ${place.state} ${place.zip}`}
              width={1200}
              height={630}
              className="w-full"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink-950">
              Who represents you
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-700">
              Your federal delegation. Tap a profile for their record, or call
              the office directly.
            </p>
          </div>
        </div>
        <ul className="mt-6 grid gap-3 md:grid-cols-3">
          {snap.reps.map((rep) => (
            <li key={rep.slug}>
              <article className="h-full rounded-lg border border-record-200 bg-paper-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                  {rep.role}
                </p>
                <h3 className="mt-2 text-base font-semibold text-ink-950">
                  <Link
                    href={`/federal/${rep.slug}`}
                    className="hover:text-civic-700"
                  >
                    {rep.name}
                  </Link>
                </h3>
                {rep.party ? (
                  <p className="mt-0.5 text-xs text-ink-600">{rep.party}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/federal/${rep.slug}`}
                    className="inline-flex items-center gap-1 rounded-full border border-civic-100 bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700 hover:border-civic-500"
                  >
                    Record →
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
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/near-me"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink-950 px-5 text-sm font-semibold text-white hover:bg-ink-800"
          >
            <MapPinned className="h-4 w-4" aria-hidden="true" />
            Your full dashboard
          </Link>
          <Link
            href="/causes/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-5 text-sm font-semibold text-ink-950 shadow-line hover:border-civic-500"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Track an issue you care about
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
