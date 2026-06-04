import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  Compass,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Share2,
} from "lucide-react";
import { CauseDeleteButton } from "@/components/CauseDeleteButton";
import { CausePublishPanel } from "@/components/CausePublishPanel";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { buildCauseActivity } from "@/lib/cause-activity";
import { encodeCauseForPublish } from "@/lib/cause-encoding";
import { looseMatches, matchCause, matchCount } from "@/lib/cause-matcher";
import { slugForRep } from "@/lib/federal-reps";
import { suggestForCause } from "@/lib/cause-suggestions";
import { readCauseById, readCauses } from "@/lib/causes";
import { readPlace } from "@/lib/place";
import { getRepsForPlace, type FederalRep } from "@/lib/reps";

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
  const matches = matchCause(cause);
  const ogParams = new URLSearchParams({
    title: cause.title,
    outcome: cause.outcome,
    emoji: cause.emoji ?? "★",
    matches: String(matchCount(matches)),
    reps: String(matches.reps.length),
    jurisdictions: cause.jurisdictions.slice(0, 3).join("|"),
  });
  const ogUrl = `/og/cause?${ogParams.toString()}`;
  return {
    title: cause.title,
    description: cause.outcome,
    alternates: { canonical: `/causes/${cause.id}` },
    robots: { index: false, follow: false },
    openGraph: {
      title: cause.title,
      description: cause.outcome,
      type: "article",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: cause.title,
      description: cause.outcome,
      images: [ogUrl],
    },
  };
}

