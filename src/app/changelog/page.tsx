import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { changelog } from "@/data/changelog";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Public, append-only log of methodology and product changes. Versioned trust.",
  alternates: { canonical: "/changelog" },
};

const KIND_TONE: Record<string, string> = {
  trust: "border-civic-100 bg-civic-50 text-civic-700",
  product: "border-record-200 bg-paper-50 text-ink-700",
  coverage: "border-civic-100 bg-civic-50 text-civic-700",
  methodology: "border-notice-100 bg-notice-50 text-notice-500",
  infra: "border-record-200 bg-paper-50 text-ink-700",
};

const KIND_LABEL: Record<string, string> = {
  trust: "Trust",
  product: "Product",
  coverage: "Coverage",
  methodology: "Methodology",
  infra: "Infrastructure",
};

export default function ChangelogPage() {
  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Changelog"
            title="Versioned methodology, versioned trust."
            description="Every change to methodology, coverage, product, infrastructure, or trust language lands here. Append-only. The corrections log covers per-record factual fixes; this log covers product-wide changes."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ol className="grid gap-4">
          {changelog.map((entry, idx) => (
            <li key={`${entry.date}-${idx}`}>
              <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 font-mono text-xs font-medium text-ink-700">
                    {entry.date}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      KIND_TONE[entry.kind] ?? KIND_TONE.product
                    }`}
                  >
                    {KIND_LABEL[entry.kind] ?? entry.kind}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-ink-950">
                  {entry.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-ink-700">
                  {entry.body}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-ink-600">
                  <ScrollText className="h-3 w-3" aria-hidden="true" />
                  Append-only entry · ledger position {changelog.length - idx}
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </PageShell>
  );
}
