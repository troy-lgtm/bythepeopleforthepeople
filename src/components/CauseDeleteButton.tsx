"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function CauseDeleteButton({ causeId }: { causeId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (
      !window.confirm(
        "Delete this cause? Matched records remain indexed; only this cause is removed from your cookie.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const existing = await fetch("/api/causes")
        .then((r) => r.json())
        .catch(() => ({}));
      const causes = Array.isArray(existing?.data?.causes)
        ? existing.data.causes
        : [];
      const next = causes.filter((c: { id: string }) => c.id !== causeId);
      const res = await fetch("/api/causes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ causes: next }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(j.error?.message ?? "Could not delete this cause.");
        setBusy(false);
        return;
      }
      try {
        window.localStorage.setItem("btpftp-causes", JSON.stringify(next));
      } catch {
        // ignore
      }
      router.push("/causes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setBusy(false);
    }
  }

  return (
    <div className="grid justify-items-end gap-2">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="inline-flex h-11 items-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-700 hover:border-rose-300 hover:text-rose-700 disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {busy ? "Deleting..." : "Delete cause"}
      </button>
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-notice-100 bg-notice-50 px-3 py-2 text-xs leading-5 text-notice-500"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
