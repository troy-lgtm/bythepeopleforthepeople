import { cn } from "@/lib/cn";
import type { DecisionStatus } from "@/data/types";

const styles: Record<DecisionStatus, string> = {
  Introduced: "border-record-200 bg-record-50 text-ink-700",
  "In Committee": "border-civic-100 bg-civic-50 text-civic-700",
  "Hearing Scheduled": "border-civic-100 bg-civic-50 text-civic-700",
  Amended: "border-notice-100 bg-notice-50 text-notice-500",
  "Passed Committee": "border-civic-100 bg-civic-50 text-civic-700",
  "Final Vote Recorded": "border-ink-800 bg-ink-900 text-white",
  Chaptered: "border-ink-800 bg-ink-900 text-white",
  Adopted: "border-ink-800 bg-ink-900 text-white",
  Updated: "border-record-200 bg-white text-ink-700",
  Pending: "border-record-200 bg-record-50 text-ink-600",
};

type StatusBadgeProps = {
  status: DecisionStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
