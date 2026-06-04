"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useFocusTrap } from "@/lib/useFocusTrap";

type PlacePickerProps = {
  currentZip?: string | null;
  currentLabel?: string | null;
  className?: string;
};

const sampleZips = ["90012", "94105", "10001", "60601", "98101"];

export function PlacePicker({
  currentZip,
  currentLabel,
  className,
}: PlacePickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [zip, setZip] = useState(currentZip ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dialogRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setError(null);
    setSubmitting(null);
  }, []);

  // Accessible dialog behavior: focus in/out, Tab trap, Escape, focus restore.
  useFocusTrap(dialogRef, { active: open, onClose: close });

  async function submit(value: string) {
    setError(null);
    const trimmed = value.trim().slice(0, 5);
    if (!/^\d{5}$/.test(trimmed)) {
      setError("Enter a 5-digit ZIP.");
      return;
    }
    setSubmitting(trimmed);
    try {
      const res = await fetch("/api/place/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip: trimmed }),
      });
      const json = (await res.json()) as
        | { ok: true }
        | { ok: false; error: string; message: string };
      if (!json.ok) {
        setError(json.message);
        setSubmitting(null);
        return;
      }
      close();
      startTransition(() => router.refresh());
    } catch {
      setError("Network error. Try again.");
      setSubmitting(null);
    }
  }

  async function clearPlace() {
    setError(null);
    setSubmitting("__clear__");
    try {
      const res = await fetch("/api/place/lookup", { method: "DELETE" });
      if (!res.ok) {
        setError("Could not clear your place. Try again.");
        setSubmitting(null);
        return;
      }
      setZip("");
      close();
      startTransition(() => router.refresh());
    } catch {
      setError("Network error. Try again.");
      setSubmitting(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border border-record-200 bg-white px-3 text-xs font-semibold text-ink-800 shadow-line transition hover:border-civic-500",
          className,
        )}
      >
        <MapPin className="h-3.5 w-3.5 text-civic-700" aria-hidden="true" />
        {currentLabel ? (
          <>
            <span className="truncate max-w-[12rem]">{currentLabel}</span>
            <span className="text-ink-600">change</span>
          </>
        ) : (
          <span>Set your place</span>
        )}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-4 sm:items-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              close();
            }
          }}
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="placepicker-title"
            className="w-full max-w-md rounded-lg border border-record-200 bg-white p-5 shadow-panel outline-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
                  Personalize
                </p>
                <h2
                  id="placepicker-title"
                  className="mt-1 text-lg font-semibold text-ink-950"
                >
                  Tell us where you are.
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-700">
                  Your ZIP stays in a first-party cookie. It is used to surface
                  your representatives and to filter records to your place.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-600 hover:bg-paper-50 hover:text-ink-900"
                aria-label="Close"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form
              className="mt-5 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                submit(zip);
              }}
            >
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                  ZIP code
                </span>
                <input
                  value={zip}
                  onChange={(event) => setZip(event.target.value)}
                  inputMode="numeric"
                  pattern="\d{5}"
                  maxLength={5}
                  autoComplete="postal-code"
                  enterKeyHint="go"
                  placeholder="90012"
                  className="h-12 rounded-md border border-record-200 bg-paper-50 px-3 text-base font-medium text-ink-950 outline-none transition focus:border-civic-500 focus:bg-white sm:h-11 sm:text-sm"
                />
              </label>
              {error ? (
                <p
                  role="alert"
                  className="rounded-md border border-notice-100 bg-notice-50 px-3 py-2 text-xs leading-5 text-notice-500"
                >
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                  Try
                </span>
                {sampleZips.map((sample) => {
                  const isSubmitting = submitting === sample;
                  return (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => submit(sample)}
                      disabled={submitting !== null}
                      aria-busy={isSubmitting}
                      className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-0.5 text-xs font-semibold text-ink-700 hover:border-civic-500 disabled:opacity-60"
                    >
                      {isSubmitting ? `${sample}…` : sample}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={pending || submitting !== null}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
                >
                  {pending || (submitting && submitting !== "__clear__")
                    ? "Saving..."
                    : "Save place"}
                </button>
                {currentZip ? (
                  <button
                    type="button"
                    onClick={clearPlace}
                    disabled={pending || submitting !== null}
                    className="inline-flex h-11 items-center justify-center rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-800 hover:border-civic-500 disabled:opacity-60"
                  >
                    {submitting === "__clear__" ? "Clearing..." : "Clear"}
                  </button>
                ) : null}
              </div>
              <p className="text-xs leading-5 text-ink-600">
                Live lookup covers any US ZIP via the US Census Geographies
                API. Major metros resolve from a local table; long-tail ZIPs
                fall back to the Census service. No third-party tracking.
              </p>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
