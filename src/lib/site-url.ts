/**
 * Canonical site origin for links embedded in emails and feeds.
 *
 * Defaults to the production domain. SITE_BASE_URL overrides it so local and
 * preview testing produce clickable confirm/manage links (e.g.
 * SITE_BASE_URL=http://localhost:3000). Trailing slash is stripped so callers
 * can safely concatenate paths.
 */
export function siteBaseUrl(): string {
  const raw = process.env.SITE_BASE_URL?.trim();
  if (raw && /^https?:\/\//.test(raw)) return raw.replace(/\/+$/, "");
  return "https://bythepeopleforthepeople.com";
}
