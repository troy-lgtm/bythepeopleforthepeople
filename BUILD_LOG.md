# Build log — private growth loop

Newest entry last. One entry per loop.

## Loop 1 — Audit + plan

- What changed: audited storage (Upstash Redis convention, env-less fallback
  philosophy), email (single sendEmail chokepoint), digest, causes, records,
  API conventions, OG routes, tests. Wrote IMPLEMENTATION_PLAN.md.
- Files touched: IMPLEMENTATION_PLAN.md.
- Tests run: none (read-only loop).
- Known issues: none.
- Next: storage facade + notification guard.

## Loop 2 — Store facade, launch mode, notification guard

- What changed: added `src/lib/store.ts` (Upstash Redis + explicit in-memory
  fallback, mode surfaced), `src/lib/launch-mode.ts` (fail-closed env parsing,
  private test mode default ON, test user defaults to troy@wearewarp.com),
  `src/lib/notification-guard.ts` (evaluateRecipient + assertCanNotifyRecipient
  + blocked-notification audit log), `src/lib/email-shared.ts` (EMAIL_RE shared
  with client code). Wired the guard INSIDE `sendEmail` so no email pathway can
  bypass it. Routed the CORRECTIONS_WEBHOOK_URL freshness alert through the
  guard (webhook channel, blocked in private test mode). Refactored
  `subscribers.ts` onto the store facade (gains env-less memory mode), added
  isTestUser/source/lastSeenMovementAt fields. Removed `server-only` from
  script-reachable modules in favor of runtime window checks (Next never
  bundles these client-side; scripts run via npx tsx per repo convention).
- Files touched: src/lib/{store,launch-mode,notification-guard,email-shared,email,subscribers}.ts,
  src/app/api/cron/refresh-leginfo/route.ts.
- Tests run: `tsc --noEmit` clean; tsx runtime probe of evaluateRecipient
  across private/open/half-open flag sets — all decisions correct (Troy
  allowed, stranger blocked in private + half-open, sms always blocked,
  stranger allowed only when all four launch flags open).
- Known issues: none.
- Next: persistent watchlist + private-mode subscribe gating.

## Loop 3 — Persistent watchlist + private-pilot subscribe gate

- What changed: subscribe blocks non-test emails in private mode with a calm
  pilot message (nothing stored, attempt logged via the guard); subscriber
  rows carry isTestUser/source/lastSeenMovementAt; tokened
  `/watchlist/manage` page; SubscribeForm handles the pilot state;
  SITE_BASE_URL override so confirm/manage links work locally.
- Files touched: src/app/api/subscribe/route.ts, confirm route,
  src/components/SubscribeForm.tsx, src/app/watchlist/manage/page.tsx,
  src/lib/site-url.ts.
- Tests run: tsc clean.
- Known issues: none.
- Next: movement detection.

## Loop 4 — Movement detection engine + cause catalog

- What changed: deterministic snapshot differ with 15 movement types,
  template summaries, evidence stacks, confidence labels
  (src/lib/movement-types.ts); baseline events derived from the real indexed
  record timelines (movement-baseline.ts); store-backed versions + detected
  events + merged read path (movement-store.ts); 10-cause canonical catalog
  with keyword matching and negative keywords (cause-catalog.ts); place
  mapping including ZIP coverage honesty (place-catalog.ts);
  /api/cron/detect-movements + vercel.json schedule. Fixed over-broad
  keywords caught during verification ("oversight" falsely tagging a housing
  bill as policing).
- Tests run: tsc clean; tsx end-to-end probe (baseline derivation, first-run
  no-double-report, simulated official change → 3 correct events, place +
  cause filters, id roundtrip).
- Known issues: none.
- Next: movement digest.

## Loop 5 — Movement digest + Troy-only sending

- What changed: movement-based digest builder + HTML/text renderers with the
  private-test footer and receipt links (movement-digest.ts); digest audit
  log (digest-log.ts); cron send-digests, confirm welcome email, and the
  operator /api/digest/send all rebuilt on guarded sendEmail — the old
  direct-Resend bypass in digest/send is closed; daily cadence skips quiet
  days; 90046 added to the indexed ZIP table (LA city, CA-30, consistent
  with neighboring entries); ZIP digests include every place level the ZIP
  belongs to (LA + CA).
- Tests run: tsc clean; tsx digest probes (subjects, coverage notes, place
  union, quiet-period honesty).
- Known issues: none.
- Next: public pages.

## Loop 6 — What-moved feeds, receipts, catalog cause pages

- What changed: /what-moved, /what-moved/[place], /what-moved/[place]/[cause],
  /gov/[zip]/what-moved (honest coverage-gap states); /receipts/[id] with
  evidence stack, record timeline, responsible body, action grid, share
  buttons, Article JSON-LD; catalog cause pages /causes/[slug] +
  /causes/[slug]/[place] + /this-week without breaking private user causes;
  "What moved" in the site nav; catalog causes on the causes index.
- Tests run: tsc clean.
- Known issues: none.
- Next: distribution surfaces.

## Loop 7 — OG cards, civic-records API, llms/sitemap/embeds, ref counter

- What changed: /og/receipt card rendered from the movement id;
  /api/civic-records/{latest, place/[place], cause/[cause], receipts/[id],
  gov/[zip]} with full provenance and explicit nulls; llms.txt + well-known
  manifest extended with movement surfaces; sitemap-movement.xml registered
  in the sitemap index; embeds /embed/cause/[cause] +
  /embed/place/[place]/cause/[cause] (link-only, private-pilot aware);
  anonymous daily ref counters via /api/events + RefTracker.
- Tests run: tsc clean.
- Known issues: none.
- Next: Launch Center.

## Loop 8 — Admin Launch Center

