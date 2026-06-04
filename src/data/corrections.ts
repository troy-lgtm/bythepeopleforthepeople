import type { CorrectionLog } from "./types";

export const corrections: CorrectionLog[] = [
  {
    id: "cor-launch-baseline",
    date: "2026-05-21",
    recordHref: "/methodology",
    recordTitle: "Methodology",
    reportedBy: "Internal audit",
    description:
      "Baseline note, not a factual correction. The corrections log is now live and will track every factual change made after publication: source URL updates, vote-count corrections, date corrections, jurisdiction corrections, and added context.",
    fix: "Established this log as an immutable append-only record of changes. Every entry is timestamped and tied to a record URL when applicable.",
  },
];
