"use client";

import { useState } from "react";
import { AlertTriangle, X, CheckCircle2 } from "lucide-react";

type ReportCorrectionProps = {
  recordHref: string;
  recordTitle: string;
};

export function ReportCorrection({
  recordHref,
  recordTitle,
}: ReportCorrectionProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "received" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (description.trim().length < 8) {
      setErrorMessage("Description must be at least 8 characters.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordHref,
          recordTitle,
          description: description.trim(),
          email: email.trim() || undefined,
        }),
      });
      const json = (await res.json()) as
        | { ok: true }
        | { ok: false; error: { message: string } };
      if (!json.ok) {
        setErrorMessage(json.error.message);
        setStatus("error");
        return;
      }
      setStatus("received");
    } catch {
      setErrorMessage("Network error. Try again or email corrections@bythepeopleforthepeople.com.");
      setStatus("error");
    }
  }

  function close() {
    setOpen(false);
    if (status === "received") {
      setStatus("idle");
      setDescription("");
      setEmail("");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-notice-100 bg-notice-50 px-3 text-xs font-semibold text-notice-500 transition hover:border-notice-500"
      >
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        Report a correction
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-4 sm:items-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              close();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-correction-title"
        >
          <div className="w-full max-w-md rounded-lg border border-record-200 bg-white p-5 shadow-panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
                  Correction
                </p>
                <h2
                  id="report-correction-title"
                  className="mt-1 text-lg font-semibold text-ink-950"
                >
                  Tell us what is wrong.
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-700">
                  Every correction is logged publicly with date and record.
                  You can submit anonymously. Email is optional and only used
                  to notify you when the correction is published.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-md p-1 text-ink-600 hover:bg-paper-50 hover:text-ink-900"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {status === "received" ? (
              <div className="mt-5 rounded-md border border-civic-100 bg-civic-50 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 text-civic-700"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink-950">
                      Received and queued for review.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-ink-700">
                      Surviving review, it lands in the public corrections log
                      within 7 days.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form className="mt-5 grid gap-3" onSubmit={submit}>
                <div className="grid gap-1">
                  <label
                    htmlFor="correction-record"
                    className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600"
                  >
                    Record
                  </label>
                  <input
                    id="correction-record"
                    value={recordTitle}
                    readOnly
                    className="h-11 rounded-md border border-record-200 bg-paper-50 px-3 text-sm text-ink-700"
                  />
                </div>
                <div className="grid gap-1">
                  <label
                    htmlFor="correction-description"
                    className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600"
                  >
                    What is wrong, and what should the record say instead?
                  </label>
                  <textarea
                    id="correction-description"
                    rows={5}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="The vote count shows 21 ayes but the LegInfo page shows 22 as of today. Source: https://..."
                    className="rounded-md border border-record-200 bg-paper-50 p-3 text-sm leading-6 text-ink-950 outline-none transition focus:border-civic-500 focus:bg-white"
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <label
                    htmlFor="correction-email"
                    className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600"
                  >
                    Email (optional)
                  </label>
                  <input
                    id="correction-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="So we can notify you when the fix lands"
                    className="h-11 rounded-md border border-record-200 bg-paper-50 px-3 text-sm text-ink-950 outline-none transition focus:border-civic-500 focus:bg-white"
                  />
                </div>
                {errorMessage ? (
                  <p className="rounded-md border border-notice-100 bg-notice-50 px-3 py-2 text-xs leading-5 text-notice-500">
                    {errorMessage}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
                >
                  {status === "submitting" ? "Submitting..." : "Submit correction"}
                </button>
                <p className="text-xs leading-5 text-ink-600">
                  Submissions queue server-side. With CORRECTIONS_WEBHOOK_URL
                  configured, they forward to your moderation pipeline.
                </p>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
