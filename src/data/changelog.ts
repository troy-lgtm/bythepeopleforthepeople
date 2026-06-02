export type ChangelogEntry = {
  date: string;
  kind: "product" | "methodology" | "coverage" | "trust" | "infra";
  title: string;
  body: string;
};

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-05-24",
    kind: "product",
    title: "Funnel v1: live hero matching, no more dead ends, real return loop",
    body:
      "Three conversion fixes. (1) Live hero matching: the home page now matches a cause to indexed records as you type — see the count before you commit, then continue into a pre-filled wizard. (2) No more dead ends: a cause that matches nothing now shows the closest coverage by word overlap (labeled loose, never exact), one-tap refine/search/digest actions, and your actual federal representatives by ZIP instead of a blank panel; the day-one activity log offers next steps instead of an empty box. (3) Real return loop: the digest send endpoint is documented as live (Resend, operator-secret auth, dry-run) and now carries your causes, so delivered digests include per-cause sections. Methodology unchanged: loose matches are labeled non-exact, no alignment scoring anywhere, missing still means missing.",
  },
  {
    date: "2026-05-23",
    kind: "product",
    title: "Causes v3: per-cause OG, RSS, suggestions, activity log, overlap detection",
    body:
      "Per-cause OG image at /og/cause renders the cause title, outcome, matched counts, and jurisdictions in the brand voice. Opt-in per-cause RSS at /feed/causes/<encoded>.xml lets anyone subscribe in any RSS reader — the cause is base64url-encoded into the URL itself (no server storage; publishing is explicit and the URL is public). Related-cause suggestions on every cause page surface 4 starter cards that share topics or keywords. Cause activity log shows recent record movement since you started tracking (event type, date, since-or-before marker). Wizard now detects overlap with existing causes (Jaccard across topics/keywords/jurisdictions; threshold 0.4 OR shared 3+) and surfaces a sharpen-instead-of-duplicate warning with links to the existing causes.",
  },
  {
    date: "2026-05-22",
    kind: "product",
    title: "Causes v2: edit, action plan, digest integration, track-as-cause, search",
    body:
      "Causes become the brain of the product. New /causes/[id]/edit in-place editor; new /causes/[id]/actions five-step structured action plan; /digest and /api/digest/preview now build per-cause sections when the user has causes; new Track as cause button on every bill, local file, and federal-rep page that pre-fills the cause with the record's topics + jurisdiction; user's causes now appear at the top of CMD+K results with a Your cause label. Methodology guardrails unchanged: product never scores alignment of any record or rep to a cause; user judges.",
  },
  {
    date: "2026-05-21",
    kind: "product",
    title: "Causes important to you (THE angle)",
    body:
      "Reframed the product around what people actually want — their causes, in their own words. New /causes index, /causes/new wizard with 12 balanced starter cards, /causes/[id] detail with matched bills/local files/topics/reps, cause-scoped digest preview, anonymous shareable card. Home page leads with Your causes. Causes stay private in a first-party cookie unless explicitly shared. The product matches indexed records to a cause via topic + jurisdiction + keyword overlap; the user judges alignment. The product never scores any rep or record as for/against a cause.",
  },
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
