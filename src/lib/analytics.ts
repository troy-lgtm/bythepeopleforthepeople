import { track as vercelTrack } from "@vercel/analytics";
import { operatorOptedOut } from "./operator-opt-out";

type Props = Record<string, string | number | boolean>;

type PlausibleFn = (event: string, options?: { props?: Props }) => void;

/**
 * Fire a privacy-respecting analytics event. Goes to Vercel Web Analytics
 * (custom events, first-party, cookieless) and, when configured, Plausible.
 * No-op when nothing is listening and never throws, so call sites never
 * need to guard. Used to measure the loop (shares, cause creation,
 * subscribes) without cookies or PII.
 */
export function track(event: string, props?: Props): void {
  if (typeof window === "undefined") return;
  if (operatorOptedOut()) return;
  try {
    vercelTrack(event, props);
  } catch {
    /* analytics must never break the app */
  }
  const fn = (window as unknown as { plausible?: PlausibleFn }).plausible;
  if (!fn) return;
  try {
    fn(event, props ? { props } : undefined);
  } catch {
    /* analytics must never break the app */
  }
}
