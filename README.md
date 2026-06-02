# By The People, For The People

A nonpartisan public-decision intelligence platform. Every claim renders with a source trail (date, type, jurisdiction, provenance label) and an evidence stack (claim, locator, excerpt, verification note, official link). Missing data is labeled missing, not guessed. No endorsements, no partisan scoring, no outrage feed.

## What it does today

- **Records**: indexed public records for state bills (CA LegInfo) and local council files (LA City Clerk) with timelines, amendments, votes, hearings, stakeholders, and source proofs
- **Topic pages**: aggregated views by issue (fires, homelessness, crime, housing, land use) with coverage gaps labeled explicitly
- **Place anchor**: a ZIP-set location lets the site surface the user's federal representatives and personalize record relevance
- **Take action**: every record page renders concrete next steps (add to calendar, email the responsible representative, file a public records request)
- **Watchlist**: browser-saved watch targets with a daily/weekly email digest scaffolded for delivery
- **Public API**: JSON endpoints under `/api/*` plus `/llms.txt` and `/.well-known/civic-records.json` so AI engines can ground civic answers on indexed records
- **Provenance discipline**: every page, every card, every answer attaches a source ID or labels itself missing

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

The product is build-passing locally without any third-party keys. The following are needed before the watchlist and digest features deliver to real users:

- `RESEND_API_KEY` (or `POSTMARK_API_KEY`) + a verified sending domain for digest email
- `TWILIO_*` credentials for SMS alerts on evacuation-grade signals
- `CICERO_API_KEY` or a Civic Information API replacement for municipal representative lookup (federal works with bundled data)
- A persistent store for account-tier watchlists (the local watchlist uses browser localStorage)

## Methodology

See `/methodology` in the running app, or `src/app/methodology/page.tsx`. The principles: public records first, facts separated from interpretation, no partisan scores, no endorsements, provenance for every claim, cited AI summaries only, missing means missing, understanding not persuasion.

## Data sources

- California LegInfo (`leginfo.legislature.ca.gov`)
- Los Angeles Council File Management System (`cityclerk.lacity.org`)
- US Congress (`congress.gov`)
- US Census Geocoder (`geocoding.geo.census.gov`)
- `unitedstates/congress-legislators` public dataset

Coverage gaps are labeled in-product. Adding a new jurisdiction means writing a connector against its official record system and seeding the type schema; never seeding fabricated records.
