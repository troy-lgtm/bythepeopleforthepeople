import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";
import { CopyCommentButton } from "@/components/CopyCommentButton";
import { PageShell } from "@/components/PageShell";
import { PrintButton } from "@/components/PrintButton";
import { SectionHeader } from "@/components/SectionHeader";
import { getBillBySlug, getLocalDecisionBySlug } from "@/data/records";

type CommentPageProps = {
  params: Promise<{ type: string; slug: string }>;
};

const BASE = "https://bythepeopleforthepeople.com";

function resolveRecord(type: string, slug: string) {
  if (type === "bills") {
    const bill = getBillBySlug(slug);
    if (!bill) return null;
    return {
      title: bill.title,
      jurisdiction: bill.jurisdiction,
      status: bill.status,
      href: `/bills/${bill.slug}`,
    };
  }
  if (type === "local") {
    const decision = getLocalDecisionBySlug(slug);
    if (!decision) return null;
    return {
      title: decision.title,
      jurisdiction: decision.jurisdiction,
      status: decision.status,
      href: `/local/${decision.slug}`,
    };
  }
  return null;
}

export async function generateMetadata({
  params,
}: CommentPageProps): Promise<Metadata> {
  const { type, slug } = await params;
  const record = resolveRecord(type, slug);

  if (!record) {
    return { title: "Public-comment letter" };
  }

  const title = `Public-comment letter: ${record.title}`;
  const description = `A ready-to-send public-comment letter for ${record.title} (${record.jurisdiction}, status: ${record.status}). Pre-fills the official body, citation, and source URL.`;

  return {
    title,
    description,
    alternates: { canonical: `/comment/${type}/${slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/comment/${type}/${slug}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

function buildLetter(
  body: string,
  recordTitle: string,
  recordHref: string,
  status: string,
  jurisdiction: string,
  sponsor?: string,
): string {
  return [
    `To the office handling ${recordTitle}:`,
    "",
    `I am submitting this public comment as a constituent. I am writing about the record indexed at ${BASE}${recordHref} (status: ${status}, jurisdiction: ${jurisdiction}${sponsor ? `, sponsor: ${sponsor}` : ""}).`,
    "",
    "My comment:",
    body,
    "",
    "I would appreciate this comment being made part of the official record for this matter, and notified by email of any further actions or hearings.",
    "",
    "Thank you for your time.",
    "",
    "Sincerely,",
    "[Your name]",
    "[Your address, city, state, ZIP]",
    "[Your email]",
    "[Your phone]",
  ].join("\n");
}

export default async function CommentPage({ params }: CommentPageProps) {
  const { type, slug } = await params;

  let title = "";
  let status = "";
  let jurisdiction = "";
  let publicCommentUrl: string | undefined;
  let recordHref = "";
  let sponsor: string | undefined;
  let suggestedAngle = "";

  if (type === "bills") {
    const bill = getBillBySlug(slug);
    if (!bill) notFound();
    title = bill.title;
    status = bill.status;
    jurisdiction = bill.jurisdiction;
    publicCommentUrl = bill.publicCommentUrl;
    recordHref = `/bills/${bill.slug}`;
    sponsor = bill.sponsor;
    suggestedAngle = `What part of ${bill.title.split(":")[0]} affects you, your business, or your community.`;
  } else if (type === "local") {
    const decision = getLocalDecisionBySlug(slug);
    if (!decision) notFound();
    title = decision.title;
    status = decision.status;
    jurisdiction = decision.jurisdiction;
    publicCommentUrl = decision.publicCommentUrl;
    recordHref = `/local/${decision.slug}`;
    suggestedAngle = `What you observe locally that this decision touches; what outcome you want from ${decision.departmentOrCommittee}.`;
  } else {
    notFound();
  }

  const sampleBody =
    `I am writing about ${title}. ` +
    (suggestedAngle ? `${suggestedAngle} ` : "") +
    `I urge the responsible office to publish a clear record of how each commenter's input was considered.`;
  const letter = buildLetter(
    sampleBody,
    title,
    recordHref,
    status,
    jurisdiction,
    sponsor,
  );

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Public comment"
            title="Pre-filled comment letter"
            description={`A ready-to-send public comment letter for ${title}. Replace the placeholder body with your own, fill the signature block, and send via the official public-comment channel.`}
          />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={recordHref}
              className="inline-flex h-10 items-center justify-center rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 hover:border-civic-500"
            >
              Open underlying record
            </Link>
            {publicCommentUrl ? (
              <a
                href={publicCommentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
              >
                Open official submission portal
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <article className="rounded-lg border border-record-200 bg-white p-6 shadow-line">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
                Letter
              </p>
              <h2 className="mt-1 text-lg font-semibold text-ink-950">
                Ready to send
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-700">
                Copy, paste into the official portal, or print to mail.
                Methodology rule: no partisan framing, no scripted talking
                points; only your authentic comment with the record citation
                attached.
              </p>
            </div>
          </div>
          <pre className="mt-5 max-h-[480px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-record-200 bg-paper-50 p-4 font-mono text-xs leading-5 text-ink-800">
            {letter}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <CopyCommentButton text={letter} />
            <PrintButton />
          </div>
        </article>
        <aside className="rounded-lg border border-record-200 bg-paper-50 p-6">
          <h2 className="text-base font-semibold text-ink-950">Methodology</h2>
          <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm leading-6 text-ink-700">
            <li>The comment is your own; the template handles citation.</li>
            <li>
              No partisan framing or scripted talking points are inserted.
            </li>
            <li>Source citation makes the record traceable for the office.</li>
            <li>
              We do not submit the comment for you. You send it via the
              official channel above (or mail it). You own your civic action.
            </li>
            <li>
              Replacement of placeholder signature block is required for it to
              be processed.
            </li>
          </ul>
        </aside>
      </section>
    </PageShell>
  );
}
