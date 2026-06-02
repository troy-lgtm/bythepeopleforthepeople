import "server-only";
import { STARTER_CAUSES, type StarterCause } from "@/data/starter-causes";
import type { Cause } from "@/data/types";

export type StarterSuggestion = {
  starter: StarterCause;
  score: number;
  reasons: string[];
};

/**
 * Suggest related starter causes based on a single cause. Score reflects
 * topic overlap, keyword overlap, and excludes anything that is essentially
 * the same cause.
 */
export function suggestForCause(cause: Cause, max = 4): StarterSuggestion[] {
  const causeTopics = new Set(cause.topics.map((t) => t.toLowerCase()));
  const causeKeywords = new Set(
    cause.watchTermsAny.map((w) => w.toLowerCase()),
  );
  const causeTitleLower = cause.title.toLowerCase();

  const scored: StarterSuggestion[] = [];
  for (const starter of STARTER_CAUSES) {
    if (starter.title.toLowerCase() === causeTitleLower) continue;
    let score = 0;
    const reasons: string[] = [];
    const topicOverlap = starter.topics.filter((t) =>
      causeTopics.has(t.toLowerCase()),
    );
    if (topicOverlap.length) {
      score += 12 * topicOverlap.length;
      reasons.push(`Shares topics: ${topicOverlap.join(", ")}`);
    }
    const keywordOverlap = starter.watchTermsAny.filter((w) =>
      causeKeywords.has(w.toLowerCase()),
    );
    if (keywordOverlap.length) {
      score += 6 * keywordOverlap.length;
      reasons.push(`Shares keywords: ${keywordOverlap.slice(0, 4).join(", ")}`);
    }
    // Bonus for adjacent topics in the same area (e.g. housing supply ↔ tenant protections)
    const adjacent: Array<[string, string]> = [
      ["housing", "land use"],
      ["fires", "land use"],
      ["homelessness", "housing"],
    ];
    for (const [a, b] of adjacent) {
      if (
        (causeTopics.has(a) && starter.topics.some((t) => t.toLowerCase() === b)) ||
        (causeTopics.has(b) && starter.topics.some((t) => t.toLowerCase() === a))
      ) {
        score += 4;
        reasons.push(`Adjacent area: ${a} ↔ ${b}`);
      }
    }
    if (score > 0) scored.push({ starter, score, reasons });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, max);
}

export type OverlapHit = {
  causeId: string;
  causeTitle: string;
  causeEmoji?: string;
  sharedTopics: string[];
  sharedKeywords: string[];
  sharedJurisdictions: string[];
  similarity: number;
};

/**
 * Detect overlap between a candidate cause (in-progress wizard state) and
 * the user's existing causes. Returns hits sorted by similarity. Threshold
 * for surfacing the warning: similarity >= 0.4 OR shared topic+keyword count
 * >= 3.
 */
export function detectOverlap(
  candidate: Pick<Cause, "topics" | "watchTermsAny" | "jurisdictions"> & {
    title?: string;
  },
  existing: Array<
    Pick<
      Cause,
      "id" | "title" | "topics" | "watchTermsAny" | "jurisdictions" | "emoji"
    >
  >,
): OverlapHit[] {
  if (existing.length === 0) return [];
  const norm = (xs: string[]) =>
    new Set(xs.filter(Boolean).map((x) => x.toLowerCase()));
  const candTopics = norm(candidate.topics);
  const candKeywords = norm(candidate.watchTermsAny);
  const candJur = norm(candidate.jurisdictions);
  const candTitleLower = candidate.title?.toLowerCase() ?? "";

  const hits: OverlapHit[] = [];
  for (const ex of existing) {
    const exTopics = norm(ex.topics);
    const exKeywords = norm(ex.watchTermsAny);
    const exJur = norm(ex.jurisdictions);

    const sharedTopics = [...candTopics].filter((t) => exTopics.has(t));
    const sharedKeywords = [...candKeywords].filter((k) => exKeywords.has(k));
    const sharedJur = [...candJur].filter((j) => exJur.has(j));

    const topicScore =
      candTopics.size + exTopics.size === 0
        ? 0
        : (2 * sharedTopics.length) / (candTopics.size + exTopics.size);
    const keywordScore =
      candKeywords.size + exKeywords.size === 0
        ? 0
        : (2 * sharedKeywords.length) / (candKeywords.size + exKeywords.size);
    const jurScore =
      candJur.size + exJur.size === 0
        ? 0
        : (2 * sharedJur.length) / (candJur.size + exJur.size);

    let similarity = 0.5 * topicScore + 0.35 * keywordScore + 0.15 * jurScore;
    if (candTitleLower && candTitleLower === ex.title.toLowerCase()) {
      similarity = Math.max(similarity, 1);
    }

    if (similarity >= 0.4 || sharedTopics.length + sharedKeywords.length >= 3) {
      hits.push({
        causeId: ex.id,
        causeTitle: ex.title,
        causeEmoji: ex.emoji,
        sharedTopics,
        sharedKeywords,
        sharedJurisdictions: sharedJur,
        similarity,
      });
    }
  }
  hits.sort((a, b) => b.similarity - a.similarity);
  return hits;
}

/**
 * Cross-cause suggestions: given the user's full causes list, suggest
 * starter causes that complement what's already tracked without duplicating.
 */
export function suggestForCauseList(
  causes: Cause[],
  max = 4,
): StarterSuggestion[] {
  if (causes.length === 0) return [];
  const haveTitles = new Set(causes.map((c) => c.title.toLowerCase()));
  const merged: Cause = {
    id: "merge",
    title: "merge",
    outcome: "",
    topics: Array.from(new Set(causes.flatMap((c) => c.topics))),
    jurisdictions: Array.from(
      new Set(causes.flatMap((c) => c.jurisdictions)),
    ),
    watchTermsAny: Array.from(
      new Set(causes.flatMap((c) => c.watchTermsAny)),
    ),
    createdAt: new Date(0).toISOString(),
  };
  return suggestForCause(merged, max).filter(
    (s) => !haveTitles.has(s.starter.title.toLowerCase()),
  );
}
