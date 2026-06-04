type Props = Record<string, string | number | boolean>;

type PlausibleFn = (event: string, options?: { props?: Props }) => void;

/**
 * Fire a privacy-respecting analytics event (Plausible). No-op when analytics
 * isn't configured, so call sites never need to guard. Used to measure the
 * viral loop (shares, cause creation, subscribes) without cookies or PII.
 */
export function track(event: string, props?: Props): void {
  if (typeof window === "undefined") return;
  const fn = (window as unknown as { plausible?: PlausibleFn }).plausible;
  if (!fn) return;
  try {
    fn(event, props ? { props } : undefined);
  } catch {
    /* analytics must never break the app */
  }
}
