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
