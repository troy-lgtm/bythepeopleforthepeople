"use client";

import { useEffect } from "react";
import { operatorOptedOut } from "@/lib/operator-opt-out";
import { storeFirstTouchRef } from "@/lib/ref-tags";

/**
 * Counts referral-tagged visits (?ref=digest|receipt|embed|og|llm|share) and
 * remembers the FIRST tag of the session so a later subscribe can be
 * attributed to the surface that actually brought the person in.
 *
 * Anonymous by construction: one counter increment per tagged page load, no
 * cookies, no ids, no PII, nothing sent on untagged loads. Browsers the
 * operator has opted out (Launch Center) send nothing at all.
 */
export function RefTracker() {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (!ref) return;
      storeFirstTouchRef(ref);
      if (operatorOptedOut()) return;
      void fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "visit", ref }),
        keepalive: true,
      });
    } catch {
      // Tracking must never break the page.
    }
  }, []);
  return null;
}
