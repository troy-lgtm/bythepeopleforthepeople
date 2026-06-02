import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { corrections } from "@/data/corrections";

export const metadata: Metadata = {
  title: "Corrections log",
  description:
    "Every factual change made after publication. Append-only, dated, and tied to the affected record.",
  alternates: { canonical: "/corrections" },
};

export default function CorrectionsPage() {
  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Corrections"
            title="Every fix posted publicly. Nothing silently deleted."
            description="When we get something wrong, we post the correction here with the date, the affected record, and what changed."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-6 text-sm leading-6 text-ink-700">
          {corrections.length} {corrections.length === 1 ? "entry" : "entries"}{" "}
          since launch. Append-only log. To report a new correction, click
          &ldquo;Report a correction&rdquo; on any record page or email{" "}
          <a
            href="mailto:corrections@bythepeopleforthepeople.com"
            className="text-civic-700 underline"
          >
            corrections@bythepeopleforthepeople.com
          </a>
          .
        </p>

        <ol className="grid gap-4">
          {corrections.map((entry) => (
            <li key={entry.id}>
              <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 font-mono text-xs font-medium text-ink-700">
                    {entry.date}
                  </span>
                  <span className="rounded-full border border-civic-100 bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700">
                    {entry.reportedBy}
                  </span>
                  <Link
                    href={entry.recordHref}
                    className="text-xs font-semibold text-ink-700 hover:text-civic-700"
                  >
                    {entry.recordTitle}
                  </Link>
                </div>
                <div className="mt-3 grid gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                      What was wrong
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-800">
                      {entry.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                      The fix
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-800">
                      {entry.fix}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <ScrollText
                    className="h-3.5 w-3.5 text-ink-600"
                    aria-hidden="true"
                  />
                  <code className="text-xs text-ink-600">{entry.id}</code>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </PageShell>
  );
}
