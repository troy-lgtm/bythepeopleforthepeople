import { sourceRecords } from "@/data/records";
import { sourceConnectors } from "@/data/product-loop";
import { jsonOk } from "@/lib/api";

export const dynamic = "force-static";
export const revalidate = 600;

export async function GET() {
  return jsonOk({
    sourceRecords,
    connectors: sourceConnectors,
    counts: {
      sources: sourceRecords.length,
      connectors: sourceConnectors.length,
    },
  });
}
