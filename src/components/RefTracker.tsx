"use client";

import { useEffect } from "react";

/**
 * Counts referral-tagged visits (?ref=digest|receipt|embed|og|llm|share).
 * Fires one anonymous counter increment per page load when a ref tag is
 * present; sends nothing otherwise. No cookies, no IDs, no PII.
 */
export function RefTracker() {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (!ref) return;
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
