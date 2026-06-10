import { type NextRequest } from "next/server";
import { sourceRecords } from "@/data/records";
import { jsonError, jsonOk, timingSafeEqualStr } from "@/lib/api";
import { assertCanNotifyRecipient } from "@/lib/notification-guard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron handler. Re-pings every indexed source URL and records the
 * verification result. Once the persistence layer lands, this updates the
 * verifiedAt timestamp on each source so the freshness UI stays honest.
 *
 * Triggered by vercel.json cron schedule. Protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return jsonError(
      503,
      "cron_secret_unset",
      "CRON_SECRET is not set. Refusing to run until it is configured.",
    );
  }
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.nextUrl.searchParams.get("secret") ??
    "";
  if (!timingSafeEqualStr(provided, expected)) {
    return jsonError(401, "unauthorized", "Provide CRON_SECRET to invoke.");
  }

  const checks = await Promise.all(
    sourceRecords.map(async (source) => {
      try {
        const res = await fetch(source.url, {
          method: "HEAD",
          headers: {
            "User-Agent": "bythepeopleforthepeople-cron/1.0",
          },
          signal: AbortSignal.timeout(10_000),
        });
        return {
          id: source.id,
          url: source.url,
          ok: res.ok,
          status: res.status,
          contentType: res.headers.get("content-type"),
        };
      } catch (err) {
        return {
          id: source.id,
          url: source.url,
          ok: false,
          status: 0,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );

  const failing = checks.filter((c) => !c.ok);

  if (failing.length > 0 && process.env.CORRECTIONS_WEBHOOK_URL) {
    // Outbound webhooks count as notifications: blocked in private test mode.
    const decision = await assertCanNotifyRecipient(
      process.env.CORRECTIONS_WEBHOOK_URL,
      "webhook",
      { payloadSummary: "source_freshness_alert" },
    );
    if (decision.allowed) {
      fetch(process.env.CORRECTIONS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "source_freshness_alert",
          ranAt: new Date().toISOString(),
          failing,
        }),
      }).catch(() => null);
    }
  }

  return jsonOk({
    ranAt: new Date().toISOString(),
    checked: checks.length,
    healthy: checks.length - failing.length,
    failing,
    note:
      failing.length > 0
        ? "One or more source URLs failed the freshness check. Posted to CORRECTIONS_WEBHOOK_URL when configured."
        : "All sources reachable.",
  });
}
