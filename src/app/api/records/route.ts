import { bills, exploreItems, localDecisions } from "@/data/records";
import { jsonOk } from "@/lib/api";

export const dynamic = "force-static";
export const revalidate = 600;

export async function GET() {
  return jsonOk({
    counts: {
      bills: bills.length,
      localDecisions: localDecisions.length,
      exploreItems: exploreItems.length,
    },
    bills: bills.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      jurisdiction: b.jurisdiction,
      status: b.status,
      sponsor: b.sponsor,
      lastAction: b.lastAction,
      nextAction: b.nextAction,
      topics: b.topics,
      url: `/api/records/${b.slug}`,
      publicUrl: `/bills/${b.slug}`,
    })),
    localDecisions: localDecisions.map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      jurisdiction: d.jurisdiction,
      status: d.status,
      meetingDate: d.meetingDate,
      topics: d.topics,
      url: `/api/records/${d.slug}`,
      publicUrl: `/local/${d.slug}`,
    })),
    exploreItems,
  });
}
