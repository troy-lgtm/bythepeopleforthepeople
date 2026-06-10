/**
 * Launch-mode flags. Server-side module (also imported by npx-tsx scripts, so
 * no "server-only" — the window check below enforces the same boundary).
 *
 * Fail-closed parsing is the whole point:
 * - PRIVATE_TEST_MODE is TRUE unless the env var is exactly "false".
 * - Every allow/enable flag is FALSE unless the env var is exactly "true".
 * - The test user defaults to troy@wearewarp.com even with zero env config.
 *
 * So a fresh deploy with no env vars at all is in private test mode and can
 * only ever message the test user.
 */

if (typeof window !== "undefined") {
  throw new Error("launch-mode is server-side only");
}

export const DEFAULT_TEST_USER_EMAIL = "troy@wearewarp.com";

export type LaunchFlags = {
  privateTestMode: boolean;
  testUserEmail: string;
  growthLaunchEnabled: boolean;
  allowPublicDigests: boolean;
  allowNonTestEmails: boolean;
};

type Env = Record<string, string | undefined>;

function flagTrue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === "true";
}

function flagFalse(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === "false";
}

/** Pure parser so tests can exercise every combination without touching process.env. */
export function parseLaunchFlags(env: Env): LaunchFlags {
  const testUserEmail = (env.TEST_USER_EMAIL ?? DEFAULT_TEST_USER_EMAIL)
    .trim()
    .toLowerCase();
  return {
    // Default true; only an explicit "false" leaves private test mode.
    privateTestMode: !flagFalse(env.PRIVATE_TEST_MODE),
    testUserEmail: testUserEmail || DEFAULT_TEST_USER_EMAIL,
    growthLaunchEnabled: flagTrue(env.GROWTH_LAUNCH_ENABLED),
    allowPublicDigests: flagTrue(env.ALLOW_PUBLIC_DIGESTS),
    allowNonTestEmails: flagTrue(env.ALLOW_NON_TEST_EMAILS),
  };
}

/** Current flags, read fresh each call so scripts and tests see env changes. */
export function launchFlags(): LaunchFlags {
  return parseLaunchFlags(process.env);
}

export function isTestUserEmail(
  email: string,
  flags: LaunchFlags = launchFlags(),
): boolean {
  return email.trim().toLowerCase() === flags.testUserEmail;
}

/**
 * Every gate that protects the public must be open at once before any
 * public-facing send or launch action is possible.
 */
export function publicLaunchUnlocked(
  flags: LaunchFlags = launchFlags(),
): boolean {
  return (
    !flags.privateTestMode &&
    flags.growthLaunchEnabled &&
    flags.allowPublicDigests &&
    flags.allowNonTestEmails
  );
}

export type LaunchModeLabel = "private-test" | "launch-unlocked" | "partial";

/**
 * Human label for the current mode. "partial" means the flags disagree (some
 * opened, some closed) — the Launch Center surfaces exactly which.
 */
export function modeLabel(flags: LaunchFlags = launchFlags()): LaunchModeLabel {
  if (publicLaunchUnlocked(flags)) return "launch-unlocked";
  if (
    flags.privateTestMode &&
    !flags.growthLaunchEnabled &&
    !flags.allowPublicDigests &&
    !flags.allowNonTestEmails
  ) {
    return "private-test";
  }
  return "partial";
}

/**
 * The exact reasons public launch is locked, in plain language, for the
 * Launch Center's disabled-button explanation.
 */
export function launchBlockers(flags: LaunchFlags = launchFlags()): string[] {
  const blockers: string[] = [];
  if (flags.privateTestMode) {
    blockers.push("PRIVATE_TEST_MODE is on (set PRIVATE_TEST_MODE=false)");
  }
  if (!flags.growthLaunchEnabled) {
    blockers.push("GROWTH_LAUNCH_ENABLED is off (set GROWTH_LAUNCH_ENABLED=true)");
  }
  if (!flags.allowPublicDigests) {
    blockers.push("ALLOW_PUBLIC_DIGESTS is off (set ALLOW_PUBLIC_DIGESTS=true)");
  }
  if (!flags.allowNonTestEmails) {
    blockers.push("ALLOW_NON_TEST_EMAILS is off (set ALLOW_NON_TEST_EMAILS=true)");
  }
  return blockers;
}
