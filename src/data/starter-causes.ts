/**
 * Starter cause cards.
 *
 * Methodology guardrails:
 * - Balanced across political framings. Both "more services" and "more
 *   enforcement" framings appear where applicable.
 * - Phrased as user goals in user-facing language, not as policy
 *   prescriptions.
 * - No partisan tag. No endorsement. The user decides their own outcome.
 * - The product matches indexed records to a cause; it does not score
 *   alignment of any official to that cause.
 */

export type StarterCause = {
  id: string;
  emoji: string;
  title: string;
  outcome: string;
  topics: string[];
  watchTermsAny: string[];
};

export const STARTER_CAUSES: StarterCause[] = [
  {
    id: "safer-streets",
    emoji: "🚸",
    title: "Safer streets for my neighborhood",
    outcome:
      "I want fewer traffic deaths and safer walking routes for kids, seniors, and people on bikes.",
    topics: ["Land use"],
    watchTermsAny: [
      "vision zero",
      "speed limit",
      "crosswalk",
      "bike lane",
      "sidewalk",
      "school zone",
      "traffic calming",
      "pedestrian",
    ],
  },
  {
    id: "wildfire-prevention",
    emoji: "🔥",
    title: "Wildfire prevention near my home",
    outcome:
      "I want effective fire prevention, brush clearance, and evacuation planning where I live.",
    topics: ["Fires"],
    watchTermsAny: [
      "fire",
      "wildfire",
      "evacuation",
      "brush",
      "defensible space",
      "cal fire",
      "prescribed burn",
    ],
  },
  {
    id: "homelessness-services",
    emoji: "🏠",
    title: "Help for people who are homeless",
    outcome:
      "I want effective services and housing for unhoused neighbors in my city.",
    topics: ["Homelessness"],
    watchTermsAny: [
      "homeless",
      "encampment",
      "shelter",
      "lahsa",
      "hhap",
      "permanent supportive",
      "outreach",
    ],
  },
  {
    id: "encampment-policy",
    emoji: "⚖️",
    title: "Encampment policy and enforcement",
    outcome:
      "I want a clear, consistent policy for sidewalk and park encampments in my city.",
    topics: ["Homelessness"],
    watchTermsAny: [
      "encampment",
      "sit lie",
      "anti-camping",
      "sidewalk",
      "sweep",
      "ordinance",
    ],
  },
  {
    id: "affordable-housing-supply",
    emoji: "🏘",
    title: "More housing supply where I live",
    outcome:
      "I want more housing built — apartments, ADUs, transit-oriented projects — so my rent stops rising.",
    topics: ["Housing", "Land use"],
    watchTermsAny: [
      "housing",
      "rent",
      "zoning",
      "tod",
      "transit-oriented",
      "adu",
      "ceqa",
      "density",
    ],
  },
  {
    id: "tenant-protections",
    emoji: "📑",
    title: "Tenant and renter protections",
    outcome:
      "I want stronger renter protections — rent control, just-cause eviction, security-deposit rules.",
    topics: ["Housing"],
    watchTermsAny: [
      "rent control",
      "just cause",
      "eviction",
      "tenant",
      "rent stabilization",
      "anti-displacement",
    ],
  },
  {
    id: "public-safety-policing",
    emoji: "🚓",
    title: "Public safety and policing",
    outcome:
      "I want effective policing, accountable to civilians, with clear standards.",
    topics: [],
    watchTermsAny: [
      "police",
      "policing",
      "public safety",
      "law enforcement",
      "consent decree",
      "civilian oversight",
      "officer training",
    ],
  },
  {
    id: "clean-air-water",
    emoji: "🌱",
    title: "Clean air and clean water",
    outcome:
      "I want cleaner air to breathe and cleaner water to drink in the places I live and work.",
    topics: [],
    watchTermsAny: [
      "air quality",
      "emissions",
      "refinery",
      "port",
      "diesel",
      "drinking water",
      "pfas",
      "lead",
    ],
  },
  {
    id: "schools",
    emoji: "🎒",
    title: "Better schools for my kids",
    outcome:
      "I want public schools to be well funded and accountable to parents and teachers.",
    topics: [],
    watchTermsAny: [
      "school",
      "education",
      "lcap",
      "curriculum",
      "school board",
      "school funding",
    ],
  },
  {
    id: "cost-of-living",
    emoji: "💵",
    title: "Lower cost of living",
    outcome:
      "I want lower taxes, lower utility bills, and policies that ease everyday costs.",
    topics: [],
    watchTermsAny: [
      "tax",
      "utility",
      "rate",
      "fee",
      "cost",
      "affordability",
      "energy",
    ],
  },
  {
    id: "small-business",
    emoji: "🛠️",
    title: "Help small businesses in my city",
    outcome:
      "I want policy that makes it easier to start, hire for, and run a small business locally.",
    topics: [],
    watchTermsAny: [
      "small business",
      "license",
      "permit",
      "business tax",
      "main street",
      "storefront",
    ],
  },
  {
    id: "transit-and-roads",
    emoji: "🚊",
    title: "Better transit and roads",
    outcome:
      "I want reliable transit and well-maintained roads where I live and commute.",
    topics: ["Land use"],
    watchTermsAny: [
      "transit",
      "metro",
      "bus",
      "rail",
      "pothole",
      "road",
      "infrastructure",
      "paving",
    ],
  },
];