export default async function CausePage({ params }: CausePageProps) {
  const { id } = await params;
  const cause = await readCauseById(id);
  if (!cause) notFound();
  const causes = await readCauses();
  const place = await readPlace();
  const matches = matchCause(cause);
  const total = matchCount(matches);
  const hasRecordMatches =
    matches.bills.length > 0 ||
    matches.locals.length > 0 ||
    matches.exploreItems.length > 0 ||
    matches.topics.length > 0;
  const loose = hasRecordMatches ? [] : looseMatches(cause);
  const activity = buildCauseActivity(matches, cause.createdAt);
  const suggestions = suggestForCause(cause);

  // Reps: prefer the user's actual place-based reps (accurate to their
  // district). Fall back to jurisdiction-string matches when no place is set.
  let repsToShow: Array<{ name: string; sub: string; slug: string }> = [];
  if (place) {
    const { houseRep, senators } = getRepsForPlace(place.state, place.cd);
    const list = [houseRep, ...senators].filter(Boolean) as FederalRep[];
    repsToShow = list.map((r) => ({
      name: r.name,
      sub:
        r.type === "sen"
          ? `U.S. Senate · ${r.state}`
          : `U.S. House · ${r.state}-${r.district}`,
      slug: slugForRep(r),
    }));
  } else {
    repsToShow = matches.reps.slice(0, 30).map((m) => ({
      name: m.rep.name,
      sub:
        m.rep.type === "sen"
          ? `U.S. Senate · ${m.rep.state}`
          : `U.S. House · ${m.rep.state}-${m.rep.district}`,
      slug: m.slug,
    }));
  }
  const encoded = encodeCauseForPublish(cause);
  const feedUrl = `https://bythepeopleforthepeople.com/feed/causes/${encoded}.xml`;
  const causeOgParams = new URLSearchParams({
    title: cause.title,
    outcome: cause.outcome,
    emoji: cause.emoji ?? "★",
    matches: String(total),
    reps: String(matches.reps.length),
    jurisdictions: cause.jurisdictions.slice(0, 3).join("|"),
  });
  const causeOgUrl = `https://bythepeopleforthepeople.com/og/cause?${causeOgParams.toString()}`;

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
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-civic-100 bg-civic-50 px-3 py-1.5 text-xs font-semibold text-civic-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            You&apos;re tracking this — below are the records behind it, your
            representatives, and how to get alerts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/causes/${cause.id}/digest`}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Get email alerts
            </Link>
            <Link
              href={`/causes/${cause.id}/share`}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 hover:border-civic-500"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Share this cause anonymously
            </Link>
            <Link
              href={`/causes/${cause.id}/edit`}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 hover:border-civic-500"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Refine
            </Link>
            <Link
              href={`/causes/${cause.id}/actions`}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 hover:border-civic-500"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Action plan
            </Link>
            <div className="ml-auto">
              <CauseDeleteButton causeId={cause.id} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Matched records"
          title={
            hasRecordMatches
              ? `${total} indexed records touch this cause`
              : "No exact matches yet — here's your next move"
          }
          description={
            hasRecordMatches
              ? "The bills, files, and topics connected to this cause. We don't tell you who's right — each one links to its official source for you to judge."
              : "Coverage is expanding and missing means missing — but you are not at a dead end. Refine your keywords, watch the closest coverage we do have, and add your representatives. New records that match will surface here and in your digest."
          }
        />

        {!hasRecordMatches ? (
          <div className="mt-6 grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                href={`/causes/${cause.id}/edit`}
                className="group rounded-lg border border-record-200 bg-white p-4 shadow-line transition hover:border-civic-500"
              >
                <Pencil className="h-5 w-5 text-civic-700" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-semibold text-ink-950">
                  Broaden your keywords
                </h3>
                <p className="mt-1 text-xs leading-5 text-ink-600">
                  Add synonyms and plainer words. More keywords catch more
                  records.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-civic-700 group-hover:gap-2">
                  Refine cause →
                </span>
              </Link>
              <Link
                href="/explore"
                className="group rounded-lg border border-record-200 bg-white p-4 shadow-line transition hover:border-civic-500"
              >
                <Compass className="h-5 w-5 text-civic-700" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-semibold text-ink-950">
                  Ask the record directly
                </h3>
                <p className="mt-1 text-xs leading-5 text-ink-600">
                  Search the full index by hand to find records to track.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-civic-700 group-hover:gap-2">
                  Open search →
                </span>
              </Link>
              <Link
                href={`/causes/${cause.id}/digest`}
                className="group rounded-lg border border-record-200 bg-white p-4 shadow-line transition hover:border-civic-500"
              >
                <Mail className="h-5 w-5 text-civic-700" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-semibold text-ink-950">
                  Get alerted when it lands
                </h3>
                <p className="mt-1 text-xs leading-5 text-ink-600">
                  Preview the digest. New matching records arrive here as
                  ingestion runs.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-civic-700 group-hover:gap-2">
                  Preview digest →
                </span>
              </Link>
            </div>

            {loose.length > 0 ? (
              <article className="rounded-lg border border-record-200 bg-paper-50 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-civic-700">
                  Closest coverage we have
                </h3>
                <p className="mt-1 text-xs leading-5 text-ink-600">
                  Loose matches by word overlap — not exact matches. Skim these
                  and add the relevant words to your cause to lock them in.
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {loose.map((m) => (
                    <li key={m.href}>
                      <Link
                        href={m.href}
                        className="block rounded-lg border border-record-200 bg-white p-4 shadow-line transition hover:border-civic-500"
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-paper-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-700">
                            {m.type === "bill"
                              ? "Bill"
                              : m.type === "local"
                                ? "Local"
                                : "Topic"}
                          </span>
                          {m.jurisdiction ? (
                            <span className="text-[11px] text-ink-600">
                              {m.jurisdiction}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-ink-950">
                          {m.title}
                        </p>
                        <p className="mt-1 text-xs text-ink-600">
                          Shared words: {m.sharedTerms.join(", ")}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}

            {!place ? (
              <article className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-civic-100 bg-civic-50 p-5">
                <div className="flex items-start gap-3">
                  <MapPin
                    className="mt-0.5 h-5 w-5 shrink-0 text-civic-700"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink-950">
                      Set your ZIP to add your representatives.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-ink-700">
                      Use “Set your place” in the top bar. Your US House member
                      and both senators attach to this cause automatically.
                    </p>
                  </div>
                </div>
              </article>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
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

      {repsToShow.length > 0 ? (
        <section className="border-y border-record-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow={
                place
                  ? `Your representatives · ${place.city}, ${place.state}`
                  : "Representatives in your watched jurisdictions"
              }
              title={`${repsToShow.length} federal reps to contact`}
              description="These representatives serve your place. The product does not score them on your outcome — click a profile to see their record, then use Take action below to contact them on this cause."
            />
            <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {repsToShow.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/federal/${r.slug}`}
                    className="block rounded-md border border-record-200 bg-paper-50 p-3 transition hover:border-civic-500 hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-ink-950">
                      {r.name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-600">{r.sub}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <article>
            <SectionHeader
              eyebrow="Activity log"
              title={
                activity.daysTracked === 0
                  ? "You started tracking this today"
                  : `Since you started tracking this ${activity.daysTracked} day${activity.daysTracked === 1 ? "" : "s"} ago`
              }
              description={
                activity.events.length === 0
                  ? "No matched records have moved yet. Coverage expands as adapters land; missing means missing."
                  : `${activity.movedSinceCauseCreated} of ${activity.totalMatched} matched records moved since you started tracking.`
              }
            />
            <ol className="mt-6 grid gap-3">
              {activity.events.length === 0 ? (
                <li className="rounded-lg border border-record-200 bg-paper-50 p-5">
                  <p className="text-sm leading-6 text-ink-700">
                    No timeline events yet — you just started. While coverage
                    catches up, lock in the return loop so you hear about
                    movement the moment it happens:
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Link
                      href={`/causes/${cause.id}/digest`}
                      className="flex items-center gap-2 rounded-md border border-record-200 bg-white p-3 text-sm font-semibold text-ink-900 transition hover:border-civic-500"
                    >
                      <Mail className="h-4 w-4 text-civic-700" aria-hidden="true" />
                      Preview your digest
                    </Link>
                    <Link
                      href="/calendar.ics"
                      className="flex items-center gap-2 rounded-md border border-record-200 bg-white p-3 text-sm font-semibold text-ink-900 transition hover:border-civic-500"
                    >
                      <CalendarPlus className="h-4 w-4 text-civic-700" aria-hidden="true" />
                      Add milestones to calendar
                    </Link>
                    <Link
                      href={`/causes/${cause.id}/share`}
                      className="flex items-center gap-2 rounded-md border border-record-200 bg-white p-3 text-sm font-semibold text-ink-900 transition hover:border-civic-500"
                    >
                      <Share2 className="h-4 w-4 text-civic-700" aria-hidden="true" />
                      Share your cause
                    </Link>
                    <Link
                      href={`/causes/${cause.id}/edit`}
                      className="flex items-center gap-2 rounded-md border border-record-200 bg-white p-3 text-sm font-semibold text-ink-900 transition hover:border-civic-500"
                    >
                      <Pencil className="h-4 w-4 text-civic-700" aria-hidden="true" />
                      Refine to catch more
                    </Link>
                  </div>
                </li>
              ) : (
                activity.events.map((event, idx) => (
                  <li key={`${event.href}-${idx}`}>
                    <Link
                      href={event.href}
                      className="block rounded-lg border border-record-200 bg-white p-4 shadow-line transition hover:border-civic-500"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={
                            event.sinceCauseCreated
                              ? "rounded-full border border-civic-100 bg-civic-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-civic-700"
                              : "rounded-full border border-record-200 bg-paper-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-600"
                          }
                        >
                          {event.sinceCauseCreated ? "Since you started" : "Before tracking"}
                        </span>
                        <span className="font-mono text-xs text-ink-600">
                          {event.date}
                        </span>
                        <span className="rounded-full bg-paper-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-700">
                          {event.type === "bill_action"
                            ? "Bill"
                            : event.type === "local_meeting"
                              ? "Local"
                              : "Topic"}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-ink-950">
                        {event.title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-ink-700">
                        {event.detail}
                      </p>
                    </Link>
                  </li>
                ))
              )}
            </ol>
          </article>
          <aside className="grid content-start gap-4">
            <article className="rounded-lg border border-record-200 bg-paper-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
                Other things you might want to track
              </p>
              <h2 className="mt-1 text-lg font-semibold text-ink-950">
                Related starter causes
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-700">
                Adjacent civic concerns that share topics or keywords with
                your cause. Each opens the wizard pre-filled.
              </p>
              {suggestions.length === 0 ? (
                <p className="mt-4 text-xs leading-5 text-ink-600">
                  No related starter causes match yet. Refine keywords on
                  your cause to surface more.
                </p>
              ) : (
                <ul className="mt-4 grid gap-2">
                  {suggestions.map((s) => (
                    <li key={s.starter.id}>
                      <Link
                        href={`/causes/new?starter=${encodeURIComponent(s.starter.id)}`}
                        className="flex items-start gap-3 rounded-md border border-record-200 bg-white p-3 transition hover:border-civic-500"
                      >
                        <span className="text-xl" aria-hidden="true">
                          {s.starter.emoji}
                        </span>
                        <span className="grid">
                          <span className="text-sm font-semibold text-ink-950">
                            {s.starter.title}
                          </span>
                          <span className="mt-1 text-xs leading-5 text-ink-600">
                            {s.reasons[0] ?? "Adjacent topic"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
            <CausePublishPanel feedUrl={feedUrl} causeOgUrl={causeOgUrl} />
          </aside>
        </div>
      </section>

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
