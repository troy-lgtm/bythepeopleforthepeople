import { assertCanNotifyRecipient } from "./notification-guard";

/**
 * Single choke-point for outbound mail via Resend.
 *
 * EVERY send — confirm emails, digests, test sends, future templates — flows
 * through sendEmail, and sendEmail itself consults the notification guard
 * before contacting the provider. In private test mode that means only the
 * test user can ever receive mail, no matter what a caller passes in. Blocked
 * attempts are logged by the guard, never silently dropped.
 *
 * Server-side module (also imported by npx-tsx scripts, so no "server-only";
 * the window check enforces the same boundary).
 */

if (typeof window !== "undefined") {
  throw new Error("email is server-side only");
}

export { EMAIL_RE, isEmail } from "./email-shared";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function fromAddress(): string {
  return (
    process.env.DIGEST_FROM_ADDRESS ?? "digest@bythepeopleforthepeople.com"
  );
}

export type SendEmailResult = {
  ok: boolean;
  id?: string;
  error?: string;
  /** True when the notification guard refused the recipient. */
  blocked?: boolean;
};

/**
 * Returns a result object instead of throwing so callers (subscribe, confirm,
 * cron) can degrade gracefully. Adds one-click List-Unsubscribe headers when a
 * token URL is supplied (required for bulk/recurring mail).
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  listUnsubscribeUrl?: string;
  /** Non-sensitive labels for the audit trail (template name, trigger). */
  metadata?: Record<string, string>;
}): Promise<SendEmailResult> {
  const decision = await assertCanNotifyRecipient(opts.to, "email", {
    payloadSummary: `subject: ${opts.subject.slice(0, 120)}${
      opts.metadata ? ` | ${JSON.stringify(opts.metadata).slice(0, 200)}` : ""
    }`,
  });
  if (!decision.allowed) {
    return { ok: false, blocked: true, error: `blocked_${decision.reason}` };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "email_not_configured" };

  const headers: Record<string, string> = {};
  if (opts.listUnsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${opts.listUnsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `By The People, For The People <${fromAddress()}>`,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        headers: Object.keys(headers).length ? headers : undefined,
      }),
    });
    const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        error:
          typeof j.message === "string" ? j.message : `status ${res.status}`,
      };
    }
    return { ok: true, id: typeof j.id === "string" ? j.id : undefined };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "send error",
    };
  }
}
