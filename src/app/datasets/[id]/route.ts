import { NextResponse, type NextRequest } from "next/server";
import { bills, localDecisions, sourceRecords } from "@/data/records";
import { sourceConnectors, topicProfiles } from "@/data/product-loop";
import { allCities } from "@/lib/cities";
import { toCsv } from "@/lib/csv";
import { allFederalReps, slugForRep } from "@/lib/federal-reps";

export const dynamic = "force-static";
export const revalidate = 3600;

const BASE = "https://bythepeopleforthepeople.com";

function dataset(id: string): Array<Record<string, unknown>> | null {
  switch (id) {
    case "records": {
      const rows: Array<Record<string, unknown>> = [];
      bills.forEach((b) =>
        rows.push({
          type: "bill",
          slug: b.slug,
          title: b.title,
          jurisdiction: b.jurisdiction,
          status: b.status,
          sponsor: b.sponsor,
          last_action: b.lastAction,
          next_action: b.nextAction,
          topics: b.topics.join("|"),
          sources_count: b.sources.length,
          watch_target_id: b.watchTargetId,
          public_url: `${BASE}/bills/${b.slug}`,
        }),
      );
      localDecisions.forEach((d) =>
        rows.push({
          type: "local",
          slug: d.slug,
          title: d.title,
          jurisdiction: d.jurisdiction,
          status: d.status,
          department_or_committee: d.departmentOrCommittee,
          meeting_date: d.meetingDate,
          topics: d.topics.join("|"),
          sources_count: d.sources.length,
          watch_target_id: d.watchTargetId,
          public_url: `${BASE}/local/${d.slug}`,
        }),
      );
      return rows;
    }
    case "sources":
      return sourceRecords.map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        url: s.url,
        date: s.date,
        jurisdiction: s.jurisdiction,
        description: s.description,
        provenance: s.provenance,
        indexed_at: s.indexedAt,
        verified_at: s.verifiedAt,
        archive_url: s.archiveUrl ?? "",
      }));
    case "federal-reps":
      return allFederalReps().map((rep) => ({
        bioguide_id: rep.id,
        name: rep.name,
        chamber: rep.type === "sen" ? "senate" : "house",
        state: rep.state,
        district: rep.district ?? "",
        party: rep.party,
        url: rep.url,
        phone: rep.phone,
        address: rep.address,
        slug: slugForRep(rep),
        public_url: `${BASE}/federal/${slugForRep(rep)}`,
      }));
    case "topics":
      return topicProfiles.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        summary: t.summary,
        related_items_count: t.relatedItemIds.length,
        watch_prompts: t.watchPrompts.join("|"),
        sources_count: t.sourceIds.length,
        watch_target_id: t.watchTargetId,
        public_url: `${BASE}/topics/${t.slug}`,
      }));
    case "connectors":
      return sourceConnectors.map((c) => ({
        id: c.id,
        name: c.name,
        jurisdiction: c.jurisdiction,
        status: c.status,
        coverage: c.coverage,
        records: c.records.join("|"),
        adapter_env: c.adapterEnv ?? "",
        upstream_url: c.upstreamUrl ?? "",
        public_url: `${BASE}/sources/${c.id}`,
      }));
    case "cities":
      return allCities().map((c) => ({
        slug: c.slug,
        name: c.name,
        state: c.state,
        population: c.population,
        records_portal: c.recordsPortal ?? "",
        public_url: `${BASE}/city/${c.slug}`,
      }));
    default:
      return null;
  }
}

export function generateStaticParams() {
  return [
    "records",
    "sources",
    "federal-reps",
    "topics",
    "connectors",
    "cities",
  ].flatMap((id) => [{ id: `${id}.csv` }, { id: `${id}.json` }]);
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const dot = id.lastIndexOf(".");
  if (dot < 0) {
    return NextResponse.json(
      { ok: false, error: "Use .csv or .json extension." },
      { status: 404 },
    );
  }
  const base = id.slice(0, dot);
  const ext = id.slice(dot + 1).toLowerCase();
  const rows = dataset(base);
  if (!rows) {
    return NextResponse.json({ ok: false, error: "Unknown dataset" }, { status: 404 });
  }
  if (ext === "json") {
    return NextResponse.json(
      {
        dataset: base,
        rowCount: rows.length,
        generatedAt: new Date().toISOString(),
        license:
          "Creative Commons Attribution. Cite bythepeopleforthepeople.com.",
        rows,
      },
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="btpftp-${base}.json"`,
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  }
  if (ext === "csv") {
    return new NextResponse(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="btpftp-${base}.csv"`,
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }
  return NextResponse.json({ ok: false, error: "Unsupported format" }, { status: 415 });
}
