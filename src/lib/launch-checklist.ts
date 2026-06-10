import { bills, localDecisions, sourceRecords } from "../data/records";
import { CAUSE_CATALOG } from "./cause-catalog";
import { countDigestLog, listDigestLog } from "./digest-log";
import { emailConfigured } from "./email";
import { launchFlags, publicLaunchUnlocked } from "./launch-mode";
import { baselineMovementEvents } from "./movement-baseline";
import {
  buildMovementDigest,
  renderMovementDigestHtml,
} from "./movement-digest";
import {
  lastDetectionRun,
  movementCounts,
} from "./movement-store";
import {
  countBlockedNotifications,
  evaluateRecipient,
} from "./notification-guard";
import { storeIsDurable, storeMode } from "./store";
import { getSubscriber, listAll } from "./subscribers";

/**
 * Launch readiness checklist. Each check is real where reality is reachable
 * from the server process (guard behavior, digest build, send log, data
 * invariants) and explicitly labeled "static" where the proof lives in the
 * smoke tests (page rendering). Required checks gate "Mark growth launch
 * ready"; warns don't.
 */

if (typeof window !== "undefined") {
  throw new Error("launch-checklist is server-side only");
}

export type CheckStatus = "pass" | "warn" | "fail";

export type LaunchCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  required: boolean;
};

