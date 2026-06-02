"use client";

import { useState } from "react";
import Link from "next/link";
import { Share2, X } from "lucide-react";

type ShareablePreset = {
  text: string;
  source: string;
  sourceUrl?: string;
  date?: string;
};

type ShareRecordButtonsProps = {
  recordTitle: string;
  recordHref: string;
  presets: ShareablePreset[];
};

export function ShareRecordButtons({
  recordTitle,
  recordHref,
  presets,
}: ShareRecordButtonsProps) {
  const [open, setOpen] = useState(false);

  function buildHref(preset: ShareablePreset): string {
    const params = new URLSearchParams({
      text: preset.text,
      source: preset.source,
      recordHref,
    });
    if (preset.sourceUrl) params.set("sourceUrl", preset.sourceUrl);
    if (preset.date) params.set("date", preset.date);
    return `/share?${params.toString()}`;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-civic-100 bg-civic-50 px-3 text-xs font-semibold text-civic-700 hover:border-civic-500"
        aria-haspopup="dialog"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        Share a sourced fact
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/60 p-4 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-record-title"
        >
          <div className="w-full max-w-xl overflow-hidden rounded-lg border border-record-200 bg-white shadow-panel">
            <div className="flex items-start justify-between gap-3 border-b border-record-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
                  Share with proof
                </p>
                <h2
                  id="share-record-title"
                  className="mt-1 text-lg font-semibold text-ink-950"
                >
                  Pick a fact from {recordTitle}
                </h2>
                <p className="mt-2 text-xs leading-5 text-ink-600">
                  Every share generates a card with the official-source
                  citation embedded.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-ink-600 hover:bg-paper-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <ul className="max-h-[60vh] divide-y divide-record-200 overflow-y-auto">
              {presets.map((preset, idx) => (
                <li key={idx}>
                  <Link
                    href={buildHref(preset)}
                    onClick={() => setOpen(false)}
                    className="block px-5 py-4 transition hover:bg-paper-50"
                  >
                    <blockquote className="border-l-2 border-civic-500 pl-3 text-sm leading-6 text-ink-900">
                      {preset.text}
                    </blockquote>
                    <p className="mt-2 text-xs text-ink-600">
                      Source: {preset.source}
                      {preset.date ? ` · Verified ${preset.date}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-record-200 bg-paper-50 px-5 py-3 text-xs text-ink-600">
              Preview, copy, and share on the next screen.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
