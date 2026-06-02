import type { Metadata } from "next";
import Link from "next/link";
import { Code2, ExternalLink, Rocket, Sparkles } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Developers and AI engines",
  description:
    "Public API, llms.txt, and well-known manifest for AI engines, newsrooms, and civic-tech builders to ground civic answers on indexed records.",
  alternates: { canonical: "/developers" },
};

type Endpoint = {
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
  cache: string;
  sample?: string;
};

const ENDPOINTS: Array<{ group: string; endpoints: Endpoint[] }> = [
  {
    group: "Records",
    endpoints: [
      {
        method: "GET",
        path: "/api/records",
        description: "Index of all bills, local decisions, and explore items.",
        cache: "10m revalidate · 1y stale",
        sample: `curl https://bythepeopleforthepeople.com/api/records | jq '.data.counts'`,
      },
      {
        method: "GET",
        path: "/api/records/{slug}",
        description:
          "Detail for a single bill or local decision, including timeline, amendments, votes, hearings, stakeholders, and sources.",
        cache: "10m revalidate · 1y stale",
        sample: `curl https://bythepeopleforthepeople.com/api/records/ca-sb-79 | jq '.data.record.status'`,
      },
      {
        method: "GET",
        path: "/api/sources",
        description: "All indexed primary sources and source connectors.",
        cache: "10m revalidate · 1y stale",
      },
      {
        method: "GET",
        path: "/api/sources/check",
        description:
          "Live HEAD-ping every indexed source URL. Returns failing list.",
        cache: "no-store",
        sample: `curl 'https://bythepeopleforthepeople.com/api/sources/check?id=src-sb79-status'`,
      },
      {
        method: "GET",
        path: "/api/topics",
        description: "All topic profiles and their coverage state.",
        cache: "10m revalidate · 1y stale",
      },
      {
        method: "GET",
        path: "/api/answers",
        description:
          "Cited answer intents with claim/locator/excerpt evidence stacks.",
        cache: "10m revalidate · 1y stale",
      },
      {
        method: "GET",
        path: "/api/search-index",
        description:
          "Full search index. 550+ entities (federal reps, bills, local files, topics, people, committees, source connectors). Use for client-side search.",
        cache: "1h revalidate · 1d stale",
      },
    ],
  },
  {
    group: "Place + watchlist",
    endpoints: [
      {
        method: "GET",
        path: "/api/place/lookup?zip={zip}",
        description:
          "Resolve any US ZIP to state + 119th congressional district. Static table for major metros; US Census Geographies fallback for any other ZIP.",
        cache: "no-store",
        sample: `curl 'https://bythepeopleforthepeople.com/api/place/lookup?zip=78704'`,
      },
      {
        method: "POST",
        path: "/api/place/lookup",
        description:
          "Same lookup; also sets a first-party cookie so subsequent server-rendered pages personalize.",
        cache: "no-store",
      },
      {
        method: "GET",
        path: "/api/watchlist",
        description: "Read the current cookie-backed watchlist.",
        cache: "no-store",
      },
      {
        method: "POST",
        path: "/api/watchlist",
        description: "Set the cookie watchlist to a JSON array of IDs.",
        cache: "no-store",
      },
    ],
  },
  {
    group: "Digest + corrections",
    endpoints: [
      {
        method: "GET",
        path: "/api/digest/preview",
        description:
          "Render the email digest as JSON, HTML, or plain text (use ?format=html|text). Personalizes to the place cookie + watchlist cookie.",
        cache: "no-store",
        sample: `curl 'https://bythepeopleforthepeople.com/api/digest/preview?format=html'`,
      },
      {
        method: "POST",
        path: "/api/digest/send",
        description:
          "Send a digest via Resend. Requires DIGEST_SEND_SECRET header and RESEND_API_KEY env. Supports dryRun: true.",
        cache: "no-store",
      },
      {
        method: "POST",
        path: "/api/corrections",
        description:
          "Submit a correction. Validates inputs, forwards to CORRECTIONS_WEBHOOK_URL if configured.",
        cache: "no-store",
      },
      {
        method: "GET",
        path: "/api/corrections",
        description: "Read the published corrections log.",
        cache: "no-store",
      },
    ],
  },
  {
    group: "Operational",
    endpoints: [
      {
        method: "GET",
        path: "/api/health",
        description:
          "Service health, record counts, env-var configuration state, region, commit SHA.",
        cache: "no-store",
      },
      {
        method: "GET",
        path: "/api/cron/refresh-leginfo",
        description:
          "Triggered nightly by Vercel Cron. Re-pings all indexed source URLs and alerts on failures.",
        cache: "no-store",
      },
    ],
  },
];

const GROUNDING_FILES = [
  {
    path: "/llms.txt",
    description:
      "Plain-text directive for LLMs: how to cite the records, what is indexed, and where to find each entity.",
  },
  {
    path: "/.well-known/civic-records.json",
    description:
      "Machine-readable manifest with endpoint URLs, counts, connector list, methodology pointer.",
  },
  {
    path: "/sitemap.xml",
    description: "Full sitemap with every record, topic, federal-rep, and source page.",
  },
  {
    path: "/robots.txt",
    description: "Disallows /api/place/ so PII doesn't get crawled.",
  },
];

