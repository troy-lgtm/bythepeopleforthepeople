import type { Metadata } from "next";
import { Suspense } from "react";
import { AnswerEngine } from "@/components/AnswerEngine";
import { ExploreWorkspace } from "@/components/ExploreWorkspace";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Ask Records",
  description:
    "Search public decisions by vote, change, incorporated text, place, status, and source record.",
  alternates: { canonical: "/explore" },
};

export default function ExplorePage() {
  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Ask records"
            title="Search by what you need to know, not by government jargon."
            description="Ask whether something passed, who voted no, what changed, what got incorporated, what happens next, whether it touches a place, and where the proof is."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <AnswerEngine
          title="Get the answer first, then inspect the public record."
          description="The search surface starts with the answer and keeps the source evidence visible so users do not have to leave the site to verify basic facts."
          initialAnswerId="answer-no-votes"
          compact
        />
      </section>

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="text-sm text-ink-600">Loading explorer...</div>
            }
          >
            <ExploreWorkspace />
          </Suspense>
        </div>
      </section>
    </PageShell>
  );
}
