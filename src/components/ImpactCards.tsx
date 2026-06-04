import type { LucideIcon } from "lucide-react";
import { FileWarning, GitCompareArrows, Route } from "lucide-react";
import { getSourcesByIds } from "@/data/records";
import { SourceTrail } from "./SourceTrail";

export type ImpactCardItem = {
  title: string;
  body: string;
  sourceIds: string[];
  icon?: LucideIcon;
};

type ImpactCardsProps = {
  cards: ImpactCardItem[];
};

// Default icons applied by position when a card does not supply its own, so the
// three procedural cards keep a consistent record/procedure/watch rhythm.
const DEFAULT_ICONS: LucideIcon[] = [GitCompareArrows, Route, FileWarning];

export function ImpactCards({ cards }: ImpactCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon ?? DEFAULT_ICONS[index % DEFAULT_ICONS.length];

        return (
          <article
            key={card.title}
            className="rounded-lg border border-record-200 bg-white p-5 shadow-line"
          >
            <Icon className="h-5 w-5 text-civic-700" aria-hidden="true" />
            <h3 className="mt-4 text-base font-semibold text-ink-950">
              {card.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink-700">{card.body}</p>
            <div className="mt-4">
              <SourceTrail sources={getSourcesByIds(card.sourceIds)} compact />
            </div>
          </article>
        );
      })}
    </div>
  );
}
