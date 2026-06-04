"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import {
  answerIntents,
  getExploreItemsByIds,
  sourceEvidence,
} from "@/data/product-loop";
import { getSourcesByIds } from "@/data/records";
import { EvidenceStack } from "./EvidenceStack";
import { SourceTrail } from "./SourceTrail";
import { StatusBadge } from "./StatusBadge";

type AnswerEngineProps = {
  title?: string;
  description?: string;
  initialAnswerId?: string;
  compact?: boolean;
};

export function AnswerEngine({
  title = "Ask the question people actually came with.",
  description = "Answers stay on this site first. Each one carries the exact public-record proof needed to verify it.",
  initialAnswerId = "answer-next",
  compact = false,
}: AnswerEngineProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialAnswerId);

  const visibleAnswers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return answerIntents;
    }

    const tokens = normalized.split(/\s+/).filter(Boolean);

    return answerIntents.filter((answer) => {
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
    });
  }, [query]);

  const activeAnswer =
    visibleAnswers.find((answer) => answer.id === selectedId) ??
    visibleAnswers[0] ??
    answerIntents.find((answer) => answer.id === selectedId) ??
    answerIntents[0];

  // If the query filtered out the selected answer, reset the selection to the
  // first visible answer so the highlight does not point at a hidden row.
  useEffect(() => {
    if (!visibleAnswers.length) return;
    if (!visibleAnswers.some((answer) => answer.id === selectedId)) {
      setSelectedId(visibleAnswers[0].id);
    }
  }, [visibleAnswers, selectedId]);

  const evidence = activeAnswer
    ? sourceEvidence.filter((record) =>
        activeAnswer.evidenceIds.includes(record.id),
      )
    : [];
  const relatedResults = activeAnswer
    ? getExploreItemsByIds(activeAnswer.relatedResultIds)
    : [];

  if (!activeAnswer) {
    return (
      <section className="rounded-lg border border-record-200 bg-white p-5 shadow-panel">
        <p className="text-sm leading-6 text-ink-700">
          No indexed answers are available yet.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-record-200 bg-white p-5 shadow-panel">
      <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
              <Search className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
                Answer engine
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-950">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-700">
                {description}
              </p>
            </div>
          </div>

          <label className="relative mt-5 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-12 w-full rounded-md border border-record-200 bg-paper-50 pl-9 pr-3 text-base font-medium text-ink-950 outline-none transition placeholder:text-ink-600 focus:border-civic-500 focus:bg-white sm:text-sm"
              placeholder="Try: who voted no, what got incorporated, what happens next"
              aria-label="Search record questions"
              enterKeyHint="search"
            />
          </label>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {visibleAnswers.map((answer) => (
              <button
                key={answer.id}
                type="button"
                onClick={() => setSelectedId(answer.id)}
                aria-pressed={activeAnswer.id === answer.id}
                className={
                  activeAnswer.id === answer.id
                    ? "rounded-md border border-civic-500 bg-civic-50 p-3 text-left text-sm font-semibold text-civic-700"
                    : "rounded-md border border-record-200 bg-paper-50 p-3 text-left text-sm font-semibold text-ink-800 hover:border-civic-500"
                }
              >
                <span className="block">{answer.label}</span>
                <span className="mt-1 block text-xs font-normal leading-5 text-ink-600">
                  {answer.question}
                </span>
              </button>
            ))}
          </div>

          {!visibleAnswers.length ? (
            <div className="mt-4 rounded-md border border-record-200 bg-paper-50 p-4 text-sm leading-6 text-ink-700">
              No indexed answer matches that wording yet. Try a question about
              votes, incorporated text, next steps, place relevance, or proof.
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-record-200 bg-paper-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-civic-100 bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700">
              Best answer
            </span>
            <span className="rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700">
              {activeAnswer.status}
            </span>
          </div>
          <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink-950">
            {activeAnswer.question}
          </h3>
          <p className="mt-3 text-base leading-7 text-ink-900">
            {activeAnswer.shortAnswer}
          </p>
          {!compact ? (
            <p className="mt-3 text-sm leading-6 text-ink-700">
              {activeAnswer.detailedAnswer}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={activeAnswer.href}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink-950 px-3 text-sm font-semibold text-white hover:bg-ink-800"
            >
              {activeAnswer.actionLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/sources"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-3 text-sm font-semibold text-ink-900 hover:border-civic-500"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Verify proof
            </Link>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">
              On-site proof
            </p>
            <EvidenceStack evidence={evidence} compact={compact} />
          </div>

          <div className="mt-5 border-t border-record-200 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">
              Source trail
            </p>
            <SourceTrail sources={getSourcesByIds(activeAnswer.sourceIds)} compact />
          </div>

          {!compact && relatedResults.length ? (
            <div className="mt-5 border-t border-record-200 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">
                Related records
              </p>
              <div className="grid gap-2">
                {relatedResults.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="rounded-md border border-record-200 bg-white p-3 hover:border-civic-500"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                      <span className="rounded-full border border-record-200 bg-paper-50 px-2 py-0.5 text-xs font-semibold text-ink-700">
                        {item.type}
                      </span>
                    </div>
                    <span className="mt-2 block text-sm font-semibold text-ink-950">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-ink-700">
                      {item.summary}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
