"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight, Plus, Sparkles, X } from "lucide-react";
import { STARTER_CAUSES, type StarterCause } from "@/data/starter-causes";

type ExistingCause = {
  id: string;
  title: string;
  emoji?: string;
  topics: string[];
  watchTermsAny: string[];
  jurisdictions: string[];
};

type OverlapHit = {
  causeId: string;
  causeTitle: string;
  causeEmoji?: string;
  sharedTopics: string[];
  sharedKeywords: string[];
  sharedJurisdictions: string[];
  similarity: number;
};

function detectOverlapClient(
  candidate: {
    title: string;
    topics: string[];
    watchTermsAny: string[];
    jurisdictions: string[];
  },
  existing: ExistingCause[],
): OverlapHit[] {
  if (existing.length === 0) return [];
  const norm = (xs: string[]) =>
    new Set(xs.filter(Boolean).map((x) => x.toLowerCase()));
  const candTopics = norm(candidate.topics);
  const candKeywords = norm(candidate.watchTermsAny);
  const candJur = norm(candidate.jurisdictions);
  const candTitleLower = candidate.title.toLowerCase();
  const hits: OverlapHit[] = [];
  for (const ex of existing) {
    const exTopics = norm(ex.topics);
    const exKeywords = norm(ex.watchTermsAny);
    const exJur = norm(ex.jurisdictions);
    const sharedTopics = [...candTopics].filter((t) => exTopics.has(t));
    const sharedKeywords = [...candKeywords].filter((k) => exKeywords.has(k));
    const sharedJur = [...candJur].filter((j) => exJur.has(j));
    const topicScore =
      candTopics.size + exTopics.size === 0
        ? 0
        : (2 * sharedTopics.length) / (candTopics.size + exTopics.size);
    const keywordScore =
      candKeywords.size + exKeywords.size === 0
        ? 0
        : (2 * sharedKeywords.length) / (candKeywords.size + exKeywords.size);
    const jurScore =
      candJur.size + exJur.size === 0
        ? 0
        : (2 * sharedJur.length) / (candJur.size + exJur.size);
    let similarity = 0.5 * topicScore + 0.35 * keywordScore + 0.15 * jurScore;
    if (candTitleLower && candTitleLower === ex.title.toLowerCase()) {
      similarity = Math.max(similarity, 1);
    }
    if (similarity >= 0.4 || sharedTopics.length + sharedKeywords.length >= 3) {
      hits.push({
        causeId: ex.id,
        causeTitle: ex.title,
        causeEmoji: ex.emoji,
        sharedTopics,
        sharedKeywords,
        sharedJurisdictions: sharedJur,
        similarity,
      });
    }
  }
  hits.sort((a, b) => b.similarity - a.similarity);
  return hits;
}

type CauseWizardProps = {
  existing: ExistingCause[];
  defaultJurisdictions: string[];
};

