import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-civic-700">
          Page not found
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink-950">
          We couldn&apos;t find that page.
        </h1>
        <p className="mt-4 text-base leading-7 text-ink-700">
          The page or record you&apos;re after isn&apos;t in the current
          public-record index. Missing records are labeled, not guessed — try the
          answer search, or head back home.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/explore"
            className="inline-flex h-11 items-center justify-center rounded-md bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-ink-800"
          >
            Open answer search
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 transition hover:border-civic-500"
          >
            Back to home
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
