import { answerIntents, sourceEvidence } from "@/data/product-loop";
import { jsonOk } from "@/lib/api";

export const dynamic = "force-static";
export const revalidate = 600;

export async function GET() {
  const evidenceById = new Map(sourceEvidence.map((e) => [e.id, e]));
  return jsonOk({
    answers: answerIntents.map((a) => ({
      ...a,
      evidence: a.evidenceIds
        .map((id) => evidenceById.get(id))
        .filter((e): e is (typeof sourceEvidence)[number] => Boolean(e)),
    })),
    counts: { answers: answerIntents.length },
  });
}
