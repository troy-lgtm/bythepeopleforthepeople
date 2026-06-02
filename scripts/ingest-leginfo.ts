#!/usr/bin/env -S npx tsx
/**
 * LegInfo ingest adapter.
 *
 * Pulls a single California bill from leginfo.legislature.ca.gov and emits a
 * JSON record suitable for hand-merging into src/data/records.ts (or
 * src/data/seed/leginfo/<bill>.json once the ingest pipeline is automated).
 *
 * Usage:
 *   npx tsx scripts/ingest-leginfo.ts 202520260SB79
 *   npx tsx scripts/ingest-leginfo.ts 202520260AB130
 *
 * Bill ID format: <session-year-pair><house-and-number>
 *   - 202520260 = 2025-2026 regular session
 *   - SB79 = Senate Bill 79
 *   - AB130 = Assembly Bill 130
 *
 * The script does NOT write to src/data/records.ts directly. Run it, eyeball
 * the JSON output, verify against the official LegInfo page, then merge.
 *
 * Methodology rule: never commit records the script could not fetch and
 * parse successfully against the live source.
 */

type LegInfoSnapshot = {
  billId: string;
  fetchedAt: string;
  sources: {
    text: string;
    status: string;
    history: string;
    votes: string;
    compare: string;
  };
  rawSizes: {
    text: number;
    status: number;
    history: number;
    votes: number;
  };
  notes: string[];
};

const BASE = "https://leginfo.legislature.ca.gov/faces";

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "bythepeopleforthepeople-ingest/1.0" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return res.text();
}

function parseTitleFromBillText(html: string): string | null {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  if (!match) return null;
  return match[1].trim();
}

function extractActionLines(historyHtml: string): string[] {
  const lines: string[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let row;
  while ((row = rowRegex.exec(historyHtml)) !== null) {
    const cells = Array.from(row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map(
      (m) =>
        m[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
    );
    if (cells.length >= 2) {
      const date = cells[0];
      const description = cells.slice(1).join(" | ");
      if (/\d{4}/.test(date)) {
        lines.push(`${date}: ${description}`);
      }
    }
  }
  return lines;
}

async function main() {
  const billId = process.argv[2];
  if (!billId) {
    console.error(
      "Usage: npx tsx scripts/ingest-leginfo.ts <billId>\n  Example: 202520260SB79",
    );
    process.exit(1);
  }

  const sources = {
    text: `${BASE}/billNavClient.xhtml?bill_id=${billId}`,
    status: `${BASE}/billStatusClient.xhtml?bill_id=${billId}`,
    history: `${BASE}/billHistoryClient.xhtml?bill_id=${billId}`,
    votes: `${BASE}/billVotesClient.xhtml?bill_id=${billId}`,
    compare: `${BASE}/billVersionsCompareClient.xhtml?bill_id=${billId}`,
  };

  const [text, status, history, votes] = await Promise.all([
    fetchText(sources.text),
    fetchText(sources.status),
    fetchText(sources.history),
    fetchText(sources.votes),
  ]);

  const title = parseTitleFromBillText(text);
  const actions = extractActionLines(history).slice(-20);

  const snapshot: LegInfoSnapshot = {
    billId,
    fetchedAt: new Date().toISOString(),
    sources,
    rawSizes: {
      text: text.length,
      status: status.length,
      history: history.length,
      votes: votes.length,
    },
    notes: [
      `Page title: ${title ?? "(none parsed)"}`,
      `Recent action lines parsed: ${actions.length}`,
      `LegInfo HTML uses JSF and is server-rendered; for production we should switch to the LegInfo XML data export.`,
    ],
  };

  const output = {
    snapshot,
    suggestedSourceRecords: [
      {
        id: `src-${billId.toLowerCase()}-text`,
        title: title ?? `${billId} bill text`,
        type: "bill_text",
        url: sources.text,
        date: new Date().toISOString().slice(0, 10),
        jurisdiction: "California Legislature",
        provenance: "Official record",
        indexedAt: new Date().toISOString().slice(0, 10),
        verifiedAt: new Date().toISOString().slice(0, 10),
        description: `LegInfo bill text for ${billId}.`,
      },
      {
        id: `src-${billId.toLowerCase()}-status`,
        title: `${billId} status page`,
        type: "bill_status",
        url: sources.status,
        date: new Date().toISOString().slice(0, 10),
        jurisdiction: "California Legislature",
        provenance: "Official record",
        indexedAt: new Date().toISOString().slice(0, 10),
        verifiedAt: new Date().toISOString().slice(0, 10),
        description: `LegInfo status page for ${billId}.`,
      },
    ],
    recentActionLines: actions,
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error("Ingest failed:", err);
  process.exit(1);
});
