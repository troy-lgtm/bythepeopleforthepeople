import { type NextRequest } from "next/server";
import { buildDigest, renderDigestHtml, renderDigestText } from "@/lib/digest";
import { jsonError, jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const BASE = "https://bythepeopleforthepeople.com";

type SendRequest = {
  to?: string;
  zip?: string;
  watchedIds?: string[];
  dryRun?: boolean;
};

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-digest-send-secret");
  const expected = process.env.DIGEST_SEND_SECRET;
  if (!expected) {
    return jsonError(
      503,
      "send_not_configured",
      "DIGEST_SEND_SECRET is not set. Configure it in the deployment environment to enable digest delivery.",
    );
  }
  if (secret !== expected) {
    return jsonError(401, "unauthorized", "Provide a valid x-digest-send-secret header.");
  }

  const body = (await request.json().catch(() => ({}))) as SendRequest;
  if (!body.to || !body.to.includes("@")) {
    return jsonError(400, "to_required", "Provide a recipient email in `to`.");
  }

  const payload = buildDigest({ zip: body.zip, watchedIds: body.watchedIds });
  const html = renderDigestHtml(payload, BASE);
  const text = renderDigestText(payload, BASE);

  if (body.dryRun) {
    return jsonOk({
      dryRun: true,
      recipient: body.to,
      payload,
      preview: { htmlBytes: html.length, textBytes: text.length },
    });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress =
    process.env.DIGEST_FROM_ADDRESS ?? "digest@bythepeopleforthepeople.com";

  if (!resendKey) {
    return jsonError(
      503,
      "resend_not_configured",
      "RESEND_API_KEY is not set. The digest renderer is ready; configure the API key to enable real delivery.",
    );
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `By The People, For The People <${fromAddress}>`,
        to: [body.to],
        subject: payload.forZip
          ? `Civic-records digest for ${payload.forZip}`
          : "Civic-records digest",
        html,
        text,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok) {
      return jsonError(
        res.status,
        "resend_failed",
        typeof json.message === "string"
          ? json.message
          : `Resend rejected the request with status ${res.status}.`,
      );
    }
    return jsonOk({
      sent: true,
      recipient: body.to,
      providerId: json.id ?? null,
      providerResponse: json,
    });
  } catch (err) {
    return jsonError(
      502,
      "delivery_error",
      err instanceof Error ? err.message : "Unknown delivery error.",
    );
  }
}
