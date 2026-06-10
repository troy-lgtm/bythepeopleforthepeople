/**
 * Email validation shared by server modules, scripts, and client components.
 * Pragmatic shape check: non-empty local + domain with a dot, no whitespace.
 */
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_RE.test(value);
}
