import zipToDistrictData from "../data/seed/zip-to-district.json";

/**
 * Canonical place keys for movement filtering. Honest by construction:
 * - "ca" = California Legislature records (state level)
 * - "la" = Los Angeles City Council records (city level)
 * A ZIP maps to "la" only when its primary city is Los Angeles in the indexed
 * ZIP table, and to "ca" only when its state is CA. Anything else gets an
 * explicit empty coverage answer — never a guess.
 *
 * Pure module (no server-only) so npx-tsx scripts can use it.
 */

export type PlaceKey = "ca" | "la";

export type PlaceInfo = {
  key: PlaceKey;
  /** Short human name used in headlines: "LA", "California". */
  shortName: string;
  /** Full human name: "Los Angeles", "California". */
  name: string;
  /** The official body whose records this place key covers. */
  body: string;
  jurisdictionMatch: string;
};

export const PLACES: PlaceInfo[] = [
  {
    key: "la",
    shortName: "LA",
    name: "Los Angeles",
    body: "Los Angeles City Council",
    jurisdictionMatch: "los angeles",
  },
  {
    key: "ca",
    shortName: "California",
    name: "California",
    body: "California Legislature",
    jurisdictionMatch: "california",
  },
];

export function getPlace(key: string): PlaceInfo | null {
  return PLACES.find((p) => p.key === key.toLowerCase()) ?? null;
}

/** Jurisdiction string from a record → the place keys it belongs to. */
export function placeKeysForJurisdiction(jurisdiction: string): PlaceKey[] {
  const lower = jurisdiction.toLowerCase();
  const keys: PlaceKey[] = [];
  if (lower.includes("los angeles")) {
    // LA city records are also California records for state-level views.
    keys.push("la", "ca");
  } else if (lower.includes("california")) {
    keys.push("ca");
  }
  return keys;
}

type ZipEntry = { state: string; cd: number; city: string; county: string };
const zipMap = zipToDistrictData as unknown as Record<
  string,
  ZipEntry | { _note?: string }
>;

function isZipEntry(value: ZipEntry | { _note?: string }): value is ZipEntry {
  return typeof (value as ZipEntry).state === "string";
}

export type ZipPlace = {
  zip: string;
  city: string;
  state: string;
  county: string;
  /** Place keys whose indexed records cover this ZIP. May be empty. */
  placeKeys: PlaceKey[];
  /** True when the ZIP resolved in the indexed table. */
  known: boolean;
};

/**
 * Resolve a ZIP to indexed coverage. Unknown ZIPs return known=false with no
 * place keys — pages must render that as a labeled coverage gap, not a guess.
 */
export function zipToPlace(zip: string): ZipPlace {
  const trimmed = zip.trim().slice(0, 5);
  const entry = zipMap[trimmed];
  if (!entry || !isZipEntry(entry)) {
    return {
      zip: trimmed,
      city: "",
      state: "",
      county: "",
      placeKeys: [],
      known: false,
    };
  }
  const keys: PlaceKey[] = [];
  if (entry.state === "CA") keys.push("ca");
  if (entry.city.toLowerCase() === "los angeles") keys.unshift("la");
  return {
    zip: trimmed,
    city: entry.city,
    state: entry.state,
    county: entry.county,
    placeKeys: keys,
    known: true,
  };
}

/**
 * Normalize a /what-moved/[place] segment: a known place key or a 5-digit
 * ZIP. Returns null for anything else so routes can 404 honestly.
 */
export function resolvePlaceParam(
  param: string,
):
  | { kind: "place"; place: PlaceInfo }
  | { kind: "zip"; zip: ZipPlace }
  | null {
  const value = param.trim().toLowerCase();
  const place = getPlace(value);
  if (place) return { kind: "place", place };
  if (/^\d{5}$/.test(value)) return { kind: "zip", zip: zipToPlace(value) };
  return null;
}
