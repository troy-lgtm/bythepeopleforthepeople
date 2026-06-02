"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import type { Cause } from "@/data/types";

type TrackAsCauseButtonProps = {
  suggestedTitle: string;
  suggestedOutcome: string;
  suggestedTopics: string[];
  suggestedJurisdictions: string[];
  suggestedKeywords: string[];
  emoji?: string;
  className?: string;
};

export function TrackAsCauseButton({
  suggestedTitle,
  suggestedOutcome,
  suggestedTopics,
  suggestedJurisdictions,
  suggestedKeywords,
  emoji,
  className,
}: TrackAsCauseButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "exists" | "added" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function track() {
    setBusy(true);
    setError(null);
    try {
      const existing = await fetch("/api/causes").then((r) => r.json());
      const arr: Cause[] = Array.isArray(existing?.data?.causes)
        ? existing.data.causes
        : [];
      const dup = arr.find(
        (c) => c.title.toLowerCase() === suggestedTitle.toLowerCase(),
      );
      if (dup) {
        setState("exists");
        router.push(`/causes/${dup.id}`);
        return;
      }
      const id = `c-track-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const next: Cause[] = [
        ...arr,
        {
          id,
          title: suggestedTitle.slice(0, 140),
          outcome: suggestedOutcome.slice(0, 600),
          topics: suggestedTopics.slice(0, 20),
          jurisdictions: suggestedJurisdictions.slice(0, 20),
          watchTermsAny: suggestedKeywords.slice(0, 40),
          createdAt: new Date().toISOString(),
          emoji,
        },
      ];
      const res = await fetch("/api/causes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ causes: next }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(j.error?.message ?? "Could not add cause.");
        setState("error");
        setBusy(false);
        return;
      }
      window.localStorage.setItem("btpftp-causes", JSON.stringify(next));
      setState("added");
      router.push(`/causes/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setState("error");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={track}
      disabled={busy}
      title={
        state === "error" && error
          ? error
          : "Add this record's topic + jurisdiction as a cause you track."
      }
      className={
        className ??
        "inline-flex h-9 items-center gap-2 rounded-full border border-civic-100 bg-civic-50 px-3 text-xs font-semibold text-civic-700 hover:border-civic-500 disabled:opacity-60"
      }
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      {busy
        ? "Adding..."
        : state === "exists"
          ? "Already a cause"
          : state === "added"
            ? "Cause added"
            : "Track as cause"}
    </button>
  );
}
