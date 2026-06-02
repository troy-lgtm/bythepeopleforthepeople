"use client";

import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { getSourcesByIds } from "@/data/records";
import type { AskRecordAnswer } from "@/data/types";
import { SourceTrail } from "./SourceTrail";

type AskRecordProps = {
  answers: AskRecordAnswer[];
  title?: string;
};

export function AskRecord({
  answers,
  title = "Ask the record",
}: AskRecordProps) {
  const [selectedId, setSelectedId] = useState(answers[0]?.id);
  const selectedAnswer =
    answers.find((answer) => answer.id === selectedId) ?? answers[0];

  if (!selectedAnswer) {
    return null;
  }

  return (
    <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
          <MessageSquareText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            Cited answers
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            Each answer is prepared from indexed public records and appears only
            when source evidence is attached.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {answers.map((answer) => (
          <button
            key={answer.id}
            type="button"
            onClick={() => setSelectedId(answer.id)}
            className={
              selectedAnswer.id === answer.id
                ? "rounded-full border border-civic-500 bg-civic-50 px-3 py-1.5 text-sm font-semibold text-civic-700"
                : "rounded-full border border-record-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 hover:border-civic-500"
            }
          >
            {answer.question}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-record-200 bg-paper-50 p-4">
        <p className="text-sm font-semibold text-ink-950">
          {selectedAnswer.question}
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-700">
          {selectedAnswer.answer}
        </p>
        <div className="mt-4">
          <SourceTrail sources={getSourcesByIds(selectedAnswer.sourceIds)} compact />
        </div>
      </div>
    </section>
  );
}
