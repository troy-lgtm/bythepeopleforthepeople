import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Terms",
  description: "Use of records, the API, and editorial framing.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Terms"
            title="Plain-English terms of use."
            description="No lock-in, no surveillance, no hidden fees. Just attribution and good faith."
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 text-sm leading-7 text-ink-800 sm:px-6 lg:px-8">
        <h2 className="mt-2 text-lg font-semibold text-ink-950">Records and source links</h2>
        <p className="mt-3">
          Every indexed record points to a public source. We do not own those
          underlying sources; they belong to the agency that published them.
          We index, organize, and provide source trails. Read the original at
          the linked official URL.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-ink-950">API</h2>
        <p className="mt-3">
          The public API at <code>/api/*</code>, the manifest at{" "}
          <code>/.well-known/civic-records.json</code>, and the LLM directives
          at <code>/llms.txt</code> are free to use under fair-use volumes for
          newsrooms, civic technologists, students, and AI engines. Cite the
          record URL when grounding. Do not strip the source trail. Do not
          re-publish indexed metadata as your own without attribution.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-ink-950">Reliance</h2>
        <p className="mt-3">
          We are a source-index, not a legal advisor. The site does not
          provide legal, financial, or political advice. For legal effect,
          read the linked official record at the source URL. Where a claim on
          this site disagrees with the official record, the official record
          governs and we will post a correction.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-ink-950">Brand and content</h2>
        <p className="mt-3">
          The name &ldquo;By The People, For The People&rdquo; and the visual
          system on this site are property of the operators. Editorial
          content, methodology, and original explanations on this site are
          released under a Creative Commons Attribution license: copy,
          translate, republish freely with attribution back to the record
          URL.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-ink-950">No warranty</h2>
        <p className="mt-3">
          The site is provided as-is. We aim for 100% accuracy and label
          missing data when we are not sure. We are not liable for downstream
          decisions made on the basis of this index. When in doubt, read the
          source record.
        </p>

        <p className="mt-8 text-xs text-ink-600">
          Last updated 2026-05-21. Material changes will be logged in the{" "}
          <a href="/corrections" className="text-civic-700 underline">
            corrections log
          </a>
          .
        </p>
      </section>
    </PageShell>
  );
}
