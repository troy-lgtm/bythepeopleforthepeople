#!/usr/bin/env -S npx tsx
/**
 * Seed the private-pilot test user (Troy) with ZIP 90046 and five catalog
 * causes, pre-confirmed so the digest loop works immediately.
 *
 *   npm run seed:test-user
 *
 * Honesty notes:
 * - Creates exactly one subscriber: the TEST_USER_EMAIL (troy@wearewarp.com
 *   by default). Never anyone else.
 * - No fabricated movement events are seeded. Movement comes from the real
 *   indexed record timelines.
 * - Without Redis env vars this writes to the in-memory store, which only
 *   lives for this process — the script says so loudly.
 */
import { catalogCauseToCause, getCatalogCause } from "../src/lib/cause-catalog";
import { launchFlags } from "../src/lib/launch-mode";
import { storeMode } from "../src/lib/store";
import {
  getSubscriber,
  newToken,
  upsertSubscriber,
} from "../src/lib/subscribers";

const SEED_ZIP = "90046";
const SEED_CAUSE_SLUGS = [
  "homelessness",
  "housing",
  "fires",
  "crime",
  "land-use",
];

async function main() {
  const flags = launchFlags();
  const email = flags.testUserEmail;
  const now = new Date().toISOString();

  const causes = SEED_CAUSE_SLUGS.map((slug) => {
    const c = getCatalogCause(slug);
    if (!c) throw new Error(`Catalog cause missing: ${slug}`);
    return catalogCauseToCause(c);
  });

  const existing = await getSubscriber(email);
  const token = existing?.token ?? newToken();
  await upsertSubscriber({
    email,
    zip: existing?.zip ?? SEED_ZIP,
    causes,
    cadence: existing?.cadence ?? "weekly",
    token,
    confirmed: true,
    createdAt: existing?.createdAt ?? now,
    confirmedAt: existing?.confirmedAt ?? now,
    lastSentAt: existing?.lastSentAt,
    isTestUser: true,
    source: existing?.source ?? "seed-script",
  });

  console.log("Seeded test user");
  console.log(`  email:   ${email}`);
  console.log(`  zip:     ${existing?.zip ?? SEED_ZIP}`);
  console.log(`  causes:  ${SEED_CAUSE_SLUGS.join(", ")}`);
  console.log(`  cadence: ${existing?.cadence ?? "weekly"}`);
  console.log(`  status:  confirmed (double opt-in marked complete by seed)`);
  console.log(`  store:   ${storeMode()}`);
  if (storeMode() === "memory") {
    console.log(
      "\nWARNING: no Redis env vars (KV_REST_API_* or UPSTASH_REDIS_REST_*).",
    );
    console.log(
      "This seed lives only inside this process. To seed the real store, run",
    );
    console.log("with the Redis env vars set (same ones the app uses).");
  } else {
    console.log(
      `\nManage page: /watchlist/manage?token=${encodeURIComponent(token)}`,
    );
  }
  console.log(
    "\nTo exercise the REAL double opt-in instead: subscribe at /digest with",
  );
  console.log(`${email} and click the confirm link in the email.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
