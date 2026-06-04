import type { Metadata } from "next";
import {
  BadgeCheck,
  BookOpenCheck,
  FileSearch,
  GitBranch,
  Scale,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { MethodologyPrincipleCard } from "@/components/MethodologyPrincipleCard";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { integrationReadiness } from "@/data/product-loop";

export const metadata: Metadata = {
  title: "About / Methodology",
  description: "How By The People, For The People organizes public records.",
  alternates: { canonical: "/methodology" },
};

const principles = [
  {
    icon: FileSearch,
    title: "Public records first",
    description:
      "The platform uses public records such as bill text, amendment versions, agendas, roll call votes, transcripts, filings, and minutes.",
  },
  {
    icon: GitBranch,
    title: "Facts separated from interpretation",
    description:
      "Records are organized into what changed, who acted, who voted, who spoke, and what source supports the record.",
  },
  {
    icon: Scale,
    title: "No partisan scores",
    description:
      "The product does not assign partisan ratings, candidate scores, or bill endorsements.",
  },
  {
    icon: ShieldCheck,
    title: "No endorsements",
    description:
      "By The People, For The People does not endorse candidates, public officials, bills, ordinances, or agencies.",
  },
  {
    icon: BadgeCheck,
    title: "Provenance for every claim",
    description:
      "Every factual card should connect to source records with date, type, jurisdiction, and description.",
  },
  {
    icon: Sparkles,
    title: "Cited AI summaries later",
    description:
      "AI summaries, when used in the future, must cite source records and expose the public record trail that supports the summary.",
  },
  {
    icon: TriangleAlert,
    title: "Missing means missing",
    description:
      "Missing data should be labeled as missing, not guessed. Unknown positions and unpublished votes should remain clearly marked.",
  },
  {
    icon: BookOpenCheck,
    title: "Understanding, not persuasion",
    description:
      "The goal is public understanding of procedural records, not persuasion, mobilization, or outrage optimization.",
  },
];

export default function MethodologyPage() {
  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            as="h1"
            eyebrow="About / Methodology"
            title="A trust-first model for public decision intelligence."
            description="The site organizes public records into timelines, changes, votes, hearings, stakeholders, and source trails while keeping the product nonpartisan and factual."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((principle) => (
            <MethodologyPrincipleCard key={principle.title} {...principle} />
          ))}
        </div>
      </section>

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <SectionHeader
            eyebrow="Record architecture"
            title="How a decision file is assembled"
            description="A decision file should be reproducible from source records and explicit about where the record is incomplete."
          />
          <div className="grid gap-3">
            {[
              "Collect primary public records from official publication points.",
              "Normalize event dates, source types, actors, vote motions, and procedural stages.",
              "Connect each timeline item, summary, amendment diff, vote table, and stakeholder statement to source IDs.",
              "Label indexed, missing, or not-yet-indexed information plainly.",
              "Publish calm summaries that cite records instead of relying on unsupported claims.",
            ].map((step, index) => (
              <div key={index} className="grid grid-cols-[auto_1fr] gap-3 rounded-lg border border-record-200 bg-paper-50 p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-950 font-mono text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <p className="self-center text-sm leading-6 text-ink-800">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <SectionHeader
          eyebrow="Real-data readiness"
          title="The record loop is shaped for official ingestion."
          description="The repeat-use loop only works if fresh records can enter the same trust model: source, change, answer, watch, alert."
        />
        <div className="grid gap-3">
          {integrationReadiness.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-record-200 bg-white p-4 text-sm leading-6 text-ink-800 shadow-line"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
