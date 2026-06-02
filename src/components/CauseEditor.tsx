"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus, Save, X } from "lucide-react";
import type { Cause } from "@/data/types";

type CauseEditorProps = {
  cause: Cause;
};

export function CauseEditor({ cause }: CauseEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(cause.title);
  const [outcome, setOutcome] = useState(cause.outcome);
  const [topics, setTopics] = useState<string[]>(cause.topics);
  const [topicInput, setTopicInput] = useState("");
  const [jurisdictions, setJurisdictions] = useState<string[]>(
    cause.jurisdictions,
  );
  const [jurInput, setJurInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>(cause.watchTermsAny);
  const [keywordInput, setKeywordInput] = useState("");
  const [emoji, setEmoji] = useState(cause.emoji ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setError(null), [title, outcome, topics, jurisdictions, keywords]);

  function addTo(setter: (xs: string[]) => void, current: string[], value: string, cap: number) {
    const v = value.trim();
    if (!v) return;
    if (current.length >= cap) return;
    if (current.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    setter([...current, v]);
  }

  async function save() {
    if (title.trim().length < 4) {
      setError("Title must be at least 4 characters.");
      return;
    }
    if (outcome.trim().length < 8) {
      setError("Outcome must be at least 8 characters.");
      return;
    }
    const updated: Cause = {
      ...cause,
      title: title.trim().slice(0, 140),
      outcome: outcome.trim().slice(0, 600),
      topics,
      jurisdictions,
      watchTermsAny: keywords,
      emoji: emoji.trim().slice(0, 8) || cause.emoji,
    };
    setBusy(true);
    try {
      const existing = await fetch("/api/causes")
        .then((r) => r.json())
        .catch(() => ({}));
      const arr: Cause[] = Array.isArray(existing?.data?.causes)
        ? existing.data.causes
        : [];
      const next = arr.map((c) => (c.id === cause.id ? updated : c));
      const res = await fetch("/api/causes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ causes: next }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(j.error?.message ?? "Could not save.");
        setBusy(false);
        return;
      }
      window.localStorage.setItem("btpftp-causes", JSON.stringify(next));
      router.push(`/causes/${cause.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
            Emoji (optional)
          </span>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={8}
            placeholder="🚸"
            className="h-11 w-24 rounded-md border border-record-200 bg-paper-50 px-3 text-2xl text-ink-950 outline-none focus:border-civic-500 focus:bg-white"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
            Cause title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={140}
            className="h-11 rounded-md border border-record-200 bg-paper-50 px-3 text-sm text-ink-950 outline-none focus:border-civic-500 focus:bg-white"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
            Outcome (your words)
          </span>
          <textarea
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            rows={4}
            maxLength={600}
            className="rounded-md border border-record-200 bg-paper-50 p-3 text-sm leading-6 text-ink-950 outline-none focus:border-civic-500 focus:bg-white"
          />
        </label>
      </div>

      <TagList
        label="Topics"
        helper="Editorial taxonomy match (Land use, Housing, Fires, etc.). Up to 20."
        items={topics}
        onAdd={(v) => addTo(setTopics, topics, v, 20)}
        onRemove={(v) => setTopics(topics.filter((x) => x !== v))}
        inputValue={topicInput}
        setInputValue={setTopicInput}
        placeholder="Land use, Housing, Fires..."
      />

      <TagList
        label="Jurisdictions"
        helper="City, county, state legislature, federal body. Up to 20."
        items={jurisdictions}
        onAdd={(v) => addTo(setJurisdictions, jurisdictions, v, 20)}
        onRemove={(v) => setJurisdictions(jurisdictions.filter((x) => x !== v))}
        inputValue={jurInput}
        setInputValue={setJurInput}
        placeholder="California Legislature, Los Angeles City Council..."
      />

      <TagList
        label="Keywords"
        helper="Any keyword in a record title, summary, or action lights it up. Up to 40."
        items={keywords}
        onAdd={(v) => addTo(setKeywords, keywords, v, 40)}
        onRemove={(v) => setKeywords(keywords.filter((x) => x !== v))}
        inputValue={keywordInput}
        setInputValue={setKeywordInput}
        placeholder="bike lane, school zone, transit..."
      />

      {error ? (
        <p className="rounded-md border border-notice-100 bg-notice-50 px-3 py-2 text-xs leading-5 text-notice-500">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
        >
          {busy ? (
            "Saving..."
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save changes
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
        <Link
          href={`/causes/${cause.id}`}
          className="text-sm font-semibold text-ink-700 hover:text-civic-700"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}

function TagList({
  label,
  helper,
  items,
  onAdd,
  onRemove,
  inputValue,
  setInputValue,
  placeholder,
}: {
  label: string;
  helper: string;
  items: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  inputValue: string;
  setInputValue: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
        {label}
      </p>
      <p className="mt-1 text-xs leading-5 text-ink-600">{helper}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((it) => (
          <span
            key={it}
            className="inline-flex items-center gap-1 rounded-full border border-civic-100 bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700"
          >
            {it}
            <button
              type="button"
              onClick={() => onRemove(it)}
              aria-label={`Remove ${it}`}
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
          onAdd(inputValue);
          setInputValue("");
        }}
      >
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
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
  );
}
