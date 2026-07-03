import type { Cause } from "../data/types";

/**
 * Canonical cause catalog: the ten issues the product watches out of the box.
 * Deterministic keyword matching only — no model in the loop, no scoring of
 * officials, no partisan framing. A record can match many causes.
 *
 * Pure module (no server-only) so npx-tsx scripts can use it.
 */

export type CatalogCause = {
  slug: string;
  name: string;
  /** User-language description of what gets watched. */
  description: string;
  /** Lowercase keywords matched against record topics, titles, and summaries. */
  keywords: string[];
  /** Hits on these cancel a keyword match (disambiguation, not censorship). */
  negativeKeywords: string[];
  /** Topic labels (as used in record data) that match directly. */
  topics: string[];
  /** Jurisdictions with indexed coverage today. */
  jurisdictions: string[];
  /** Record IDs that demonstrably match (kept honest by tests). */
  exampleRecordIds: string[];
};

const COVERAGE = ["California Legislature", "Los Angeles City Council"];

export const CAUSE_CATALOG: CatalogCause[] = [
  {
    slug: "homelessness",
    name: "Homelessness",
    description:
      "What government is doing about homelessness: shelter, services, encampment policy, and the money behind each.",
    keywords: [
      "homeless",
      "homelessness",
      "encampment",
      "shelter",
      "unhoused",
      "supportive housing",
      "interim housing",
      "lahsa",
      "outreach",
    ],
    negativeKeywords: [],
    topics: ["Homelessness"],
    jurisdictions: COVERAGE,
    exampleRecordIds: [],
  },
  {
    slug: "housing",
    name: "Housing",
    description:
      "New homes, zoning, rent rules, and building approvals: what actually changes whether housing gets built and what it costs.",
    keywords: [
      "housing",
      "zoning",
      "density",
      "rent",
      "affordable",
      "transit-oriented",
      "housing development",
      "residential development",
      "adu",
      "upzone",
      "residential",
    ],
    negativeKeywords: [],
    topics: ["Housing"],
    jurisdictions: COVERAGE,
    exampleRecordIds: ["bill-ca-sb-79", "local-la-downtown-community-plan"],
  },
  {
    slug: "fires",
    name: "Fires",
    description:
      "Wildfire prevention, brush clearance, evacuation planning, and recovery decisions where you live.",
    keywords: [
      "fire",
      "wildfire",
      "brush",
      "evacuation",
      "defensible space",
      "prescribed burn",
      "cal fire",
      "burn area",
      "fire department",
    ],
    negativeKeywords: ["fired", "ceasefire"],
    topics: ["Fires"],
    jurisdictions: COVERAGE,
    exampleRecordIds: [],
  },
  {
    slug: "crime",
    name: "Crime",
    description:
      "Public-safety decisions: what gets funded, what gets enforced, and what the official record shows.",
    keywords: [
      "crime",
      "theft",
      "burglary",
      "assault",
      "public safety",
      "victim",
      "retail theft",
      "felony",
      "misdemeanor",
    ],
    negativeKeywords: [],
    topics: ["Crime", "Public safety"],
    jurisdictions: COVERAGE,
    exampleRecordIds: [],
  },
  {
    slug: "land-use",
    name: "Land use",
    description:
      "Zoning, community plans, and permits: the decisions that shape what gets built where.",
    keywords: [
      "zoning",
      "land use",
      "community plan",
      "permit",
      "density",
      "downtown",
      "development project",
      "redevelopment",
      "general plan",
      "specific plan",
      "entitlement",
    ],
    negativeKeywords: [],
    topics: ["Land use", "Zoning"],
    jurisdictions: COVERAGE,
    exampleRecordIds: ["bill-ca-sb-79", "local-la-downtown-community-plan"],
  },
  {
    slug: "transportation",
    name: "Transportation",
    description:
      "Transit, streets, and how you get around: service changes, street projects, and the votes behind them.",
    keywords: [
      "transit",
      "bus",
      "rail",
      "metro",
      "traffic",
      "bike",
      "pedestrian",
      "highway",
      "transportation",
      "street",
    ],
    negativeKeywords: [],
    topics: ["Transit", "Transportation"],
    jurisdictions: COVERAGE,
    exampleRecordIds: ["bill-ca-sb-79"],
  },
  {
    slug: "small-business",
    name: "Small business",
    description:
      "Permits, fees, and rules that decide how hard it is to open and run a small business.",
    keywords: [
      "small business",
      "permit fee",
      "business license",
      "storefront",
      "vendor",
      "sidewalk vending",
      "commercial lease",
      "business tax",
    ],
    negativeKeywords: [],
    topics: ["Small business"],
    jurisdictions: COVERAGE,
    exampleRecordIds: [],
  },
  {
    slug: "taxes",
    name: "Taxes",
    description:
      "Taxes, bonds, and budgets: where public money comes from and where the record says it goes.",
    keywords: [
      "tax",
      "levy",
      "bond",
      "assessment",
      "revenue",
      "budget",
      "appropriation",
      "fee increase",
    ],
    negativeKeywords: ["taxi"],
    topics: ["Taxes", "Budget"],
    jurisdictions: COVERAGE,
    exampleRecordIds: [],
  },
  {
    slug: "schools",
    name: "Schools",
    description:
      "Education decisions: funding, programs, and policies that reach classrooms.",
    keywords: [
      "school",
      "student",
      "classroom",
      "education",
      "teacher",
      "curriculum",
      "school district",
      "lausd",
    ],
    negativeKeywords: [],
    topics: ["Schools", "Education"],
    jurisdictions: COVERAGE,
    exampleRecordIds: [],
  },
  {
    slug: "policing",
    name: "Policing",
    description:
      "Police budgets, oversight, and policy: what the official record shows, without a score in either direction.",
    keywords: [
      "police",
      "lapd",
      "officer",
      "police oversight",
      "civilian oversight",
      "use of force",
      "sheriff",
      "patrol",
      "police commission",
    ],
    negativeKeywords: [],
    topics: ["Policing", "Public safety"],
    jurisdictions: COVERAGE,
    exampleRecordIds: [],
  },
];

