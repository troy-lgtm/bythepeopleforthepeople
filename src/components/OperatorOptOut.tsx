"use client";

import { useEffect, useState } from "react";
import { operatorOptedOut, setOperatorOptOut } from "@/lib/operator-opt-out";

/**
 * Launch Center control: stop this browser from being counted by either
 * analytics layer. Per-browser, reversible, plainly labeled.
 */
export function OperatorOptOut() {
  const [on, setOn] = useState<boolean | null>(null);

  useEffect(() => {
    setOn(operatorOptedOut());
  }, []);

  if (on === null) {
    return (
      <p className="text-xs text-ink-600">Checking this browser&apos;s setting...</p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => {
          setOperatorOptOut(!on);
          setOn(!on);
        }}
        className="inline-flex h-10 items-center justify-center rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-950 hover:border-civic-500"
      >
        {on ? "Count this browser again" : "Don't count this browser"}
      </button>
      <p className="text-xs leading-5 text-ink-700">
        {on
          ? "This browser is NOT counted. Your own visits stay out of the numbers on this device."
          : "This browser IS counted right now. Press the button on every device you use to check the site."}
      </p>
    </div>
  );
}
