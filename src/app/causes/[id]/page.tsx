import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Mail,
  MessageCircle,
  Pencil,
  Share2,
} from "lucide-react";
import { CauseDeleteButton } from "@/components/CauseDeleteButton";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { matchCause, matchCount } from "@/lib/cause-matcher";
import { readCauseById, readCauses } from "@/lib/causes";

type CausePageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: CausePageProps): Promise<Metadata> {
  const { id } = await params;
  const cause = await readCauseById(id);
  if (!cause) return { title: "Cause not found" };
  return {
    title: cause.title,
    description: cause.outcome,
    alternates: { canonical: `/causes/${cause.id}` },
    robots: { index: false, follow: false },
  };
}

export default async function CausePage({ params }: CausePageProps) {
  const { id } = await params;
  const cause = await readCauseById(id);
  if (!cause) notFound();
  const causes = await readCauses();
  const matches = matchCause(cause);
  const total = matchCount(matches);

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/causes"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700 hover:text-civic-600"
            >
              ← Your causes
            </Link>
            <span className="text-xs text-ink-600">
              {causes.length} cause{causes.length === 1 ? "" : "s"} on file
            </span>
          </div>
          <div className="mt-4 flex items-start gap-4">
            {cause.emoji ? (
              <span className="text-4xl" aria-hidden="true">
                {cause.emoji}
              </span>
            ) : null}
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
                {cause.title}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-ink-700">
                {cause.outcome}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {cause.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-civic-100 bg-civic-50 px-2.5 py-1 font-semibold text-civic-700"
                  >
                    {t}
                  </span>
                ))}
                {cause.jurisdictions.map((j) => (
                  <span
                    key={j}
                    className="rounded-full border border-record-200 bg-paper-50 px-2.5 py-1 font-semibold text-ink-700"
                  >
                    {j}
                  </span>
                ))}
                {cause.watchTermsAny.slice(0, 6).map((w) => (
                  <span
                    key={w}
                    className="rounded-full border border-record-200 bg-white px-2.5 py-1 font-mono text-[11px] text-ink-700"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/causes/${cause.id}/digest`}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Cause digest preview
            </Link>
            <Link
              href={`/causes/${cause.id}/share`}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 hover:border-civic-500"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Share this cause anonymously
            </Link>
            <Link
              href={`/causes/new?prefill=${cause.id}`}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 hover:border-civic-500"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Refine
            </Link>
            <CauseDeleteButton causeId={cause.id} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Matched records"
          title={`${total} indexed records touch this cause`}
          description="Bills, council files, topics, and source connectors that overlap your topics, jurisdictions, or keywords. We do not score alignment to your outcome; you judge each record on its own."
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {matches.bills.length === 0 &&
          matches.locals.length === 0 &&
          matches.exploreItems.length === 0 &&
          matches.topics.length === 0 ? (
            <div className="rounded-lg border border-record-200 bg-paper-50 p-5 text-sm leading-6 text-ink-700">
              No indexed records currently match this cause. Coverage is
              expanding; missing means missing. Set your place to surface
              federal reps for your state, refine your keywords, or come back
              after the next ingestion run.
            </div>
          ) : null}

          {matches.bills.length > 0 ? (
            <article>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-civic-700">
                Bills
              </h3>
              <ul className="mt-3 grid gap-2">
                {matches.bills.slice(0, 10).map((m) => (
                  <li key={m.bill.id}>
                    <Link
                      href={`/bills/${m.bill.slug}`}
                      className="block rounded-lg border border-record-200 bg-white p-4 shadow-line hover:border-civic-500"
                    >
                      <p className="text-sm font-semibold text-ink-950">
                        {m.bill.title}
                      </p>
                      <p className="mt-1 text-xs text-ink-600">
                        {m.bill.jurisdiction} · {m.bill.status}
                      </p>
                      <p className="mt-2 text-xs text-civic-700">
                        Match: {m.reasons.join(" · ")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          {matches.locals.length > 0 ? (
            <article>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-civic-700">
                Local files
              </h3>
              <ul className="mt-3 grid gap-2">
                {matches.locals.slice(0, 10).map((m) => (
                  <li key={m.decision.id}>
                    <Link
                      href={`/local/${m.decision.slug}`}
                      className="block rounded-lg border border-record-200 bg-white p-4 shadow-line hover:border-civic-500"
                    >
                      <p className="text-sm font-semibold text-ink-950">
                        {m.decision.title}
                      </p>
                      <p className="mt-1 text-xs text-ink-600">
                        {m.decision.jurisdiction} · {m.decision.status}
                      </p>
                      <p className="mt-2 text-xs text-civic-700">
                        Match: {m.reasons.join(" · ")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          {matches.topics.length > 0 ? (
            <article>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-civic-700">
                Topics
              </h3>
              <ul className="mt-3 grid gap-2">
                {matches.topics.slice(0, 10).map((m) => (
                  <li key={m.topic.id}>
                    <Link
                      href={`/topics/${m.topic.slug}`}
                      className="block rounded-lg border border-record-200 bg-white p-4 shadow-line hover:border-civic-500"
                    >
                      <p className="text-sm font-semibold text-ink-950">
                        {m.topic.name}
                      </p>
                      <p className="mt-2 text-xs text-civic-700">
                        Match: {m.reasons.join(" · ")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          {matches.connectors.length > 0 ? (
            <article>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-civic-700">
                Source connectors
              </h3>
              <ul className="mt-3 grid gap-2">
                {matches.connectors.slice(0, 10).map((m) => (
                  <li key={m.connector.id}>
                    <Link
                      href={`/sources/${m.connector.id}`}
                      className="block rounded-lg border border-record-200 bg-white p-4 shadow-line hover:border-civic-500"
                    >
                      <p className="text-sm font-semibold text-ink-950">
                        {m.connector.name}
                      </p>
                      <p className="mt-1 text-xs text-ink-600">
                        {m.connector.jurisdiction} · {m.connector.status}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </div>
      </section>

      {matches.reps.length > 0 ? (
        <section className="border-y border-record-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Representatives in your watched jurisdictions"
              title={`${matches.reps.length} federal reps to watch`}
              description="These representatives serve the states you watch on this cause. The product does not score them on your outcome. Click a profile to see their record."
            />
            <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {matches.reps.slice(0, 30).map((m) => (
                <li key={m.slug}>
                  <Link
                    href={`/federal/${m.slug}`}
                    className="block rounded-md border border-record-200 bg-paper-50 p-3 transition hover:border-civic-500 hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-ink-950">
                      {m.rep.name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-600">
                      {m.rep.type === "sen"
                        ? `U.S. Senate · ${m.rep.state}`
                        : `U.S. House · ${m.rep.state}-${m.rep.district}`}
                      {m.rep.party ? ` · ${m.rep.party}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Take action on this cause"
          title="Bridge from record to action"
          description="Action prompts you can use on any of the matched records. Pre-filled comment letters carry the cause and the record citation."
        />
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {matches.bills.slice(0, 1).map((m) => (
            <Link
              key={`bill-comment-${m.bill.id}`}
              href={`/comment/bills/${m.bill.slug}`}
              className="rounded-lg border border-record-200 bg-paper-50 p-4 shadow-line hover:border-civic-500"
            >
              <MessageCircle
                className="h-5 w-5 text-civic-700"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-sm font-semibold text-ink-950">
                Comment on {m.bill.title.slice(0, 50)}...
              </h3>
              <p className="mt-1 text-xs text-ink-600">
                Pre-filled public-comment letter.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-civic-700">
                Open letter →
              </span>
            </Link>
          ))}
          {matches.locals.slice(0, 1).map((m) => (
            <Link
              key={`local-comment-${m.decision.id}`}
              href={`/comment/local/${m.decision.slug}`}
              className="rounded-lg border border-record-200 bg-paper-50 p-4 shadow-line hover:border-civic-500"
            >
              <MessageCircle
                className="h-5 w-5 text-civic-700"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-sm font-semibold text-ink-950">
                Comment on {m.decision.title.slice(0, 50)}...
              </h3>
              <p className="mt-1 text-xs text-ink-600">
                Pre-filled public-comment letter for the council file.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-civic-700">
                Open letter →
              </span>
            </Link>
          ))}
          <Link
            href="/calendar.ics"
            className="rounded-lg border border-record-200 bg-paper-50 p-4 shadow-line hover:border-civic-500"
          >
            <ArrowRight className="h-5 w-5 text-civic-700" aria-hidden="true" />
            <h3 className="mt-3 text-sm font-semibold text-ink-950">
              Subscribe to milestones (.ics)
            </h3>
            <p className="mt-1 text-xs text-ink-600">
              Add upcoming legislative milestones to your calendar.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-civic-700">
              Download .ics →
            </span>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
