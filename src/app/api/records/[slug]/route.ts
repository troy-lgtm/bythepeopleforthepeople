import { type NextRequest } from "next/server";
import {
  bills,
  getBillBySlug,
  getLocalDecisionBySlug,
  localDecisions,
} from "@/data/records";
import { jsonOk, jsonError } from "@/lib/api";

export const dynamic = "force-static";
export const revalidate = 600;

export async function generateStaticParams() {
  return [
    ...bills.map((b) => ({ slug: b.slug })),
    ...localDecisions.map((d) => ({ slug: d.slug })),
  ];
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const bill = getBillBySlug(slug);
  if (bill) {
    return jsonOk(
      { kind: "bill", record: bill, publicUrl: `/bills/${bill.slug}` },
      { etag: `${bill.id}-${bill.lastAction}` },
    );
  }
  const decision = getLocalDecisionBySlug(slug);
  if (decision) {
    return jsonOk(
      {
        kind: "local_decision",
        record: decision,
        publicUrl: `/local/${decision.slug}`,
      },
      { etag: `${decision.id}-${decision.meetingDate}` },
    );
  }
  return jsonError(
    404,
    "record_not_found",
    `No bill or local decision indexed at slug "${slug}". This is a labeled missing record, not a silent empty.`,
  );
}
