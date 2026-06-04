import "server-only";
import type { Cause } from "@/data/types";
import { buildCauseActivity } from "./cause-activity";
import { matchCause, matchCount } from "./cause-matcher";

export type Wrapped = {
  causesCount: number;
  totalMatched: number;
  movedRecently: number;
  topTopics: string[];
  topJurisdictions: string[];
};

/**
 * A personal civic recap built entirely from the user's own (cookie) causes —
 * a shareable identity artifact. Every number is real: matched records and
 * movement are computed from the live index, not invented.
 */
export function buildWrapped(causes: Cause[]): Wrapped {
  let totalMatched = 0;
  let movedRecently = 0;
  const topicCounts = new Map<string, number>();
  const jurCounts = new Map<string, number>();

  for (const cause of causes) {
    const matches = matchCause(cause);
    totalMatched += matchCount(matches);
    movedRecently += buildCauseActivity(
      matches,
      cause.createdAt,
    ).movedSinceCauseCreated;
    for (const t of cause.topics) {
      topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
    }
    for (const j of cause.jurisdictions) {
      jurCounts.set(j, (jurCounts.get(j) ?? 0) + 1);
    }
  }

  const top = (map: Map<string, number>) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k)
      .slice(0, 4);

  return {
    causesCount: causes.length,
    totalMatched,
    movedRecently,
    topTopics: top(topicCounts),
    topJurisdictions: top(jurCounts),
  };
}
