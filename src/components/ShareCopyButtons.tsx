"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Send } from "lucide-react";

type ShareCopyButtonsProps = {
  shareUrl: string;
  ogUrl: string;
  tweetText: string;
  recordHref: string;
};

export function ShareCopyButtons({
  shareUrl,
  ogUrl,
  tweetText,
  recordHref,
}: ShareCopyButtonsProps) {
  const [copyState, setCopyState] = useState<{
    [k: string]: "idle" | "copied" | "error";
  }>({});

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState((s) => ({ ...s, [key]: "copied" }));
      setTimeout(
        () => setCopyState((s) => ({ ...s, [key]: "idle" })),
        2500,
      );
    } catch {
      setCopyState((s) => ({ ...s, [key]: "error" }));
    }
  }

  const tweetIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  const blueskyIntent = `https://bsky.app/intent/compose?text=${encodeURIComponent(tweetText)}`;

  return (
    <div className="mt-5 grid gap-3">
      <CopyRow
        label="Share URL"
        value={shareUrl}
        state={copyState.share ?? "idle"}
        onClick={() => copy("share", shareUrl)}
      />
      <CopyRow
        label="OG image URL"
        value={ogUrl}
        state={copyState.og ?? "idle"}
        onClick={() => copy("og", ogUrl)}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <a
          href={tweetIntent}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-3 text-sm font-semibold text-ink-900 hover:border-civic-500"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Tweet
        </a>
        <a
          href={blueskyIntent}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-3 text-sm font-semibold text-ink-900 hover:border-civic-500"
        >
          Bluesky
        </a>
      </div>
      {recordHref && recordHref !== "/" ? (
        <Link
          href={recordHref}
          className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink-950 px-3 text-sm font-semibold text-white hover:bg-ink-800"
        >
          Open the underlying record
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

function CopyRow({
  label,
  value,
  state,
  onClick,
}: {
  label: string;
  value: string;
  state: "idle" | "copied" | "error";
  onClick: () => void;
}) {
  return (
    <div className="grid gap-1">
      <label className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 flex-1 min-w-0 rounded-md border border-record-200 bg-paper-50 px-3 font-mono text-xs text-ink-800 outline-none focus:border-civic-500 focus:bg-white"
        />
        <button
          type="button"
          onClick={onClick}
          aria-label={`Copy ${label}`}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-md border border-record-200 bg-white px-3 text-xs font-semibold text-ink-800 hover:border-civic-500"
        >
          {state === "copied" ? (
            <>
              <Check className="h-3.5 w-3.5 text-civic-700" aria-hidden="true" />
              Copied
            </>
          ) : state === "error" ? (
            "Copy failed"
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
