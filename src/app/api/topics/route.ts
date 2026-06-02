import { topicProfiles } from "@/data/product-loop";
import { jsonOk } from "@/lib/api";

export const dynamic = "force-static";
export const revalidate = 600;

export async function GET() {
  return jsonOk({
    topics: topicProfiles.map((t) => ({
      ...t,
      publicUrl: `/topics/${t.slug}`,
      coverageState: t.relatedItemIds.length > 0 ? "indexed" : "being_indexed",
    })),
    counts: { topics: topicProfiles.length },
  });
}
