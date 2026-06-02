"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyCommentButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-10 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
    >
      {state === "copied" ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" />
          Copied
        </>
      ) : state === "error" ? (
        "Copy failed"
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy letter
        </>
      )}
    </button>
  );
}
