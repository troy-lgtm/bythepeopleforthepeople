import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Lock,
  Rocket,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { OperatorOptOut } from "@/components/OperatorOptOut";
import { PageShell } from "@/components/PageShell";
import { adminSecretConfigured, isValidAdminKey } from "@/lib/admin-auth";
import { countDigestLog, listDigestLog } from "@/lib/digest-log";
import { emailConfigured } from "@/lib/email";
import { buildGrowthDigest } from "@/lib/growth-digest";
import { listGrowthDigestRuns } from "@/lib/growth-digest-delivery";
import { getGrowthMetrics } from "@/lib/growth-metrics";
import {
  launchBlockers,
  launchFlags,
  modeLabel,
  publicLaunchUnlocked,
} from "@/lib/launch-mode";
import {
  checklistReady,
  runLaunchChecklist,
} from "@/lib/launch-checklist";
import { getLaunchState } from "@/lib/launch-state";
import { lastDetectionRun, movementCounts } from "@/lib/movement-store";
import {
  countBlockedNotifications,
  listBlockedNotifications,
} from "@/lib/notification-guard";
import { refKindLabel } from "@/lib/ref-tags";
import { storeMode } from "@/lib/store";
import { listAll } from "@/lib/subscribers";
import {
  getVisitorReport,
  trendPct,
  vercelAnalyticsConfigured,
} from "@/lib/vercel-analytics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Launch Center",
  robots: { index: false, follow: false },
};

type AdminPageProps = {
  searchParams: Promise<{ key?: string; notice?: string; tone?: string }>;
};

function StatusChip({ ok, label }: { ok: boolean | null; label: string }) {
  return (
    <span
      className={
        ok === null
          ? "inline-flex items-center gap-1 rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 text-xs font-semibold text-ink-700"
          : ok
            ? "inline-flex items-center gap-1 rounded-full border border-civic-100 bg-civic-50 px-2.5 py-1 text-xs font-semibold text-civic-700"
            : "inline-flex items-center gap-1 rounded-full border border-notice-100 bg-notice-50 px-2.5 py-1 text-xs font-semibold text-notice-500"
      }
    >
      {label}
    </span>
  );
}

/**
 * The Launch Center: private-mode proof, live counts, the readiness
 * checklist, and the launch controls. Requires ADMIN_LAUNCH_SECRET via
 * ?key=. None of the buttons here message the public; the only button that
 * could ever change that is triple-gated by env flags and stays locked.
 */
