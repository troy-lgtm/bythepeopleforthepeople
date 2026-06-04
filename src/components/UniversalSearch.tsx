"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { useFocusTrap } from "@/lib/useFocusTrap";

type SearchDoc = {
  id: string;
  type:
    | "rep"
    | "senator"
    | "bill"
    | "local"
    | "topic"
    | "person"
    | "committee"
    | "connector"
    | "cause";
  title: string;
  subtitle?: string;
  href: string;
  jurisdiction?: string;
  keywords: string[];
};

type ScoredDoc = SearchDoc & { score: number };

const TYPE_LABEL: Record<SearchDoc["type"], string> = {
  rep: "U.S. House",
  senator: "U.S. Senate",
  bill: "Bill",
  local: "Local file",
  topic: "Topic",
  person: "Person",
  committee: "Committee",
  connector: "Source",
  cause: "Your cause",
};

const TYPE_TONE: Record<SearchDoc["type"], string> = {
  rep: "bg-paper-50 text-ink-700 border-record-200",
  senator: "bg-ink-900 text-white border-ink-800",
  bill: "bg-civic-50 text-civic-700 border-civic-100",
  local: "bg-civic-50 text-civic-700 border-civic-100",
  topic: "bg-notice-50 text-notice-500 border-notice-100",
  person: "bg-paper-50 text-ink-700 border-record-200",
  committee: "bg-paper-50 text-ink-700 border-record-200",
  connector: "bg-paper-100 text-ink-700 border-record-200",
  cause: "bg-civic-50 text-civic-700 border-civic-500",
};

function score(doc: SearchDoc, q: string): number {
  if (!q) return 0;
  const ql = q.toLowerCase();
  const tokens = ql.split(/\s+/).filter(Boolean);
  let s = 0;
  const titleL = doc.title.toLowerCase();
  if (titleL === ql) s += 1000;
  if (titleL.startsWith(ql)) s += 500;
  if (titleL.includes(ql)) s += 200;
  for (const tok of tokens) {
    if (titleL.includes(tok)) s += 40;
    for (const kw of doc.keywords) {
      const kl = kw.toLowerCase();
      if (kl === tok) s += 50;
      else if (kl.startsWith(tok)) s += 20;
      else if (kl.includes(tok)) s += 8;
    }
  }
  if (doc.subtitle?.toLowerCase().includes(ql)) s += 15;
  if (doc.type === "cause" && s > 0) s += 300;
  return s;
}

