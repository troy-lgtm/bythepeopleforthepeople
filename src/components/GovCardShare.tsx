"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, Send, Share2 } from "lucide-react";
import { track } from "@/lib/analytics";
import { copyText } from "@/lib/clipboard";

type Props = {
  shareUrl: string;
  text: string;
  storyUrl: string;
  surface?: string;
};

export function GovCardShare({
  shareUrl,
  text,
  storyUrl,
  surface = "gov",
}: Props) {
  const [canShare, setCanShare] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  async function nativeShare() {
    try {
      await navigator.share({ text, url: shareUrl });
      track("share", { surface, method: "native" });
    } catch {
      /* cancelled / unsupported */
    }
  }

  async function copy() {
    const ok = await copyText(shareUrl);
    if (ok) {
      setCopyStatus("copied");
      track("share", { surface, method: "copy" });
    } else {
      setCopyStatus("error");
    }
    setTimeout(() => setCopyStatus("idle"), 2000);
  }

  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
  const bsky = `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text} ${shareUrl}`)}`;

  return (
    <div className="grid gap-3">
      {canShare ? (
        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-civic-600 px-5 text-sm font-semibold text-white transition hover:bg-civic-700"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share this card
        </button>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-3 text-sm font-semibold text-ink-900 transition hover:border-civic-500"
        >
          {copyStatus === "copied" ? (
            <>
              <Check className="h-4 w-4 text-civic-700" aria-hidden="true" />
              Copied
            </>
          ) : copyStatus === "error" ? (
            "Copy failed"
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy link
            </>
          )}
        </button>
        <a
          href={storyUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("share", { surface, method: "story" })}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-3 text-sm font-semibold text-ink-900 transition hover:border-civic-500"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Story image (9:16)
        </a>
        <a
          href={tweet}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("share", { surface, method: "tweet" })}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-3 text-sm font-semibold text-ink-900 transition hover:border-civic-500"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Tweet
        </a>
        <a
          href={bsky}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("share", { surface, method: "bluesky" })}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-3 text-sm font-semibold text-ink-900 transition hover:border-civic-500"
        >
          Bluesky
        </a>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {copyStatus === "copied"
          ? "Link copied to clipboard."
          : copyStatus === "error"
            ? "Copy failed. Please copy the link manually."
            : ""}
      </p>
    </div>
  );
}