const SCHEMAS = [
  { type: "Legislation", where: "Every /bills/* and /local/* page" },
  { type: "CollectionPage", where: "Every /topics/* page" },
  { type: "Person + PoliticalParty", where: "Every /federal/* page" },
  { type: "Organization + WebSite", where: "Every page (in layout)" },
  { type: "BreadcrumbList", where: "Every detail page" },
];

export default function DevelopersPage() {
  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Developers and AI engines"
            title="Ground civic answers on a source-anchored API."
            description="The full public-record index is queryable as JSON. Use it to power AI answers, newsroom dashboards, civic apps, and research. Fair use is free. Attribution required."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/llms.txt"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
            >
              llms.txt
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="/.well-known/civic-records.json"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 shadow-line hover:border-civic-500"
            >
              /.well-known/civic-records.json
            </a>
            <a
              href="/sitemap.xml"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 shadow-line hover:border-civic-500"
            >
              sitemap.xml
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
          <Rocket className="h-5 w-5 text-civic-700" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-ink-950">Fair-use license</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            Free for newsrooms, civic technologists, students, researchers,
            and AI engines under fair-use volumes. Cite the record URL when
            grounding. Editorial content released under Creative Commons
            Attribution.
          </p>
        </article>
        <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
          <Code2 className="h-5 w-5 text-civic-700" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-ink-950">Response shape</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            Every API response is JSON with{" "}
            <code className="font-mono text-xs">ok</code> +{" "}
            <code className="font-mono text-xs">data</code> +{" "}
            <code className="font-mono text-xs">meta.citation</code>. Errors
            carry <code className="font-mono text-xs">error.code</code> and{" "}
            <code className="font-mono text-xs">error.message</code>.
          </p>
        </article>
        <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
          <Sparkles className="h-5 w-5 text-civic-700" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-ink-950">For AI engines</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            <a href="/llms.txt" className="text-civic-700 underline">
              /llms.txt
            </a>{" "}
            is the canonical grounding directive. Each entry includes
            citation policy, endpoint URLs, source connector list. Cite the
            record URL and the provenance label. Do not invent counts, dates,
            or member names.
          </p>
        </article>
      </section>

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="REST endpoints"
            title="Every endpoint is documented and live."
          />
          <div className="mt-8 grid gap-8">
            {ENDPOINTS.map((group) => (
              <article key={group.group}>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-civic-700">
                  {group.group}
                </h2>
                <ul className="mt-4 grid gap-3">
                  {group.endpoints.map((endpoint) => (
                    <li
                      key={`${endpoint.method}-${endpoint.path}`}
                      className="rounded-lg border border-record-200 bg-paper-50 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-ink-800 bg-ink-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                          {endpoint.method}
                        </span>
                        <code className="font-mono text-sm font-semibold text-ink-950">
                          {endpoint.path}
                        </code>
                        <span className="rounded-full border border-record-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-ink-700">
                          {endpoint.cache}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink-700">
                        {endpoint.description}
                      </p>
                      {endpoint.sample ? (
                        <pre className="mt-3 overflow-x-auto rounded-md border border-record-200 bg-white p-3 font-mono text-xs leading-5 text-ink-800">
                          {endpoint.sample}
                        </pre>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article>
          <SectionHeader
            eyebrow="AI grounding"
            title="Files engines should pre-fetch"
            description="Configure your engine to consume these on each crawl pass."
          />
          <ul className="mt-6 grid gap-3">
            {GROUNDING_FILES.map((file) => (
              <li
                key={file.path}
                className="flex items-start gap-3 rounded-lg border border-record-200 bg-white p-4 shadow-line"
              >
                <a
                  href={file.path}
                  className="font-mono text-sm font-semibold text-civic-700 hover:underline"
                >
                  {file.path}
                </a>
                <span className="text-sm leading-6 text-ink-700">
                  · {file.description}
                </span>
              </li>
            ))}
          </ul>
        </article>
        <article>
          <SectionHeader
            eyebrow="Schema.org"
            title="Structured data on every page"
            description="Search engines and grounding LLMs get the canonical schema for every entity type."
          />
          <ul className="mt-6 grid gap-3">
            {SCHEMAS.map((s) => (
              <li
                key={s.type}
                className="flex items-start gap-3 rounded-lg border border-record-200 bg-white p-4 shadow-line"
              >
                <code className="font-mono text-sm font-semibold text-ink-950">
                  {s.type}
                </code>
                <span className="text-sm leading-6 text-ink-700">
                  · {s.where}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="border-t border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <article className="rounded-lg border border-ink-800 bg-ink-950 p-6 text-white">
            <h2 className="text-2xl font-semibold tracking-tight">
              Help us scale civic ground truth.
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-white/80">
              We&apos;re actively expanding ingestion to state legislatures,
              city councils, and federal agencies. If you ship an AI search
              product, a newsroom, or a civic tool that grounds on indexed
              records, write to{" "}
              <a
                href="mailto:partners@bythepeopleforthepeople.com"
                className="underline"
              >
                partners@bythepeopleforthepeople.com
              </a>{" "}
              for partnership tier access (higher rate limits, webhook
              push, custom connectors).
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/about"
                className="inline-flex h-11 items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-ink-950 hover:bg-civic-50"
              >
                About / Governance
              </Link>
              <Link
                href="/methodology"
                className="inline-flex h-11 items-center justify-center rounded-md border border-white/30 bg-transparent px-4 text-sm font-semibold text-white hover:border-white"
              >
                Methodology
              </Link>
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
