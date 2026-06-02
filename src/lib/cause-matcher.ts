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
