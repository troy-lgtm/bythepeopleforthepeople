"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

type PreviewHit = { type: "bill" | "local" | "topic"; title: string; href: string };
type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; count: number; top: PreviewHit[] }
  | { status: "error" };

const ISSUES: Array<{ label: string; emoji: string }> = [
  { label: "Affordable housing", emoji: "🏠" },
  { label: "Homelessness services", emoji: "🤝" },
  { label: "Wildfire prevention", emoji: "🔥" },
  { label: "Public safety", emoji: "🛡️" },
  { label: "Public transit", emoji: "🚌" },
  { label: "Clean elections", emoji: "🗳️" },
];

function keywordsFromQuery(q: string): string[] {
  return Array.from(
    new Set(
      q
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 3),
    ),
  ).slice(0, 12);
}

export function HeroCauseMatch() {
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });
  const [creating, setCreating] = useState(false);
  const [creatingLabel, setCreatingLabel] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = query.trim();

  // One tap → create the cause and land straight on its dashboard (records +
  // your reps + alerts). Accepts an explicit issue label (from the tap grid)
  // or falls back to the typed query.
  async function track(explicit?: string) {
    const value = (explicit ?? query).trim();
    if (value.length < 3 || creating) return;
    setCreating(true);
    setCreatingLabel(explicit ?? "__typed__");
    try {
      const existingRes = await fetch("/api/causes");
      const existingJson = (await existingRes.json()) as {
        data?: { causes?: unknown[] };
      };
      const existing = Array.isArray(existingJson.data?.causes)
        ? existingJson.data!.causes
        : [];
      const id = `c-hero-${Date.now().toString(36)}`;
      const cause = {
        id,
        title: value.slice(0, 140),
        outcome: value.slice(0, 600),
        topics: [],
        jurisdictions: [],
        watchTermsAny: keywordsFromQuery(value),
        createdAt: new Date().toISOString(),
      };
      const causes = [...existing, cause];
      const res = await fetch("/api/causes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ causes }),
      });
      if (!res.ok) {
        setCreating(false);
        setCreatingLabel(null);
        return;
      }
      try {
        window.localStorage.setItem("btpftp-causes", JSON.stringify(causes));
      } catch {
        /* ignore */
      }
      window.location.assign(`/causes/${id}`);
    } catch {
      setCreating(false);
      setCreatingLabel(null);
    }
  }

  useEffect(() => {
    if (trimmed.length < 3) {
      setPreview({ status: "idle" });
      return;
    }
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setPreview({ status: "loading" });
      try {
        const res = await fetch(
          `/api/causes/match-preview?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          setPreview({ status: "error" });
          return;
        }
        const json = (await res.json()) as {
          data?: { count: number; top: PreviewHit[] };
        };
        setPreview({
          status: "done",
          count: json.data?.count ?? 0,
          top: json.data?.top ?? [],
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setPreview({ status: "error" });
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [trimmed]);

  const message = useMemo(() => {
    if (preview.status !== "done") return null;
    if (preview.count === 0) return `Nothing indexed for "${trimmed}" yet.`;
    return `${preview.count} record${preview.count === 1 ? "" : "s"} ready for "${trimmed}".`;
  }, [preview, trimmed]);

  return (
    <div className="mt-7 max-w-2xl">
      <p className="text-sm font-semibold text-ink-900">Tap what you care about:</p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ISSUES.map((it) => (
          <button
            key={it.label}
            type="button"
            onClick={() => track(it.label)}
            disabled={creating}
            className="group flex items-center gap-3 rounded-lg border border-record-200 bg-white p-3 text-left shadow-line transition hover:border-civic-500 hover:bg-civic-50 disabled:opacity-60"
          >
            <span className="text-xl" aria-hidden="true">
              {it.emoji}
            </span>
            <span className="text-sm font-semibold text-ink-950">
              {it.label}
            </span>
            {creatingLabel === it.label ? (
              <Loader2
                className="ml-auto h-4 w-4 animate-spin text-civic-700"
                aria-hidden="true"
              />
            ) : (
              <ArrowRight
                className="ml-auto h-4 w-4 text-civic-700 opacity-0 transition group-hover:opacity-100"
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </div>

      {/* How it works — orient the first-timer */}
      <ol className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-600">
        <li className="font-semibold text-ink-800">1 · Pick an issue</li>
        <li aria-hidden="true">→</li>
        <li className="font-semibold text-ink-800">2 · See the records + your reps</li>
        <li aria-hidden="true">→</li>
        <li className="font-semibold text-ink-800">3 · Get alerts when it moves</li>
      </ol>

      {/* Secondary: describe your own (keeps the live match) */}
      <div className="mt-5 border-t border-record-200 pt-4">
        <label
          htmlFor="hero-custom"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600"
        >
          Or describe your own
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            track();
          }}
          className="mt-2 flex flex-col gap-2 sm:flex-row"
        >
          <input
            id="hero-custom"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. safer streets, rent staying affordable…"
            className="h-12 w-full flex-1 rounded-md border border-record-200 bg-white px-3 text-base text-ink-950 shadow-line outline-none focus:border-civic-500 sm:text-sm"
            maxLength={140}
            enterKeyHint="go"
            autoComplete="off"
            aria-describedby="hero-match-status"
          />
          <button
            type="submit"
            disabled={trimmed.length < 3 || creating}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-ink-950 px-5 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-50"
          >
            {creating && creatingLabel === "__typed__" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Creating…
              </>
            ) : (
              <>
                Track it
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div
          id="hero-match-status"
          aria-live="polite"
          className="mt-2 min-h-[1.25rem]"
        >
          {preview.status === "loading" ? (
            <span className="inline-flex items-center gap-2 text-xs text-ink-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Checking…
            </span>
          ) : null}
          {preview.status === "done" ? (
            <p className="text-xs font-semibold text-civic-700">{message}</p>
          ) : null}
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-500">
        Nonpartisan · every claim links to the official record ·{" "}
        <Link href="/explore" className="font-semibold text-ink-600 hover:text-civic-700">
          or just ask the record →
        </Link>
      </p>
    </div>
  );
}
