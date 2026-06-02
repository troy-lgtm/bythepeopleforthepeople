import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ShieldCheck, Users, Wallet, Mail, Scale } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "About / Governance",
  description:
    "Who runs By The People, For The People: the operators, the funding model, the editorial guardrails, and how to contact us.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="About"
            title="Who runs this, who funds it, and how we stay nonpartisan."
            description="A civic-trust product loses credibility the moment it hides its operators. Everything below is on-the-record."
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article className="rounded-lg border border-record-200 bg-white p-6 shadow-line">
          <Users className="h-6 w-6 text-civic-700" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-ink-950">Operators</h2>
          <p className="mt-3 text-sm leading-6 text-ink-700">
            This site is operated as an independent civic project. The named
            operators below are accountable for every claim, every source, and
            every correction.
          </p>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-ink-800">
            <li>
              <strong>Editor:</strong> the named editor will be listed here
              before public launch. Pseudonymous operation defeats the purpose
              of a trust product.
            </li>
            <li>
              <strong>Engineering:</strong> open-source contributions tracked in
              the project repository; named contributors credited.
            </li>
            <li>
              <strong>Methodology review:</strong> at least two outside civic
              technologists review every methodology change before it ships.
            </li>
          </ul>
        </article>

        <article className="rounded-lg border border-record-200 bg-white p-6 shadow-line">
          <Wallet className="h-6 w-6 text-civic-700" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-ink-950">Funding</h2>
          <p className="mt-3 text-sm leading-6 text-ink-700">
            How we pay for this matters. The funding model is disclosed here
            and updated whenever it changes.
          </p>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-ink-800">
            <li>
              <strong>Today:</strong> personally funded by the founding
              operators. No outside money. No advertising. No paid placement.
            </li>
            <li>
              <strong>Allowed:</strong> reader contributions, philanthropic
              grants from nonpartisan civic-tech funders, paid API access for
              newsrooms and AI engines.
            </li>
            <li>
              <strong>Disallowed:</strong> campaign committees, PACs, candidate
              committees, lobbying organizations, party committees, dark-money
              entities, advertising on records or topic pages.
            </li>
            <li>
              <strong>Disclosure:</strong> every donor over $500 disclosed on
              this page within 14 days.
            </li>
          </ul>
        </article>

        <article className="rounded-lg border border-record-200 bg-white p-6 shadow-line">
          <ShieldCheck className="h-6 w-6 text-civic-700" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-ink-950">Editorial rules</h2>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-ink-800">
            <li>No partisan scoring. No endorsements. No outrage framing.</li>
            <li>Every factual claim links to a primary source.</li>
            <li>
              Missing data is labeled missing. Coverage gaps are visible, not
              hidden.
            </li>
            <li>
              Corrections are posted publicly in the{" "}
              <Link href="/corrections" className="text-civic-700 underline">
                corrections log
              </Link>{" "}
              and never silently deleted.
            </li>
            <li>
              Operators recuse from records they have a personal financial
              interest in. Recusals are noted in the methodology log.
            </li>
          </ul>
        </article>

        <article className="rounded-lg border border-record-200 bg-white p-6 shadow-line">
          <Scale className="h-6 w-6 text-civic-700" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-ink-950">Governance</h2>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-ink-800">
            <li>
              <strong>Methodology changes</strong> require two named reviewers
              and a public changelog entry.
            </li>
            <li>
              <strong>Adding a jurisdiction</strong> requires a working
              ingestion connector against an official source, not a one-time
              hand-curated upload.
            </li>
            <li>
              <strong>Removing a record</strong> requires a corrections-log
              entry explaining why; we do not silently delete.
            </li>
            <li>
              <strong>Hosting and data:</strong> deployed on Vercel; source
              records and indexed metadata are not personal data and are
              published as a public API.
            </li>
          </ul>
        </article>
      </section>

      <section className="border-y border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <article className="rounded-lg border border-record-200 bg-paper-50 p-6">
              <BadgeCheck className="h-6 w-6 text-civic-700" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-semibold text-ink-950">
                Independence pledge
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink-700">
                The operators do not take money, gifts, or any in-kind
                consideration from candidates, campaigns, PACs, party
                committees, foreign governments, or lobbying organizations.
                Violation is grounds for resignation from operator role.
              </p>
            </article>
            <article className="rounded-lg border border-record-200 bg-paper-50 p-6">
              <Mail className="h-6 w-6 text-civic-700" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-semibold text-ink-950">Contact</h2>
              <p className="mt-3 text-sm leading-6 text-ink-700">
                Corrections, source updates, partnership inquiries, and
                governance questions:
              </p>
              <a
                href="mailto:hello@bythepeopleforthepeople.com"
                className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
              >
                hello@bythepeopleforthepeople.com
              </a>
              <p className="mt-3 text-xs text-ink-600">
                For a specific record, use the{" "}
                <strong>Report a correction</strong> button on that record
                page. It routes to the same queue with the record context
                attached.
              </p>
            </article>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
