import "server-only";
import {
  bills,
  exploreItems,
  localDecisions,
} from "@/data/records";
import { sourceConnectors, topicProfiles } from "@/data/product-loop";
import type { Bill, Cause, ExploreItem, LocalDecision } from "@/data/types";
import {
  allFederalReps,
  type FederalRep,
  slugForRep,
} from "@/lib/federal-reps";

export type CauseMatches = {
  bills: Array<{ bill: Bill; score: number; reasons: string[] }>;
  locals: Array<{ decision: LocalDecision; score: number; reasons: string[] }>;
  exploreItems: Array<{ item: ExploreItem; score: number; reasons: string[] }>;
  topics: Array<{
    topic: (typeof topicProfiles)[number];
    score: number;
    reasons: string[];
  }>;
  reps: Array<{
    rep: FederalRep;
    slug: string;
    score: number;
    reasons: string[];
  }>;
  connectors: Array<{
    connector: (typeof sourceConnectors)[number];
    score: number;
    reasons: string[];
  }>;
};

function termHits(haystack: string, terms: string[]): string[] {
  const hits: string[] = [];
  const lower = haystack.toLowerCase();
  for (const term of terms) {
    const t = term.toLowerCase().trim();
    if (!t) continue;
    if (lower.includes(t)) hits.push(term);
  }
  return hits;
}

function topicOverlap(causeTopics: string[], itemTopics: string[]): string[] {
  if (!causeTopics.length || !itemTopics.length) return [];
  const set = new Set(causeTopics.map((t) => t.toLowerCase()));
  return itemTopics.filter((t) => set.has(t.toLowerCase()));
}

function jurisdictionOverlap(
  causeJurisdictions: string[],
  itemJurisdiction: string,
): boolean {
  if (!causeJurisdictions.length) return false;
  const lower = itemJurisdiction.toLowerCase();
  return causeJurisdictions.some((j) => lower.includes(j.toLowerCase()));
}

export function matchCause(cause: Cause): CauseMatches {
  const matches: CauseMatches = {
    bills: [],
    locals: [],
    exploreItems: [],
    topics: [],
    reps: [],
    connectors: [],
  };

  for (const bill of bills) {
    let score = 0;
    const reasons: string[] = [];
    const topicHit = topicOverlap(cause.topics, bill.topics);
    if (topicHit.length) {
      score += 30 * topicHit.length;
      reasons.push(`Topics matched: ${topicHit.join(", ")}`);
    }
    if (jurisdictionOverlap(cause.jurisdictions, bill.jurisdiction)) {
      score += 25;
      reasons.push(`Jurisdiction: ${bill.jurisdiction}`);
    }
    const kw = termHits(
      `${bill.title} ${bill.summary} ${bill.lastAction} ${bill.nextAction}`,
      cause.watchTermsAny,
    );
    if (kw.length) {
      score += 10 * kw.length;
      reasons.push(`Keywords: ${kw.slice(0, 3).join(", ")}`);
    }
    if (score > 0) matches.bills.push({ bill, score, reasons });
  }

  for (const decision of localDecisions) {
    let score = 0;
    const reasons: string[] = [];
    const topicHit = topicOverlap(cause.topics, decision.topics);
    if (topicHit.length) {
      score += 30 * topicHit.length;
      reasons.push(`Topics matched: ${topicHit.join(", ")}`);
    }
    if (jurisdictionOverlap(cause.jurisdictions, decision.jurisdiction)) {
      score += 25;
      reasons.push(`Jurisdiction: ${decision.jurisdiction}`);
    }
    const kw = termHits(
      `${decision.title} ${decision.summary} ${decision.motionSummary} ${decision.publicCommentSummary}`,
      cause.watchTermsAny,
    );
    if (kw.length) {
      score += 10 * kw.length;
      reasons.push(`Keywords: ${kw.slice(0, 3).join(", ")}`);
    }
    if (score > 0) matches.locals.push({ decision, score, reasons });
  }

  for (const item of exploreItems) {
    let score = 0;
    const reasons: string[] = [];
    if (cause.topics.some((t) => t.toLowerCase() === item.topic.toLowerCase())) {
      score += 20;
      reasons.push(`Topic: ${item.topic}`);
    }
    if (jurisdictionOverlap(cause.jurisdictions, item.jurisdiction)) {
      score += 15;
      reasons.push(`Jurisdiction: ${item.jurisdiction}`);
    }
    const kw = termHits(
      `${item.title} ${item.summary}`,
      cause.watchTermsAny,
    );
    if (kw.length) {
      score += 8 * kw.length;
      reasons.push(`Keywords: ${kw.slice(0, 3).join(", ")}`);
    }
    if (score > 0) matches.exploreItems.push({ item, score, reasons });
  }

  for (const topic of topicProfiles) {
    let score = 0;
    const reasons: string[] = [];
    if (cause.topics.some((t) => t.toLowerCase() === topic.name.toLowerCase())) {
      score += 40;
      reasons.push(`Direct topic match`);
    }
    const kw = termHits(
      `${topic.name} ${topic.summary} ${topic.watchPrompts.join(" ")}`,
      cause.watchTermsAny,
    );
    if (kw.length) {
      score += 10 * kw.length;
      reasons.push(`Keywords in watch prompts: ${kw.slice(0, 3).join(", ")}`);
    }
    if (score > 0) matches.topics.push({ topic, score, reasons });
  }

  if (cause.jurisdictions.length) {
    for (const rep of allFederalReps()) {
      if (!rep.state) continue;
      if (
        cause.jurisdictions.some(
          (j) =>
            j.toLowerCase() === rep.state?.toLowerCase() ||
            j.toLowerCase().includes("congress") ||
            j.toLowerCase().includes("federal"),
        )
      ) {
        matches.reps.push({
          rep,
          slug: slugForRep(rep),
          score: 10,
          reasons: [`Represents ${rep.state}`],
        });
      }
    }
  }

  for (const connector of sourceConnectors) {
    let score = 0;
    const reasons: string[] = [];
    if (jurisdictionOverlap(cause.jurisdictions, connector.jurisdiction)) {
      score += 20;
      reasons.push(`Jurisdiction: ${connector.jurisdiction}`);
    }
    const kw = termHits(
      `${connector.name} ${connector.coverage} ${connector.records.join(" ")}`,
      cause.watchTermsAny,
    );
    if (kw.length) {
      score += 8 * kw.length;
      reasons.push(`Keywords: ${kw.slice(0, 3).join(", ")}`);
    }
    if (score > 0) matches.connectors.push({ connector, score, reasons });
  }

  matches.bills.sort((a, b) => b.score - a.score);
  matches.locals.sort((a, b) => b.score - a.score);
  matches.exploreItems.sort((a, b) => b.score - a.score);
  matches.topics.sort((a, b) => b.score - a.score);
  matches.reps.sort((a, b) => b.score - a.score);
  matches.connectors.sort((a, b) => b.score - a.score);
  return matches;
}

