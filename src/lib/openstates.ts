import "server-only";

export type OfficialLevel = "state" | "county" | "municipality" | "other";

export type Official = {
  id: string;
  name: string;
  party?: string;
  title: string;
  org: string;
  district?: string;
  jurisdiction: string;
  level: OfficialLevel;
  url?: string;
  email?: string;
};

export type OfficialsResult = {
  configured: boolean;
  officials: Official[];
  error?: string;
};

type OpenStatesPerson = {
  id: string;
  name: string;
  party?: string;
  email?: string;
  openstates_url?: string;
  current_role?: {
    title?: string;
    org_classification?: string;
    district?: string | number;
  };
  jurisdiction?: { name?: string; classification?: string };
};

export function openStatesConfigured(): boolean {
  return Boolean(process.env.OPENSTATES_API_KEY);
}

function mapPerson(p: OpenStatesPerson): Official {
  const jc = p.jurisdiction?.classification;
  const level: OfficialLevel =
    jc === "state"
      ? "state"
      : jc === "municipality"
        ? "municipality"
        : jc === "county"
          ? "county"
          : "other";
  return {
    id: p.id,
    name: p.name,
    party: p.party,
    title: p.current_role?.title ?? "Official",
    org: p.current_role?.org_classification ?? "",
    district:
      p.current_role?.district != null
        ? String(p.current_role.district)
        : undefined,
    jurisdiction: p.jurisdiction?.name ?? "",
    level,
    url: p.openstates_url,
    email: p.email,
  };
}

/**
 * Real state (and where covered, local) officials whose districts contain a
 * point, via OpenStates v3 people.geo. Degrades gracefully to {configured:false}
 * with no key. Never fabricates — returns only what OpenStates actually serves.
 */
export async function getOfficialsByPoint(
  lat: number,
  lng: number,
): Promise<OfficialsResult> {
  const key = process.env.OPENSTATES_API_KEY;
  if (!key) return { configured: false, officials: [] };
  const url = `https://v3.openstates.org/people.geo?lat=${lat}&lng=${lng}&apikey=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) {
      return { configured: true, officials: [], error: `status ${res.status}` };
    }
    const data = (await res.json()) as { results?: OpenStatesPerson[] };
    return {
      configured: true,
      officials: (data.results ?? []).map(mapPerson),
    };
  } catch (err) {
    return {
      configured: true,
      officials: [],
      error: err instanceof Error ? err.message : "request failed",
    };
  }
}
