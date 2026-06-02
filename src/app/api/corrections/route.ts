import { type NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { corrections } from "@/data/corrections";

export const dynamic = "force-dynamic";

type CorrectionReport = {
  recordHref?: string;
  recordTitle?: string;
  description?: string;
  email?: string;
};

export async function GET() {
  return jsonOk({
    corrections,
    count: corrections.length,
    submissionEndpoint: "/api/corrections (POST)",
  });
}

export async function POST(request: NextRequest) {
  const body = (await request
    .json()
    .catch(() => ({}))) as CorrectionReport;
  if (!body.description || body.description.trim().length < 8) {
    return jsonError(
      400,
      "description_required",
      "Provide a description (at least 8 characters) of what is wrong on the record.",
    );
  }
  if (!body.recordHref) {
    return jsonError(
      400,
      "record_required",
      "Provide the record href being corrected, e.g. /bills/ca-sb-79.",
    );
  }

  const submitted = {
    id: `pending-${Date.now().toString(36)}`,
    recordHref: body.recordHref,
    recordTitle: body.recordTitle ?? "Unspecified record",
    description: body.description.trim().slice(0, 2000),
    reporterEmail: body.email ?? null,
    receivedAt: new Date().toISOString(),
    status: "received_pending_review",
  };

  if (process.env.CORRECTIONS_WEBHOOK_URL) {
    fetch(process.env.CORRECTIONS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitted),
    }).catch(() => null);
  }

  return jsonOk({
    received: true,
    message:
      "Correction received and queued for review. If it survives review it will appear in the public /corrections log within 7 days.",
    submitted,
  });
}
