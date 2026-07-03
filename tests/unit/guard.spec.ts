import { expect, test } from "@playwright/test";
import {
  DEFAULT_TEST_USER_EMAIL,
  parseLaunchFlags,
} from "@/lib/launch-mode";
import { evaluateRecipient } from "@/lib/notification-guard";

const PRIVATE = parseLaunchFlags({});
const HALF_OPEN = parseLaunchFlags({ PRIVATE_TEST_MODE: "false" });
const FULL_OPEN = parseLaunchFlags({
  PRIVATE_TEST_MODE: "false",
  GROWTH_LAUNCH_ENABLED: "true",
  ALLOW_PUBLIC_DIGESTS: "true",
  ALLOW_NON_TEST_EMAILS: "true",
});

test.describe("notification guard", () => {
  test("allows the test user in private mode", () => {
    const d = evaluateRecipient(DEFAULT_TEST_USER_EMAIL, "email", PRIVATE);
    expect(d.allowed).toBe(true);
    expect(d.reason).toBe("test_user");
  });

  test("is case-insensitive for the test user", () => {
    const d = evaluateRecipient("Troy@WeAreWarp.com", "email", PRIVATE);
    expect(d.allowed).toBe(true);
  });

  test("blocks any other email in private mode", () => {
    const d = evaluateRecipient("someone@example.com", "email", PRIVATE);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("private_test_mode");
  });

  test("still blocks non-test email when only PRIVATE_TEST_MODE is off", () => {
    const d = evaluateRecipient("someone@example.com", "email", HALF_OPEN);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("non_test_emails_disabled");
  });

  test("allows non-test email only when every flag is open", () => {
    const d = evaluateRecipient("someone@example.com", "email", FULL_OPEN);
    expect(d.allowed).toBe(true);
  });

  test("blocks sms on every flag combination, including for the test user", () => {
    for (const flags of [PRIVATE, HALF_OPEN, FULL_OPEN]) {
      expect(
        evaluateRecipient(DEFAULT_TEST_USER_EMAIL, "sms", flags).allowed,
      ).toBe(false);
    }
  });

  test("blocks push everywhere", () => {
    expect(
      evaluateRecipient(DEFAULT_TEST_USER_EMAIL, "push", PRIVATE).allowed,
    ).toBe(false);
  });

  test("blocks webhooks in private mode, allows when fully open", () => {
    expect(
      evaluateRecipient("https://hooks.example.com/x", "webhook", PRIVATE)
        .allowed,
    ).toBe(false);
    expect(
      evaluateRecipient("https://hooks.example.com/x", "webhook", FULL_OPEN)
        .allowed,
    ).toBe(true);
  });

  test("rejects invalid email shapes", () => {
    const d = evaluateRecipient("not-an-email", "email", FULL_OPEN);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("invalid_email");
  });
});

test.describe("launch flags", () => {
  test("defaults are fully closed with zero env config", () => {
    expect(PRIVATE.privateTestMode).toBe(true);
    expect(PRIVATE.growthLaunchEnabled).toBe(false);
    expect(PRIVATE.allowPublicDigests).toBe(false);
    expect(PRIVATE.allowNonTestEmails).toBe(false);
    expect(PRIVATE.testUserEmail).toBe(DEFAULT_TEST_USER_EMAIL);
  });

  test("garbage values stay closed", () => {
    const flags = parseLaunchFlags({
      PRIVATE_TEST_MODE: "no",
      GROWTH_LAUNCH_ENABLED: "yes",
      ALLOW_PUBLIC_DIGESTS: "1",
      ALLOW_NON_TEST_EMAILS: "TRUE ",
    });
    expect(flags.privateTestMode).toBe(true);
    expect(flags.growthLaunchEnabled).toBe(false);
    expect(flags.allowPublicDigests).toBe(false);
    // " TRUE " trims and lowercases to "true" — explicitly accepted.
    expect(flags.allowNonTestEmails).toBe(true);
  });

  test("test user email overrides and normalizes", () => {
    const flags = parseLaunchFlags({ TEST_USER_EMAIL: " Troy@WeAreWarp.com " });
    expect(flags.testUserEmail).toBe("troy@wearewarp.com");
  });
});
