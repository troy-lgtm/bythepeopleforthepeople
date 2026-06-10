#!/usr/bin/env -S npx tsx
/**
 * Run the launch readiness checklist and print a pass/fail table.
 * Read-only: never sends a message of any kind.
 *
 *   npm run launch:check
 *
 * Exit code 0 when every required check passes, 1 otherwise.
 */
import {
  checklistReady,
  runLaunchChecklist,
} from "../src/lib/launch-checklist";
import { launchFlags, modeLabel } from "../src/lib/launch-mode";
import { storeMode } from "../src/lib/store";

async function main() {
  const flags = launchFlags();
  console.log("Launch readiness check");
  console.log(`  mode:      ${modeLabel(flags)}`);
  console.log(`  test user: ${flags.testUserEmail}`);
  console.log(`  store:     ${storeMode()}`);
  console.log("");

  const checks = await runLaunchChecklist();
  const width = Math.max(...checks.map((c) => c.label.length));
  for (const c of checks) {
    const mark =
      c.status === "pass" ? "PASS" : c.status === "warn" ? "WARN" : "FAIL";
    const req = c.required ? "" : " (advisory)";
    console.log(`  [${mark}] ${c.label.padEnd(width)}${req}`);
    console.log(`         ${c.detail}`);
  }

  const ready = checklistReady(checks);
  console.log("");
  console.log(
    ready
      ? "READY: every required check passes."
      : "NOT READY: required checks are failing above.",
  );
  process.exitCode = ready ? 0 : 1;
}

main().catch((err) => {
  console.error("launch:check failed:", err);
  process.exit(1);
});
