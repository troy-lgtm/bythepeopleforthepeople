"use client";

import { useState } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { track } from "@/lib/analytics";
import { readStoredRef } from "@/lib/ref-tags";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "pending" }
  | { kind: "updated" }
  | { kind: "private_pilot"; message: string }
  | { kind: "error"; message: string };

// Pragmatic email shape check: a local part, an @, and a dotted domain.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [cadence, setCadence] = useState<"weekly" | "daily">("weekly");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const trimmedEmail = email.trim();
  const emailValid = EMAIL_RE.test(trimmedEmail);
  // Only flag an invalid-email message once the user has typed something.
  const emailError = trimmedEmail.length > 0 && !emailValid;
  const consentError = status.kind === "error" && !consent;

  async function submit() {
    if (!emailValid) {
      setStatus({
        kind: "error",
        message: "Enter a valid email address.",
      });
      return;
    }
    if (!consent) {
      setStatus({ kind: "error", message: "Please check the consent box." });
      return;
    }
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          cadence,
          consent,
          // First-touch surface for this session, so a subscribe can be
          // credited to the receipt or digest that actually drove it.
          ref: readStoredRef() ?? undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        data?: { status?: string; message?: string };
        error?: { message?: string };
      };
      if (!res.ok || !json.ok) {
        setStatus({
          kind: "error",
          message:
            json.error?.message ??
            "Could not subscribe right now. Try again shortly.",
        });
        return;
      }
      if (json.data?.status === "private_pilot") {
        // Calm, honest gate: the pilot only accepts the test user right now.
        setStatus({
          kind: "private_pilot",
          message:
            json.data.message ??
            "Private test mode is active. This pilot is currently limited to the test user.",
        });
      } else if (json.data?.status === "updated") {
        // Already-confirmed address; preferences refreshed, not a new signup.
        setStatus({ kind: "updated" });
      } else {
        track("subscribe", { cadence });
        setStatus({ kind: "pending" });
      }
    } catch {
      setStatus({ kind: "error", message: "Network error. Try again." });
    }
  }

  if (status.kind === "pending") {
    return (
      <Done
        title="Check your inbox"
        body="We sent a confirmation link. Click it to start your digest — nothing sends until you confirm."
      />
    );
  }
  if (status.kind === "updated") {
    return (
      <Done
        title="Preferences updated"
        body="This address was already confirmed. Your cadence and tracked causes have been refreshed."
      />
    );
  }
  if (status.kind === "private_pilot") {
    return <Done title="Private pilot" body={status.message} />;
  }

  return (
    <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
          <Mail className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            Get the digest
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink-950">
            Have it delivered.
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            Source-anchored civic-records updates by email. If you have set a
            ZIP or any causes, they are included automatically — and personalize
            what you receive.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="done"
            aria-invalid={emailError}
            aria-describedby={emailError ? "subscribe-email-error" : undefined}
            className="h-12 rounded-md border border-record-200 bg-paper-50 px-3 text-base text-ink-950 outline-none focus:border-civic-500 focus:bg-white sm:h-11 sm:text-sm"
          />
          {emailError ? (
            <span
              id="subscribe-email-error"
              className="text-xs leading-5 text-notice-500"
            >
              Enter a valid email address (name@example.com).
            </span>
          ) : null}
        </label>

        <div className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
            Cadence
          </span>
          <div className="flex gap-2">
            {(["weekly", "daily"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCadence(c)}
                className={
                  cadence === c
                    ? "flex-1 rounded-md border border-civic-500 bg-civic-50 px-3 py-2 text-sm font-semibold capitalize text-civic-700"
                    : "flex-1 rounded-md border border-record-200 bg-white px-3 py-2 text-sm font-semibold capitalize text-ink-700 hover:border-civic-500"
                }
              >
                {c}
              </button>
            ))}
          </div>
          <span className="text-xs text-ink-600">
            Weekly sends Mondays. Daily sends each day there is movement.
          </span>
        </div>

        <label className="flex items-start gap-2 text-xs leading-5 text-ink-700">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={consentError}
            aria-describedby={consentError ? "subscribe-error" : undefined}
            className="mt-0.5 h-4 w-4 rounded border-record-200 text-civic-600 focus:ring-civic-500"
          />
          <span>
            I want this digest by email. I can unsubscribe from any message in
            one click. Email is stored only to deliver the digest — never sold,
            never shared.
          </span>
        </label>

        {status.kind === "error" ? (
          <p
            id="subscribe-error"
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-notice-100 bg-notice-50 px-3 py-2 text-xs leading-5 text-notice-500"
          >
            {status.message}
          </p>
        ) : null}

        <button
          type="button"
          onClick={submit}
          disabled={status.kind === "submitting" || !emailValid}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink-950 px-5 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60"
        >
          {status.kind === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Subscribing…
            </>
          ) : (
            "Subscribe"
          )}
        </button>
      </div>
    </section>
  );
}

function Done({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-lg border border-civic-100 bg-civic-50 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-civic-700">
          <Check className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-ink-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-ink-700">{body}</p>
        </div>
      </div>
    </section>
  );
}
