#!/usr/bin/env -S npx tsx
/**
 * Build the movement digest for the test user, write a local HTML/text
 * preview, and (only if email is configured) send it to the test user
 * through the guarded sendEmail chokepoint.
 *
 *   npm run digest:test
 *
 * It is impossible for this script to email anyone but the test user: the
 * recipient comes from launch flags and sendEmail re-checks the guard.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { logDigest } from "../src/lib/digest-log";
import { emailConfigured, sendEmail } from "../src/lib/email";
import { launchFlags } from "../src/lib/launch-mode";
import {
  buildMovementDigest,
  renderMovementDigestHtml,
  renderMovementDigestText,
} from "../src/lib/movement-digest";
import { siteBaseUrl } from "../src/lib/site-url";
import { getSubscriber } from "../src/lib/subscribers";

async function main() {
  const flags = launchFlags();
  const to = flags.testUserEmail;
  const BASE = siteBaseUrl();
  const sub = await getSubscriber(to);

  const digest = await buildMovementDigest({
    email: to,
    zip: sub?.zip ?? "90046",
    causes: sub?.causes,
    periodDays: 30,
  });
  const urls = sub
    ? {
        unsubscribeUrl: `${BASE}/api/unsubscribe?token=${encodeURIComponent(sub.token)}`,
        manageUrl: `${BASE}/watchlist/manage?token=${encodeURIComponent(sub.token)}`,
      }
    : undefined;
  const html = renderMovementDigestHtml(digest, BASE, urls);
  const text = renderMovementDigestText(digest, BASE, urls);

  const dir = join(process.cwd(), ".artifacts");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "digest-preview.html"), html);
  writeFileSync(join(dir, "digest-preview.txt"), text);

  console.log(`Digest built for ${to}`);
  console.log(`  subject:   ${digest.subject}`);
  console.log(`  movements: ${digest.totalMovements}`);
  console.log(`  private:   ${digest.privateTestMode}`);
  console.log(`  preview:   .artifacts/digest-preview.html`);

  if (!emailConfigured()) {
    await logDigest({
      email: to,
      zip: digest.zip,
      subject: digest.subject,
      itemCount: digest.totalMovements,
      status: "preview",
      trigger: "script",
      at: new Date().toISOString(),
    });
    console.log(
      "\nRESEND_API_KEY is not set, so nothing was sent. Open the preview file",
    );
    console.log("or /api/digest/preview?format=html in the running app.");
    return;
  }

  const result = await sendEmail({
    to,
    subject: digest.subject,
    html,
    text,
    listUnsubscribeUrl: urls?.unsubscribeUrl,
    metadata: { template: "movement-digest", trigger: "script" },
  });
  await logDigest({
    email: to,
    zip: digest.zip,
    subject: digest.subject,
    itemCount: digest.totalMovements,
    status: result.ok ? "sent" : result.blocked ? "blocked" : "failed",
    trigger: "script",
    providerId: result.id,
    error: result.error,
    at: new Date().toISOString(),
  });

  if (result.ok) {
    console.log(`\nSENT to ${to} (provider id: ${result.id ?? "n/a"}).`);
  } else {
    console.error(`\nNOT SENT: ${result.error}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("digest:test failed:", err);
  process.exit(1);
});