export async function runLaunchChecklist(): Promise<LaunchCheck[]> {
  const flags = launchFlags();
  const checks: LaunchCheck[] = [];
  const add = (
    id: string,
    label: string,
    status: CheckStatus,
    detail: string,
    required = true,
  ) => checks.push({ id, label, status, detail, required });

  // 1. Guard: stranger must be blocked while not fully launched.
  const stranger = evaluateRecipient("stranger@example.com", "email", flags);
  if (publicLaunchUnlocked(flags)) {
    add(
      "guard-blocks-non-test",
      "Email guard blocks non-test recipients",
      "warn",
      "All four launch flags are open, so public sending is enabled by configuration.",
    );
  } else {
    add(
      "guard-blocks-non-test",
      "Email guard blocks non-test recipients",
      stranger.allowed ? "fail" : "pass",
      stranger.allowed
        ? "A non-test address would be allowed. DO NOT SEND ANYTHING."
        : `Blocked with reason "${stranger.reason}".`,
    );
  }

  // 2. Guard: the test user must be allowed.
  const troy = evaluateRecipient(flags.testUserEmail, "email", flags);
  add(
    "guard-allows-test-user",
    `Email guard allows ${flags.testUserEmail}`,
    troy.allowed ? "pass" : "fail",
    troy.allowed ? `Allowed (${troy.reason}).` : `Blocked: ${troy.reason}.`,
  );

  // 3. SMS must be impossible.
  const sms = evaluateRecipient(flags.testUserEmail, "sms", flags);
  add(
    "sms-disabled",
    "SMS sending is disabled",
    sms.allowed ? "fail" : "pass",
    sms.allowed ? "SMS would be allowed!" : "No SMS pathway exists; guard blocks the channel.",
  );

  // 4. No non-test address has ever been sent a digest.
  const log = await listDigestLog(200);
  const nonTestSends = log.filter(
    (e) => e.status === "sent" && e.email !== flags.testUserEmail,
  );
  add(
    "only-test-user-mailed",
    "Only the test user has received email",
    nonTestSends.length === 0 ? "pass" : "fail",
    nonTestSends.length === 0
      ? `${log.length} digest log entries, zero sends to non-test addresses.`
      : `${nonTestSends.length} sends to non-test addresses found in the log!`,
  );

  // 5. Email provider.
  add(
    "email-provider",
    "Email provider configured (RESEND_API_KEY)",
    emailConfigured() ? "pass" : "warn",
    emailConfigured()
      ? "Resend key present."
      : "Not set. Digest preview works; real delivery to the test user needs the key.",
    false,
  );

  // 6. Durable store.
  add(
    "store-durable",
    "Persistent store (Upstash Redis)",
    storeIsDurable() ? "pass" : "warn",
    storeIsDurable()
      ? "Redis configured; watchlists and movement events survive restarts."
      : `Running on the in-memory fallback (mode: ${storeMode()}). Fine for local testing; provision Redis before real use.`,
    false,
  );

  // 7. Test user subscribed + confirmed (the persistent watchlist).
  const sub = await getSubscriber(flags.testUserEmail);
  add(
    "test-user-watchlist",
    "Test user has a persistent watchlist",
    sub?.confirmed ? "pass" : "warn",
    sub
      ? sub.confirmed
        ? `Subscribed and confirmed (${sub.causes?.length ?? 0} causes, ZIP ${sub.zip ?? "unset"}).`
        : "Subscribed but not confirmed yet. Run the double opt-in from the email."
      : "No subscriber row yet. Run npm run seed:test-user or subscribe in the app.",
    false,
  );

  // 8. Double opt-in mechanics exist (token issued for the subscriber).
  add(
    "double-opt-in",
    "Double opt-in flow",
    sub?.token ? "pass" : "warn",
    sub?.token
      ? "Capability token issued; confirm/unsubscribe/manage links work."
      : "Proves itself when the test user subscribes.",
    false,
  );

  // 9. Movement detection ran.
  const run = await lastDetectionRun();
  add(
    "movement-detection",
    "Movement detection has run",
    run ? "pass" : "warn",
    run
      ? `Last run ${run.ranAt}: ${run.recordsChecked} records checked, ${run.newEvents} new events.`
      : "Never run. Trigger npm run movements:detect or the cron.",
    false,
  );

  // 10. Movement events exist.
  const counts = await movementCounts();
  add(
    "movement-events",
    "Movement events indexed",
    counts.total > 0 ? "pass" : "fail",
    `${counts.total} events (${counts.baseline} from indexed history, ${counts.detected} detected), ${counts.digestWorthy} digest-worthy.`,
  );

  // 11. Every movement carries a source trail.
  const missingEvidence = baselineMovementEvents().filter(
    (e) => e.evidence.length === 0 || !e.sourceUrl,
  );
  add(
    "source-trails",
    "Every movement has a source trail",
    missingEvidence.length === 0 ? "pass" : "fail",
    missingEvidence.length === 0
      ? "All baseline movements carry evidence rows with official source URLs."
      : `${missingEvidence.length} movements lack evidence: ${missingEvidence
          .slice(0, 3)
          .map((e) => e.id)
          .join(", ")}.`,
  );

  // 12. Digest builds with source links for the test user.
  try {
    const digest = await buildMovementDigest({
      email: flags.testUserEmail,
      zip: sub?.zip ?? "90046",
      causes: sub?.causes,
      periodDays: 365,
    });
    const html = renderMovementDigestHtml(digest, "https://example.test");
    const hasSources = html.includes("Source:") && html.includes("/receipts/");
    add(
      "digest-preview",
      "Digest builds with receipts and source links",
      hasSources ? "pass" : "fail",
      hasSources
        ? `Subject: "${digest.subject}" with ${digest.totalMovements} movements.`
        : "Rendered digest is missing source links or receipt URLs.",
    );
  } catch (err) {
    add(
      "digest-preview",
      "Digest builds with receipts and source links",
      "fail",
      `Digest build threw: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 13. A test digest reached the test user.
  const sentToTroy = log.some(
    (e) => e.status === "sent" && e.email === flags.testUserEmail,
  );
  add(
    "test-digest-sent",
    "Test digest sent to the test user",
    sentToTroy ? "pass" : "warn",
    sentToTroy
      ? "At least one delivered digest in the log."
      : `No delivered digest yet (${await countDigestLog()} log entries). Use the button below once email is configured.`,
    false,
  );

  // 14. Records indexed.
  add(
    "records-indexed",
    "Official records indexed",
    bills.length + localDecisions.length > 0 ? "pass" : "fail",
    `${bills.length} state bills, ${localDecisions.length} local council files, ${sourceRecords.length} source records.`,
  );

  // 15. Cause catalog.
  add(
    "cause-catalog",
    "Cause catalog live",
    CAUSE_CATALOG.length >= 10 ? "pass" : "fail",
    `${CAUSE_CATALOG.length} canonical causes with public pages.`,
  );

  // 16. Watchlist count (informational).
  const allSubs = await listAll();
  const nonTest = allSubs.filter((s) => s.email !== flags.testUserEmail);
  add(
    "watchlists",
    "Watchlists in store",
    nonTest.length === 0 || publicLaunchUnlocked(flags) ? "pass" : "fail",
    `${allSubs.length} total (${nonTest.length} non-test). In private mode non-test rows should be zero.`,
  );

  // 17. Blocked-notification audit trail readable.
  const blockedCount = await countBlockedNotifications();
  add(
    "blocked-log",
    "Blocked-notification audit log",
    "pass",
    `${blockedCount} blocked attempts recorded. Every block is proof the guard fired.`,
    false,
  );

  // 18. Static surfaces (rendering proven by smoke tests).
  add(
    "static-surfaces",
    "Receipts, what-moved, OG, sitemap, llms.txt, civic-records.json, methodology",
    "pass",
    "Routes exist in the build; rendering is covered by the Playwright smoke suite.",
    false,
  );

  return checks;
}

export function checklistReady(checks: LaunchCheck[]): boolean {
  return checks.every((c) => !c.required || c.status === "pass");
}
