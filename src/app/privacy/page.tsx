import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What we collect, what we do not collect, and where the data lives.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Privacy"
            title="What we collect, what we never collect."
            description="A civic-trust product cannot survive surveillance practices. This is what we do and what we will not do."
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 text-sm leading-7 text-ink-800 sm:px-6 lg:px-8">
        <h2 className="mt-2 text-lg font-semibold text-ink-950">What we store</h2>
        <ul className="mt-3 grid list-disc gap-2 pl-5">
          <li>
            <strong>Place cookie</strong> (<code>btpftp-place</code>): your ZIP
            and the derived state, congressional district, city, county, and
            council district. First-party, lax SameSite, set when you click
            Set your place. You can clear it any time from the place picker.
          </li>
          <li>
            <strong>Watchlist (browser only):</strong> the records you mark to
            watch are stored in your browser&apos;s localStorage under{" "}
            <code>btpftp-watchlist</code>. Never transmitted unless you opt
            into server-side sync (not yet enabled).
          </li>
          <li>
            <strong>Correction submissions:</strong> if you submit a correction
            with an optional email, we store the email server-side only to
            notify you when the fix lands. Never sold, never shared.
          </li>
          <li>
            <strong>Email subscriptions (opt-in):</strong> if you subscribe to
            the digest, we store your email, your chosen cadence, and a snapshot
            of your ZIP and causes so the digest can be personalized. Stored in
            a managed Redis store, used only to send the digest you asked for.
            Double opt-in: nothing is sent until you click the confirmation
            link. One-click unsubscribe in every email deletes all of it. Never
            sold, never shared.
          </li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-ink-950">What we do not store</h2>
        <ul className="mt-3 grid list-disc gap-2 pl-5">
          <li>No third-party advertising trackers.</li>
          <li>No fingerprinting libraries.</li>
          <li>No social-media login pixels.</li>
          <li>No session recording, no heatmaps, no mouse tracking.</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-ink-950">Analytics</h2>
        <p className="mt-3">
          When analytics are enabled, we use privacy-respecting tooling (e.g.
          Plausible) that does not set cookies, does not fingerprint, and
          aggregates traffic at the page level. Per-user paths are not
          retained. The <code>PLAUSIBLE_DOMAIN</code> env var, if set, enables
          this; absent that, no analytics fire.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-ink-950">Data residency</h2>
        <p className="mt-3">
          The site is hosted on Vercel. Server-side requests run in the
          closest Vercel edge region to your browser. Source records and
          indexed metadata are public; user-specific state lives only in your
          browser plus the optional correction-submission server queue.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-ink-950">Requests, deletion, contact</h2>
        <p className="mt-3">
          Email <a href="mailto:privacy@bythepeopleforthepeople.com" className="text-civic-700 underline">privacy@bythepeopleforthepeople.com</a> with any
          request to delete a correction submission you sent, or to ask what
          we know about you. Default position: we know your ZIP if you set it
          (visible to you in your own browser), an optional email if you gave
          one on a correction submission, and your email plus cadence and a
          ZIP/causes snapshot if you subscribed to the digest. Unsubscribe from
          any digest email to erase the subscription record entirely.
        </p>

        <p className="mt-8 text-xs text-ink-600">
          Last updated 2026-06-02. Material changes will be logged in the{" "}
          <a href="/corrections" className="text-civic-700 underline">
            corrections log
          </a>
          .
        </p>
      </section>
    </PageShell>
  );
}
