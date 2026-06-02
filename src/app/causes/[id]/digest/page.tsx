import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { matchCause } from "@/lib/cause-matcher";
import { readCauseById } from "@/lib/causes";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

const BASE = "https://bythepeopleforthepeople.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cause = await readCauseById(id);
  if (!cause) return { title: "Cause not found" };
  return {
    title: `Cause digest: ${cause.title}`,
    description: `Personalized digest for the cause: ${cause.title}.`,
    robots: { index: false, follow: false },
  };
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function CauseDigestPage({ params }: Props) {
  const { id } = await params;
  const cause = await readCauseById(id);
  if (!cause) notFound();

  const matches = matchCause(cause);
  const topBills = matches.bills.slice(0, 5);
  const topLocals = matches.locals.slice(0, 5);
  const topTopics = matches.topics.slice(0, 5);

  const billRows = topBills
    .map(
      (m) =>
        `<li style="margin:0 0 14px 0;"><strong>${esc(m.bill.title)}</strong><br><span style="color:#27364f;">${esc(m.bill.jurisdiction)} · ${esc(m.bill.status)}</span><br><a href="${BASE}/bills/${m.bill.slug}" style="color:#175c55;">Open record</a><br><span style="color:#40516a;font-size:12px;">Match: ${esc(m.reasons.join(" · "))}</span></li>`,
    )
    .join("");

  const localRows = topLocals
    .map(
      (m) =>
        `<li style="margin:0 0 14px 0;"><strong>${esc(m.decision.title)}</strong><br><span style="color:#27364f;">${esc(m.decision.jurisdiction)} · ${esc(m.decision.status)}</span><br><a href="${BASE}/local/${m.decision.slug}" style="color:#175c55;">Open record</a><br><span style="color:#40516a;font-size:12px;">Match: ${esc(m.reasons.join(" · "))}</span></li>`,
    )
    .join("");

  const topicRows = topTopics
    .map(
      (m) =>
        `<li style="margin:0 0 14px 0;"><strong>${esc(m.topic.name)}</strong><br><a href="${BASE}/topics/${m.topic.slug}" style="color:#175c55;">Open topic</a></li>`,
    )
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;font-family:Inter,system-ui,sans-serif;background:#fbfaf7;color:#07111f;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #d9dde8;border-radius:12px;padding:24px;">
    <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#175c55;">By The People, For The People · Cause digest</p>
    <h1 style="margin:0 0 8px 0;font-size:20px;color:#07111f;">${cause.emoji ? esc(cause.emoji) + " " : ""}${esc(cause.title)}</h1>
    <p style="margin:0 0 18px 0;font-size:14px;color:#27364f;">${esc(cause.outcome)}</p>

    ${billRows ? `<h2 style="font-size:14px;margin:18px 0 8px 0;border-bottom:1px solid #eceef4;padding-bottom:4px;">Bills matched</h2><ul style="margin:0;padding-left:18px;">${billRows}</ul>` : ""}
    ${localRows ? `<h2 style="font-size:14px;margin:18px 0 8px 0;border-bottom:1px solid #eceef4;padding-bottom:4px;">Local files matched</h2><ul style="margin:0;padding-left:18px;">${localRows}</ul>` : ""}
    ${topicRows ? `<h2 style="font-size:14px;margin:18px 0 8px 0;border-bottom:1px solid #eceef4;padding-bottom:4px;">Topics matched</h2><ul style="margin:0;padding-left:18px;">${topicRows}</ul>` : ""}

    <p style="margin:24px 0 0 0;font-size:11px;color:#40516a;">This is a preview. Once digest delivery is configured (Resend), this cause sends on the schedule you choose. Methodology: source-anchored. No partisan scoring. You judge alignment.</p>
  </div>
</body></html>`;

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
            eyebrow="Cause digest preview"
            title={`What gets sent for "${cause.title}"`}
            description="Cause-scoped digest. Carries the matched records, jurisdictions, and source links for THIS cause only."
          />
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-civic-100 bg-civic-50 px-3 py-1 text-xs font-semibold text-civic-700">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            Delivery enables when RESEND_API_KEY is set
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="overflow-hidden rounded-lg border border-record-200 bg-paper-100 p-3 shadow-line">
          <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">
            Email preview
          </p>
          <iframe
            srcDoc={html}
            title="Cause digest preview"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            className="h-[800px] w-full rounded-md border border-record-200 bg-white"
          />
        </article>
      </section>
    </PageShell>
  );
}
