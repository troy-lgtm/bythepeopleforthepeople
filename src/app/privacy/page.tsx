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
            as="h1"
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
            <strong>Watchlist (browser first):</strong> the records you mark
            to watch are stored in your browser&apos;s localStorage under{" "}
            <code>btpftp-watchlist</code>. They stay on your device unless you
            subscribe to the email digest, which saves a copy of your ZIP and
            causes server-side so the digest can be personalized (see below).
          </li>
          <li>
            <strong>Correction submissions:</strong> if you submit a correction
            with an optional email, we store the email server-side only to
            notify you when the fix lands. Never sold, never shared.
          </li>
          <li>
            <strong>Email subscriptions (opt-in):</strong> if you subscribe to
            the digest, we store your email, your chosen cadence (daily or
            weekly), a snapshot of your ZIP and causes so the digest can be
            personalized, and the name of the surface you arrived from (for
            example &ldquo;receipt&rdquo; or &ldquo;digest&rdquo;). Stored in
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
          Two things count traffic here. Both are aggregate-only: neither
          assigns you an identifier, sets an analytics cookie, or records the
          path you personally took through the site.
        </p>
        <ul className="mt-3 grid list-disc gap-2 pl-5">
          <li>
            <strong>Vercel Web Analytics:</strong> page-view counts, served
            first-party from this domain (<code>/_vercel/insights</code>) by
            our host. Cookieless, no persistent visitor id, no cross-site
            tracking, no data sold or shared for advertising.
          </li>
          <li>
            <strong>Referral counter (ours):</strong> when you arrive on a
            link tagged <code>?ref=receipt</code>, <code>?ref=digest</code>,{" "}
            <code>?ref=embed</code> and the like, we add <em>one</em> to a
            daily tally for that surface, for example &ldquo;receipt: 24
            visits on 2026-07-25.&rdquo; We store the tag and the date. We do
            not store your IP, your user agent, a visitor id, or which page
            you landed on. If you later subscribe in the same browser session,
            we save that same surface name on your subscription so we can tell
            which surfaces bring people in; it is a surface name, never
            anything about you.
          </li>
        </ul>
        <p className="mt-3">
          Plausible remains supported as an alternative and stays dormant
          unless <code>NEXT_PUBLIC_PLAUSIBLE_DOMAIN</code> is set.
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
          one on a correction submission, and your email plus your cadence
          (daily or weekly) and a ZIP/causes snapshot if you subscribed to the
          digest. Unsubscribe from
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
