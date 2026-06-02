"use client";

import { useState } from "react";
import { Calendar, Mail, FileText, MessageCircle, Copy, ExternalLink } from "lucide-react";
import { buildIcs, dataUrlForIcs } from "@/lib/ics";

type TakeActionRecord = {
  title: string;
  href: string;
  jurisdiction: string;
  status: string;
  nextActionDate?: string;
  nextActionTitle?: string;
  contactUrl?: string;
  contactEmail?: string;
  publicCommentUrl?: string;
  cpraEntity?: string;
  cpraScope?: string;
};

type TakeActionProps = {
  record: TakeActionRecord;
};

export function TakeAction({ record }: TakeActionProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  const calendarEvent = record.nextActionDate
    ? buildIcs({
        uid: `${record.href.replace(/[^a-z0-9]/gi, "-")}-${record.nextActionDate}`,
        title: record.nextActionTitle ?? `Public-record milestone: ${record.title}`,
        description: `Tracking from bythepeopleforthepeople.com${record.href}. ${record.status}.`,
        url: `https://bythepeopleforthepeople.com${record.href}`,
        location: record.jurisdiction,
        start: new Date(record.nextActionDate),
        durationMinutes: 60,
      })
    : null;

  const emailSubject = `Public-record question about ${record.title}`;
  const emailBody = `Hello,\n\nI am writing as a constituent about the record I found on bythepeopleforthepeople.com: ${record.title} (${record.status}).\n\nMy question or comment: \n\nFor reference, the public record I am citing: https://bythepeopleforthepeople.com${record.href}\n\nThank you,\n`;

  const contactHref = record.contactUrl
    ? record.contactUrl
    : record.contactEmail
      ? `mailto:${record.contactEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      : null;
  const contactBody = record.contactUrl
    ? "Opens the official contact page for the responsible office. Most offices accept structured constituent contact through their site."
    : record.contactEmail
      ? "Opens your mail client with a prefilled subject and a citation to the public record."
      : "No contact channel is on file. The site never invents a contact address.";

  const cpraTemplate = buildCpraTemplate(record);

  async function copyCpra() {
    try {
      await window.navigator.clipboard.writeText(cpraTemplate);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      setCopyState("error");
    }
  }

  return (
    <section className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            Take action
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink-950">
            Bridge from record to action.
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            Calendar the next milestone, contact the responsible office, or
            request the underlying document. Source links remain attached.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <ActionCard
          icon={Calendar}
          title="Add to calendar"
          body={
            calendarEvent
              ? `Schedule a reminder for ${record.nextActionTitle ?? "the next milestone"} on ${record.nextActionDate}.`
              : "No future-dated milestone in the record. Calendar action lights up when the record names a next action with a date."
          }
          actionLabel={calendarEvent ? "Download .ics" : "Not available"}
          href={calendarEvent ? dataUrlForIcs(calendarEvent) : undefined}
          download={calendarEvent ? "milestone.ics" : undefined}
          disabled={!calendarEvent}
        />
        <ActionCard
          icon={Mail}
          title="Contact the office"
          body={contactBody}
          actionLabel={contactHref ? (record.contactUrl ? "Open contact page" : "Compose email") : "Not available"}
          href={contactHref ?? undefined}
          target={record.contactUrl ? "_blank" : undefined}
          disabled={!contactHref}
        />
        <ActionCard
          icon={FileText}
          title="Request the record"
          body="Copy a public-records-request template (CPRA in California, FOIA federally) addressed to the right office, citing this record."
          actionLabel={
            copyState === "copied"
              ? "Copied"
              : copyState === "error"
                ? "Copy failed"
                : "Copy template"
          }
          onClick={copyCpra}
          iconRight={Copy}
        />
      </div>

      {record.publicCommentUrl ? (
        <div className="mt-4 rounded-lg border border-record-200 bg-paper-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            Public comment
          </p>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            The jurisdiction publishes a sign-up or submission surface for this
            record.
          </p>
          <a
            href={record.publicCommentUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink-950 px-3 text-sm font-semibold text-white hover:bg-ink-800"
          >
            Open public-comment page
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      ) : null}
    </section>
  );
}

function ActionCard({
  icon: Icon,
  title,
  body,
  actionLabel,
  href,
  download,
  target,
  onClick,
  disabled,
  iconRight: IconRight,
}: {
  icon: typeof Calendar;
  title: string;
  body: string;
  actionLabel: string;
  href?: string;
  download?: string;
  target?: string;
  onClick?: () => void;
  disabled?: boolean;
  iconRight?: typeof Copy;
}) {
  const baseClass =
    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition";
  const enabledClass = "bg-ink-950 text-white hover:bg-ink-800";
  const disabledClass =
    "border border-record-200 bg-paper-50 text-ink-600 cursor-not-allowed";

  const content = (
    <>
      {actionLabel}
      {IconRight ? <IconRight className="h-4 w-4" aria-hidden="true" /> : null}
    </>
  );

  return (
    <article className="rounded-lg border border-record-200 bg-paper-50 p-4">
      <Icon className="h-5 w-5 text-civic-700" aria-hidden="true" />
      <h3 className="mt-4 text-base font-semibold text-ink-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink-700">{body}</p>
      <div className="mt-4">
        {disabled ? (
          <span className={`${baseClass} ${disabledClass}`}>{content}</span>
        ) : href ? (
          <a
            href={href}
            download={download}
            target={target}
            rel={target === "_blank" ? "noreferrer" : undefined}
            className={`${baseClass} ${enabledClass}`}
          >
            {content}
          </a>
        ) : (
          <button
            type="button"
            onClick={onClick}
            className={`${baseClass} ${enabledClass}`}
          >
            {content}
          </button>
        )}
      </div>
    </article>
  );
}

function buildCpraTemplate(record: TakeActionRecord) {
  const entity = record.cpraEntity ?? record.jurisdiction;
  const scope =
    record.cpraScope ??
    "all communications, attachments, staff reports, and any related correspondence";
  const isFederal = entity.toLowerCase().includes("congress") ||
    entity.toLowerCase().includes("federal") ||
    entity.toLowerCase().includes("u.s.");
  const statute = isFederal
    ? "the Freedom of Information Act, 5 U.S.C. § 552"
    : "the California Public Records Act, Gov. Code § 7920 et seq.";

  return [
    `To the records officer for ${entity},`,
    "",
    `I am requesting public records pursuant to ${statute}. I am asking for ${scope} related to the following decision record:`,
    "",
    `Record: ${record.title}`,
    `Status: ${record.status}`,
    `Citation: https://bythepeopleforthepeople.com${record.href}`,
    "",
    "Date range: from one year before the first indexed action on this record through today.",
    "",
    "Preferred delivery: electronic copies, emailed to the address on file. If any responsive record is exempt, please cite the specific exemption and segregate releasable portions.",
    "",
    "If the cost of fulfilling this request will exceed $25, please notify me in advance.",
    "",
    "Thank you for your time.",
    "",
    "Sincerely,",
    "[Your name]",
    "[Your address]",
    "[Your email]",
  ].join("\n");
}