- What changed: /admin/launch behind ADMIN_LAUNCH_SECRET (constant-time,
  fail-closed when unset); system status grid; blocked-attempt audit; the
  18-point readiness checklist (launch-checklist.ts); launch state store
  (launch-state.ts); buttons: Send test digest to Troy, Mark growth launch
  ready (state only), and Begin public organic launch — disabled unless all
  four env gates open AND the checklist passes, with the exact blockers
  listed. No button can message the public.
- Tests run: tsc clean.
- Known issues: none.
- Next: tests + scripts.

## Loop 9 — Tests, scripts, env example

- What changed: 42 unit specs (guard matrix, sendEmail chokepoint proof,
  launch flags, movement differ, cause catalog, digest, memory store) under
  a browserless Playwright project; 16 growth-loop smoke specs (subscribe
  gating both ways, receipts, what-moved, cause pages, APIs with provenance,
  admin auth + locked launch button, embed, OG, llms/manifest/sitemap);
  scripts seed:test-user / digest:test / launch:check / movements:detect /
  demo; quiet digests now include a dated "Latest on your causes" section;
  .env.example documents every gate.
- Tests run: 42/42 unit specs green; scripts exercised end to end in memory
  mode.
- Known issues: none.
- Next: full verification.

## Loop 10 — Full verification

- What changed: lint fixes (unused var, unescaped quotes); fixed a
  production-only 500 on /gov/[zip]/what-moved (empty generateStaticParams +
  ISR threw DYNAMIC_SERVER_USAGE; the page is now force-dynamic, matching
  its sibling /gov/[zip] page); BUILD_LOG + README brought current.
- Tests run: `npm run lint` clean; `tsc --noEmit` clean; env-less
  `npm run build` passes; full Playwright suite 67/67 green (42 unit + 25
  smoke); visual verification in the browser preview of /what-moved,
  /receipts/mv-bill-ca-sb-79-sb79-t5, /admin/launch (locked button confirmed
  disabled with exact blockers listed), and the digest HTML preview — zero
  console errors.
- Known issues: in memory-store mode each process is isolated (clearly
  labeled everywhere); municipal rep lookup still needs CICERO_API_KEY;
  detected (post-baseline) receipts join the sitemap on rebuild only.
- Next: hand off to Troy for private testing.

## Loop 11 — Live ingest connector (Open States) + launch prep

- What changed: live CA bill connector on the Open States v3 API
  (src/lib/live-ingest.ts): refreshes tracked bills by id, discovers
  current-session bills with one deterministic query per catalog cause,
  maps official actions to record snapshots (LegInfo source labeled
  Official record, aggregator page labeled Derived summary), skips bills
  already hand-curated, caps tracking at 40, paces requests. Detection now
  ingests live snapshots; first sight of a live record emits an honest
  new_record plus its last-30-days official actions, dated by the record.
  Live records link receipts to the official record system (no dead
  internal links). Launch Center gains Run Detection and Seed Test User
  buttons (admin-key gated; neither sends anything) plus live-ingest
  status. Shipped PR 20 (squash-merged), deployed to production via
  vercel --prod, set production env: ADMIN_LAUNCH_SECRET + explicit safety
  flags (PRIVATE_TEST_MODE=true, allows false, TEST_USER_EMAIL).
- Files touched: src/lib/live-ingest.ts, movement-types.ts (live/external
  record fields), movement-store.ts (live-aware detection + run stats),
  receipts page (external record CTA), admin launch page + 2 new admin
  routes, detect-movements script, tests/unit/live-ingest.spec.ts.
- Tests run: 74/74 (49 unit incl. 7 live-ingest fixture specs, 25 smoke);
  lint, typecheck, env-less build clean. Prod verified: stranger subscribe
  returns private_pilot on bythepeopleforthepeople.com; Launch Center
  authenticates and shows PRIVATE TEST MODE.
- Known issues: production env values are write-only (sensitive), so
  operator actions on prod go through the admin-key routes; the Open
  States key's validity is verified by the run result itself (surfaced in
  the Launch Center, isolated on failure).
- Next: prod end-to-end (seed Troy, run detection, send the test digest).

## Launch prep — production end-to-end (2026-07-03)

- What changed and ran, in order: PR 20 merged + deployed (vercel --prod
  from the synced main checkout — this repo has NO GitHub auto-deploy);
  production env set (ADMIN_LAUNCH_SECRET + explicit safety flags); prod
  gate verified (stranger subscribe → private_pilot, attempt audit-logged);
  PR 21 live ingest merged + deployed; first prod detection run discovered
  and tracked 29 current-session CA bills → 150 real movement events
  (amendments, referrals, votes, advances with true official dates);
  PR 22 fixed first-indexed headlines ("is now indexed", never
  "was introduced") with a self-healing pass for stored events; PR 23
  replaced per-bill refresh with one updated_since sweep after the
  ~10/min Open States limit produced 5 errors at 29 tracked bills
  (clean 0-error run after); Troy seeded on the prod store via the new
  admin route; REAL test digest delivered to troy@wearewarp.com
  ("Government moved on homelessness and housing. Here are the
  receipts."); prod Launch Center shows ALL REQUIRED CHECKS PASS,
  1 digest sent (to the test user only), 1 blocked attempt logged (the
  gate test), PRIVATE TEST MODE on. Fixed API recordUrl double-prefix
  for live records.
- Tests run: 50 unit + 25 smoke green locally; prod verified end to end
  via the admin routes and public API.
- Known issues: prod detection currently triggers via the Launch Center
  button or the daily cron (cron needs a real CRON_SECRET value — it is
  set in Vercel; value is write-only so unverified from here, and the
  cron result will confirm on its first 9:30 UTC run).
- Next: Troy walks the loop; live ingest breadth (more causes/sessions,
  LA Council files) when ready.