export function CauseWizard({
  existing,
  defaultJurisdictions,
}: CauseWizardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"pick" | "custom">("pick");
  const [picked, setPicked] = useState<StarterCause | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customOutcome, setCustomOutcome] = useState("");
  const [customKeywords, setCustomKeywords] = useState("");
  const [jurisdictions, setJurisdictions] = useState<string[]>(
    defaultJurisdictions,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jurInput, setJurInput] = useState("");

  useEffect(() => {
    setJurisdictions(defaultJurisdictions);
  }, [defaultJurisdictions]);

  const overlap = useMemo<OverlapHit[]>(() => {
    if (mode === "pick") {
      if (!picked) return [];
      return detectOverlapClient(
        {
          title: picked.title,
          topics: picked.topics,
          watchTermsAny: picked.watchTermsAny,
          jurisdictions,
        },
        existing,
      );
    }
    const kw = customKeywords
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!customTitle.trim() && kw.length === 0) return [];
    return detectOverlapClient(
      {
        title: customTitle.trim(),
        topics: [],
        watchTermsAny: kw,
        jurisdictions,
      },
      existing,
    );
  }, [mode, picked, customTitle, customKeywords, jurisdictions, existing]);

  function addJurisdiction(value: string) {
    const v = value.trim();
    if (!v) return;
    if (jurisdictions.length >= 5) return;
    if (jurisdictions.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    setJurisdictions([...jurisdictions, v]);
    setJurInput("");
  }

  function removeJurisdiction(value: string) {
    setJurisdictions(jurisdictions.filter((j) => j !== value));
  }

  async function submit() {
    setError(null);
    let candidate: ExistingCause & {
      outcome: string;
      topics: string[];
      jurisdictions: string[];
      watchTermsAny: string[];
      emoji?: string;
      createdAt: string;
    };

    if (mode === "pick") {
      if (!picked) {
        setError("Pick a starter card or switch to custom.");
        return;
      }
      candidate = {
        id: `c-${picked.id}-${Date.now().toString(36)}`,
        title: picked.title,
        outcome: picked.outcome,
        topics: picked.topics,
        jurisdictions,
        watchTermsAny: picked.watchTermsAny,
        emoji: picked.emoji,
        createdAt: new Date().toISOString(),
      };
    } else {
      if (customTitle.trim().length < 4) {
        setError("Cause title must be at least 4 characters.");
        return;
      }
      if (customOutcome.trim().length < 8) {
        setError("Outcome must be at least 8 characters.");
        return;
      }
      candidate = {
        id: `c-custom-${Date.now().toString(36)}`,
        title: customTitle.trim().slice(0, 140),
        outcome: customOutcome.trim().slice(0, 600),
        topics: [],
        jurisdictions,
        watchTermsAny: customKeywords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 20),
        createdAt: new Date().toISOString(),
      };
    }

    setSubmitting(true);
    try {
      const causes = [...existing, candidate];
      const res = await fetch("/api/causes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ causes }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(j.error?.message ?? "Could not save the cause.");
        setSubmitting(false);
        return;
      }
      window.localStorage.setItem("btpftp-causes", JSON.stringify(causes));
      router.push(`/causes/${candidate.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("pick")}
          className={
            mode === "pick"
              ? "rounded-full border border-civic-500 bg-civic-50 px-3 py-1.5 text-sm font-semibold text-civic-700"
              : "rounded-full border border-record-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 hover:border-civic-500"
          }
        >
          Pick a starter
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={
            mode === "custom"
              ? "rounded-full border border-civic-500 bg-civic-50 px-3 py-1.5 text-sm font-semibold text-civic-700"
              : "rounded-full border border-record-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 hover:border-civic-500"
          }
        >
          Write a custom cause
        </button>
      </div>

      {mode === "pick" ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {STARTER_CAUSES.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setPicked(s)}
              className={
                picked?.id === s.id
                  ? "rounded-lg border-2 border-civic-500 bg-civic-50 p-4 text-left shadow-line"
                  : "rounded-lg border border-record-200 bg-white p-4 text-left shadow-line hover:border-civic-500"
              }
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">
                  {s.emoji}
                </span>
                <span className="text-sm font-semibold text-ink-950">
                  {s.title}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-ink-700">{s.outcome}</p>
              {s.topics.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {s.topics.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-record-200 bg-paper-50 px-2 py-0.5 text-[10px] font-semibold text-ink-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
              Cause title
            </span>
            <input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Safer streets in West LA"
              className="h-11 rounded-md border border-record-200 bg-paper-50 px-3 text-sm text-ink-950 outline-none focus:border-civic-500 focus:bg-white"
              maxLength={140}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
              Outcome you want (your words)
            </span>
            <textarea
              value={customOutcome}
              onChange={(e) => setCustomOutcome(e.target.value)}
              placeholder="e.g. I want a protected bike lane on Venice Blvd so kids can get to school safely."
              rows={4}
              maxLength={600}
              className="rounded-md border border-record-200 bg-paper-50 p-3 text-sm leading-6 text-ink-950 outline-none focus:border-civic-500 focus:bg-white"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
              Keywords (comma separated)
            </span>
            <input
              value={customKeywords}
              onChange={(e) => setCustomKeywords(e.target.value)}
              placeholder="bike lane, Venice, school, crosswalk"
              className="h-11 rounded-md border border-record-200 bg-paper-50 px-3 text-sm text-ink-950 outline-none focus:border-civic-500 focus:bg-white"
            />
            <span className="text-xs text-ink-600">
              We match records by topic + keyword + jurisdiction. The cause stays in your cookie.
            </span>
          </label>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
          Jurisdictions to watch
        </p>
        <p className="mt-1 text-xs leading-5 text-ink-600">
          We default to your place; add cities, counties, or states you care
          about. Up to 5.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {jurisdictions.map((j) => (
            <span
              key={j}
              className="inline-flex items-center gap-1 rounded-full border border-civic-100 bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700"
            >
              {j}
              <button
                type="button"
                onClick={() => removeJurisdiction(j)}
                aria-label={`Remove ${j}`}
                className="rounded-full p-0.5 hover:bg-white"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addJurisdiction(jurInput);
          }}
        >
          <input
            value={jurInput}
            onChange={(e) => setJurInput(e.target.value)}
            placeholder="California Legislature, Los Angeles, ..."
            className="h-10 flex-1 rounded-md border border-record-200 bg-paper-50 px-3 text-sm text-ink-950 outline-none focus:border-civic-500 focus:bg-white"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-1 rounded-md border border-record-200 bg-white px-3 text-xs font-semibold text-ink-800 hover:border-civic-500"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            Add
          </button>
        </form>
      </div>

      {overlap.length > 0 ? (
        <div className="rounded-lg border border-notice-100 bg-notice-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-notice-500" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-notice-500">
                You already track {overlap.length === 1 ? "a cause" : `${overlap.length} causes`} that overlap this one.
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-700">
                Sharpening an existing cause usually beats duplicating. Open
                one of these to refine it, or proceed below if this is a
                genuinely distinct angle.
              </p>
              <ul className="mt-3 grid gap-2">
                {overlap.slice(0, 3).map((hit) => (
                  <li key={hit.causeId}>
                    <Link
                      href={`/causes/${hit.causeId}`}
                      className="flex items-start gap-3 rounded-md border border-record-200 bg-white p-3 hover:border-civic-500"
                    >
                      {hit.causeEmoji ? (
                        <span className="text-xl" aria-hidden="true">
                          {hit.causeEmoji}
                        </span>
                      ) : null}
                      <span className="grid">
                        <span className="text-sm font-semibold text-ink-950">
                          {hit.causeTitle}
                        </span>
                        <span className="mt-1 text-xs leading-5 text-ink-700">
                          {Math.round(hit.similarity * 100)}% similarity
                          {hit.sharedTopics.length
                            ? ` · shared topics: ${hit.sharedTopics.slice(0, 3).join(", ")}`
                            : ""}
                          {hit.sharedKeywords.length
                            ? ` · shared keywords: ${hit.sharedKeywords.slice(0, 3).join(", ")}`
                            : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-notice-100 bg-notice-50 px-3 py-2 text-xs leading-5 text-notice-500">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-ink-950 px-5 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
        >
          {submitting ? (
            "Saving..."
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Save cause and see matches
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
        <Link
          href="/causes"
          className="text-sm font-semibold text-ink-700 hover:text-civic-700"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
