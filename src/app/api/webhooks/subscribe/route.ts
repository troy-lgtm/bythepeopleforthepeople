import { type NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";

type SubscribeBody = {
  url?: string;
  events?: string[];
  contact?: string;
};

const SUPPORTED_EVENTS = [
  "source_freshness_alert",
  "correction_submitted",
  "correction_published",
  "record_status_change",
];

/**
 * Webhook subscription stub.
 *
 * Validates the URL + requested event list and returns a token-style
 * confirmation. Persistent subscriber storage lands when a database is
 * wired (Vercel KV / Neon). Until then, subscribers should email
 * partners@bythepeopleforthepeople.com with the confirmation payload to
 * be added to the static delivery list.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as SubscribeBody;
  if (!body.url) {
    return jsonError(400, "url_required", "Provide a webhook URL.");
  }
  try {
    const u = new URL(body.url);
    if (u.protocol !== "https:") {
      return jsonError(
        400,
        "https_required",
        "Webhook URLs must use HTTPS.",
      );
    }
  } catch {
    return jsonError(400, "invalid_url", "Could not parse the URL.");
  }

  const events =
    body.events && body.events.length > 0
      ? body.events.filter((e) => SUPPORTED_EVENTS.includes(e))
      : SUPPORTED_EVENTS;

  if (events.length === 0) {
    return jsonError(
      400,
      "unsupported_events",
      `No supported events selected. Supported: ${SUPPORTED_EVENTS.join(", ")}`,
    );
  }

  return jsonOk({
    received: true,
    url: body.url,
    events,
    contact: body.contact ?? null,
    nextStep:
      "Persistent subscriber storage lands when a database is wired. Until then, forward this confirmation to partners@bythepeopleforthepeople.com to be added to the static delivery list.",
    confirmationToken: `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  });
}

export async function GET() {
  return jsonOk({
    supportedEvents: SUPPORTED_EVENTS,
    description:
      "POST {url, events?, contact?} to register. URLs must be HTTPS. Event payloads carry source citations in the body.",
    eventShapes: {
      source_freshness_alert: {
        ranAt: "ISO timestamp",
        failing: [{ id: "source-id", url: "https://...", status: 404 }],
      },
      correction_submitted: {
        id: "pending-id",
        recordHref: "/bills/...",
        description: "...",
      },
      correction_published: {
        id: "cor-...",
        recordHref: "/bills/...",
        description: "...",
        fix: "...",
      },
      record_status_change: {
        recordHref: "/bills/...",
        from: "Introduced",
        to: "Chaptered",
        date: "ISO date",
      },
    },
  });
}
