import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { bills, localDecisions } from "@/data/records";
import {
  allFederalReps,
  getRepBySlug,
  slugForRep,
} from "@/lib/federal-reps";

export const metadata: Metadata = {
  title: "Compare",
  description:
    "Side-by-side comparison of representatives, bills, or local files. Source-anchored.",
  alternates: { canonical: "/compare" },
};

type SearchParams = Promise<{ a?: string; b?: string }>;

type ComparableEntity =
  | {
      kind: "rep";
      title: string;
      subtitle: string;
      href: string;
      rows: Array<{ label: string; value: string }>;
    }
  | {
      kind: "bill";
      title: string;
      subtitle: string;
      href: string;
      rows: Array<{ label: string; value: string }>;
    }
  | {
      kind: "local";
      title: string;
      subtitle: string;
      href: string;
      rows: Array<{ label: string; value: string }>;
    };

function resolve(key: string | undefined): ComparableEntity | null {
  if (!key) return null;
  if (key.startsWith("rep:")) {
    const slug = key.slice(4);
    const rep = getRepBySlug(slug);
    if (!rep) return null;
    const chamber = rep.type === "sen" ? "U.S. Senate" : "U.S. House";
    const district =
      rep.type === "sen" ? rep.state : `${rep.state}-${rep.district}`;
    return {
      kind: "rep",
      title: rep.name,
      subtitle: `${chamber} ${district}`,
      href: `/federal/${slug}`,
      rows: [
        { label: "Chamber", value: chamber },
        { label: "District", value: district ?? "—" },
        { label: "Party", value: rep.party ?? "—" },
        { label: "Office", value: rep.address ?? "—" },
        { label: "Phone", value: rep.phone ?? "—" },
        { label: "Official site", value: rep.url ?? "—" },
        { label: "Bioguide ID", value: rep.id ?? "—" },
      ],
    };
  }
  if (key.startsWith("bill:")) {
    const slug = key.slice(5);
    const bill = bills.find((b) => b.slug === slug);
    if (!bill) return null;
    return {
      kind: "bill",
      title: bill.title,
      subtitle: `${bill.jurisdiction} · ${bill.status}`,
      href: `/bills/${bill.slug}`,
      rows: [
        { label: "Jurisdiction", value: bill.jurisdiction },
        { label: "Status", value: bill.status },
        { label: "Sponsor", value: bill.sponsor },
        { label: "Last action", value: bill.lastAction },
        { label: "Next action", value: bill.nextAction },
        { label: "Sources indexed", value: String(bill.sources.length) },
        { label: "Votes recorded", value: String(bill.votes.length) },
        { label: "Stakeholders named", value: String(bill.stakeholders.length) },
      ],
    };
  }
  if (key.startsWith("local:")) {
    const slug = key.slice(6);
    const d = localDecisions.find((x) => x.slug === slug);
    if (!d) return null;
    return {
      kind: "local",
      title: d.title,
      subtitle: `${d.jurisdiction} · ${d.status}`,
      href: `/local/${d.slug}`,
      rows: [
        { label: "Jurisdiction", value: d.jurisdiction },
        { label: "Status", value: d.status },
        { label: "Department/Committee", value: d.departmentOrCommittee },
        { label: "Meeting date", value: d.meetingDate },
        { label: "Motion summary", value: d.motionSummary },
        { label: "Next procedural step", value: d.nextProceduralStep },
        { label: "Sources indexed", value: String(d.sources.length) },
      ],
    };
  }
  return null;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { a, b } = await searchParams;
  const entityA = resolve(a);
  const entityB = resolve(b);

  const allReps = allFederalReps()
    .slice(0, 50)
    .map((rep) => ({
      key: `rep:${slugForRep(rep)}`,
      label: `${rep.name} (${rep.type === "sen" ? "Senate" : "House"} ${rep.state}${rep.district ? "-" + rep.district : ""})`,
    }));
  const allBills = bills.map((b) => ({
    key: `bill:${b.slug}`,
    label: `Bill: ${b.title.slice(0, 80)}`,
  }));
  const allLocal = localDecisions.map((d) => ({
    key: `local:${d.slug}`,
    label: `Local: ${d.title.slice(0, 80)}`,
  }));
  const options = [...allReps, ...allBills, ...allLocal];

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            as="h1"
            eyebrow="Compare"
            title="Side-by-side civic comparison"
            description="Pick two entities of the same kind to compare them row by row. Source-anchored. No partisan scoring."
          />
          <form
            action="/compare"
            method="get"
            className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                Entity A
              </span>
              <select
                name="a"
                defaultValue={a ?? ""}
                className="h-11 rounded-md border border-record-200 bg-paper-50 px-3 text-sm text-ink-950 outline-none focus:border-civic-500 focus:bg-white"
              >
                <option value="">Select…</option>
                {options.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                Entity B
              </span>
              <select
                name="b"
                defaultValue={b ?? ""}
                className="h-11 rounded-md border border-record-200 bg-paper-50 px-3 text-sm text-ink-950 outline-none focus:border-civic-500 focus:bg-white"
              >
                <option value="">Select…</option>
                {options
                  .filter((opt) => opt.key !== a)
                  .map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center self-end rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
            >
              Compare
            </button>
          </form>
          {a && b && a === b ? (
            <p className="mt-4 rounded-md border border-notice-100 bg-notice-50 px-3 py-2 text-xs leading-5 text-notice-500">
              You picked the same entity for both sides. Choose a different
              Entity B to see a meaningful comparison.
            </p>
          ) : entityA && entityB && entityA.kind !== entityB.kind ? (
            <p className="mt-4 rounded-md border border-notice-100 bg-notice-50 px-3 py-2 text-xs leading-5 text-notice-500">
              Compare works best within the same kind ({entityA.kind} vs{" "}
              {entityB.kind}). Rows are mismatched.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {!entityA || !entityB ? (
          <p className="rounded-lg border border-record-200 bg-paper-50 p-5 text-sm leading-6 text-ink-700">
            Pick two entities above. Comparison is server-rendered, source-
            anchored, and link-shareable.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <EntityCard entity={entityA} other={entityB} />
            <EntityCard entity={entityB} other={entityA} />
          </div>
        )}
      </section>
    </PageShell>
  );
}

function EntityCard({
  entity,
  other,
}: {
  entity: ComparableEntity;
  other: ComparableEntity;
}) {
  const rowsByLabel = new Map<string, string>(
    other.rows.map((r) => [r.label, r.value]),
  );
  return (
    <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
        {entity.kind === "rep"
          ? "Representative"
          : entity.kind === "bill"
            ? "Bill"
            : "Local file"}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-ink-950">
        <Link href={entity.href} className="hover:text-civic-700">
          {entity.title}
        </Link>
      </h2>
      <p className="mt-1 text-sm text-ink-600">{entity.subtitle}</p>
      <dl className="mt-5 grid gap-3">
        {entity.rows.map((row) => {
          const otherValue = rowsByLabel.get(row.label);
          const sameAsOther =
            otherValue !== undefined && otherValue === row.value;
          return (
            <div
              key={row.label}
              className={`grid gap-1 rounded-md border ${sameAsOther ? "border-civic-100 bg-civic-50" : "border-record-200 bg-paper-50"} p-3`}
            >
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                {row.label}
                {sameAsOther ? (
                  <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-civic-700">
                    same
                  </span>
                ) : null}
              </dt>
              <dd className="text-sm leading-6 text-ink-900">
                {/^https?:\/\//.test(row.value) ? (
                  <a
                    href={row.value}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-civic-700 underline hover:text-civic-600"
                  >
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}
