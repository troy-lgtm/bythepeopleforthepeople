"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Search } from "lucide-react";

type Suggestion = { zip: string; city: string; state: string };

type Props = {
  currentZip?: string | null;
  currentLabel?: string | null;
};

export function LocationAutocomplete({ currentLabel }: Props) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `/api/place/suggest?q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        const json = (await res.json()) as {
          data?: { suggestions?: Suggestion[] };
        };
        setSuggestions(json.data?.suggestions ?? []);
        setOpen(true);
      } catch {
        /* aborted or offline */
      }
    }, 200);
    return () => clearTimeout(t);
  }, [value]);

  async function choose(zip: string) {
    setBusy(true);
    setError(null);
    setOpen(false);
    try {
      const res = await fetch("/api/place/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip }),
      });
      const json = (await res.json()) as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Could not resolve that ZIP.");
        setBusy(false);
        return;
      }
      setValue("");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const digits = value.trim().slice(0, 5);
    if (/^\d{5}$/.test(digits)) {
      choose(digits);
    } else if (suggestions[0]) {
      choose(suggestions[0].zip);
    } else {
      setError("Enter a 5-digit ZIP or pick a suggestion.");
    }
  }

  return (
    <div className="relative">
      {currentLabel ? (
        <p className="mb-2 text-xs text-ink-600">
          Showing{" "}
          <span className="font-semibold text-ink-900">{currentLabel}</span>.
          Change it below.
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">ZIP code or city</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
            aria-hidden="true"
          />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Enter your ZIP or city…"
            enterKeyHint="go"
            autoComplete="postal-code"
            className="h-12 w-full rounded-md border border-record-200 bg-white pl-9 pr-3 text-base text-ink-950 shadow-line outline-none focus:border-civic-500 sm:text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <MapPin className="h-4 w-4" aria-hidden="true" />
          )}
          See my reps
        </button>
      </form>

      {open && suggestions.length > 0 ? (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-record-200 bg-white shadow-panel">
          {suggestions.map((s) => (
            <li key={`${s.zip}-${s.city}`}>
              <button
                type="button"
                onClick={() => choose(s.zip)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-paper-50"
              >
                <MapPin
                  className="h-3.5 w-3.5 shrink-0 text-civic-700"
                  aria-hidden="true"
                />
                <span className="font-semibold text-ink-950">{s.zip}</span>
                <span className="text-ink-600">
                  {s.city}, {s.state}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs leading-5 text-notice-500">{error}</p>
      ) : null}
    </div>
  );
}
