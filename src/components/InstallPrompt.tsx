"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type InstallEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: string }>;
};

const DISMISS_KEY = "btp-install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }

    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;
    if (standalone) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS Safari never fires beforeinstallprompt — show a manual hint.
    const ua = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|chrome|android/i.test(ua);
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isIos && isSafari) {
      timer = setTimeout(() => {
        setIosHint(true);
        setShow(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      if (timer) clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    dismiss();
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 3.75rem)" }}
    >
      <div className="mx-3 mb-2 rounded-lg border border-record-200 bg-white p-3 shadow-panel">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
            <Download className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-950">
              Add to your home screen
            </p>
            {iosHint ? (
              <p className="mt-0.5 inline-flex flex-wrap items-center gap-1 text-xs leading-5 text-ink-700">
                Tap
                <Share className="inline h-3.5 w-3.5 text-civic-700" aria-hidden="true" />
                Share, then “Add to Home Screen” for one-tap access.
              </p>
            ) : (
              <p className="mt-0.5 text-xs leading-5 text-ink-700">
                Install for one-tap access and faster loads. No app store.
              </p>
            )}
            {!iosHint ? (
              <button
                type="button"
                onClick={install}
                className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-ink-950 px-3 text-xs font-semibold text-white hover:bg-ink-800"
              >
                Add to home screen
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-600 hover:bg-paper-50 hover:text-ink-900"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
