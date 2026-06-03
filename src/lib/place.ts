import "server-only";
import { cookies } from "next/headers";
import zipToDistrictData from "@/data/seed/zip-to-district.json";

export type Place = {
  zip: string;
  state: string;
  cd: number;
  city: string;
  county: string;
  councilDistrict?: string;
};

export const PLACE_COOKIE = "btpftp-place";

type ZipEntry = Omit<Place, "zip">;
const zipMap = zipToDistrictData as unknown as Record<string, ZipEntry | { _note?: string }>;

function isZipEntry(value: ZipEntry | { _note?: string }): value is ZipEntry {
  return typeof (value as ZipEntry).state === "string";
}

export function lookupZip(zip: string): Place | null {
  const trimmed = zip.trim().slice(0, 5);
  const entry = zipMap[trimmed];
  if (!entry || !isZipEntry(entry)) {
    return null;
  }
  return { zip: trimmed, ...entry };
}

export function knownZips(): string[] {
  return Object.keys(zipMap).filter((k) => !k.startsWith("_"));
}

export type ZipSuggestion = { zip: string; city: string; state: string };

/**
 * Address-style autocomplete over the static metro table. Matches a ZIP prefix
 * or a city/state substring. Long-tail ZIPs not in the table still resolve on
 * submit via the Census fallback.
 */
export function searchZips(q: string, limit = 8): ZipSuggestion[] {
  const query = q.trim().toLowerCase();
  if (query.length < 2) return [];
  const out: ZipSuggestion[] = [];
  const seen = new Set<string>();
  for (const [zip, entry] of Object.entries(zipMap)) {
    if (zip.startsWith("_") || !isZipEntry(entry)) continue;
    const label = `${entry.city}, ${entry.state}`.toLowerCase();
    if (zip.startsWith(query) || label.includes(query)) {
      const dedupe = `${entry.city}-${entry.state}-${zip}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      out.push({ zip, city: entry.city, state: entry.state });
      if (out.length >= limit) break;
    }
  }
  return out;
}

export async function readPlace(): Promise<Place | null> {
  const store = await cookies();
  const raw = store.get(PLACE_COOKIE)?.value;
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Place;
    if (!parsed.zip) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
