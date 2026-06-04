"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, CircleAlert, RefreshCw } from "lucide-react";

type FreshnessState =
  | { status: "loading" }
  | {
      status: "healthy" | "degraded";
      checked: number;
      healthy: number;
      lastRunAt: string | null;
    }
  | { status: "error"; message: string };

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diffSec = Math.max(
    1,
    Math.floor((Date.now() - date.getTime()) / 1000),
  );
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function FreshnessBadge() {
  const [state, setState] = useState<FreshnessState>({ status: "loading" });

  async function refresh() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/sources/check");
      const json = (await res.json()) as
        | {
            ok: true;
            data: {
              checked: number;
              healthy: number;
              failing: unknown[];
              checks: Array<{ fetchedAt: string }>;
            };
          }
        | { ok: false; error: { message: string } };
      if (!json.ok) {
        setState({ status: "error", message: json.error.message });
        return;
      }
      const lastRunAt = json.data.checks?.[0]?.fetchedAt ?? null;
      setState({
        status:
          json.data.healthy === json.data.checked ? "healthy" : "degraded",
        checked: json.data.checked,
        healthy: json.data.healthy,
        lastRunAt,
      });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  let body: React.ReactNode;
  if (state.status === "loading") {
    body = (
      <span className="inline-flex items-center gap-2 text-ink-700">
        <RefreshCw
          className="h-3.5 w-3.5 animate-spin text-ink-600"
          aria-hidden="true"
        />
        Pinging sources...
      </span>
    );
  } else if (state.status === "error") {
    body = (
      <span className="inline-flex items-center gap-2 text-notice-500">
        <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
        Freshness check unavailable
      </span>
    );
  } else if (state.status === "healthy") {
    const when = state.lastRunAt ? relativeTime(state.lastRunAt) : "recently";
    body =
      state.checked === 0 ? (
        <span className="inline-flex items-center gap-2 text-ink-700">
          <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
          No sources to verify yet
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 text-civic-700">
          <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
          All {state.checked} sources verified {when}
        </span>
      );
  } else {
    const when = state.lastRunAt ? relativeTime(state.lastRunAt) : "time unknown";
    body = (
      <span className="inline-flex items-center gap-2 text-notice-500">
        <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
        {state.healthy}/{state.checked} sources reachable · {when}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <Link
        href="/sources"
        title="Open sources page"
        className="inline-flex items-center gap-3 rounded-full border border-record-200 bg-white px-3 py-1.5 text-xs font-semibold shadow-line transition hover:border-civic-500"
      >
        {body}
      </Link>
      <button
        type="button"
        onClick={() => refresh()}
        aria-label="Re-check source freshness"
        className="rounded-full border border-record-200 bg-white p-1.5 text-ink-600 shadow-line transition hover:border-civic-500 hover:text-ink-900"
      >
        <RefreshCw className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}
