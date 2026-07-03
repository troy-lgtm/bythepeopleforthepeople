import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, CheckCircle2, MailX, MapPin } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { getSubscriberByToken } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage your watchlist",
  description: "Review and manage your saved watchlist and digest delivery.",
  robots: { index: false, follow: false },
};

/**
 * Tokened management page for the persistent (email) watchlist. The token is
 * the same capability token used for confirm/unsubscribe links, so the page
 * works straight from any digest email with no account system.
 */
export default async function ManageWatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const sub = token ? await getSubscriberByToken(token) : null;

  if (!sub) {
    return (
      <PageShell>
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <SectionHeader
            as="h1"
            eyebrow="Watchlist"
            title="We could not find that watchlist."
            description="The manage link may be incomplete or the subscription may have been removed. Subscribing again takes under a minute."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/digest"
              className="inline-flex h-11 items-center justify-center rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
            >
              Subscribe to the digest
            </Link>
            <Link
              href="/watchlist"
              className="inline-flex h-11 items-center justify-center rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-950 hover:border-civic-500"
            >
              Open the browser watchlist
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  const unsubscribeUrl = `/api/unsubscribe?token=${encodeURIComponent(sub.token)}`;
  const causes = sub.causes ?? [];

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <SectionHeader
            as="h1"
            eyebrow="Your watchlist"
            title="What we watch for you."
            description={`Delivery to ${sub.email}. We email you when official records move on your causes. Nothing else.`}
          />
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            <span
              className={
                sub.confirmed
                  ? "inline-flex items-center gap-1 rounded-full border border-civic-100 bg-civic-50 px-3 py-1 text-civic-700"
                  : "inline-flex items-center gap-1 rounded-full border border-notice-100 bg-notice-50 px-3 py-1 text-notice-500"
              }
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {sub.confirmed
                ? "Confirmed (double opt-in complete)"
                : "Pending: confirm from your email to start delivery"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-record-200 bg-paper-50 px-3 py-1 capitalize text-ink-700">
              <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
              {sub.cadence} digest
            </span>
            {sub.zip ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-record-200 bg-paper-50 px-3 py-1 text-ink-700">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                ZIP {sub.zip}
              </span>
            ) : null}
            {sub.isTestUser ? (
              <span className="inline-flex items-center rounded-full border border-record-200 bg-paper-50 px-3 py-1 text-ink-700">
                Private test user
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-600">
          Causes on this watchlist
        </h2>
        {causes.length === 0 ? (
          <p className="mt-3 rounded-lg border border-record-200 bg-white p-4 text-sm leading-6 text-ink-700">
            No causes saved yet. Pick causes on the site, then subscribe again
            from the same browser and they ride along automatically.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {causes.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-record-200 bg-white p-4"
              >
                <p className="text-sm font-semibold text-ink-950">{c.title}</p>
                <p className="mt-1 text-sm leading-6 text-ink-700">
                  {c.outcome}
                </p>
                <Link
                  href={`/causes/${encodeURIComponent(c.id)}`}
                  className="mt-2 inline-flex text-sm font-semibold text-civic-700 hover:underline"
                >
                  Open cause page
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 grid gap-3 text-sm text-ink-700">
          {sub.lastSentAt ? (
            <p>
              Last digest sent:{" "}
              {new Date(sub.lastSentAt).toUTCString().replace(" GMT", " UTC")}.
            </p>
          ) : (
            <p>No digest has been sent to this address yet.</p>
          )}
          <p>
            Watching since{" "}
            {new Date(sub.createdAt).toUTCString().replace(" GMT", " UTC")}.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/what-moved"
            className="inline-flex h-11 items-center justify-center rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
          >
            See what moved
          </Link>
          <a
            href={unsubscribeUrl}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-950 hover:border-notice-100 hover:text-notice-500"
          >
            <MailX className="h-4 w-4" aria-hidden="true" />
            Unsubscribe
          </a>
        </div>
        <p className="mt-4 text-xs leading-5 text-ink-600">
          Unsubscribing removes this email and its watchlist immediately. We
          keep nothing after that.{" "}
          <Link href="/methodology" className="font-semibold text-civic-700">
            Methodology
          </Link>
        </p>
      </section>
    </PageShell>
  );
}
