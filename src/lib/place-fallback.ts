import "server-only";
import type { Place } from "./place";

const ZIPPOPOTAM = "https://api.zippopotam.us/us";
const CENSUS_COORDS =
  "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";

type ZipResp = {
  places?: Array<{
    "place name"?: string;
    longitude?: string;
    latitude?: string;
    "state abbreviation"?: string;
  }>;
};

type CensusResp = {
  result?: {
    geographies?: {
      "119th Congressional Districts"?: Array<{ CD119?: string }>;
      Counties?: Array<{ BASENAME?: string }>;
      "Incorporated Places"?: Array<{ BASENAME?: string }>;
    };
  };
};

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "bythepeopleforthepeople-ingest/1.0" },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Live lookup for any US ZIP code:
 * 1. zippopotam.us → city, state, lat, lon
 * 2. Census Geographies → 119th congressional district number
 *
 * Returns null on any failure. Caller falls back to "not in index" copy.
 */
export async function liveLookupZip(zip: string): Promise<Place | null> {
  const trimmed = zip.trim().slice(0, 5);
  if (!/^\d{5}$/.test(trimmed)) return null;

  try {
    const zipRes = await fetchWithTimeout(`${ZIPPOPOTAM}/${trimmed}`, 5000);
    if (!zipRes.ok) return null;
    const zipJson = (await zipRes.json()) as ZipResp;
    const place = zipJson.places?.[0];
    if (!place?.latitude || !place?.longitude || !place["state abbreviation"]) {
      return null;
    }

    const params = new URLSearchParams({
      x: place.longitude,
      y: place.latitude,
      benchmark: "Public_AR_Current",
      vintage: "Current_Current",
      layers: "Counties,Incorporated Places,119th Congressional Districts",
      format: "json",
    });
    const censusRes = await fetchWithTimeout(
      `${CENSUS_COORDS}?${params.toString()}`,
      6000,
    );
    if (!censusRes.ok) return null;
    const censusJson = (await censusRes.json()) as CensusResp;
    const cdEntry =
      censusJson.result?.geographies?.["119th Congressional Districts"]?.[0];
    const cdRaw = cdEntry?.CD119;
    if (!cdRaw) return null;
    const cd = Number.parseInt(cdRaw, 10);
    if (Number.isNaN(cd)) return null;

    const county =
      censusJson.result?.geographies?.Counties?.[0]?.BASENAME ??
      "Unknown county";
    const cityFromCensus =
      censusJson.result?.geographies?.["Incorporated Places"]?.[0]?.BASENAME;
    const city = cityFromCensus ?? place["place name"] ?? "Unknown city";

    return {
      zip: trimmed,
      state: place["state abbreviation"],
      cd,
      city,
      county,
    };
  } catch {
    return null;
  }
}
