#!/usr/bin/env -S npx tsx
/**
 * Snapshot every indexed record, diff against stored versions, and persist
 * movement events for official changes. Same engine the cron runs.
 *
 *   npm run movements:detect
 */
import {
  detectAndStoreMovements,
  movementCounts,
} from "../src/lib/movement-store";
import { storeMode } from "../src/lib/store";

async function main() {
  const run = await detectAndStoreMovements();
  const counts = await movementCounts();
  console.log("Movement detection run");
  console.log(`  store:           ${storeMode()}`);
  console.log(`  records checked: ${run.recordsChecked}`);
  console.log(`  records changed: ${run.recordsChanged}`);
  console.log(`  new events:      ${run.newEvents}`);
  if (run.liveConfigured === false) {
    console.log(
      "  live ingest:     skipped (OPENSTATES_API_KEY unset) — curated records only",
    );
  } else if (run.liveConfigured) {
    console.log(
      `  live ingest:     ${run.liveTracked} tracked, ${run.liveDiscovered} discovered, ${run.liveRefreshed} refreshed${run.liveErrors?.length ? `, errors: ${run.liveErrors.join(" | ")}` : ""}`,
    );
  }
  if (run.firstRun) {
    console.log(
      "  note: first run stores versions as the baseline; diffs emit from the next run on.",
    );
  }
  console.log(
    `  totals: ${counts.total} events (${counts.baseline} baseline, ${counts.detected} detected), ${counts.digestWorthy} digest-worthy`,
  );
}

main().catch((err) => {
  console.error("movements:detect failed:", err);
  process.exit(1);
});
