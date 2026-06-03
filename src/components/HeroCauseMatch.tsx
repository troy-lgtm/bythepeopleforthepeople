"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Search, Sparkles } from "lucide-react";

type PreviewHit = { type: "bill" | "local" | "topic"; title: string; href: string };
type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; count: number; top: PreviewHit[] }
  | { status: "error" };

const QUICK_PICKS = [
  "Affordable housing",
  "Homelessness services",
  "Wildfire prevention",
  "Public safety",
  "Public transit",
];

function keywordsFromQuery(q: string): string {
  return Array.from(
    new Set(
      q
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 3),
    ),
  )
    .slice(0, 12)
    .join(", ");
}

export function HeroCauseMatch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });
  const [creating, setCreating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = query.trim();

  // One tap from "name a cause" straight to the created cause page (matches +
  // your reps + activity) — no cold wizard form in between.
  async function track() {
    if (trimmed.length < 3 || creating) return;
    setCreating(true);
    try {
      const existingRes = await fetch("/api/causes");
      const existingJson = (await existingRes.json()) as {
        data?: { causes?: unknown[] };
      };
      const existing = Array.isArray(existingJson.data?.causes)
        ? existingJson.data!.causes
        : [];
      const id = `c-hero-${Date.now().toString(36)}`;
      const keywords = keywordsFromQuery(trimmed)
        .split(", ")
        .filter(Boolean);
      const cause = {
        id,
        title: trimmed.slice(0, 140),
        outcome: trimmed.slice(0, 600),
        topics: [],
        jurisdictions: [],
        watchTermsAny: keywords,
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
        return;
      }
      try {
        window.localStorage.setItem("btpftp-causes", JSON.stringify(causes));
      } catch {
        /* ignore */
      }
      router.push(`/causes/${id}`);
    } catch {
      setCreating(false);
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
    if (preview.count === 0) {
      return `No indexed records match "${trimmed}" yet.`;
    }
    return `${preview.count} indexed record${preview.count === 1 ? "" : "s"} already match "${trimmed}".`;
  }, [preview, trimmed]);

  return (
    <div className="mt-7 max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          track();
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <label className="relative flex-1">
          <span className="sr-only">Name a cause you care about</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name a cause: safer streets, wildfires stopping, rent staying affordable…"
            className="h-12 w-full rounded-md border border-record-200 bg-white pl-9 pr-3 text-base text-ink-950 shadow-line outline-none focus:border-civic-500 sm:text-sm"
            maxLength={140}
            enterKeyHint="go"
            autoComplete="off"
            aria-describedby="hero-match-status"
          />
        </label>
        <button
          type="submit"
          disabled={trimmed.length < 3 || creating}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-ink-950 px-5 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-50"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Creating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Track this cause
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-600">Try:</span>
        {QUICK_PICKS.map((pick) => (
          <button
            key={pick}
            type="button"
            onClick={() => setQuery(pick)}
            className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-xs font-semibold text-ink-700 transition hover:border-civic-500 hover:text-civic-700"
          >
            {pick}
          </button>
        ))}
      </div>

      <div id="hero-match-status" aria-live="polite" className="mt-3 min-h-[1.5rem]">
        {preview.status === "loading" ? (
          <span className="inline-flex items-center gap-2 text-xs text-ink-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Checking the index…
          </span>
        ) : null}
        {preview.status === "done" ? (
          <div
            className={`rounded-lg border p-3 ${
              preview.count > 0
                ? "border-civic-100 bg-civic-50"
                : "border-record-200 bg-paper-50"
            }`}
          >
            <p className="text-sm font-semibold text-ink-950">{message}</p>
            {preview.count === 0 ? (
              <p className="mt-1 text-xs leading-5 text-ink-600">
                Coverage is expanding. Track it and you&apos;ll be first to know
                when a record lands — your cause page also shows the closest
                coverage we already have.
              </p>
            ) : null}
            {preview.top.length > 0 ? (
              <ul className="mt-2 grid gap-1">
                {preview.top.map((hit) => (
                  <li key={hit.href}>
                    <Link
                      href={hit.href}
                      className="flex items-center gap-2 text-xs text-ink-700 hover:text-civic-700"
                    >
                      <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-600">
                        {hit.type}
                      </span>
                      <span className="truncate">{hit.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              onClick={track}
              disabled={creating}
              className="mt-3 inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-ink-950 px-4 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60"
            >
              {preview.count > 0 ? "Track this cause" : "Track it anyway"}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
        <Link href="/causes/new" className="font-semibold text-ink-700 hover:text-civic-700">
          Or pick from 12 starter causes →
        </Link>
        <Link href="/explore" className="font-semibold text-ink-700 hover:text-civic-700">
          Ask the record instead →
        </Link>
      </div>
    </div>
  );
}
