import type { Metadata } from "next";
import { Mail, Send, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { SubscribeForm } from "@/components/SubscribeForm";
import { readCauses } from "@/lib/causes";
import { buildDigest, renderDigestHtml } from "@/lib/digest";
import { readPlace } from "@/lib/place";
import { readWatchlist } from "@/lib/watchlist";

export const metadata: Metadata = {
  title: "Get civic updates by email",
  description:
    "Subscribe to source-anchored email updates on the records, reps, and causes you follow.",
  alternates: { canonical: "/digest" },
};

const BASE = "https://bythepeopleforthepeople.com";

export default async function DigestPage() {
  const place = await readPlace();
  const watchedIds = await readWatchlist();
  const causes = await readCauses();
  const payload = buildDigest({ zip: place?.zip, watchedIds, causes });
  const html = renderDigestHtml(payload, BASE);
  const itemCount =
    payload.recentChanges.length +
    payload.upcomingMilestones.length +
    payload.watchedTargets.length;

  return (
    <PageShell>
      {/* Public: subscribe first, with a sample of what lands */}
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-start lg:px-8">
          <div>
            <SectionHeader
              eyebrow="Email updates"
              title="Get civic updates, delivered."
              description="Pick a cadence and we email you source-anchored updates on the records, reps, and causes you follow. Confirm by email; unsubscribe in one tap. We never sell or share your address."
            />
            <div className="mt-6">
              <SubscribeForm />
            </div>
          </div>
          <article className="overflow-hidden rounded-lg border border-record-200 bg-paper-100 p-3 shadow-line">
            <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">
              A sample of what lands
            </p>
            <iframe
              srcDoc={html}
              title="Digest sample"
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              className="h-[60vh] w-full rounded-md border border-record-200 bg-white sm:h-[760px]"
            />
          </article>
        </div>
      </section>

      {/* Operator / setup — secondary, transparency only */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="Under the hood."
          description="Transparency for operators and the technically curious — none of this is required to subscribe."
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Items in a current digest" value={String(itemCount)} />
          <Stat label="Watch targets tracked" value={String(payload.watchedTargets.length)} />
          <Stat label="Missing-data callouts" value={String(payload.missing.length)} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              Delivery
            </p>
            <h2 className="mt-1 text-lg font-semibold text-ink-950">
              Sent through Resend.
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              The send endpoint at{" "}
              <span className="font-mono">/api/digest/send</span> is live;
              delivery turns on once the email provider keys are set in the
              environment. Double opt-in, one-click unsubscribe.
            </p>
          </section>

          <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
              <Send className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              Cadence
            </p>
            <h2 className="mt-1 text-lg font-semibold text-ink-950">
              Weekly or daily.
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              Weekly sends Monday; daily sends each day there is movement on
              what you follow. A cron handles it; same-day dedupe prevents
              double-sends.
            </p>
          </section>

          <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              Methodology
            </p>
            <h2 className="mt-1 text-lg font-semibold text-ink-950">
              Every line links to a source.
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              Headlines, counts, and dates must trace to an indexed source
              record. The renderer attaches official-source links inline.
            </p>
          </section>
        </div>
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