export default async function LaunchCenterPage({
  searchParams,
}: AdminPageProps) {
  const { key, notice, tone } = await searchParams;

  if (!adminSecretConfigured()) {
    return (
      <PageShell>
        <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <Lock className="h-8 w-8 text-ink-600" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold text-ink-950">
            Launch Center is locked.
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-700">
            Set the <code className="rounded bg-paper-50 px-1.5 py-0.5 font-mono text-xs">ADMIN_LAUNCH_SECRET</code>{" "}
            environment variable, then open{" "}
            <code className="rounded bg-paper-50 px-1.5 py-0.5 font-mono text-xs">/admin/launch?key=YOUR_SECRET</code>.
            With no secret configured this page stays closed on purpose.
          </p>
        </section>
      </PageShell>
    );
  }

  if (!isValidAdminKey(key)) {
    return (
      <PageShell>
        <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <Lock className="h-8 w-8 text-ink-600" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold text-ink-950">
            Admin key required.
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-700">
            Open this page as{" "}
            <code className="rounded bg-paper-50 px-1.5 py-0.5 font-mono text-xs">/admin/launch?key=YOUR_SECRET</code>{" "}
            using the value of ADMIN_LAUNCH_SECRET.
          </p>
        </section>
      </PageShell>
    );
  }

  const flags = launchFlags();
  const mode = modeLabel(flags);
  const state = await getLaunchState();
  const checks = await runLaunchChecklist();
  const ready = checklistReady(checks);
  const unlocked = publicLaunchUnlocked(flags);
  const blockers = launchBlockers(flags);
  const counts = await movementCounts();
  const run = await lastDetectionRun();
  const subs = await listAll();
  const blockedCount = await countBlockedNotifications();
  const blocked = await listBlockedNotifications(5);
  const digestEntries = await listDigestLog(5);
  const digestTotal = await countDigestLog();
  const growth = await getGrowthMetrics(14);
  const visitors = await getVisitorReport(7);
  const week = await buildGrowthDigest({ periodDays: 7, flags, visitors });
  const digestRuns = await listGrowthDigestRuns(3);
  const lastDigestRun = digestRuns[0] ?? null;
  const visitorTrend =
    visitors.status === "ok" && visitors.totals
      ? trendPct(visitors.totals.pageviews, visitors.previous?.pageviews)
      : null;
  const failCount = checks.filter(
    (c) => c.required && c.status === "fail",
  ).length;

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-civic-700" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight text-ink-950">
              Launch Center
            </h1>
            <StatusChip
              ok={mode === "private-test" ? true : mode === "partial" ? false : null}
              label={
                mode === "private-test"
                  ? "PRIVATE TEST MODE"
                  : mode === "launch-unlocked"
                    ? "LAUNCH UNLOCKED"
                    : "PARTIAL FLAGS — REVIEW ENV"
              }
            />
            <StatusChip
              ok={null}
              label={`Launch state: ${state.mode}`}
            />
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-700">
            Test user: <strong>{flags.testUserEmail}</strong>. While private
            test mode is on, the notification guard blocks every other
            recipient in code and logs the attempt.
          </p>
          {notice ? (
            <p
              className={
                tone === "bad"
                  ? "mt-4 rounded-md border border-notice-100 bg-notice-50 px-3 py-2 text-sm font-semibold text-notice-500"
                  : "mt-4 rounded-md border border-civic-100 bg-civic-50 px-3 py-2 text-sm font-semibold text-civic-700"
              }
            >
              {notice}
            </p>
          ) : null}
        </div>
      </section>

      {/* Status grid */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-600">
          System status
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: "Mode flags",
              value: `PRIVATE_TEST_MODE=${flags.privateTestMode} · GROWTH_LAUNCH_ENABLED=${flags.growthLaunchEnabled} · ALLOW_PUBLIC_DIGESTS=${flags.allowPublicDigests} · ALLOW_NON_TEST_EMAILS=${flags.allowNonTestEmails}`,
            },
            {
              label: "Email provider",
              value: emailConfigured()
                ? "Resend configured"
                : "Not configured (preview works; delivery needs RESEND_API_KEY)",
            },
            {
              label: "Store",
              value:
                storeMode() === "redis"
                  ? "Upstash Redis (durable)"
                  : "In-memory fallback (ephemeral, dev only)",
            },
            {
              label: "Last movement detection",
              value: run
                ? `${run.ranAt.slice(0, 16)} · ${run.recordsChecked} records · ${run.newEvents} new events${
                    run.liveConfigured
                      ? ` · live: ${run.liveTracked ?? 0} tracked, ${run.liveDiscovered ?? 0} discovered`
                      : run.liveConfigured === false
                        ? " · live ingest off (OPENSTATES_API_KEY unset)"
                        : ""
                  }`
                : "Never run",
            },
            {
              label: "Movement events",
              value: `${counts.total} total · ${counts.digestWorthy} digest-worthy · ${counts.detected} detected live`,
            },
            {
              label: "Watchlists",
              value: `${subs.length} subscriber${subs.length === 1 ? "" : "s"} (${subs.filter((s) => s.confirmed).length} confirmed)`,
            },
            {
              label: "Digest log",
              value: digestTotal
                ? `${digestTotal} entries · latest: ${digestEntries[0]?.status} to ${digestEntries[0]?.email} (${digestEntries[0]?.at.slice(0, 16)})`
                : "No digests logged yet",
            },
            {
              label: "Blocked notifications",
              value: `${blockedCount} blocked attempts logged`,
            },
            {
              label: "Visitor counting",
              value:
                visitors.status === "ok"
                  ? "Connected: Vercel Web Analytics is on and readable"
                  : visitors.status === "not_enabled"
                    ? "OFF in Vercel: page views are being discarded (see Visitors below)"
                    : visitors.status === "not_configured"
                      ? "Not connected: no VERCEL_ANALYTICS_TOKEN (see Visitors below)"
                      : "Error reading Vercel (see Visitors below)",
            },
            {
              label: "Growth digest",
              value: lastDigestRun
                ? `Last sent ${lastDigestRun.at.slice(0, 16)} (${lastDigestRun.trigger}) · Slack ${lastDigestRun.slack.status} · email ${lastDigestRun.email.status}`
                : "Never sent. Runs every Monday 14:00 UTC once CRON_SECRET is set; or press the button below.",
            },
            {
              label: "Distribution surfaces",
              value:
                "sitemap.xml + sitemap-movement.xml · llms.txt · /.well-known/civic-records.json · /api/civic-records/* · /og/receipt",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-record-200 bg-white p-4"
            >
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-600">
                {item.label}
              </dt>
              <dd className="mt-1.5 text-sm leading-6 text-ink-950">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        {blocked.length > 0 ? (
          <details className="mt-4 rounded-lg border border-record-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink-950">
              Recent blocked attempts ({blockedCount})
            </summary>
            <ul className="mt-3 grid gap-2 text-xs text-ink-700">
              {blocked.map((b, i) => (
                <li key={i} className="rounded border border-record-200 bg-paper-50 px-3 py-2 font-mono">
                  {b.createdAt.slice(0, 19)} · {b.channel} · {b.recipient} · {b.reason}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      {/* Visitors: did anyone come? */}
      <section className="mx-auto max-w-5xl px-4 pb-8 sm:px-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink-600">
          <Users className="h-4 w-4" aria-hidden="true" />
          Visitors (last 7 days)
        </h2>
        <p className="mt-1 text-sm text-ink-700">
          Real people, counted by Vercel Web Analytics with bots filtered
          out. Page views and top pages, never a visitor id.
        </p>
        <div className="mt-3 rounded-lg border border-record-200 bg-white p-5">
          <p className="text-base font-semibold leading-7 text-ink-950">
            {week.headline}
          </p>

          {visitors.status === "ok" && visitors.totals ? (
            <>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-record-200 bg-paper-50 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-600">Page views</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink-950">
                    {visitors.totals.pageviews}
                  </dd>
                  <dd className="text-xs text-ink-700">
                    {visitors.previous
                      ? `${visitors.previous.pageviews} the 7 days before${
                          visitorTrend === null ? "" : ` (${visitorTrend >= 0 ? "+" : ""}${visitorTrend}%)`
                        }`
                      : "no earlier window yet"}
                  </dd>
                </div>
                <div className="rounded-md border border-record-200 bg-paper-50 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-600">Visitors</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink-950">
                    {visitors.totals.visitors}
                  </dd>
                  <dd className="text-xs text-ink-700">
                    daily uniques added up, so a ceiling
                  </dd>
                </div>
                <div className="rounded-md border border-record-200 bg-paper-50 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-600">Actions taken</dt>
                  <dd className="mt-1 text-sm leading-6 text-ink-950">
                    {visitors.events.length
                      ? visitors.events.map((e) => `${e.name} ${e.count}`).join(" · ")
                      : "none recorded (share, subscribe, cause created)"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-600">Most read</h3>
                  {visitors.topPages.length ? (
                    <ul className="mt-2 grid gap-1 text-sm">
                      {visitors.topPages.map((p) => (
                        <li key={p.path} className="flex justify-between gap-3">
                          <span className="truncate font-mono text-xs text-ink-950">{p.path}</span>
                          <span className="shrink-0 tabular-nums text-ink-700">{p.pageviews}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-ink-700">Nothing yet.</p>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-600">Came from</h3>
                  {visitors.topReferrers.length ? (
                    <ul className="mt-2 grid gap-1 text-sm">
                      {visitors.topReferrers.map((r) => (
                        <li key={r.host} className="flex justify-between gap-3">
                          <span className="truncate text-ink-950">{r.host || "typed the address / no referrer"}</span>
                          <span className="shrink-0 tabular-nums text-ink-700">{r.pageviews}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-ink-700">Nothing yet.</p>
                  )}
                  {visitors.topCountries.length ? (
                    <p className="mt-2 text-xs text-ink-700">
                      Countries: {visitors.topCountries.map((c) => `${c.country} ${c.pageviews}`).join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-md border border-notice-100 bg-notice-50 p-4 text-sm leading-6 text-ink-950">
              <p className="font-semibold">
                {visitors.status === "not_enabled"
                  ? "Page views are being thrown away right now."
                  : visitors.status === "not_configured"
                    ? "This page cannot read the visitor numbers yet."
                    : "Vercel could not be read."}
              </p>
              <p className="mt-1">{visitors.message}</p>
              {visitors.status !== "error" ? (
                <ol className="mt-2 list-decimal pl-5">
                  {visitors.status === "not_enabled" || !vercelAnalyticsConfigured() ? (
                    <li>
                      In Vercel open this project, then the <strong>Analytics</strong> tab,
                      and press <strong>Enable</strong>. From that moment real page views
                      are kept. No code change needed.
                    </li>
                  ) : null}
                  {!vercelAnalyticsConfigured() ? (
                    <li>
                      Create an access token at vercel.com/account/tokens (scope: this
                      team) and add it to the deployment environment as{" "}
                      <code className="text-xs">VERCEL_ANALYTICS_TOKEN</code>, with{" "}
                      <code className="text-xs">VERCEL_TEAM_ID</code> and{" "}
                      <code className="text-xs">VERCEL_PROJECT_ID</code> (both under the
                      project&apos;s Settings, General). Redeploy. Then this panel and
                      the Monday growth digest fill in by themselves.
                    </li>
                  ) : null}
                </ol>
              ) : null}
            </div>
          )}

          <div className="mt-5 border-t border-record-200 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-600">
              Keep your own visits out
            </h3>
            <div className="mt-2">
              <OperatorOptOut />
            </div>
          </div>
        </div>
      </section>

      {/* Growth signals */}
      <section className="mx-auto max-w-5xl px-4 pb-8 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-600">
          Growth signals (last {growth.days} days)
        </h2>
        <p className="mt-1 text-sm text-ink-700">
          Our own counters: which tagged link people click, and which surface
          turns a reader into a watcher. Anonymous daily counts only: no
          visitor ids, no cookies, no paths. Known crawlers are not counted;
          an unknown one still could be, so treat these as ceilings.{" "}
          {growth.durable
            ? null
            : "Counters are in the ephemeral in-memory store, so they reset on redeploy."}
        </p>
        <p className="mt-2 text-sm font-semibold text-ink-950">
          {growth.inbound.visits} clicks arrived from outside the site ·{" "}
          {growth.internal.visits} clicks moved between our own pages ·{" "}
          {growth.totals.subscribes} subscribes · {growth.totals.confirms} confirmed
        </p>
        {growth.totals.visits === 0 && growth.totals.subscribes === 0 ? (
          <p className="mt-3 rounded-lg border border-record-200 bg-white p-4 text-sm leading-6 text-ink-700">
            No referral-tagged traffic counted yet. Tagged links
            (<code className="text-xs">?ref=receipt</code>,{" "}
            <code className="text-xs">?ref=digest</code>,{" "}
            <code className="text-xs">?ref=embed</code>) start filling this in
            as soon as they are clicked.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-record-200 bg-white">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-record-200 text-left text-xs uppercase tracking-[0.1em] text-ink-600">
                  <th scope="col" className="px-4 py-2.5 font-semibold">Surface</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">What a click means</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Clicks</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Subscribes</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Confirmed</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {growth.byRef.map((row) => (
                  <tr key={row.ref} className="border-b border-record-200 last:border-0">
                    <td className="px-4 py-2.5 font-semibold text-ink-950">{row.ref}</td>
                    <td className="px-4 py-2.5 text-ink-700">{refKindLabel(row.kind)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-ink-700">{row.visits}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-ink-700">{row.subscribes}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-ink-700">{row.confirms}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-ink-700">
                      {row.conversionPct === null ? (
                        <span className="text-ink-600">no visits yet</span>
                      ) : (
                        `${row.conversionPct}%`
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="bg-paper-50 font-semibold text-ink-950">
                  <td className="px-4 py-2.5">All surfaces</td>
                  <td className="px-4 py-2.5"></td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{growth.totals.visits}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{growth.totals.subscribes}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{growth.totals.confirms}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {growth.totals.visits > 0
                      ? `${Math.round((growth.totals.subscribes / growth.totals.visits) * 1000) / 10}%`
                      : "no visits yet"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-ink-600">
          Raw JSON:{" "}
          <code className="text-xs">/api/events?key=ADMIN_KEY&amp;days=30</code>.
          Real page views are in the Visitors panel above.
        </p>
      </section>

      {/* Checklist */}
      <section className="mx-auto max-w-5xl px-4 pb-8 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-600">
          Launch checklist
        </h2>
        <p className="mt-1 text-sm text-ink-700">
          {ready
            ? "All required checks pass."
            : `${failCount} required check${failCount === 1 ? "" : "s"} failing.`}
        </p>
        <ul className="mt-3 grid gap-2">
          {checks.map((c) => (
            <li
              key={c.id}
              className="flex items-start gap-3 rounded-lg border border-record-200 bg-white p-3.5"
            >
              {c.status === "pass" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-civic-700" aria-hidden="true" />
              ) : c.status === "warn" ? (
                <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-ink-600" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-notice-500" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-950">
                  {c.label}
                  {!c.required ? (
                    <span className="ml-2 text-xs font-medium text-ink-600">
                      (advisory)
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-ink-700">
                  {c.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Actions */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-600">
          Actions
        </h2>
        <div className="mt-3 grid gap-4">
          <div className="rounded-lg border border-record-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950">
              <CircleDashed className="h-4 w-4 text-civic-700" aria-hidden="true" />
              Run movement detection now
            </h3>
            <p className="mt-1 text-sm leading-6 text-ink-700">
              Snapshots every record (curated plus the live Open States
              connector), diffs against stored versions, and persists any new
              movement. Detection only; sends nothing.
            </p>
            <form method="POST" action="/api/admin/launch/run-detection" className="mt-3">
              <input type="hidden" name="key" value={key} />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-5 text-sm font-semibold text-ink-950 hover:border-civic-500"
              >
                Run detection
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-record-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950">
              <CheckCircle2 className="h-4 w-4 text-civic-700" aria-hidden="true" />
              Seed the test user watchlist
            </h3>
            <p className="mt-1 text-sm leading-6 text-ink-700">
              Creates or refreshes the persistent watchlist for{" "}
              {flags.testUserEmail} (ZIP 90046; homelessness, housing, fires,
              crime, land use) against this deployment&apos;s store, marked
              confirmed. Sends nothing.
            </p>
            <form method="POST" action="/api/admin/launch/seed-test-user" className="mt-3">
              <input type="hidden" name="key" value={key} />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-5 text-sm font-semibold text-ink-950 hover:border-civic-500"
              >
                Seed test user
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-record-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950">
              <Send className="h-4 w-4 text-civic-700" aria-hidden="true" />
              Send test digest to {flags.testUserEmail}
            </h3>
            <p className="mt-1 text-sm leading-6 text-ink-700">
              Builds the movement digest for the test user and sends it
              through the guarded email path.{" "}
              {emailConfigured()
                ? "Resend is configured, so this delivers for real."
                : "RESEND_API_KEY is not set, so this records a preview instead of delivering."}
            </p>
            <form method="POST" action="/api/admin/launch/send-test-digest" className="mt-3">
              <input type="hidden" name="key" value={key} />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink-950 px-5 text-sm font-semibold text-white hover:bg-ink-800"
              >
                Send test digest
              </button>
            </form>
            <p className="mt-2 text-xs text-ink-600">
              Preview without sending:{" "}
              <Link
                href="/api/digest/preview?format=html"
                className="font-semibold text-civic-700"
              >
                /api/digest/preview?format=html
              </Link>
            </p>
          </div>

          <div className="rounded-lg border border-record-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950">
              <Users className="h-4 w-4 text-civic-700" aria-hidden="true" />
              Send the growth digest now
            </h3>
            <p className="mt-1 text-sm leading-6 text-ink-700">
              The Monday message that answers &ldquo;did anyone come?&rdquo;:
              visitors, arrivals, demand, and whether the loop ran. Goes to{" "}
              {flags.operatorWebhookUrl
                ? "your Slack webhook and "
                : "Slack once GROWTH_DIGEST_WEBHOOK_URL is set, and to "}
              {flags.testUserEmail} by email
              {emailConfigured() ? "" : " (email delivery needs RESEND_API_KEY)"}.
              Aggregate numbers only; it never includes a subscriber address.
            </p>
            <form method="POST" action="/api/admin/launch/send-growth-digest" className="mt-3">
              <input type="hidden" name="key" value={key} />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-5 text-sm font-semibold text-ink-950 hover:border-civic-500"
              >
                Send growth digest
              </button>
            </form>
            <p className="mt-2 text-xs text-ink-600">
              Read it first without sending:{" "}
              <Link
                href={`/api/admin/launch/growth-digest-preview?key=${encodeURIComponent(key ?? "")}`}
                className="font-semibold text-civic-700"
              >
                plain text
              </Link>{" "}
              or{" "}
              <Link
                href={`/api/admin/launch/growth-digest-preview?key=${encodeURIComponent(key ?? "")}&format=html`}
                className="font-semibold text-civic-700"
              >
                the email
              </Link>
              .
            </p>
          </div>

          <div className="rounded-lg border border-record-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950">
              <CheckCircle2 className="h-4 w-4 text-civic-700" aria-hidden="true" />
              Mark growth launch ready
            </h3>
            <p className="mt-1 text-sm leading-6 text-ink-700">
              Records that the product passed internal readiness. Updates
              launch state only — it does not email anyone and does not open
              public signups.
            </p>
            <form method="POST" action="/api/admin/launch/mark-ready" className="mt-3">
              <input type="hidden" name="key" value={key} />
              <button
                type="submit"
                disabled={!ready}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-civic-700 px-5 text-sm font-semibold text-white hover:bg-civic-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mark growth launch ready
              </button>
            </form>
            {!ready ? (
              <p className="mt-2 text-xs text-notice-500">
                Locked until every required check above passes.
              </p>
            ) : null}
            {state.growthLaunchReadyAt ? (
              <p className="mt-2 text-xs text-civic-700">
                Marked ready at {state.growthLaunchReadyAt}.
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border-2 border-dashed border-record-200 bg-paper-50 p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950">
              <Rocket className="h-4 w-4 text-ink-600" aria-hidden="true" />
              Begin public organic launch
            </h3>
            <p className="mt-1 text-sm leading-6 text-ink-700">
              The future button. It flips launch state to &ldquo;launched&rdquo;
              so the public growth surfaces activate. It still never emails
              anyone by itself — public digests start only when real people
              subscribe and confirm.
            </p>
            <form method="POST" action="/api/admin/launch/begin-public" className="mt-3">
              <input type="hidden" name="key" value={key} />
              <button
                type="submit"
                disabled={!unlocked || !ready}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Begin public organic launch
              </button>
            </form>
            {!unlocked || !ready ? (
              <div className="mt-3 rounded-md border border-record-200 bg-white p-3 text-xs leading-5 text-ink-700">
                <p className="font-semibold text-ink-950">
                  Locked. Exactly what is preventing launch:
                </p>
                <ul className="mt-1.5 list-disc pl-4">
                  {blockers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                  {!ready ? (
                    <li>
                      {failCount} required checklist check
                      {failCount === 1 ? "" : "s"} failing above
                    </li>
                  ) : null}
                </ul>
                <p className="mt-1.5">
                  All four env vars change in the deployment environment, not
                  here. That is deliberate: launching requires a deploy-level
                  decision, never one click.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
