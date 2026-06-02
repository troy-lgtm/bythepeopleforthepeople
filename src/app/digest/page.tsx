import type { Metadata } from "next";
import { Mail, Send, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { buildDigest, renderDigestHtml } from "@/lib/digest";
import { readPlace } from "@/lib/place";
import { readWatchlist } from "@/lib/watchlist";

export const metadata: Metadata = {
  title: "Digest preview",
  description: "Preview the email digest that delivers source-anchored civic updates.",
  alternates: { canonical: "/digest" },
};

const BASE = "https://bythepeopleforthepeople.com";

export default async function DigestPage() {
  const place = await readPlace();
  const watchedIds = await readWatchlist();
  const payload = buildDigest({ zip: place?.zip, watchedIds });
  const html = renderDigestHtml(payload, BASE);
  const itemCount =
    payload.recentChanges.length +
    payload.upcomingMilestones.length +
    payload.watchedTargets.length;

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Digest preview"
            title="The return loop. Source-anchored, delivered."
            description="Watchlists become useful only when they deliver. This page renders the exact digest the system will send once an email provider is configured."
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Items in this digest" value={String(itemCount)} />
            <Stat label="Watch targets" value={String(payload.watchedTargets.length)} />
            <Stat label="Missing-data callouts" value={String(payload.missing.length)} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="grid content-start gap-4">
          <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
                  Delivery setup
                </p>
                <h2 className="mt-1 text-lg font-semibold text-ink-950">
                  Add credentials to start sending.
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-700">
                  The renderer and content engine are live. Plug an email
                  provider into the listed env vars to enable delivery.
                </p>
              </div>
            </div>
            <ul className="mt-5 grid gap-2 text-sm">
              <li className="rounded-md border border-record-200 bg-paper-50 p-3 font-mono text-xs text-ink-800">
                RESEND_API_KEY=re_...
              </li>
              <li className="rounded-md border border-record-200 bg-paper-50 p-3 font-mono text-xs text-ink-800">
                DIGEST_FROM_ADDRESS=digest@bythepeopleforthepeople.com
              </li>
              <li className="rounded-md border border-record-200 bg-paper-50 p-3 font-mono text-xs text-ink-800">
                DIGEST_SEND_SECRET=...
              </li>
            </ul>
            <p className="mt-4 text-xs leading-5 text-ink-600">
              Once set, the send-stub at `/api/digest/send` (to be added) will
              accept POST requests authenticated by `DIGEST_SEND_SECRET` and
              dispatch this HTML through Resend.
            </p>
          </section>

          <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
                <Send className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
                  Cron
                </p>
                <h2 className="mt-1 text-lg font-semibold text-ink-950">
                  Send cadence
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-700">
                  Default schedule: daily for items tagged urgency `Now`,
                  weekly digest every Monday for everyone else. Configurable per
                  subscriber when accounts ship.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
                  Methodology
                </p>
                <h2 className="mt-1 text-lg font-semibold text-ink-950">
                  Every digest item links back to a source.
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-700">
                  Headlines, counts, and dates in the digest must trace to an
                  indexed source record. The renderer attaches official-source
                  links inline.
                </p>
              </div>
            </div>
          </section>
        </div>

        <article className="overflow-hidden rounded-lg border border-record-200 bg-paper-100 p-3 shadow-line">
          <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">
            Email preview
          </p>
          <iframe
            srcDoc={html}
            title="Digest preview"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            className="h-[1100px] w-full rounded-md border border-record-200 bg-white"
          />
        </article>
      </section>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-record-200 bg-paper-50 p-4">
      <p className="font-mono text-2xl font-semibold text-ink-950">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
        {label}
      </p>
    </div>
  );
}
