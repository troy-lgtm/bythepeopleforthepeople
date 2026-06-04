import Script from "next/script";

/**
 * Privacy-respecting analytics (Plausible) — no cookies, no fingerprinting,
 * no PII. Loads only when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set; otherwise
 * renders nothing. The tagged-events build lets us fire custom events
 * (share, cause_created, subscribe) via window.plausible().
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.tagged-events.js"
      strategy="afterInteractive"
    />
  );
}
