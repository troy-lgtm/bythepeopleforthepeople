export type ChangelogEntry = {
  date: string;
  kind: "product" | "methodology" | "coverage" | "trust" | "infra";
  title: string;
  body: string;
};

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-05-21",
    kind: "coverage",
    title: "RSS, iCal, per-connector pages",
    body:
      "Subscribable feeds for journalists and RSS clients. /feed.xml carries source-anchored civic-record changes; /calendar.ics carries upcoming legislative milestones. Each source connector now has its own page documenting status, freshness, and ingestion requirements.",
  },
  {
    date: "2026-05-21",
    kind: "trust",
    title: "Plain-language summaries, public changelog",
    body:
      "Every indexed record can carry a plainLanguage callout that translates procedural language into normal English. The translation is labeled as translation only; legal effect remains the official record. This changelog records every methodology or product change in public.",
  },
  {
    date: "2026-05-21",
    kind: "product",
    title: "PWA install support",
    body:
      "Web app manifest, icons, and theme colors are in place. The site is now installable to the iOS or Android home screen. Three home-screen shortcuts: Ask records, Your reps, Top topics.",
  },
  {
    date: "2026-05-21",
    kind: "coverage",
    title: "State directory hubs",
    body:
      "/state/[abbr] for all 50 states, DC, and 5 territories. Each hub aggregates federal delegation, indexed state-level bills, indexed local files, and source connectors covering the jurisdiction.",
  },
  {
    date: "2026-05-21",
    kind: "product",
    title: "Universal search (CMD+K)",
    body:
      "551 indexed entities — all 536 current U.S. Congress members + bills + local files + topic pages + source connectors — are now searchable from anywhere via Cmd/Ctrl+K. Server-rendered full results at /search.",
  },
  {
    date: "2026-05-21",
    kind: "coverage",
    title: "Federal representative pages",
    body:
      "All 536 current members of the U.S. Congress now have source-anchored civic profiles at /federal/[slug] with chamber, district, party, contact information, and Bioguide ID. Voting records, sponsorships, and committee actions are added per profile as ingestion lands.",
  },
  {
    date: "2026-05-21",
    kind: "coverage",
    title: "National ZIP coverage",
    body:
      "Place lookup now resolves any US ZIP via a two-stage fallback (zippopotam.us centroid + US Census Geographies congressional-district lookup). Static metro table still hits first for speed.",
  },
  {
    date: "2026-05-21",
    kind: "product",
    title: "Shareable quote cards and per-record share buttons",
    body:
      "Each indexed record now has a Share a sourced fact button with auto-generated presets (status, vote count, amendment summary, sponsor). Every share renders a dynamic OG card carrying the official source citation.",
  },
  {
    date: "2026-05-21",
    kind: "trust",
    title: "Trust foundation: about, corrections, privacy, terms",
    body:
      "Public governance pages: /about (named operators, funding model, allowed and disallowed donors, independence pledge), /corrections (append-only log of factual changes, with Report a correction button on every record page), /privacy, and /terms.",
  },
  {
    date: "2026-05-21",
    kind: "methodology",
    title: "Stakeholder.position enum removed",
    body:
      "Stakeholder records no longer carry a For/Against/Informational/Not-stated enum, which functioned as partisan tagging by another name. They now render the publicStatement verbatim with a Verbatim from the public record. No partisan tagging applied. label.",
  },
  {
    date: "2026-05-21",
    kind: "infra",
    title: "Cron-protected freshness monitor",
    body:
      "Vercel Cron triggers /api/cron/refresh-leginfo daily at 9am UTC. Re-pings every indexed source URL; posts to CORRECTIONS_WEBHOOK_URL when any source returns 4xx or 5xx.",
  },
  {
    date: "2026-05-21",
    kind: "product",
    title: "Public API with citation policy",
    body:
      "17 endpoints under /api/* return JSON with a citation header. Companion files: /llms.txt for LLM grounding, /.well-known/civic-records.json for tooling discovery. /developers documents every endpoint.",
  },
  {
    date: "2026-05-21",
    kind: "infra",
    title: "Launch baseline",
    body:
      "Public launch of bythepeopleforthepeople.com. Source-anchored. Nonpartisan. Missing data labeled missing.",
  },
];
