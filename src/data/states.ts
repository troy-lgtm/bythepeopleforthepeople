export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin",
  WY: "Wyoming", AS: "American Samoa", GU: "Guam", MP: "Northern Mariana Islands",
  PR: "Puerto Rico", VI: "U.S. Virgin Islands",
};

/**
 * Known place jurisdictions that belong to a state but do not contain the state
 * name in their label (e.g. "Los Angeles City Council" is California). Keys are
 * lowercase substrings tested against a jurisdiction label; values are the
 * owning state abbreviation. Extend this as place-level connectors land.
 */
const JURISDICTION_PLACE_TO_STATE: Array<{ match: string; abbr: string }> = [
  { match: "los angeles", abbr: "CA" },
];

/**
 * Resolve a free-text jurisdiction label (e.g. "California Legislature",
 * "Los Angeles City Council", "Washington, DC") to a single state/territory
 * abbreviation, or null when it cannot be tied to exactly one state.
 *
 * Matching is word-boundary and DC-aware so an ambiguous token like
 * "Washington" does not cross-match the state of Washington against a
 * "Washington, DC" jurisdiction.
 */
export function jurisdictionState(jurisdiction: string): string | null {
  const label = jurisdiction.toLowerCase().trim();
  if (!label) return null;

  // DC markers win first so "Washington, DC" never reads as the state.
  if (/\bd\.?c\.?\b/.test(label) || label.includes("district of columbia")) {
    return "DC";
  }

  // Explicit place → state hints (cities/counties that omit the state name).
  for (const { match, abbr } of JURISDICTION_PLACE_TO_STATE) {
    if (label.includes(match)) return abbr;
  }

  // Otherwise require the full state name as a whole-word match. Test longest
  // names first so "West Virginia" wins over "Virginia", "North Carolina" over
  // "Carolina", etc.
  const byLongest = Object.entries(STATE_NAMES)
    .filter(([abbr]) => abbr !== "DC") // handled above
    .sort((a, b) => b[1].length - a[1].length);
  for (const [abbr, name] of byLongest) {
    const re = new RegExp(`\\b${name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (re.test(label)) return abbr;
  }
  return null;
}

/** True when a jurisdiction label belongs to the given state abbreviation. */
export function jurisdictionInState(jurisdiction: string, abbr: string): boolean {
  return jurisdictionState(jurisdiction) === abbr.toUpperCase();
}

export const STATE_CAPITAL: Record<string, string> = {
  AL: "Montgomery", AK: "Juneau", AZ: "Phoenix", AR: "Little Rock", CA: "Sacramento",
  CO: "Denver", CT: "Hartford", DE: "Dover", DC: "Washington",
  FL: "Tallahassee", GA: "Atlanta", HI: "Honolulu", ID: "Boise", IL: "Springfield",
  IN: "Indianapolis", IA: "Des Moines", KS: "Topeka", KY: "Frankfort", LA: "Baton Rouge",
  ME: "Augusta", MD: "Annapolis", MA: "Boston", MI: "Lansing", MN: "Saint Paul",
  MS: "Jackson", MO: "Jefferson City", MT: "Helena", NE: "Lincoln", NV: "Carson City",
  NH: "Concord", NJ: "Trenton", NM: "Santa Fe", NY: "Albany",
  NC: "Raleigh", ND: "Bismarck", OH: "Columbus", OK: "Oklahoma City",
  OR: "Salem", PA: "Harrisburg", RI: "Providence", SC: "Columbia",
  SD: "Pierre", TN: "Nashville", TX: "Austin", UT: "Salt Lake City", VT: "Montpelier",
  VA: "Richmond", WA: "Olympia", WV: "Charleston", WI: "Madison",
  WY: "Cheyenne", AS: "Pago Pago", GU: "Hagåtña", MP: "Saipan",
  PR: "San Juan", VI: "Charlotte Amalie",
};
