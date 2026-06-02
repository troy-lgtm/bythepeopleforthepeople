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
