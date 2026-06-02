import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { STARTER_CAUSES } from "@/data/starter-causes";

export const metadata: Metadata = {
  title: "Starter causes",
  description:
    "12 starter cause cards balanced across civic concerns. Pick one to begin tracking matched records.",
  alternates: { canonical: "/causes/starters" },
};

export default function StarterCausesPage() {
  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Starter causes"
            title="Pick a starting point in your own words."
            description="12 starter prompts balanced across civic concerns. The product does not score causes for or against; it surfaces records that match your topics, jurisdictions, and keywords."
          />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STARTER_CAUSES.map((s) => (
            <li key={s.id}>
              <Link
                href="/causes/new"
                className="block h-full rounded-lg border border-record-200 bg-white p-5 shadow-line transition hover:border-civic-500 hover:bg-paper-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden="true">
                    {s.emoji}
                  </span>
                  <h3 className="text-base font-semibold text-ink-950">
                    {s.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-700">
                  {s.outcome}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-600">
                  {s.topics.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-paper-50 px-2 py-0.5"
                    >
                      {t}
                    </span>
                  ))}
                  {s.watchTermsAny.slice(0, 3).map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-paper-50 px-2 py-0.5"
                    >
                      {k}
                    </span>
                  ))}
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-civic-700">
                  Open wizard
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
