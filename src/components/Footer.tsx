import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-record-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold text-ink-950">
            By The People, For The People
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-600">
            A nonpartisan public-decision intelligence platform built around
            primary records, source trails, and labeled coverage gaps.
          </p>
          <p className="mt-4 inline-flex rounded-full border border-record-200 bg-paper-50 px-3 py-1 text-xs font-medium text-ink-600">
            Source-anchored. No endorsements. Missing means missing.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-600">
            Product
          </p>
          <div className="mt-3 grid gap-2 text-sm text-ink-700">
            <Link href="/causes" className="hover:text-civic-700">
              Causes important to you
            </Link>
            <Link href="/explore" className="hover:text-civic-700">
              Ask records
            </Link>
            <Link href="/near-me" className="hover:text-civic-700">
              Near me
            </Link>
            <Link href="/activity" className="hover:text-civic-700">
              Upcoming and recent
            </Link>
            <Link href="/watchlist" className="hover:text-civic-700">
              Watchlist
            </Link>
            <Link href="/digest" className="hover:text-civic-700">
              Email digest
            </Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-600">
            Trust
          </p>
          <div className="mt-3 grid gap-2 text-sm text-ink-700">
            <Link href="/about" className="hover:text-civic-700">
              About / Governance
            </Link>
            <Link href="/methodology" className="hover:text-civic-700">
              Methodology
            </Link>
            <Link href="/corrections" className="hover:text-civic-700">
              Corrections log
            </Link>
            <Link href="/changelog" className="hover:text-civic-700">
              Changelog
            </Link>
            <Link href="/sources" className="hover:text-civic-700">
              Sources and connectors
            </Link>
            <Link href="/privacy" className="hover:text-civic-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-civic-700">
              Terms
            </Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-600">
            Developers
          </p>
          <div className="mt-3 grid gap-2 text-sm text-ink-700">
            <Link href="/developers" className="hover:text-civic-700">
              Developers + AI grounding
            </Link>
            <Link href="/share" className="hover:text-civic-700">
              Share a sourced fact
            </Link>
            {/* eslint-disable @next/next/no-html-link-for-pages */}
            <a href="/api/records" className="hover:text-civic-700">
              Records API
            </a>
            <a href="/api/sources" className="hover:text-civic-700">
              Sources API
            </a>
            <a href="/api/topics" className="hover:text-civic-700">
              Topics API
            </a>
            <a href="/api/answers" className="hover:text-civic-700">
              Answers API
            </a>
            <a href="/api/health" className="hover:text-civic-700">
              Health
            </a>
            <a href="/llms.txt" className="hover:text-civic-700">
              llms.txt
            </a>
            <a href="/feed.xml" className="hover:text-civic-700">
              RSS (Atom)
            </a>
            <a href="/calendar.ics" className="hover:text-civic-700">
              iCal calendar
            </a>
            <Link href="/datasets" className="hover:text-civic-700">
              Bulk datasets (CSV/JSON)
            </Link>
            <a href="/.well-known/security.txt" className="hover:text-civic-700">
              Security disclosure
            </a>
            <a href="/.well-known/civic-records.json" className="hover:text-civic-700">
              Civic-records manifest
            </a>
            {/* eslint-enable @next/next/no-html-link-for-pages */}
          </div>
        </div>
      </div>
      <div className="border-t border-record-200">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-ink-600 sm:px-6 lg:px-8">
          Editorial content released under Creative Commons Attribution. Cite the record URL.
        </div>
      </div>
    </footer>
  );
}
