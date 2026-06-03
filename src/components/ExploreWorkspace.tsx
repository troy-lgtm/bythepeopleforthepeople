"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Filter, Search } from "lucide-react";
import { answerIntents, sourceEvidence } from "@/data/product-loop";
import { exploreItems, getSourcesByIds } from "@/data/records";
import type { DecisionStatus, ExploreItem, SourceType } from "@/data/types";
import { EvidenceStack } from "./EvidenceStack";
import { SourceTrail, sourceTypeLabel } from "./SourceTrail";
import { StatusBadge } from "./StatusBadge";
import { WatchButton } from "./WatchButton";

const jurisdictions = [
  "All jurisdictions",
  "California Legislature",
  "Los Angeles City Council",
] as const;

const topics = [
  "All topics",
  "Housing",
  "Land use",
  "Transit",
  "Votes",
  "Bill text",
  "Committee action",
] as const;

const statuses: Array<"Any status" | DecisionStatus> = [
  "Any status",
  "Chaptered",
  "Adopted",
  "Final Vote Recorded",
  "Amended",
  "Updated",
];

const decisionTypes: Array<"Any type" | ExploreItem["type"]> = [
  "Any type",
  "Bill",
  "Ordinance",
  "Hearing",
  "Vote",
  "Amendment",
];

const sourceTypes: Array<"Any source" | SourceType> = [
  "Any source",
  "bill_text",
  "bill_status",
  "compare_versions",
  "roll_call_vote",
  "council_file",
  "action_history",
  "committee_action",
  "staff_report",
  "public_comment",
];

const dateRanges = ["Any date", "2026", "2025", "Final actions"] as const;

