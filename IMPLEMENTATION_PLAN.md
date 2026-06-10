# Private Growth Loop — Implementation Plan

Goal: make the civic growth loop real end to end, in private test mode, with
troy@wearewarp.com as the only person who can ever receive a message. End state:
Troy opens the app, the loop works, and the Admin Launch Center shows a readiness
checklist plus a safely gated launch button.

## Audit findings (Loop 1)

What exists and is kept:

- **Email**: `src/lib/email.ts` — single `sendEmail` chokepoint via Resend REST.
  Degrades gracefully when `RESEND_API_KEY` is unset.
- **Subscribers**: `src/lib/subscribers.ts` — Upstash Redis (`KV_REST_API_*` or
  `UPSTASH_REDIS_REST_*`), double opt-in tokens, confirm/unsubscribe routes,
  rate limiting. Null-store degrades gracefully.
- **Digest**: `src/lib/digest.ts` — deterministic digest from indexed records +
  the user's causes. Cron at `/api/cron/send-digests` gated by `CRON_SECRET`.
- **Records**: static, source-anchored data in `src/data/records.ts` and
  `src/data/product-loop.ts` (real CA bills, real LA council files, every claim
  carries source IDs). This is real official-record data, not fabricated.
- **Causes**: cookie + localStorage based user causes (`src/lib/causes.ts`,
  `cause-matcher.ts`), starter cause cards.
- **API conventions**: `jsonOk`/`jsonError` with citation meta,
  `timingSafeEqualStr` for secrets.
- **OG images**: `next/og` edge routes under `src/app/og/*`, civic palette
  (paper `#fbfaf7`, ink `#07111f`, civic green `#175c55`).
- **Tests**: Playwright smoke tests (`tests/smoke.spec.ts`).
- **Constraint**: repo builds env-less (static fallbacks everywhere). Keep that.
- **Constraint**: scripts run via `npx tsx` (repo convention,
  `scripts/ingest-leginfo.ts`). Modules in a script's import graph must not use
  `import "server-only"` (Next-bundler-only alias) — replaced with a runtime
  window check in shared modules.

## Storage decision

No Postgres/Prisma is present. The repo's persistence pattern is Upstash Redis
with graceful null-store degradation. Decision: extend that pattern with a thin
store facade (`src/lib/store.ts`) that uses Upstash when configured and an
explicit in-memory fallback otherwise (labeled ephemeral, dev only). Subscribers,
movement events, record versions, launch state, blocked notifications, digest
log, and ref counters all ride on it. This avoids a parallel database, keeps
Vercel deploys working with zero new infra, and keeps env-less local dev alive.

## Safety model (non-negotiable)

`src/lib/launch-mode.ts` — fail-closed env parsing:

- `PRIVATE_TEST_MODE` — true unless the string is exactly `"false"`.
- `TEST_USER_EMAIL` — defaults to `troy@wearewarp.com`.
- `GROWTH_LAUNCH_ENABLED`, `ALLOW_PUBLIC_DIGESTS`, `ALLOW_NON_TEST_EMAILS` —
  false unless exactly `"true"`.

`src/lib/notification-guard.ts` — `assertCanNotifyRecipient(email, channel)`:

- Private test mode + email is not the test user → blocked.
- `ALLOW_NON_TEST_EMAILS` false + email is not the test user → blocked.
- Channel `sms` → always blocked (no SMS wiring exists; stays that way).
- Channel `webhook` → blocked in private test mode.
- Every block is logged to the store (`BlockedNotification`) and the console.

The guard is wired INSIDE `sendEmail` itself, so no current or future call site
can bypass it. The cron sender, subscribe confirm, digest test sends, and any
new pathway all flow through the same chokepoint.

## Build loops

- **Loop 2 — storage + guard**: `store.ts`, `launch-mode.ts`,
  `notification-guard.ts`, guard wired into `email.ts`, subscribers refactored
  onto the store (gains memory fallback for env-less dev).
- **Loop 3 — watchlist + opt-in**: subscriber becomes the persistent watchlist
  (zip + causes + confirmed + isTestUser + source). Private-mode subscribe
  gating with a friendly pilot message. Tokened manage page.
- **Loop 4 — movement detection + cause catalog**: deterministic differ
  (`movement-types.ts`), baseline movement events derived from the real record
  timelines (`movement-baseline.ts`), persistent detection on snapshot diffs
  (`movement-store.ts`, cron + script), 10-cause canonical catalog
  (`cause-catalog.ts`) with deterministic keyword matching.
- **Loop 5 — digest v2**: movement-based digest builder + renderers, Troy-only
  send paths, `npm run digest:test`, browser preview.
- **Loop 6 — what-moved + receipts**: `/what-moved[/place[/cause]]`,
  `/gov/[zip]/what-moved`, `/receipts/[id]` with full evidence stack, cause
  catalog pages `/causes/[slug]/[place][/this-week]`.
- **Loop 7 — distribution surfaces**: `/og/receipt`, `/api/civic-records/*`,
  llms.txt + `.well-known/civic-records.json` + sitemap additions, embeds
  (`/embed/cause/[cause]`, `/embed/place/[place]/cause/[cause]`), `?ref=`
  counter (anonymous, no PII).
- **Loop 8 — Launch Center**: `/admin/launch` behind `ADMIN_LAUNCH_SECRET`,
  status grid, readiness checklist, "Send test digest to Troy",
  "Mark growth launch ready", and the locked "Begin public organic launch"
  button that explains exactly which env vars and checks gate it.
- **Loop 9 — tests + scripts**: unit specs (Playwright test runner, no new
  deps) for guard/launch-mode/differ/matcher/digest, smoke additions for
  subscribe gating + receipts + what-moved + admin, scripts: `seed:test-user`,
  `digest:test`, `launch:check`, `movements:detect`.
- **Loop 10 — verification**: lint, typecheck, build, full test run, fixes,
  BUILD_LOG.md entries, local commits per loop.

## Env vars

```
# Safety (defaults are the safe values; set explicitly in Vercel anyway)
PRIVATE_TEST_MODE=true
TEST_USER_EMAIL=troy@wearewarp.com
GROWTH_LAUNCH_ENABLED=false
ALLOW_PUBLIC_DIGESTS=false
ALLOW_NON_TEST_EMAILS=false

# Admin
ADMIN_LAUNCH_SECRET=<long random string>

# Existing
RESEND_API_KEY=<resend key>            # email delivery
DIGEST_FROM_ADDRESS=digest@bythepeopleforthepeople.com
KV_REST_API_URL=<upstash url>          # or UPSTASH_REDIS_REST_URL
KV_REST_API_TOKEN=<upstash token>      # or UPSTASH_REDIS_REST_TOKEN
CRON_SECRET=<long random string>
```

## What stays untouched

Provenance behavior, methodology page, existing record pages, federal rep
lookup, existing API routes, embed headers in `next.config.ts`, the env-less
static build guarantee, and the no-partisan-signal rule everywhere.
