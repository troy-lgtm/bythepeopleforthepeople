import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { buildSearchIndex, type SearchDoc } from "@/lib/search-index";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search 550+ source-anchored civic entities: federal reps, bills, local files, topic pages, people, committees, source connectors.",
  alternates: { canonical: "/search" },
};

type SearchParams = Promise<{ q?: string; type?: string }>;

const TYPE_LABEL: Record<SearchDoc["type"], string> = {
  rep: "U.S. House",
  senator: "U.S. Senate",
  bill: "Bill",
  local: "Local file",
  topic: "Topic",
  person: "Person",
  committee: "Committee",
  connector: "Source",
};

const TYPE_ORDER: SearchDoc["type"][] = [
  "senator",
  "rep",
  "bill",
  "local",
  "topic",
  "person",
  "committee",
  "connector",
];

function score(doc: SearchDoc, q: string): number {
  const ql = q.toLowerCase();
  const tokens = ql.split(/\s+/).filter(Boolean);
  let s = 0;
  const titleL = doc.title.toLowerCase();
  if (titleL === ql) s += 1000;
  if (titleL.startsWith(ql)) s += 500;
  if (titleL.includes(ql)) s += 200;
  for (const tok of tokens) {
    if (titleL.includes(tok)) s += 40;
    for (const kw of doc.keywords) {
      const kl = kw.toLowerCase();
      if (kl === tok) s += 50;
      else if (kl.startsWith(tok)) s += 20;
      else if (kl.includes(tok)) s += 8;
    }
  }
  if (doc.subtitle?.toLowerCase().includes(ql)) s += 15;
  return s;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, type } = await searchParams;
  const docs = buildSearchIndex();
  const query = (q ?? "").trim();
  const filterType = (type ?? "").trim();

  const matched = query
    ? docs
        .map((d) => ({ ...d, score: score(d, query) }))
        .filter((d) => d.score > 0)
        .filter((d) => !filterType || d.type === filterType)
        .sort((a, b) => b.score - a.score)
    : [];

  const grouped: Record<string, typeof matched> = {};
  for (const doc of matched) {
    if (!grouped[doc.type]) grouped[doc.type] = [];
    grouped[doc.type].push(doc);
  }
  const typesWithResults = TYPE_ORDER.filter((t) => grouped[t]?.length);

  const typeCounts: Record<string, number> = {};
  for (const d of docs) typeCounts[d.type] = (typeCounts[d.type] ?? 0) + 1;

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Search"
            title={
              query
                ? `${matched.length} ${matched.length === 1 ? "result" : "results"} for “${query}”`
                : "Search source-anchored civic records"
            }
            description="Press ⌘K from anywhere for the typeahead modal. This page is for the long tail and for deep-linkable search URLs."
          />
          <form
            action="/search"
            method="get"
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <label className="relative flex-1">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600"
                aria-hidden="true"
              />
              <input
                name="q"
                defaultValue={query}
                placeholder="Schiff, California, SB 79, homelessness, 22-0617..."
                className="h-12 w-full rounded-md border border-record-200 bg-paper-50 pl-9 pr-3 text-sm text-ink-950 outline-none transition placeholder:text-ink-600 focus:border-civic-500 focus:bg-white"
                aria-label="Search query"
              />
            </label>
            {filterType ? (
              <input type="hidden" name="type" value={filterType} />
            ) : null}
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
            Filter by type:
          </span>
          <Link
            href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}
            className={
              !filterType
                ? "rounded-full border border-civic-500 bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700"
                : "rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 hover:border-civic-500"
            }
          >
            All ({docs.length})
          </Link>
          {TYPE_ORDER.map((t) => (
            <Link
              key={t}
              href={`/search?q=${encodeURIComponent(query)}&type=${t}`}
              className={
                filterType === t
                  ? "rounded-full border border-civic-500 bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700"
                  : "rounded-full border border-record-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 hover:border-civic-500"
              }
            >
              {TYPE_LABEL[t]} ({typeCounts[t] ?? 0})
            </Link>
          ))}
        </div>

        {!query ? (
          <div className="mt-8 rounded-lg border border-record-200 bg-paper-50 p-6 text-sm leading-6 text-ink-700">
            <p>
              Type something above, or press ⌘K to use the typeahead modal
              from anywhere on the site. The index has{" "}
              <strong>{docs.length}</strong> entities right now —{" "}
              {typeCounts.rep ?? 0} House + {typeCounts.senator ?? 0} Senate +{" "}
              {typeCounts.bill ?? 0} bills + {typeCounts.local ?? 0} local
              files + {typeCounts.topic ?? 0} topics +{" "}
              {typeCounts.connector ?? 0} connectors.
            </p>
          </div>
        ) : matched.length === 0 ? (
          <div className="mt-8 rounded-lg border border-record-200 bg-paper-50 p-6 text-sm leading-6 text-ink-700">
            <p>
              No indexed records match <strong>&ldquo;{query}&rdquo;</strong>.
              Coverage is expanding; missing means missing.
            </p>
            <p className="mt-2 text-xs text-ink-600">
              Try a representative last name, a state, a bill number (SB 79),
              or a topic like &ldquo;homelessness&rdquo;.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-8">
            {typesWithResults.map((t) => (
              <article key={t}>
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-civic-700">
                  {TYPE_LABEL[t]} · {grouped[t].length}
                </h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {grouped[t].map((doc) => (
                    <li key={doc.id}>
                      <Link
                        href={doc.href}
                        className="block rounded-lg border border-record-200 bg-white p-4 shadow-line transition hover:border-civic-500 hover:bg-paper-50"
                      >
                        <h3 className="text-sm font-semibold text-ink-950">
                          {doc.title}
                        </h3>
                        {doc.subtitle ? (
                          <p className="mt-1 text-xs leading-5 text-ink-600">
                            {doc.subtitle}
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
