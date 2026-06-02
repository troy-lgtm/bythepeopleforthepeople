# Contributing

Thanks for considering a contribution.

## What we accept

- **New source connectors** — adapters that pull official-record data into
  the schema from a verifiable upstream system (state legislature, city
  council, federal agency). See `scripts/ingest-leginfo.ts` for the pattern.
- **Schema improvements** — additions to `src/data/types.ts` that broaden
  what we can index without compromising source-anchored discipline.
- **Bug fixes** — anything that breaks the methodology rule that every
  factual claim must trace to a primary source.
- **Accessibility** — fixes to color contrast, focus management, screen
  reader semantics, keyboard nav.
- **Test coverage** — Playwright smoke tests, unit tests for adapters,
  snapshot tests for OG images.
- **Translation** — UI strings to non-English locales (Spanish, Chinese,
  Tagalog, Vietnamese, Korean prioritized).

## What we do not accept

- **Fabricated records** — never. If a record cannot be sourced from an
  official publication point, do not add it. See `/methodology`.
- **Partisan tagging or scoring** — see `/about` Editorial rules. Stakeholder
  positions are limited to verbatim quotes; we removed the For/Against enum
  for this reason.
- **Tracking pixels, ad surfaces, sponsored placements** — the product is
  ad-free by design.
- **Source-trail removal** — every claim must keep its source link.

## How to contribute

1. Fork the repo and create a feature branch.
2. Run `npm install` then `npm run dev`. Verify the relevant page renders.
3. For a new source connector:
   - Write the adapter script under `scripts/ingest-<name>.ts`.
   - Add the connector definition to `sourceConnectors` in
     `src/data/product-loop.ts` with `status: "Documented adapter"`.
   - Run the adapter against one record. Commit the seed JSON to
     `src/data/seed/<connector>/<id>.json`.
   - Open a PR with a description of the upstream source and any rate-limit
     considerations.
4. Run `npm run typecheck && npm run lint && npm run build`.
5. Add or update a Playwright smoke test in `tests/`.
6. Open a PR. The maintainer reviews methodology adherence first, then
   code.

## Code style

- TypeScript strict mode.
- Tailwind for styles.
- No dashes in body copy (use periods or colons).
- No banned vocabulary in copy (streamline, optimize, leverage, synergy,
  cutting-edge, next-generation, seamless, robust).
- Apple-minimalist UI: sentence case, soft borders, generous whitespace.
- Plain language preferred; legalese kept only in direct quotes from the
  record.

## Communication

- Substantive methodology questions: open an issue with the `methodology`
  label.
- Partnership / press / coverage requests:
  partners@bythepeopleforthepeople.com
- Security: see `/.well-known/security.txt`.

## Code of conduct

Treat fellow contributors as you would treat the public officials whose
records we index: with skepticism on substance and respect on form. Bad-faith
contributions, partisan edits, harassment, or attempts to circumvent the
methodology will result in a ban without warning.
