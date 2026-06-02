"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function CauseDeleteButton({ causeId }: { causeId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (
      !window.confirm(
        "Delete this cause? Matched records remain indexed; only this cause is removed from your cookie.",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const existing = await fetch("/api/causes")
        .then((r) => r.json())
        .catch(() => ({}));
      const causes = Array.isArray(existing?.data?.causes)
        ? existing.data.causes
        : [];
      const next = causes.filter((c: { id: string }) => c.id !== causeId);
      await fetch("/api/causes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ causes: next }),
      });
      try {
        window.localStorage.setItem("btpftp-causes", JSON.stringify(next));
      } catch {
        // ignore
      }
      router.push("/causes");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className="inline-flex h-11 items-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-700 hover:border-rose-300 hover:text-rose-700 disabled:opacity-60"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {busy ? "Deleting..." : "Delete cause"}
    </button>
  );
}