export function ExploreWorkspace() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  useEffect(() => {
    const fromUrl = searchParams?.get("q") ?? "";
    if (fromUrl && fromUrl !== query) setQuery(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [jurisdiction, setJurisdiction] = useState<(typeof jurisdictions)[number]>(
    "All jurisdictions",
  );
  const [topic, setTopic] = useState<(typeof topics)[number]>("All topics");
  const [status, setStatus] = useState<(typeof statuses)[number]>("Any status");
  const [decisionType, setDecisionType] =
    useState<(typeof decisionTypes)[number]>("Any type");
  const [sourceType, setSourceType] =
    useState<(typeof sourceTypes)[number]>("Any source");
  const [dateRange, setDateRange] =
    useState<(typeof dateRanges)[number]>("Any date");

  const bestAnswer = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return answerIntents[0];
    }

    const tokens = normalized.split(/\s+/).filter(Boolean);

    return (
      answerIntents.find((answer) => {
        const haystack = [
          answer.label,
          answer.question,
          answer.shortAnswer,
          answer.detailedAnswer,
          answer.status,
        ]
          .join(" ")
          .toLowerCase();

        return tokens.some((token) => haystack.includes(token));
      }) ?? answerIntents[0]
    );
  }, [query]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const tokens = normalized.split(/\s+/).filter(Boolean);

    return exploreItems.filter((item) => {
      const itemSources = getSourcesByIds(item.sourceIds);
      const searchable = [
        item.title,
        item.summary,
        item.jurisdiction,
        item.type,
        item.status,
        item.topic,
        ...itemSources.map((source) => `${source.title} ${source.description}`),
      ]
        .join(" ")
        .toLowerCase();

      const queryMatches =
        !tokens.length || tokens.some((token) => searchable.includes(token));
      const jurisdictionMatches =
        jurisdiction === "All jurisdictions" || item.jurisdiction === jurisdiction;
      const topicMatches =
        topic === "All topics" ||
        item.topic === topic ||
        item.summary.toLowerCase().includes(topic.toLowerCase());
      const statusMatches = status === "Any status" || item.status === status;
      const typeMatches = decisionType === "Any type" || item.type === decisionType;
      const sourceMatches =
        sourceType === "Any source" ||
        itemSources.some((source) => source.type === sourceType);
      const dateMatches = matchesDateRange(item, dateRange);

      return (
        queryMatches &&
        jurisdictionMatches &&
        topicMatches &&
        statusMatches &&
        typeMatches &&
        sourceMatches &&
        dateMatches
      );
    });
  }, [dateRange, decisionType, jurisdiction, query, sourceType, status, topic]);

  const evidence = sourceEvidence.filter((record) =>
    bestAnswer.evidenceIds.includes(record.id),
  );

  return (
    <section className="grid gap-6 lg:grid-cols-[0.38fr_0.62fr]">
      <aside className="rounded-lg border border-record-200 bg-white p-5 shadow-panel lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-civic-700" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            Find a record
          </p>
        </div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink-950">
          Filter by the answer you need.
        </h2>

        <label className="relative mt-5 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 w-full rounded-md border border-record-200 bg-paper-50 pl-9 pr-3 text-base text-ink-950 outline-none transition placeholder:text-ink-600 focus:border-civic-500 focus:bg-white sm:text-sm"
            placeholder="who voted no, upcoming vote, Downtown LA"
            aria-label="Search public records"
            enterKeyHint="search"
          />
        </label>

        <div className="mt-4 grid gap-3">
          <SelectControl
            label="Jurisdiction"
            value={jurisdiction}
            options={jurisdictions}
            onChange={setJurisdiction}
          />
          <SelectControl
            label="Topic"
            value={topic}
            options={topics}
            onChange={setTopic}
          />
          <SelectControl
            label="Status"
            value={status}
            options={statuses}
            onChange={setStatus}
          />
          <SelectControl
            label="Decision type"
            value={decisionType}
            options={decisionTypes}
            onChange={setDecisionType}
          />
          <SelectControl
            label="Date"
            value={dateRange}
            options={dateRanges}
            onChange={setDateRange}
          />
          <SelectControl
            label="Source type"
            value={sourceType}
            options={sourceTypes}
            onChange={setSourceType}
            format={(value) =>
              value === "Any source" ? value : sourceTypeLabel(value as SourceType)
            }
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setQuery("");
            setJurisdiction("All jurisdictions");
            setTopic("All topics");
            setStatus("Any status");
            setDecisionType("Any type");
            setDateRange("Any date");
            setSourceType("Any source");
          }}
          className="mt-4 h-10 w-full rounded-md border border-record-200 bg-white text-sm font-semibold text-ink-800 hover:border-civic-500"
        >
          Reset filters
        </button>
      </aside>

      <div className="grid gap-5">
        <article className="rounded-lg border border-civic-100 bg-civic-50 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-civic-100 bg-white px-2.5 py-1 text-xs font-semibold text-civic-700">
              Best answer
            </span>
            <span className="rounded-full border border-civic-100 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700">
              {bestAnswer.status}
            </span>
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink-950">
            {bestAnswer.question}
          </h3>
          <p className="mt-2 text-base leading-7 text-ink-900">
            {bestAnswer.shortAnswer}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={bestAnswer.href}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink-950 px-3 text-sm font-semibold text-white hover:bg-ink-800"
            >
              {bestAnswer.actionLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/sources"
              className="inline-flex h-10 items-center justify-center rounded-md border border-record-200 bg-white px-3 text-sm font-semibold text-ink-900 hover:border-civic-500"
            >
              Verify source trail
            </Link>
          </div>
          <div className="mt-4">
            <EvidenceStack evidence={evidence.slice(0, 2)} compact />
          </div>
        </article>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              Matching records
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-950">
              {results.length} result{results.length === 1 ? "" : "s"}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-ink-700">
            Each card keeps the answer, procedural status, and source trail in
            the same place.
          </p>
        </div>

        <div className="grid gap-4">
          {results.length ? (
            results.map((item) => <ExploreResultCard key={item.id} item={item} />)
          ) : (
            <div className="rounded-lg border border-record-200 bg-white p-5 text-sm leading-6 text-ink-700 shadow-line">
              No indexed records match those filters. Remove one filter or
              search for votes, incorporated text, source proof, or Downtown LA.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SelectControl<T extends string>({
  label,
  value,
  options,
  onChange,
  format,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  format?: (value: T) => string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-11 rounded-md border border-record-200 bg-paper-50 px-3 text-base text-ink-950 outline-none transition focus:border-civic-500 focus:bg-white sm:text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {format ? format(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ExploreResultCard({ item }: { item: ExploreItem }) {
  const sources = getSourcesByIds(item.sourceIds);

  return (
    <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
              {item.type}
            </span>
            <span className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
              {item.jurisdiction}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold tracking-tight text-ink-950">
            <Link href={item.href} className="hover:text-civic-700">
              {item.title}
            </Link>
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-700">{item.summary}</p>
        </div>
        <WatchButton targetId={item.watchTargetId} />
      </div>

      <div className="mt-4 grid gap-3 border-t border-record-200 pt-4 md:grid-cols-[1fr_auto]">
        <SourceTrail sources={sources} compact />
        <Link
          href={item.href}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-record-200 bg-paper-50 px-3 text-sm font-semibold text-ink-900 hover:border-civic-500"
        >
          Open record
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function matchesDateRange(
  item: ExploreItem,
  range: (typeof dateRanges)[number],
) {
  if (range === "Any date") {
    return true;
  }

  if (range === "Final actions") {
    return item.status === "Chaptered" || item.status === "Adopted";
  }

  return item.date.startsWith(range);
}
