import { FileWarning, GitCompareArrows, Route } from "lucide-react";
import { getSourcesByIds } from "@/data/records";
import { SourceTrail } from "./SourceTrail";

type ImpactCardsProps = {
  variant: "bill" | "local";
};

export function ImpactCards({ variant }: ImpactCardsProps) {
  const cards =
    variant === "bill"
      ? [
          {
            icon: GitCompareArrows,
            title: "Record effect",
            text: "The bill record is no longer pending. It is an inactive, chaptered law record tied to Chapter 512.",
            sourceIds: ["src-sb79-status"],
          },
          {
            icon: Route,
            title: "Procedural effect",
            text: "The useful trail moves from bill passage to implementation records, agency guidance, and local follow-up actions.",
            sourceIds: ["src-sb79-text", "src-sb79-history"],
          },
          {
            icon: FileWarning,
            title: "Watch next",
            text: "Watch local alternative plans, HCD review materials, and local ordinances instead of expecting another bill vote.",
            sourceIds: ["src-sb79-text"],
          },
        ]
      : [
          {
            icon: GitCompareArrows,
            title: "Record effect",
            text: "The Council File report records Downtown LA community plan, zone change, CPIO, and New Zoning Code actions.",
            sourceIds: ["src-la-cf-22-0617"],
          },
          {
            icon: Route,
            title: "Procedural effect",
            text: "The file shows PLUM action, Council adoption, and Council action final rather than an open pending vote.",
            sourceIds: ["src-la-cf-22-0617-actions", "src-la-cf-22-0617-plum"],
          },
          {
            icon: FileWarning,
            title: "Watch next",
            text: "Watch related files, correction reports, ordinances, and implementation documents that cite or follow this file.",
            sourceIds: ["src-la-cf-22-0617"],
          },
        ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.title}
            className="rounded-lg border border-record-200 bg-white p-5 shadow-line"
          >
            <Icon className="h-5 w-5 text-civic-700" aria-hidden="true" />
            <h3 className="mt-4 text-base font-semibold text-ink-950">
              {card.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink-700">{card.text}</p>
            <div className="mt-4">
              <SourceTrail sources={getSourcesByIds(card.sourceIds)} compact />
            </div>
          </article>
        );
      })}
    </div>
  );
}
