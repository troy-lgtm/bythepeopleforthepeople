import Link from "next/link";
import { MapPinned, Phone, ExternalLink, ArrowUpRight } from "lucide-react";
import { readPlace } from "@/lib/place";
import { getRepsForPlace, type FederalRep } from "@/lib/reps";
import { slugForRep } from "@/lib/federal-reps";
import { PlacePicker } from "./PlacePicker";

export async function YourReps() {
  const place = await readPlace();

  if (!place) {
    return (
      <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
            <MapPinned className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              Your place
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink-950">
              Set your ZIP to see your representatives.
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              Once you set your ZIP, every page personalizes to your district.
              The site shows your US House representative, both US senators, and
              filters records to your jurisdiction where possible.
            </p>
            <div className="mt-4">
              <PlacePicker />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const { houseRep, senators } = getRepsForPlace(place.state, place.cd);
  const districtLabel =
    place.cd === 0 ? "At-large" : `${place.state}-${place.cd}`;

  return (
    <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
            <MapPinned className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              Your place
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink-950">
              {place.city}, {place.state} {place.zip}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              Congressional district {districtLabel}. {place.county} County.
              {place.councilDistrict
                ? ` Council district ${place.councilDistrict}.`
                : ""}
            </p>
          </div>
        </div>
        <PlacePicker
          currentZip={place.zip}
          currentLabel={`${place.city} ${place.zip}`}
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {houseRep ? (
          <RepCard rep={houseRep} role={`U.S. House ${districtLabel}`} />
        ) : (
          <div className="rounded-lg border border-record-200 bg-paper-50 p-4 text-sm leading-6 text-ink-700">
            U.S. House seat for {districtLabel} is not in the current dataset.
          </div>
        )}
        {senators.map((senator) => (
          <RepCard
            key={senator.id ?? senator.name}
            rep={senator}
            role={`U.S. Senate ${place.state}`}
          />
        ))}
      </div>
    </section>
  );
}

function RepCard({ rep, role }: { rep: FederalRep; role: string }) {
  const slug = slugForRep(rep);
  return (
    <article className="group rounded-lg border border-record-200 bg-paper-50 p-4 transition hover:border-civic-500 hover:bg-white">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
          {role}
        </p>
        <Link
          href={`/federal/${slug}`}
          className="text-xs font-semibold text-civic-700 hover:text-civic-600"
          aria-label={`Open ${rep.name} profile`}
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <h3 className="mt-2 text-base font-semibold text-ink-950">
        <Link href={`/federal/${slug}`} className="hover:text-civic-700">
          {rep.name}
        </Link>
      </h3>
      {rep.party ? (
        <p className="mt-1 text-xs font-medium text-ink-600">{rep.party}</p>
      ) : null}
      {rep.address ? (
        <p className="mt-3 text-xs leading-5 text-ink-600">{rep.address}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/federal/${slug}`}
          className="inline-flex items-center gap-1 rounded-full border border-civic-100 bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700 hover:border-civic-500"
        >
          Civic profile →
        </Link>
        {rep.url ? (
          <a
            href={rep.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 hover:border-civic-500"
          >
            Official site
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ) : null}
        {rep.phone ? (
          <a
            href={`tel:${rep.phone.replace(/[^0-9]/g, "")}`}
            className="inline-flex items-center gap-1 rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 hover:border-civic-500"
          >
            <Phone className="h-3 w-3" aria-hidden="true" />
            {rep.phone}
          </a>
        ) : null}
      </div>
    </article>
  );
}
