import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { movementTypeLabel } from "@/lib/movement-digest";
import type { MovementEvent } from "@/lib/movement-types";
import { getCatalogCause } from "@/lib/cause-catalog";

/**
 * One movement in a feed: what changed, when, with the receipt and the
 * official source one tap away. Server component, no client JS.
 */
export function MovementCard({
  event,
  refTag = "feed",
}: {
  event: MovementEvent;
  refTag?: string;
}) {
  return (
    <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="rounded-full border border-civic-100 bg-civic-50 px-2.5 py-0.5 uppercase tracking-[0.1em] text-civic-700">
          {movementTypeLabel(event.movementType)}
        </span>
        <span className="text-ink-600">{event.occurredAt}</span>
        <span className="text-ink-600">·</span>
        <span className="text-ink-600">{event.jurisdiction}</span>
        {event.confidence !== "confirmed" ? (
          <span className="rounded-full border border-notice-100 bg-notice-50 px-2.5 py-0.5 text-notice-500">
            Uncertain
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug text-ink-950">
        <Link
          href={`/receipts/${encodeURIComponent(event.id)}?ref=${refTag}`}
          className="hover:text-civic-700"
        >
          {event.title}
        </Link>
      </h3>
      <p className="mt-2 text-sm leading-6 text-ink-700">
        {event.plainEnglishSummary}
      </p>

      {event.causeSlugs.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {event.causeSlugs.map((slug) => {
            const cause = getCatalogCause(slug);
            if (!cause) return null;
            return (
              <Link
                key={slug}
                href={`/causes/${slug}`}
                className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-0.5 text-xs font-semibold text-ink-700 hover:border-civic-500"
              >
                {cause.name}
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold">
        <Link
          href={`/receipts/${encodeURIComponent(event.id)}?ref=${refTag}`}
          className="inline-flex items-center gap-1 text-civic-700 hover:gap-2"
        >
          See the receipt
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-ink-700 hover:text-civic-700"
        >
          Official source
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
