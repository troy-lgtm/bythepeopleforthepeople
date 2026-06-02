"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { cn } from "@/lib/cn";

const storageKey = "btpftp-watchlist";

type WatchButtonProps = {
  targetId: string;
  label?: string;
  className?: string;
};

export function WatchButton({
  targetId,
  label = "Watch",
  className,
}: WatchButtonProps) {
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    setWatched(readWatchlist().includes(targetId));
  }, [targetId]);

  async function toggleWatch() {
    const current = readWatchlist();
    const next = current.includes(targetId)
      ? current.filter((id) => id !== targetId)
      : [...current, targetId];

    window.localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event("btpftp-watchlist-change"));
    setWatched(next.includes(targetId));

    try {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchedIds: next }),
        keepalive: true,
      });
    } catch {
      // server sync best-effort; localStorage remains source-of-truth client-side
    }
  }

  return (
    <button
      type="button"
      onClick={toggleWatch}
      aria-pressed={watched}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition",
        watched
          ? "border-civic-500 bg-civic-50 text-civic-700"
          : "border-record-200 bg-white text-ink-950 hover:border-civic-500",
        className,
      )}
    >
      {watched ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Bell className="h-4 w-4" aria-hidden="true" />
      )}
      {watched ? "Watching" : label}
    </button>
  );
}

export function readWatchlist() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
