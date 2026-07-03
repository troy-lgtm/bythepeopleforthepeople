import { timingSafeEqual } from "node:crypto";

/**
 * Admin access for the Launch Center. Locked by ADMIN_LAUNCH_SECRET: when
 * the env var is unset the admin surface stays closed (fail closed), and
 * comparisons are constant-time.
 */

if (typeof window !== "undefined") {
  throw new Error("admin-auth is server-side only");
}

export function adminSecretConfigured(): boolean {
  return Boolean(process.env.ADMIN_LAUNCH_SECRET);
}

export function isValidAdminKey(provided: string | null | undefined): boolean {
  const expected = process.env.ADMIN_LAUNCH_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
