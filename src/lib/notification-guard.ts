import { EMAIL_RE } from "./email-shared";
import {
  type LaunchFlags,
  isTestUserEmail,
  launchFlags,
  publicLaunchUnlocked,
} from "./launch-mode";
import { listLength, listPushCapped, listRange } from "./store";

/**
 * The single outbound-notification guard. EVERY pathway that could message a
 * human (email, sms, webhook, push) must pass through assertCanNotifyRecipient
 * before sending. sendEmail() in email.ts calls it internally, so no email
 * call site can bypass it even by accident.
 *
 * Rules (fail closed):
 * - sms and push are disabled, full stop. No wiring exists and none may send.
 * - webhooks are blocked while private test mode is on.
 * - email to the test user is always allowed (subject to provider config).
 * - email to anyone else is blocked while PRIVATE_TEST_MODE is on, and
 *   blocked while ALLOW_NON_TEST_EMAILS is not "true".
 * - Every block is logged (console + store) so the Launch Center can prove
 *   "no one except the test user was ever messaged."
 */

if (typeof window !== "undefined") {
  throw new Error("notification-guard is server-side only");
}

export type NotificationChannel = "email" | "sms" | "webhook" | "push";

export type GuardDecision = {
  allowed: boolean;
  /** Machine-readable reason, e.g. "test_user", "private_test_mode". */
  reason: string;
};

export type BlockedNotification = {
  recipient: string;
  channel: NotificationChannel;
  reason: string;
  /** Non-sensitive context only (subject line, template name). Never bodies. */
  payloadSummary?: string;
  createdAt: string;
};

const BLOCKED_KEY = "guard:blocked";
const BLOCKED_CAP = 500;

/** Pure decision logic — unit-testable across every flag combination. */
export function evaluateRecipient(
  recipient: string,
  channel: NotificationChannel,
  flags: LaunchFlags,
): GuardDecision {
  if (channel === "sms") {
    return { allowed: false, reason: "sms_disabled" };
  }
  if (channel === "push") {
    return { allowed: false, reason: "push_disabled" };
  }
  if (channel === "webhook") {
    return publicLaunchUnlocked(flags)
      ? { allowed: true, reason: "launch_unlocked" }
      : { allowed: false, reason: "webhook_blocked_in_private_test_mode" };
  }

  // channel === "email"
  const email = recipient.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { allowed: false, reason: "invalid_email" };
  }
  if (isTestUserEmail(email, flags)) {
    return { allowed: true, reason: "test_user" };
  }
  if (flags.privateTestMode) {
    return { allowed: false, reason: "private_test_mode" };
  }
  if (!flags.allowNonTestEmails) {
    return { allowed: false, reason: "non_test_emails_disabled" };
  }
  return { allowed: true, reason: "public_sending_enabled" };
}

/**
 * Decide whether `recipient` may be notified on `channel`, logging every
 * block. Returns the decision instead of throwing so callers can degrade
 * gracefully — but a blocked decision means DO NOT SEND, ever.
 */
export async function assertCanNotifyRecipient(
  recipient: string,
  channel: NotificationChannel = "email",
  context?: { payloadSummary?: string },
): Promise<GuardDecision> {
  const decision = evaluateRecipient(recipient, channel, launchFlags());
  if (!decision.allowed) {
    await logBlockedNotification({
      recipient: recipient.trim().toLowerCase(),
      channel,
      reason: decision.reason,
      payloadSummary: context?.payloadSummary,
      createdAt: new Date().toISOString(),
    });
  }
  return decision;
}

async function logBlockedNotification(
  entry: BlockedNotification,
): Promise<void> {
  console.warn(
    `[notification-guard] BLOCKED ${entry.channel} to ${entry.recipient}: ${entry.reason}` +
      (entry.payloadSummary ? ` (${entry.payloadSummary})` : ""),
  );
  try {
    await listPushCapped(BLOCKED_KEY, entry, BLOCKED_CAP);
  } catch {
    // The block already happened and was logged to console; storage of the
    // audit row must never turn into a crash that could mask the block.
  }
}

export async function listBlockedNotifications(
  limit = 50,
): Promise<BlockedNotification[]> {
  return listRange<BlockedNotification>(BLOCKED_KEY, 0, limit - 1);
}

export async function countBlockedNotifications(): Promise<number> {
  return listLength(BLOCKED_KEY);
}
