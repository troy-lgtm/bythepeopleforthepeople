# By The People, For The People

A nonpartisan public-decision intelligence platform. Every claim renders with a source trail (date, type, jurisdiction, provenance label) and an evidence stack (claim, locator, excerpt, verification note, official link). Missing data is labeled missing, not guessed. No endorsements, no partisan scoring, no outrage feed.

## What it does today

- **Records**: indexed public records for state bills (CA LegInfo) and local council files (LA City Clerk) with timelines, amendments, votes, hearings, stakeholders, and source proofs
- **Topic pages**: aggregated views by issue (fires, homelessness, crime, housing, land use) with coverage gaps labeled explicitly
- **Place anchor**: a ZIP-set location lets the site surface the user's federal representatives and personalize record relevance
- **Take action**: every record page renders concrete next steps (add to calendar, email the responsible representative, file a public records request)
- **Watchlist**: browser-saved watch targets plus a persistent email watchlist (ZIP + causes) with double opt-in and a real movement digest
- **Movement loop**: deterministic movement detection over indexed records, "what moved" feeds (`/what-moved`, `/gov/[zip]/what-moved`), and a Civic Receipt page per movement (`/receipts/[id]`) with evidence stack, timeline, and actions
- **Public API**: JSON endpoints under `/api/*` (including `/api/civic-records/*` movement endpoints) plus `/llms.txt` and `/.well-known/civic-records.json` so AI engines can ground civic answers on indexed records
- **Provenance discipline**: every page, every card, every answer attaches a source ID or labels itself missing

## Private test mode (default)

The app ships fail-closed: with zero env config it is in private test mode and
can only ever email the test user (`troy@wearewarp.com`). Every outbound
pathway flows through one notification guard inside `sendEmail`; blocked
attempts are logged, never silently sent. SMS does not exist. The Launch
Center at `/admin/launch?key=ADMIN_LAUNCH_SECRET` shows live proof, an
18-point readiness checklist, and a public-launch button that stays locked
until four env vars open it (`PRIVATE_TEST_MODE=false`,
`GROWTH_LAUNCH_ENABLED=true`, `ALLOW_PUBLIC_DIGESTS=true`,
`ALLOW_NON_TEST_EMAILS=true`) AND the checklist passes. See `.env.example`.

Operator scripts:

```bash
npm run seed:test-user    # seed Troy (90046, five causes, confirmed)
npm run movements:detect  # snapshot + diff indexed records
npm run digest:test       # build digest, write .artifacts preview, send to Troy if configured
npm run launch:check      # readiness checklist in the terminal
npm run demo              # all of the above in order
npm run test:unit         # 42 unit specs (guard, differ, digest, catalog)
npm run test:smoke        # full Playwright suite against a prod build
```

## Stack

- Next.js 15.5.18 (App Router, RSC) on Vercel
- React 19, TypeScript 5, Tailwind 3
- Geist Sans + Geist Mono
- Lucide React icons
- US Census Geocoder + bundled `unitedstates/congress-legislators` data for federal reps
- Static rendering (SSG) for every record page

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run typecheck
npm run lint
npm run build
```

## External setup required before production delivery

The product is build-passing locally without any third-party keys. The following are needed before the watchlist and digest features deliver to the test user (and, later, real users):

- `RESEND_API_KEY` + a verified sending domain for digest email (wired; sends only to the test user while private test mode is on)
- `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Upstash Redis / Vercel KV) so watchlists, movement events, and audit logs survive restarts (an explicit in-memory fallback covers local dev)
- `ADMIN_LAUNCH_SECRET` to open the Launch Center, `CRON_SECRET` for the cron routes, `DIGEST_SEND_SECRET` for the operator send endpoint
- `CICERO_API_KEY` or a Civic Information API replacement for municipal representative lookup (federal works with bundled data)
- SMS is deliberately not wired; the notification guard blocks the channel outright

## Methodology

See `/methodology` in the running app, or `src/app/methodology/page.tsx`. The principles: public records first, facts separated from interpretation, no partisan scores, no endorsements, provenance for every claim, cited AI summaries only, missing means missing, understanding not persuasion.

## Data sources

- California LegInfo (`leginfo.legislature.ca.gov`)
- Los Angeles Council File Management System (`cityclerk.lacity.org`)
- US Congress (`congress.gov`)
- US Census Geocoder (`geocoding.geo.census.gov`)
- `unitedstates/congress-legislators` public dataset

Coverage gaps are labeled in-product. Adding a new jurisdiction means writing a connector against its official record system and seeding the type schema; never seeding fabricated records.
