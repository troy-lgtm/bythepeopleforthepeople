import "server-only";

export type MemberBill = {
  title: string;
  congress?: number;
  type?: string;
  number?: string;
  introducedDate?: string;
  latestAction?: string;
  url?: string;
};

export type MemberLegislation = {
  configured: boolean;
  sponsored: MemberBill[];
  cosponsored: MemberBill[];
  error?: string;
};

export function congressConfigured(): boolean {
  return Boolean(process.env.CONGRESS_GOV_API_KEY);
}

function humanUrl(b: { congress?: number; type?: string; number?: string }): string | undefined {
  if (!b.congress || !b.type || !b.number) return undefined;
  const typeMap: Record<string, string> = {
    hr: "house-bill",
    s: "senate-bill",
    hjres: "house-joint-resolution",
    sjres: "senate-joint-resolution",
    hconres: "house-concurrent-resolution",
    sconres: "senate-concurrent-resolution",
    hres: "house-resolution",
    sres: "senate-resolution",
  };
  const slug = typeMap[b.type.toLowerCase()];
  if (!slug) return undefined;
  return `https://www.congress.gov/bill/${b.congress}th-congress/${slug}/${b.number}`;
}

type RawBill = {
  title?: string;
  congress?: number;
  type?: string;
  number?: string | number;
  introducedDate?: string;
  latestAction?: { text?: string };
};

async function fetchList(url: string, listKey: string): Promise<MemberBill[]> {
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 6 } });
  if (!res.ok) return [];
  const data = (await res.json()) as Record<string, RawBill[] | undefined>;
  const items = data[listKey] ?? [];
  return items.slice(0, 5).map((b) => ({
    title: b.title ?? "Untitled measure",
    congress: b.congress,
    type: b.type,
    number: b.number != null ? String(b.number) : undefined,
    introducedDate: b.introducedDate,
    latestAction: b.latestAction?.text,
    url: humanUrl({
      congress: b.congress,
      type: b.type,
      number: b.number != null ? String(b.number) : undefined,
    }),
  }));
}

/**
 * Real federal legislative activity for a member (sponsored + cosponsored),
 * via the Congress.gov API. Degrades to {configured:false} with no key.
 */
export async function getMemberLegislation(
  bioguideId: string,
): Promise<MemberLegislation> {
  const key = process.env.CONGRESS_GOV_API_KEY;
  if (!key) return { configured: false, sponsored: [], cosponsored: [] };
  if (!bioguideId) return { configured: true, sponsored: [], cosponsored: [] };
  const base = "https://api.congress.gov/v3/member";
  try {
    const [sponsored, cosponsored] = await Promise.all([
      fetchList(
        `${base}/${bioguideId}/sponsored-legislation?limit=5&api_key=${key}`,
        "sponsoredLegislation",
      ),
      fetchList(
        `${base}/${bioguideId}/cosponsored-legislation?limit=5&api_key=${key}`,
        "cosponsoredLegislation",
      ),
    ]);
    return { configured: true, sponsored, cosponsored };
  } catch (err) {
    return {
      configured: true,
      sponsored: [],
      cosponsored: [],
      error: err instanceof Error ? err.message : "request failed",
    };
  }
}
