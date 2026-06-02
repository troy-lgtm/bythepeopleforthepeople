import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-civic-700">
          Record not found
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink-950">
          This decision record is not in the current public-record index.
        </h1>
        <p className="mt-4 text-base leading-7 text-ink-700">
          Missing records are labeled instead of guessed. Try the answer search
          or open the indexed source library.
        </p>
        <Link
          href="/explore"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          Open answer search
        </Link>
      </section>
    </PageShell>
  );
}
