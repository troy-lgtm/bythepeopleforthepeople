/**
 * "Don't count me" for the operator's own browser. Pure module, safe on the
 * client and the server.
 *
 * Troy opens the site dozens of times a week to check it; without this every
 * one of those visits lands in the visitor numbers and the referral counters
 * and the growth signal is really a picture of him. The flag lives in
 * localStorage on one browser, is set from the Launch Center, and is read
 * by both analytics layers before they send anything.
 */

export const OPERATOR_OPT_OUT_KEY = "btpftp-no-count";

export function operatorOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(OPERATOR_OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setOperatorOptOut(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(OPERATOR_OPT_OUT_KEY, "1");
    else window.localStorage.removeItem(OPERATOR_OPT_OUT_KEY);
  } catch {
    /* storage unavailable; nothing to do */
  }
}
