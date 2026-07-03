import { expect, test } from "@playwright/test";
import { sendEmail } from "@/lib/email";
import { listBlockedNotifications } from "@/lib/notification-guard";
import { __resetMemoryStoreForTests } from "@/lib/store";

/**
 * Proof that the chokepoint itself refuses non-test recipients: sendEmail
 * (the only way any code in this repo sends mail) returns blocked BEFORE
 * touching the provider, even when an API key is present.
 */

test.describe("sendEmail guard integration", () => {
  test.beforeEach(() => {
    __resetMemoryStoreForTests();
  });

  test("blocks a non-test recipient in default (private) mode and logs it", async () => {
    process.env.RESEND_API_KEY = "fake-key-never-used";
    try {
      const result = await sendEmail({
        to: "stranger@example.com",
        subject: "Should never send",
        html: "<p>no</p>",
        text: "no",
      });
      expect(result.ok).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.error).toBe("blocked_private_test_mode");

      const blocked = await listBlockedNotifications(5);
      expect(blocked.length).toBe(1);
      expect(blocked[0].recipient).toBe("stranger@example.com");
      expect(blocked[0].reason).toBe("private_test_mode");
    } finally {
      delete process.env.RESEND_API_KEY;
    }
  });

  test("the test user passes the guard and fails only on provider config", async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendEmail({
      to: "troy@wearewarp.com",
      subject: "Guard pass check",
      html: "<p>ok</p>",
      text: "ok",
    });
    // Guard allowed it (no blocked flag); the only failure is the missing key.
    expect(result.blocked).toBeUndefined();
    expect(result.ok).toBe(false);
    expect(result.error).toBe("email_not_configured");
    expect(await listBlockedNotifications(5)).toHaveLength(0);
  });
});
