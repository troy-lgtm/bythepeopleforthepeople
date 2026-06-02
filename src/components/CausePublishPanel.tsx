"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Rss } from "lucide-react";

type CausePublishPanelProps = {
  feedUrl: string;
  causeOgUrl: string;
};

export function CausePublishPanel({
  feedUrl,
  causeOgUrl,
}: CausePublishPanelProps) {
  const [copyState, setCopyState] = useState<{ [k: string]: "idle" | "copied" }>({});

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState((s) => ({ ...s, [key]: "copied" }));
      setTimeout(() => setCopyState((s) => ({ ...s, [key]: "idle" })), 2500);
    } catch {
      // ignore
    }
  }

  return (
    <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
          <Rss className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            Publish RSS for this cause
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink-950">
            Subscribe in any RSS reader.
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            The feed URL embeds the cause configuration. Anyone with the URL
            sees the matched records. Use that as your subscription link in
            Feedly, Reeder, Miniflux, Inoreader, or NetNewsWire. If you edit
            the cause, generate a fresh URL.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        <CopyRow
          label="RSS feed URL"
          value={feedUrl}
          state={copyState.feed ?? "idle"}
          onCopy={() => copy("feed", feedUrl)}
        />
        <CopyRow
          label="Per-cause OG image URL"
          value={causeOgUrl}
          state={copyState.og ?? "idle"}
          onCopy={() => copy("og", causeOgUrl)}
        />
      </div>
      <p className="mt-4 text-xs leading-5 text-ink-600">
        The URL is a base64url-encoded snapshot of your cause configuration.
        It does not contain a session identifier, cookie, or any account
        token. If you delete your cause locally, the URL still works for
        whoever holds it — that is the cost of opt-in publishing.
      </p>
      <Link
        href="/feed.xml"
        className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-record-200 bg-paper-50 px-3 text-xs font-semibold text-ink-800 hover:border-civic-500"
      >
        Or: subscribe to the site-wide /feed.xml instead
      </Link>
    </section>
  );
}

function CopyRow({
  label,
  value,
  state,
  onCopy,
}: {
  label: string;
  value: string;
  state: "idle" | "copied";
  onCopy: () => void;
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
          className="h-11 min-w-0 flex-1 rounded-md border border-record-200 bg-paper-50 px-3 font-mono text-xs text-ink-800 outline-none focus:border-civic-500 focus:bg-white"
        />
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-11 items-center gap-1 rounded-md border border-record-200 bg-white px-3 text-xs font-semibold text-ink-800 hover:border-civic-500"
        >
          {state === "copied" ? (
            <>
              <Check className="h-3.5 w-3.5 text-civic-700" aria-hidden="true" />
              Copied
            </>
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