export function getCatalogCause(slug: string): CatalogCause | null {
  return CAUSE_CATALOG.find((c) => c.slug === slug.toLowerCase()) ?? null;
}

/**
 * Deterministic matcher: does this text belong to this cause?
 * A topic hit or any keyword hit counts; a negative-keyword hit cancels the
 * keyword that triggered inside it (e.g. "ceasefire" must not match "fires").
 */
export function causeMatchesText(
  cause: CatalogCause,
  opts: { topics?: string[]; text: string },
): boolean {
  const topicSet = new Set((opts.topics ?? []).map((t) => t.toLowerCase()));
  if (cause.topics.some((t) => topicSet.has(t.toLowerCase()))) return true;

  const lower = ` ${opts.text.toLowerCase()} `;
  for (const keyword of cause.keywords) {
    let idx = lower.indexOf(keyword);
    while (idx !== -1) {
      const hitContext = lower.slice(
        Math.max(0, idx - 12),
        idx + keyword.length + 12,
      );
      const cancelled = cause.negativeKeywords.some((neg) =>
        hitContext.includes(neg),
      );
      if (!cancelled) return true;
      idx = lower.indexOf(keyword, idx + keyword.length);
    }
  }
  return false;
}

/** All catalog causes whose criteria match the given record text. */
export function matchCausesForText(opts: {
  topics?: string[];
  text: string;
}): string[] {
  return CAUSE_CATALOG.filter((c) => causeMatchesText(c, opts)).map(
    (c) => c.slug,
  );
}

/**
 * Adapt a catalog cause into the user-cause shape so the existing
 * cause-matcher and digest plumbing can reuse it unchanged.
 */
export function catalogCauseToCause(cause: CatalogCause): Cause {
  return {
    id: `catalog-${cause.slug}`,
    title: cause.name,
    outcome: cause.description,
    topics: cause.topics,
    jurisdictions: cause.jurisdictions,
    watchTermsAny: cause.keywords,
    createdAt: "2026-06-10T00:00:00.000Z",
  };
}