export function UniversalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const titleId = useId();
  const listboxId = useId();
  const optionId = (i: number) => `${listboxId}-opt-${i}`;

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  // Accessible dialog behavior: focus in/out, Tab trap, Escape, focus restore.
  useFocusTrap(dialogRef, { active: open, onClose: close });

  // Lazy-load the search index + user's causes on first open
  useEffect(() => {
    if (!open || docs || loading || fetchError) return;
    setLoading(true);
    Promise.all([
      fetch("/api/search-index").then((r) => {
        if (!r.ok) throw new Error("index");
        return r.json();
      }),
      // Causes are optional; a failure there should not fail the whole index.
      fetch("/api/causes").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([idx, causesResp]) => {
        const baseDocs: SearchDoc[] = Array.isArray(idx?.docs) ? idx.docs : [];
        const causes = Array.isArray(causesResp?.data?.causes)
          ? causesResp.data.causes
          : [];
        const causeDocs: SearchDoc[] = causes.map(
          (c: {
            id: string;
            title: string;
            outcome: string;
            topics: string[];
            jurisdictions: string[];
            watchTermsAny: string[];
            emoji?: string;
          }) => ({
            id: `cause-${c.id}`,
            type: "cause",
            title: `${c.emoji ? c.emoji + " " : ""}${c.title}`,
            subtitle: c.outcome.slice(0, 120),
            href: `/causes/${c.id}`,
            keywords: [c.title, c.outcome, ...c.topics, ...c.jurisdictions, ...c.watchTermsAny],
          }),
        );
        setDocs([...causeDocs, ...baseDocs]);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [open, docs, loading, fetchError]);

  // Global Cmd/Ctrl+K. Escape close is handled by useFocusTrap while open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Open from the mobile bottom-nav Search tab.
  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener("btp:open-search", openHandler);
    return () => window.removeEventListener("btp:open-search", openHandler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const results = useMemo<ScoredDoc[]>(() => {
    if (!docs || !query.trim()) return [];
    return docs
      .map((d) => ({ ...d, score: score(d, query) }))
      .filter((d) => d.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
  }, [docs, query]);

  // Reset highlighted row when query changes
  useEffect(() => setActiveIdx(0), [query]);

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const target = results[activeIdx];
      if (target) {
        e.preventDefault();
        router.push(target.href);
        close();
        setQuery("");
      } else if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        close();
      }
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-md border border-record-200 bg-white px-3 text-sm font-semibold text-ink-700 shadow-line transition hover:border-civic-500",
          className,
        )}
      >
        <Search className="h-4 w-4 text-ink-600" aria-hidden="true" />
        <span className="hidden sm:inline">Search</span>
        <span className="hidden items-center gap-0.5 rounded border border-record-200 bg-paper-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-600 sm:inline-flex">
          ⌘K
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink-950/60 p-4 sm:p-10"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-2xl overflow-hidden rounded-lg border border-record-200 bg-white shadow-panel outline-none"
          >
            <h2 id={titleId} className="sr-only">
              Search civic records
            </h2>
            <div className="flex items-center gap-3 border-b border-record-200 px-4 py-3">
              <Search className="h-5 w-5 text-ink-600" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onListKey}
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Search records, representatives, places, topics..."
                className="h-10 flex-1 bg-transparent text-base text-ink-950 outline-none placeholder:text-ink-600"
                aria-label="Search records, representatives, places, and topics"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={
                  results.length > 0 ? optionId(activeIdx) : undefined
                }
              />
              <kbd className="hidden rounded border border-record-200 bg-paper-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-600 sm:inline">
                ESC
              </kbd>
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-600 hover:bg-paper-50 hover:text-ink-900"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto" onKeyDown={onListKey}>
              {fetchError ? (
                <div className="px-4 py-6 text-sm leading-6 text-ink-700">
                  <p className="font-semibold text-ink-950">
                    Couldn&apos;t load the search index.
                  </p>
                  <p className="mt-1 text-xs text-ink-600">
                    The index didn&apos;t respond. Check your connection and try
                    again.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFetchError(false)}
                    className="mt-3 inline-flex items-center gap-2 rounded-md border border-record-200 bg-paper-50 px-3 py-1.5 text-xs font-semibold text-ink-800 hover:border-civic-500"
                  >
                    Try again
                  </button>
                </div>
              ) : !docs && loading ? (
                <p className="px-4 py-6 text-sm text-ink-600">
                  Loading search index...
                </p>
              ) : !query.trim() ? (
                <EmptyHints onPick={(q) => setQuery(q)} />
              ) : results.length === 0 ? (
                <div className="px-4 py-6 text-sm leading-6 text-ink-700">
                  <p>
                    No indexed records match{" "}
                    <strong>&ldquo;{query}&rdquo;</strong>.
                  </p>
                  <p className="mt-1 text-xs text-ink-600">
                    Try a representative name, a bill number, a city, or a
                    topic. Missing records are labeled, not invented.
                  </p>
                  <Link
                    href={`/search?q=${encodeURIComponent(query.trim())}`}
                    onClick={close}
                    className="mt-3 inline-flex items-center gap-2 rounded-md border border-record-200 bg-paper-50 px-3 py-1.5 text-xs font-semibold text-ink-800 hover:border-civic-500"
                  >
                    Open full search page
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <ul id={listboxId} role="listbox" className="grid">
                  {results.map((doc, idx) => (
                    <li
                      key={doc.id}
                      id={optionId(idx)}
                      role="option"
                      aria-selected={activeIdx === idx}
                    >
                      <Link
                        href={doc.href}
                        onClick={() => close()}
                        onMouseEnter={() => setActiveIdx(idx)}
                        tabIndex={-1}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 transition",
                          activeIdx === idx
                            ? "bg-civic-50"
                            : "hover:bg-paper-50",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                            TYPE_TONE[doc.type],
                          )}
                        >
                          {TYPE_LABEL[doc.type]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink-950">
                            {doc.title}
                          </span>
                          {doc.subtitle ? (
                            <span className="block truncate text-xs leading-5 text-ink-600">
                              {doc.subtitle}
                            </span>
                          ) : null}
                        </span>
                        {activeIdx === idx ? (
                          <CornerDownLeft
                            className="h-4 w-4 shrink-0 text-civic-700"
                            aria-hidden="true"
                          />
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-record-200 bg-paper-50 px-4 py-2 text-xs text-ink-600">
              <span>
                {fetchError
                  ? "Index unavailable"
                  : docs
                    ? `${docs.length} indexed`
                    : "Loading index"}
              </span>
              <span className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-record-200 bg-white px-1 py-0.5 font-mono text-[10px] font-semibold text-ink-700">
                    ↑↓
                  </kbd>{" "}
                  navigate
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-record-200 bg-white px-1 py-0.5 font-mono text-[10px] font-semibold text-ink-700">
                    ↵
                  </kbd>{" "}
                  open
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-record-200 bg-white px-1 py-0.5 font-mono text-[10px] font-semibold text-ink-700">
                    esc
                  </kbd>{" "}
                  close
                </span>
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function EmptyHints({ onPick }: { onPick: (q: string) => void }) {
  const hints = [
    { label: "Try a senator", q: "Schiff" },
    { label: "Try a state delegation", q: "California" },
    { label: "Try a bill number", q: "SB 79" },
    { label: "Try a topic", q: "homelessness" },
    { label: "Try a council file", q: "22-0617" },
  ];
  return (
    <div className="grid gap-2 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
        Search the index
      </p>
      <p className="text-sm leading-6 text-ink-700">
        540+ indexed entities: all 536 current U.S. Congress members, indexed
        bills, local files, topic pages, and source connectors.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {hints.map((h) => (
          <button
            key={h.q}
            type="button"
            onClick={() => onPick(h.q)}
            className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-xs font-semibold text-ink-700 hover:border-civic-500"
          >
            {h.label}: {h.q}
          </button>
        ))}
      </div>
    </div>
  );
}
