import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3210);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

// Unit specs run in plain Node (no browser, no server). UNIT_ONLY=1 skips
// the webServer boot so `npm run test:unit` is fast.
const UNIT_ONLY = process.env.UNIT_ONLY === "1";

// The smoke server gets a known admin secret so the Launch Center specs can
// exercise auth. Test-only value; production uses the real env var.
const ADMIN_SECRET = process.env.ADMIN_LAUNCH_SECRET ?? "test-admin-secret";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer:
    process.env.PLAYWRIGHT_BASE_URL || UNIT_ONLY
      ? undefined
      : {
          command: `PORT=${PORT} ADMIN_LAUNCH_SECRET=${ADMIN_SECRET} npm run start`,
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
  projects: [
    {
      name: "unit",
      testMatch: /unit\/.*\.spec\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /unit\//,
    },
  ],
});
