import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Mail,
  MessageCircle,
  Phone,
  Share2,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { matchCause, matchCount } from "@/lib/cause-matcher";
import { readCauseById } from "@/lib/causes";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cause = await readCauseById(id);
  if (!cause) return { title: "Cause not found" };
  return {
    title: `Action plan: ${cause.title}`,
    description: `Five concrete actions you can take this week for ${cause.title}.`,
    robots: { index: false, follow: false },
  };
}

const BASE = "https://bythepeopleforthepeople.com";

export default async function CauseActionPlanPage({ params }: Props) {
  const { id } = await params;
  const cause = await readCauseById(id);
  if (!cause) notFound();

  const matches = matchCause(cause);
  const totalRecords = matchCount(matches);
  const topBill = matches.bills[0]?.bill ?? null;
  const topLocal = matches.locals[0]?.decision ?? null;
  const topRep = matches.reps[0]?.rep ?? null;

  const shareUrl = `${BASE}/share?${new URLSearchParams({
    text: `${cause.title} — ${cause.outcome}`,
    source: `${totalRecords} indexed civic records currently match this cause`,
    sourceUrl: `${BASE}/causes/${cause.id}`,
  }).toString()}`;

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href={`/causes/${cause.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-civic-700 hover:text-civic-600"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Back to cause
          </Link>
          <SectionHeader
            eyebrow="Action plan"
            title="Five things you can do this week for this cause"
            description="Source-anchored, low-friction, and adapter-aware. Every action links back to the underlying public record."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ol className="grid gap-4">
          <ActionStep
            n={1}
            icon={MessageCircle}
            title="Write one comment on a record that touches this cause"
            body={
              topBill
                ? `Pre-filled comment letter for ${topBill.title} (${topBill.jurisdiction}). Carries the cause and the official record citation.`
                : topLocal
                  ? `Pre-filled comment letter for ${topLocal.title} (${topLocal.jurisdiction}).`
                  : "No matched record yet. Refine keywords or jurisdictions to surface more matches."
            }
            ctaLabel={
              topBill
                ? "Open bill comment letter"
                : topLocal
                  ? "Open local-file comment letter"
                  : "Refine cause"
            }
            href={
              topBill
                ? `/comment/bills/${topBill.slug}`
                : topLocal
                  ? `/comment/local/${topLocal.slug}`
                  : `/causes/${cause.id}/edit`
            }
          />
          <ActionStep
            n={2}
            icon={Phone}
            title="Contact a representative for one of your jurisdictions"
            body={
              topRep
                ? `${topRep.name} — ${topRep.type === "sen" ? "U.S. Senate" : "U.S. House"} ${topRep.state}${topRep.district ? `-${topRep.district}` : ""}. Phone, official site, and office address on the profile.`
                : "Set your place to surface your federal representatives, then return here. The product does not score reps on your cause; it surfaces the records you can ask them about."
            }
            ctaLabel={topRep ? `Open ${topRep.name} profile` : "Set your place"}
            href={
              topRep
                ? `/federal/${matches.reps[0].slug}`
                : `/?action=set-place`
            }
          />
          <ActionStep
            n={3}
            icon={Calendar}
            title="Add upcoming milestones to your calendar"
            body="Subscribe to the .ics feed of upcoming legislative and council-file milestones. Apple/Google Calendar can auto-refresh it."
            ctaLabel="Download milestones .ics"
            href="/calendar.ics"
          />
          <ActionStep
            n={4}
            icon={Mail}
            title="Preview the cause-scoped digest"
            body="See exactly what email would arrive when delivery is enabled — bills, local files, topics, all matched to THIS cause."
            ctaLabel="Open cause digest preview"
            href={`/causes/${cause.id}/digest`}
          />
          <ActionStep
            n={5}
            icon={Share2}
            title="Share this cause anonymously"
            body="A shareable card carrying the cause title, your stated outcome, and the matched-record count. No identifying cookie attached. No other causes exposed."
            ctaLabel="Open share preview"
            href={`/causes/${cause.id}/share`}
            secondaryLabel="Quick copy: share URL"
            secondaryHref={shareUrl}
          />
        </ol>
      </section>

      <section className="border-t border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <article className="rounded-lg border border-record-200 bg-paper-50 p-5 text-sm leading-7 text-ink-700">
            Methodology: the product offers concrete action surfaces. It does
            not pressure you to send any specific message. We never submit on
            your behalf. We never aggregate your actions into mobilization
            data. You own your civic action.
          </article>
        </div>
      </section>
    </PageShell>
  );
}

function ActionStep({
  n,
  icon: Icon,
  title,
  body,
  ctaLabel,
  href,
  secondaryLabel,
  secondaryHref,
}: {
  n: number;
  icon: typeof Calendar;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <li>
      <article className="grid gap-3 rounded-lg border border-record-200 bg-white p-5 shadow-line md:grid-cols-[auto_1fr] md:items-start md:gap-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-base font-bold text-civic-700">
          {n}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-civic-700" aria-hidden="true" />
            <h2 className="text-base font-semibold text-ink-950">{title}</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-ink-700">{body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={href}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-ink-950 px-3 text-sm font-semibold text-white hover:bg-ink-800"
            >
              {ctaLabel}
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-record-200 bg-paper-50 px-3 text-xs font-semibold text-ink-800 hover:border-civic-500"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </article>
    </li>
  );
}
