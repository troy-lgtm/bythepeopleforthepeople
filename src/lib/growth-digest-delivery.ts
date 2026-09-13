import { sendEmail } from "./email";
import {
  type GrowthDigest,
  buildGrowthDigest,
  renderGrowthDigestHtml,
  renderGrowthDigestSlack,
  renderGrowthDigestText,
} from "./growth-digest";
import { launchFlags } from "./launch-mode";
import { assertCanNotifyRecipient } from "./notification-guard";
import { listPushCapped, listRange } from "./store";

/**
 * Delivery for the weekly growth digest. Two operator channels, both
 * guarded, both optional:
 * - Slack, through GROWTH_DIGEST_WEBHOOK_URL (the guard's operator_webhook
 *   channel: the URL must equal the env value, so no public webhook can
 *   ever ride this path).
 * - Email to the test user (the operator), through the same guarded
 *   sendEmail every other message uses.
 *
 * Nothing configured means a logged no-op, never a throw. Every run is
 * recorded so the Launch Center can show when the operator was last told.
 *
 * Server-side module (window check instead of "server-only" so scripts can
 * import it).
 */

if (typeof window !== "undefined") {
  throw new Error("growth-digest-delivery is server-side only");
}

const LOG_KEY = "growth-digest:log";
const LOG_CAP = 100;
const SLACK_TIMEOUT_MS = 8_000;

export type ChannelOutcome = {
  status: "sent" | "blocked" | "failed" | "not_configured" | "skipped";
  detail?: string;
};

export type GrowthDigestRun = {
  at: string;
  trigger: "cron" | "admin" | "script";
  subject: string;
  headline: string;
  slack: ChannelOutcome;
  email: ChannelOutcome;
  /** Where the visitor numbers came from, so a quiet digest is explainable. */
  visitorStatus: GrowthDigest["visitors"]["status"];
};

async function postToSlack(
  url: string,
  payload: { text: string },
): Promise<ChannelOutcome> {
  const decision = await assertCanNotifyRecipient(url, "operator_webhook", {
    payloadSummary: "growth-digest",
  });
  if (!decision.allowed) {
    return { status: "blocked", detail: decision.reason };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(SLACK_TIMEOUT_MS),
    });
    if (!res.ok) {
      return { status: "failed", detail: `slack responded ${res.status}` };
    }
    return { status: "sent" };
  } catch (err) {
    return {
      status: "failed",
      detail: err instanceof Error ? err.message : "slack request failed",
    };
  }
}

export async function sendGrowthDigest(opts: {
  trigger: GrowthDigestRun["trigger"];
  periodDays?: number;
  now?: Date;
  /** Deliver to Slack when configured (default true). */
  slack?: boolean;
  /** Deliver to the operator's email when configured (default true). */
  email?: boolean;
  /** Prebuilt digest (tests, previews); built fresh otherwise. */
  digest?: GrowthDigest;
}): Promise<GrowthDigestRun> {
  const flags = launchFlags();
  const digest =
    opts.digest ??
    (await buildGrowthDigest({ periodDays: opts.periodDays, now: opts.now, flags }));
  const now = opts.now ?? new Date();

  let slack: ChannelOutcome = { status: "skipped" };
  if (opts.slack !== false) {
    slack = flags.operatorWebhookUrl
      ? await postToSlack(flags.operatorWebhookUrl, renderGrowthDigestSlack(digest))
      : { status: "not_configured", detail: "GROWTH_DIGEST_WEBHOOK_URL unset" };
  }

  let email: ChannelOutcome = { status: "skipped" };
  if (opts.email !== false) {
    const result = await sendEmail({
      to: flags.testUserEmail,
      subject: digest.subject,
      html: renderGrowthDigestHtml(digest),
      text: renderGrowthDigestText(digest),
      metadata: { template: "growth-digest", trigger: opts.trigger },
    });
    email = result.ok
      ? { status: "sent", detail: result.id }
      : result.blocked
        ? { status: "blocked", detail: result.error }
        : result.error === "email_not_configured"
          ? { status: "not_configured", detail: "RESEND_API_KEY unset" }
          : { status: "failed", detail: result.error };
  }

  const run: GrowthDigestRun = {
    at: now.toISOString(),
    trigger: opts.trigger,
    subject: digest.subject,
    headline: digest.headline,
    slack,
    email,
    visitorStatus: digest.visitors.status,
  };
  try {
    await listPushCapped(LOG_KEY, run, LOG_CAP);
  } catch {
    // The send already happened; a failed audit write must not mask it.
  }
  return run;
}

export async function listGrowthDigestRuns(limit = 10): Promise<GrowthDigestRun[]> {
  return listRange<GrowthDigestRun>(LOG_KEY, 0, limit - 1);
}
