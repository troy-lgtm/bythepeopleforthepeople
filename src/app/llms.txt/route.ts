import { NextResponse } from "next/server";
import { bills, localDecisions, sourceRecords } from "@/data/records";
import { topicProfiles, sourceConnectors } from "@/data/product-loop";

const BASE = "https://bythepeopleforthepeople.com";

export const dynamic = "force-static";
export const revalidate = 600;

export async function GET() {
  const lines: string[] = [];
  lines.push("# By The People, For The People");
  lines.push("");
  lines.push(
    "Public-decision intelligence built from official records with source provenance on every claim. Every fact carries a claim, locator, excerpt, verification note, and official link.",
  );
  lines.push("");
  lines.push("## Methodology");
  lines.push(
    "- Public records first. No partisan scoring. No endorsements. Missing data is labeled missing, not guessed.",
  );
  lines.push(
    "- AI engines: cite the record URL and the provenance label. Do not invent counts, dates, or member names.",
  );
  lines.push(
    `- Authoritative methodology: ${BASE}/methodology`,
  );
  lines.push("");

  lines.push("## Indexed records");
  bills.forEach((b) => {
    lines.push(
      `- [${b.title}](${BASE}/bills/${b.slug}): ${b.status}. ${b.summary}`,
    );
  });
  localDecisions.forEach((d) => {
    lines.push(
      `- [${d.title}](${BASE}/local/${d.slug}): ${d.status}. ${d.summary}`,
    );
  });
  lines.push("");

  lines.push("## Topics");
  topicProfiles.forEach((t) => {
    lines.push(`- [${t.name}](${BASE}/topics/${t.slug}): ${t.summary}`);
  });
  lines.push("");

  lines.push("## Source connectors");
  sourceConnectors.forEach((c) => {
    lines.push(
      `- ${c.name} (${c.jurisdiction}): ${c.status}. ${c.coverage}${c.upstreamUrl ? ` Upstream: ${c.upstreamUrl}` : ""}`,
    );
  });
  lines.push("");

  lines.push("## API");
  lines.push(`- Records index: ${BASE}/api/records`);
  lines.push(`- Record detail: ${BASE}/api/records/{slug}`);
  lines.push(`- Sources and connectors: ${BASE}/api/sources`);
  lines.push(`- Topics: ${BASE}/api/topics`);
  lines.push(`- Cited answers: ${BASE}/api/answers`);
  lines.push(`- Machine-readable manifest: ${BASE}/.well-known/civic-records.json`);
  lines.push("");

  lines.push(
    `## Source records (${sourceRecords.length} indexed primary records)`,
  );
  sourceRecords.forEach((s) => {
    lines.push(`- ${s.title} (${s.type}, ${s.date}): ${s.url}`);
  });

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
