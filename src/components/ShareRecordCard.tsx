"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Share2 } from "lucide-react";
import { getSourcesByIds } from "@/data/records";
import type { ShareCardRecord } from "@/data/types";
import { copyText } from "@/lib/clipboard";
import { SourceTrail } from "./SourceTrail";

type ShareRecordCardProps = {
  card: ShareCardRecord;
};

export function ShareRecordCard({ card }: ShareRecordCardProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  async function copyLink() {
    const url = `${window.location.origin}${card.href}`;
    const ok = await copyText(url);
    setCopyStatus(ok ? "copied" : "error");
    setTimeout(() => setCopyStatus("idle"), 2000);
  }

  return (
    <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            {card.kicker}
          </p>
          <h3 className="mt-2 text-lg font-semibold leading-7 text-ink-950">
            <Link href={card.href} className="hover:text-civic-700">
              {card.title}
            </Link>
          </h3>
        </div>
        <div className="rounded-lg border border-record-200 bg-paper-50 px-3 py-2 text-center">
          <p className="font-mono text-lg font-semibold text-ink-950">
            {card.statValue}
          </p>
          <p className="text-xs font-medium text-ink-600">{card.statLabel}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-ink-700">{card.summary}</p>
      <div className="mt-4">
        <SourceTrail sources={getSourcesByIds(card.sourceIds)} compact />
      </div>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-record-200 pt-4">
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-3 text-sm font-semibold text-ink-950 hover:border-civic-500"
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
              Copy source card
            </>
          )}
        </button>
        <Link
          href={card.href}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink-950 px-3 text-sm font-semibold text-white hover:bg-ink-800"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Open record
        </Link>
        <p className="sr-only" role="status" aria-live="polite">
          {copyStatus === "copied"
            ? "Source card link copied to clipboard."
            : copyStatus === "error"
              ? "Copy failed. Please copy the link manually."
              : ""}
        </p>
      </div>
    </article>
  );
}
