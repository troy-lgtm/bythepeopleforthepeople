/**
 * Best-effort crawler detection for the anonymous counters. Pure module:
 * safe for client and server imports.
 *
 * The counter's whole job is to say whether a PERSON clicked a tagged link.
 * Google renders JavaScript when it crawls, so without this check every
 * crawl of a receipt page fires a "visit" and the numbers describe robots.
 * The user agent is inspected in memory to make one yes/no decision and is
 * never stored, logged, or hashed — the counter still holds only a tag and
 * a date.
 *
 * This is a deny-list, so an unknown crawler still counts. That is the
 * honest direction to be wrong in: the number can only be too high, and the
 * Launch Center says so.
 */

const BOT_PATTERN =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|scrape|monitor|python-requests|curl\/|wget\/|go-http-client|java\/|okhttp|axios|node-fetch|undici|phantom|selenium|webdriver|puppeteer|playwright|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|w3c_validator|whatsapp|slackbot|twitterbot|linkedinbot|applebot|bingpreview|yandex|baidu|duckduck|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|claudebot|claude-web|anthropic|perplexity|ccbot|cohere|diffbot|amazonbot|meta-externalagent|oai-searchbot|chatgpt-user|ia_archiver/i;

/** True when the user agent looks like automated traffic. Empty = unknown = counted. */
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? "").trim();
  if (!ua) return false;
  return BOT_PATTERN.test(ua);
}