export function matchCount(matches: CauseMatches): number {
  return (
    matches.bills.length +
    matches.locals.length +
    matches.exploreItems.length +
    matches.topics.length +
    matches.connectors.length
  );
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "you", "want",
  "more", "less", "are", "not", "but", "our", "their", "its", "into", "than",
  "then", "they", "them", "has", "have", "will", "would", "should", "could",
  "about", "over", "under", "near", "onto", "all", "any", "get", "got", "let",
  "make", "made", "keep", "stop", "stopping", "need", "needs", "people",
  "public", "record", "records", "cause", "causes", "city", "county", "state",
  "want", "like", "just", "also", "where", "when", "what", "who", "how",
]);

/**
 * Tokenize free text into meaningful lowercased terms (>=4 chars, no stopwords).
 * Used for loose matching and the live hero match-preview.
 */
export function tokenize(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  return Array.from(new Set(words));
}

export type LooseMatch = {
  type: "bill" | "local" | "topic";
  title: string;
  href: string;
  jurisdiction?: string;
  sharedTerms: string[];
};

/**
 * Last-resort matching for a cause that produced ZERO exact matches.
 * Scores indexed records by raw word overlap against the cause's full text
 * (title + outcome + topics + keywords), ignoring the curated topic/keyword
 * gates. Honest by construction: results are labeled "closest coverage," not
 * exact matches. Only routes with real pages (bills, local files, topics) are
 * returned so every link resolves.
 */
export function looseMatches(cause: Cause, limit = 6): LooseMatch[] {
  const tokens = tokenize(
    `${cause.title} ${cause.outcome} ${cause.topics.join(" ")} ${cause.watchTermsAny.join(" ")}`,
  );
  if (tokens.length === 0) return [];

  const scored: Array<LooseMatch & { score: number }> = [];
  const scan = (haystack: string, base: Omit<LooseMatch, "sharedTerms">) => {
    const lower = haystack.toLowerCase();
    const shared = tokens.filter((t) => lower.includes(t));
    if (shared.length > 0) {
      scored.push({ ...base, sharedTerms: shared.slice(0, 4), score: shared.length });
    }
  };

  for (const bill of bills) {
    scan(
      `${bill.title} ${bill.summary} ${bill.lastAction} ${bill.nextAction} ${bill.topics.join(" ")}`,
      { type: "bill", title: bill.title, href: `/bills/${bill.slug}`, jurisdiction: bill.jurisdiction },
    );
  }
  for (const decision of localDecisions) {
    scan(
      `${decision.title} ${decision.summary} ${decision.motionSummary} ${decision.topics.join(" ")}`,
      { type: "local", title: decision.title, href: `/local/${decision.slug}`, jurisdiction: decision.jurisdiction },
    );
  }
  for (const topic of topicProfiles) {
    scan(`${topic.name} ${topic.summary} ${topic.watchPrompts.join(" ")}`, {
      type: "topic",
      title: topic.name,
      href: `/topics/${topic.slug}`,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((m) => ({
    type: m.type,
    title: m.title,
    href: m.href,
    jurisdiction: m.jurisdiction,
    sharedTerms: m.sharedTerms,
  }));
}
