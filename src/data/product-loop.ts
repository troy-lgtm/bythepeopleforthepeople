import { exploreItems, getSourcesByIds, sourceRecords } from "./records";
import type {
  AnswerIntentRecord,
  AskRecordAnswer,
  DailyChange,
  EntityProfile,
  EvidenceRecord,
  LocalSignal,
  MissingDataRecord,
  RecordAccessItem,
  ShareCardRecord,
  SourceConnector,
  TopicProfile,
  UpcomingAction,
  UserNeedRecord,
  WatchTarget,
} from "./types";

export const sourceEvidence: EvidenceRecord[] = [
  {
    id: "evidence-sb79-status-chaptered",
    sourceId: "src-sb79-status",
    claim: "SB 79 is no longer pending legislation; it is chaptered.",
    locator: "California LegInfo status page",
    excerpt:
      "The indexed status record identifies SB 79 as an inactive, chaptered measure and ties the chaptering record to October 10, 2025.",
    verificationNote:
      "Use this evidence for status claims, not for local implementation claims.",
  },
  {
    id: "evidence-sb79-history-final",
    sourceId: "src-sb79-history",
    claim: "The final legislative actions were Governor approval and Secretary of State chaptering.",
    locator: "LegInfo history actions",
    excerpt:
      "The action history records floor passage, concurrence, enrollment, Governor approval, and Secretary of State chaptering in sequence.",
    verificationNote:
      "Use this evidence when explaining how the bill moved through the process.",
  },
  {
    id: "evidence-sb79-vote-count",
    sourceId: "src-sb79-votes",
    claim: "The Senate concurrence vote was 21 ayes, 8 noes, and 11 no vote recorded.",
    locator: "LegInfo vote records, Senate concurrence motion",
    excerpt:
      "The indexed vote record includes the motion, vote date, chamber, totals, and member-level Senate votes.",
    verificationNote:
      "Use this evidence for vote totals and member vote lists.",
  },
  {
    id: "evidence-sb79-no-votes",
    sourceId: "src-sb79-votes",
    claim: "Eight senators are listed as voting no on the Senate concurrence motion.",
    locator: "LegInfo vote records, member-level Senate vote list",
    excerpt:
      "The no votes indexed in this record are Blakespear, Jones, Niello, Richardson, Seyarto, Stern, Strickland, and Valladares.",
    verificationNote:
      "This is the answer users expect from a 'who voted no' query.",
  },
  {
    id: "evidence-sb79-text-incorporated",
    sourceId: "src-sb79-text",
    claim: "The chaptered text incorporates a transit-oriented development framework.",
    locator: "LegInfo bill text and Legislative Counsel digest",
    excerpt:
      "The indexed text adds a Government Code transit-oriented development chapter with TOD stop definitions, project standards, local alternative plans, transit-agency zoning standards, and HCD review pathways.",
    verificationNote:
      "Use this evidence for what became part of the chaptered bill text.",
  },
  {
    id: "evidence-la-final-action",
    sourceId: "src-la-cf-22-0617-actions",
    claim: "Council File 22-0617 reached Council action final.",
    locator: "LA City Clerk Council File action history",
    excerpt:
      "The indexed action history records Council adoption on June 17, 2025 and Council action final on June 18, 2025.",
    verificationNote:
      "Use this evidence for local procedural posture and final-action claims.",
  },
  {
    id: "evidence-la-incorporated",
    sourceId: "src-la-cf-22-0617",
    claim: "The council file incorporates the Downtown LA plan update and zoning actions.",
    locator: "LA City Clerk Council File report title and file scope",
    excerpt:
      "The indexed council file tracks the Downtown Los Angeles Community Plan Update 2040, General Plan Amendment, Zone Change, CPIO materials, and New Zoning Code actions.",
    verificationNote:
      "Use this evidence to explain the scope of the local file without assigning a policy score.",
  },
  {
    id: "evidence-la-comments",
    sourceId: "src-la-cf-22-0617-community-impact",
    claim: "Public comment entries exist, but the underlying filings are not yet fully indexed here.",
    locator: "LA City Clerk Council File public filing entries",
    excerpt:
      "The indexed file shows Community Impact Statement entries in the file history. The underlying attachment text is labeled as not fully indexed.",
    verificationNote:
      "Use this evidence to avoid inventing public-comment sentiment.",
  },
];

export const answerIntents: AnswerIntentRecord[] = [
  {
    id: "answer-next",
    label: "What happens next?",
    question: "What should I watch next?",
    shortAnswer:
      "SB 79 has no further legislative vote listed. The useful watch is implementation: agency guidance, local alternative plans, local ordinances, and related public records.",
    detailedAnswer:
      "The bill record is closed as legislation, so the next public-record trail moves outside the bill page. For the LA council file, the indexed record shows final Council action; the next useful watch is a related ordinance, correction report, implementation document, or later council file.",
    status: "Watch implementation",
    href: "/watchlist",
    actionLabel: "Set watch points",
    sourceIds: ["src-sb79-status", "src-sb79-text", "src-la-cf-22-0617-actions"],
    evidenceIds: [
      "evidence-sb79-status-chaptered",
      "evidence-sb79-text-incorporated",
      "evidence-la-final-action",
    ],
    relatedResultIds: ["explore-sb79", "explore-la-220617"],
  },
  {
    id: "answer-passed",
    label: "Did it pass?",
    question: "Did this decision pass?",
    shortAnswer:
      "SB 79 passed the Legislature and was chaptered as Chapter 512. The indexed local file shows Council adoption and final Council action for CF 22-0617.",
    detailedAnswer:
      "For SB 79, the decisive record trail is the final floor vote, Governor approval, and Secretary of State chaptering. For CF 22-0617, the City Clerk action history is the current proof for adoption and final action, but this index does not include a member-level final Council vote table.",
    status: "Final action recorded",
    href: "/bills/ca-sb-79#votes",
    actionLabel: "Open vote table",
    sourceIds: ["src-sb79-votes", "src-sb79-status", "src-la-cf-22-0617-actions"],
    evidenceIds: [
      "evidence-sb79-vote-count",
      "evidence-sb79-history-final",
      "evidence-la-final-action",
    ],
    relatedResultIds: [
      "explore-sb79-senate-vote",
      "explore-sb79-assembly-vote",
      "explore-la-220617",
    ],
  },
  {
    id: "answer-no-votes",
    label: "Who voted no?",
    question: "Who voted no?",
    shortAnswer:
      "On the indexed SB 79 Senate concurrence vote, the no votes are Blakespear, Jones, Niello, Richardson, Seyarto, Stern, Strickland, and Valladares.",
    detailedAnswer:
      "The page should show names immediately because that is the user’s actual question. The official vote record remains attached for verification, and the full table appears on the SB 79 detail page.",
    status: "Member list available",
    href: "/bills/ca-sb-79#votes",
    actionLabel: "View member votes",
    sourceIds: ["src-sb79-votes"],
    evidenceIds: ["evidence-sb79-no-votes", "evidence-sb79-vote-count"],
    relatedResultIds: ["explore-sb79-senate-vote"],
  },
  {
    id: "answer-changed",
    label: "What changed?",
    question: "What changed in the record?",
    shortAnswer:
      "SB 79 changed from pending legislation into chaptered law. The chaptered text adds a transit-oriented development framework to state land-use law.",
    detailedAnswer:
      "The important distinction is status plus incorporated text. The status record proves the bill is chaptered; the text and compare-version records support the incorporated chapter summary. Later local implementation remains a separate source trail.",
    status: "Status plus text change",
    href: "/bills/ca-sb-79#amendments",
    actionLabel: "Read incorporated text",
    sourceIds: ["src-sb79-status", "src-sb79-text", "src-sb79-compare"],
    evidenceIds: [
      "evidence-sb79-status-chaptered",
      "evidence-sb79-text-incorporated",
    ],
    relatedResultIds: ["explore-sb79", "explore-sb79-versions"],
  },
  {
    id: "answer-incorporated",
    label: "What’s incorporated?",
    question: "What got incorporated?",
    shortAnswer:
      "The indexed SB 79 text incorporates TOD stop definitions, project eligibility, local alternative-plan rules, transit-agency zoning standards, HCD review, and implementation rules.",
    detailedAnswer:
      "The LA file incorporates the Downtown LA Community Plan Update 2040, General Plan Amendment, Zone Change, CPIO materials, and New Zoning Code actions. The app separates those incorporated records from later implementation materials that are not indexed yet.",
    status: "In final text / file scope",
    href: "/bills/ca-sb-79#amendments",
    actionLabel: "Compare text",
    sourceIds: ["src-sb79-text", "src-sb79-compare", "src-la-cf-22-0617"],
    evidenceIds: ["evidence-sb79-text-incorporated", "evidence-la-incorporated"],
    relatedResultIds: ["explore-sb79-versions", "explore-la-220617"],
  },
  {
    id: "answer-place",
    label: "Does this affect me?",
    question: "Does this affect my place?",
    shortAnswer:
      "The current indexed place signals are California statewide housing/land-use records and a Downtown Los Angeles council file. Relevance depends on whether later local implementation records name your city, district, parcel, or plan area.",
    detailedAnswer:
      "The record should not guess local effect from a state bill alone. It should show the state record, then watch local ordinances, alternative plans, agency guidance, and council files that connect the decision to a specific place.",
    status: "Place relevance requires local records",
    href: "/near-me",
    actionLabel: "Check place signals",
    sourceIds: ["src-sb79-text", "src-la-cf-22-0617"],
    evidenceIds: ["evidence-sb79-text-incorporated", "evidence-la-incorporated"],
    relatedResultIds: ["explore-sb79", "explore-la-220617"],
  },
  {
    id: "answer-proof",
    label: "Show proof",
    question: "Where is the proof?",
    shortAnswer:
      "Each answer is backed by an indexed official record: LegInfo for SB 79 and the LA City Clerk Council File report for CF 22-0617.",
    detailedAnswer:
      "The page should let users verify the source without leaving first: source title, date, record type, claim, on-site excerpt, and official link all stay attached to the answer.",
    status: "Source-backed",
    href: "/sources",
    actionLabel: "Open source library",
    sourceIds: ["src-sb79-status", "src-sb79-votes", "src-la-cf-22-0617"],
    evidenceIds: [
      "evidence-sb79-status-chaptered",
      "evidence-sb79-vote-count",
      "evidence-la-final-action",
    ],
    relatedResultIds: ["explore-sb79", "explore-la-220617"],
  },
];

export const userNeedRecords: UserNeedRecord[] = [
  {
    id: "need-upcoming",
    title: "Upcoming votes and deadlines",
    body:
      "Show the next posted agenda, vote, hearing, or comment deadline only when an official source publishes it.",
    href: "/activity",
    sourceIds: ["src-sb79-status", "src-la-cf-22-0617"],
  },
  {
    id: "need-incorporated",
    title: "What was incorporated",
    body:
      "Translate final bill text and council-file scope into specific sections, requirements, documents, and implementation watch points.",
    href: "/explore",
    sourceIds: ["src-sb79-text", "src-la-cf-22-0617"],
  },
  {
    id: "need-votes",
    title: "Who voted how",
    body:
      "Answer vote questions with counts, member names, motion text, and the official roll-call source attached.",
    href: "/bills/ca-sb-79#votes",
    sourceIds: ["src-sb79-votes"],
  },
  {
    id: "need-place",
    title: "Whether it touches my place",
    body:
      "Start with jurisdiction and topic, then tie statewide or citywide records to later local implementation records.",
    href: "/near-me",
    sourceIds: ["src-sb79-text", "src-la-cf-22-0617"],
  },
];

export const upcomingVoteChecks: RecordAccessItem[] = [
  {
    id: "vote-check-sb79",
    recordId: "sb79",
    label: "Upcoming votes",
    title: "No upcoming legislative vote is listed for SB 79",
    status: "Closed: chaptered",
    body:
      "SB 79 has already moved through the Legislature and is listed as chaptered. The useful next watch is implementation records, local alternative plans, and agency guidance.",
    href: "/bills/ca-sb-79#votes",
    sourceIds: ["src-sb79-status", "src-sb79-history", "src-sb79-votes"],
    proofPoints: [
      "Status page lists the measure as inactive and chaptered.",
      "History records Governor approval and Secretary of State chaptering on October 10, 2025.",
      "Vote records already show Senate concurrence and Assembly passage.",
    ],
  },
  {
    id: "vote-check-la-220617",
    recordId: "la-220617",
    label: "Upcoming votes",
    title: "No upcoming Council vote is visible in this file extract",
    status: "Final action recorded",
    body:
      "The City Clerk report shows Council adoption and Council action final for CF 22-0617. The next useful watch is a related file, ordinance, correction report, or implementation document.",
    href: "/local/la-downtown-community-plan-update",
    sourceIds: ["src-la-cf-22-0617", "src-la-cf-22-0617-actions"],
    proofPoints: [
      "Action history records Council adoption on June 17, 2025.",
      "Action history records Council action final on June 18, 2025.",
      "The indexed extract does not expose a member-level final vote table.",
    ],
  },
  {
    id: "vote-check-watch-queue",
    recordId: "global",
    label: "Watch queue",
    title: "Upcoming votes should appear only when a source posts them",
    status: "Coverage rule",
    body:
      "A future vote should appear when an agenda, daily file, council calendar, or official vote notice is indexed. Until then, the correct answer is that no upcoming vote is present in the record.",
    href: "/sources",
    sourceIds: ["src-sb79-status", "src-la-cf-22-0617"],
    proofPoints: [
      "Future vote claims require an agenda, calendar, daily file, or official notice.",
      "Missing future votes are labeled as missing, not inferred.",
      "Watchlists point users back to source-backed changes.",
    ],
  },
];

export const incorporatedRecords: RecordAccessItem[] = [
  {
    id: "incorporated-sb79",
    recordId: "sb79",
    label: "What is incorporated",
    title: "Chaptered SB 79 incorporates a transit-oriented development chapter",
    status: "In final text",
    body:
      "The chaptered text includes a new transit-oriented development structure: TOD stop definitions, project eligibility, local alternative plans, transit agency zoning standards, HCD review, and implementation rules.",
    href: "/bills/ca-sb-79#amendments",
    sourceIds: ["src-sb79-text", "src-sb79-compare"],
    proofPoints: [
      "Chaptered text adds Government Code Chapter 4.1.5.",
      "The bill text defines TOD stops, Tier 1 and Tier 2 stops, and project standards.",
      "The text includes local alternative plan and HCD review pathways.",
    ],
  },
  {
    id: "incorporated-la-220617",
    recordId: "la-220617",
    label: "What is incorporated",
    title: "CF 22-0617 incorporates Downtown LA plan and zoning actions",
    status: "In council file",
    body:
      "The council file tracks the Downtown Los Angeles Community Plan Update 2040, General Plan Amendment, Zone Change, CPIO materials, New Zoning Code actions, and later correction-report entries.",
    href: "/local/la-downtown-community-plan-update",
    sourceIds: [
      "src-la-cf-22-0617",
      "src-la-cf-22-0617-planning-report",
      "src-la-cf-22-0617-plum",
    ],
    proofPoints: [
      "Council file title lists the Downtown LA Community Plan Update 2040.",
      "The file includes zone change, CPIO, and New Zoning Code references.",
      "Planning report entries and PLUM actions are preserved in the same file trail.",
    ],
  },
  {
    id: "incorporated-not-yet",
    recordId: "global",
    label: "What is not incorporated",
    title: "Downstream implementation records are not in the current file yet",
    status: "Not indexed",
    body:
      "The record separates enacted or adopted text from later implementation materials. If later agency guidance, local ordinances, or attachments are not indexed, they stay in missing-data status.",
    href: "/sources",
    sourceIds: ["src-sb79-status", "src-la-cf-22-0617"],
    proofPoints: [
      "Chaptered status does not itself prove local implementation.",
      "Council final action does not expose every underlying attachment in the indexed extract.",
      "The missing-data panel labels these gaps explicitly.",
    ],
  },
];

export const sourceVerificationRecords: RecordAccessItem[] = [
  {
    id: "verify-leginfo-status",
    recordId: "sb79",
    label: "Verify source",
    title: "SB 79 status comes from California LegInfo",
    status: "Official record",
    body:
      "Users can stay on this site for the plain-English answer while the source trail shows the official LegInfo status, history, text, vote, and compare-version records behind it.",
    href: "/bills/ca-sb-79",
    sourceIds: ["src-sb79-status", "src-sb79-history", "src-sb79-text"],
    proofPoints: [
      "Official status record supports chaptered status.",
      "Official history supports action dates.",
      "Official bill text supports what was incorporated.",
    ],
  },
  {
    id: "verify-leginfo-votes",
    recordId: "sb79",
    label: "Verify source",
    title: "Vote counts come from the LegInfo vote record",
    status: "Official vote record",
    body:
      "The in-site vote table summarizes the motion and counts, while the source trail lets users open the official vote page when they want the original record.",
    href: "/bills/ca-sb-79#votes",
    sourceIds: ["src-sb79-votes"],
    proofPoints: [
      "Senate concurrence count is 21 ayes, 8 noes, and 11 no vote recorded.",
      "Assembly third reading count is 43 ayes, 19 noes, and 18 no vote recorded.",
      "Member-level Senate votes are represented in the in-site vote table.",
    ],
  },
  {
    id: "verify-la-city-clerk",
    recordId: "la-220617",
    label: "Verify source",
    title: "CF 22-0617 comes from the LA City Clerk file report",
    status: "Official record",
    body:
      "The local decision page summarizes the file title, action history, committee action, public filing presence, and missing attachments from the City Clerk report.",
    href: "/local/la-downtown-community-plan-update",
    sourceIds: ["src-la-cf-22-0617", "src-la-cf-22-0617-actions"],
    proofPoints: [
      "Council file report supports the file title and scope.",
      "Action history supports Council adoption and final action.",
      "The indexed extract shows public filing entries but not every attachment.",
    ],
  },
];

export const dailyChanges: DailyChange[] = [
  {
    id: "daily-sb79-chaptered",
    date: "2025-10-10",
    label: "Final status",
    title: "SB 79 was chaptered as Chapter 512",
    description:
      "The official status record shows SB 79 was approved by the Governor and chaptered by the Secretary of State on October 10, 2025.",
    href: "/bills/ca-sb-79",
    urgency: "Watching",
    sourceIds: ["src-sb79-status", "src-sb79-history"],
  },
  {
    id: "daily-sb79-senate-vote",
    date: "2025-09-12",
    label: "Vote record",
    title: "Senate concurrence vote recorded",
    description:
      "The LegInfo vote record shows 21 ayes, 8 noes, and 11 no vote recorded on the Senate concurrence motion.",
    href: "/bills/ca-sb-79#votes",
    urgency: "Watching",
    sourceIds: ["src-sb79-votes"],
  },
  {
    id: "daily-la-final-action",
    date: "2025-06-18",
    label: "Local action final",
    title: "Council action final on CF 22-0617",
    description:
      "The Los Angeles City Clerk report marks Council action final for the Downtown LA Community Plan Update file.",
    href: "/local/la-downtown-community-plan-update",
    urgency: "Watching",
    sourceIds: ["src-la-cf-22-0617-actions"],
  },
  {
    id: "daily-la-plum-action",
    date: "2025-06-10",
    label: "Committee action",
    title: "PLUM Committee approved CF 22-0617 items",
    description:
      "The council file action history records Planning and Land Use Management Committee approval on June 10, 2025.",
    href: "/local/la-downtown-community-plan-update",
    urgency: "Watching",
    sourceIds: ["src-la-cf-22-0617-plum"],
  },
];

export const localSignals: LocalSignal[] = [
  {
    id: "local-signal-la-downtown",
    locationLabel: "Los Angeles",
    title: "Downtown LA community plan file reached final Council action",
    description:
      "CF 22-0617 covers Downtown LA community plan, zone change, CPIO, and New Zoning Code actions.",
    href: "/local/la-downtown-community-plan-update",
    topic: "Land use",
    sourceIds: ["src-la-cf-22-0617", "src-la-cf-22-0617-actions"],
  },
  {
    id: "local-signal-ca-housing",
    locationLabel: "California",
    title: "SB 79 is chaptered and moves from bill tracking to implementation tracking",
    description:
      "The bill record is no longer an active vote tracker; the useful next watch is agency guidance and local implementation records.",
    href: "/bills/ca-sb-79",
    topic: "Housing",
    sourceIds: ["src-sb79-status", "src-sb79-text"],
  },
  {
    id: "local-signal-ca-votes",
    locationLabel: "California",
    title: "SB 79 has published Senate and Assembly vote records",
    description:
      "Vote counts are available in the official LegInfo votes page and should stay tied to the motion text.",
    href: "/bills/ca-sb-79#votes",
    topic: "Votes",
    sourceIds: ["src-sb79-votes"],
  },
];

export const upcomingActions: UpcomingAction[] = [
  {
    id: "upcoming-sb79-implementation-watch",
    date: "Watch next records",
    title: "SB 79: implementation records, not another bill vote",
    body:
      "Because SB 79 is chaptered, the repeat-use value is watching HCD guidance, local alternative plans, local ordinances, and later agency records.",
    href: "/bills/ca-sb-79",
    sourceIds: ["src-sb79-status", "src-sb79-text"],
  },
  {
    id: "upcoming-la-related-files",
    date: "Watch related files",
    title: "CF 22-0617: related ordinances and correction reports",
    body:
      "The Council File report shows final action; the next useful record type is a later related file, ordinance, correction report, or implementation document.",
    href: "/local/la-downtown-community-plan-update",
    sourceIds: ["src-la-cf-22-0617", "src-la-cf-22-0617-actions"],
  },
];

export const missingDataRecords: MissingDataRecord[] = [
  {
    id: "missing-federal-bills",
    title: "Federal congressional records",
    status: "Outside indexed coverage",
    description:
      "Connector adapter is written for Congress.gov but no records are ingested yet. Ingestion lights up when CONGRESS_API_KEY is set and the cron is enabled. Until then, federal questions point to congress.gov directly.",
    expectedSourceType: "bill_status",
    relatedHref: "/sources",
    relatedSourceIds: [],
  },
  {
    id: "missing-sb79-local-implementation",
    title: "Local implementation records for SB 79",
    status: "Outside indexed coverage",
    description:
      "The bill is chaptered, but the current index does not yet include local ordinances, HCD determinations, or agency guidance that may follow.",
    expectedSourceType: "staff_report",
    relatedHref: "/bills/ca-sb-79",
    relatedSourceIds: ["src-sb79-status", "src-sb79-text"],
  },
  {
    id: "missing-sb79-line-diff",
    title: "Machine line diff between all SB 79 versions",
    status: "Awaiting update",
    description:
      "The app links LegInfo compare versions but does not yet compute a full line-by-line diff across every amendment version.",
    expectedSourceType: "compare_versions",
    relatedHref: "/bills/ca-sb-79#amendments",
    relatedSourceIds: ["src-sb79-compare"],
  },
  {
    id: "missing-la-roll-call",
    title: "Member-level vote count for CF 22-0617 final action",
    status: "Not published",
    description:
      "The indexed City Clerk report records Council adoption and final action but does not expose member-level vote counts in the current extract.",
    expectedSourceType: "roll_call_vote",
    relatedHref: "/local/la-downtown-community-plan-update",
    relatedSourceIds: ["src-la-cf-22-0617-actions"],
  },
  {
    id: "missing-la-underlying-filings",
    title: "Indexed PDFs for each CF 22-0617 filing",
    status: "Awaiting update",
    description:
      "The Council File report references filings and community impact statements; the current index links the file report but does not include every underlying attachment yet.",
    expectedSourceType: "public_comment",
    relatedHref: "/local/la-downtown-community-plan-update",
    relatedSourceIds: ["src-la-cf-22-0617-community-impact"],
  },
];

export const watchTargets: WatchTarget[] = [
  {
    id: "watch-sb79",
    title: "SB 79 implementation trail",
    href: "/bills/ca-sb-79",
    type: "Decision",
    alertReason:
      "Watch for agency guidance, local alternative plans, local ordinances, and later implementation records.",
    sourceIds: ["src-sb79-status", "src-sb79-text"],
  },
  {
    id: "watch-la-220617",
    title: "LA Council File 22-0617",
    href: "/local/la-downtown-community-plan-update",
    type: "Decision",
    alertReason:
      "Watch for related council files, ordinances, correction reports, and implementation documents.",
    sourceIds: ["src-la-cf-22-0617"],
  },
  {
    id: "watch-land-use",
    title: "Land use decisions",
    href: "/topics/land-use",
    type: "Topic",
    alertReason:
      "Bills, council files, zoning actions, votes, and source records tagged land use.",
    sourceIds: ["src-sb79-text", "src-la-cf-22-0617"],
  },
  {
    id: "watch-plum",
    title: "LA Planning and Land Use Management Committee",
    href: "/committees/la-planning-land-use-management",
    type: "Committee",
    alertReason:
      "New committee actions, agendas, minutes, reports, and related council-file movements.",
    sourceIds: ["src-la-cf-22-0617-plum"],
  },
  {
    id: "watch-fires",
    title: "Fires",
    href: "/topics/fires",
    type: "Topic",
    alertReason:
      "Fire department reports, wildfire incidents, evacuation orders, fire-code ordinances, and prevention budget actions once indexed.",
    sourceIds: [],
  },
  {
    id: "watch-homelessness",
    title: "Homelessness",
    href: "/topics/homelessness",
    type: "Topic",
    alertReason:
      "LAHSA reports, county HHAP actions, council motions on encampments and shelter, and audit findings once indexed.",
    sourceIds: [],
  },
  {
    id: "watch-crime",
    title: "Crime",
    href: "/topics/crime",
    type: "Topic",
    alertReason:
      "Police Commission actions, DA charging policies, public-safety motions, court filings on policing, and crime data publications once indexed.",
    sourceIds: [],
  },
];

export const shareCards: ShareCardRecord[] = [
  {
    id: "share-sb79-status",
    kicker: "Final status",
    title: "SB 79 is chaptered as Chapter 512",
    summary:
      "The official status and history records show Governor approval and Secretary of State chaptering on October 10, 2025.",
    href: "/bills/ca-sb-79",
    statLabel: "Record state",
    statValue: "Chaptered",
    sourceIds: ["src-sb79-status", "src-sb79-history"],
  },
  {
    id: "share-sb79-vote",
    kicker: "Vote record",
    title: "Senate concurrence: 21 ayes, 8 noes",
    summary:
      "LegInfo records the September 12, 2025 Senate concurrence motion with 21 ayes, 8 noes, and 11 no vote recorded.",
    href: "/bills/ca-sb-79#votes",
    statLabel: "Motion date",
    statValue: "Sep 12",
    sourceIds: ["src-sb79-votes"],
  },
  {
    id: "share-la-final-action",
    kicker: "Local file",
    title: "CF 22-0617 reached Council action final",
    summary:
      "The Los Angeles City Clerk report records final Council action on June 18, 2025 for the Downtown LA Community Plan Update file.",
    href: "/local/la-downtown-community-plan-update",
    statLabel: "Council file",
    statValue: "22-0617",
    sourceIds: ["src-la-cf-22-0617", "src-la-cf-22-0617-actions"],
  },
];

export const sourceConnectors: SourceConnector[] = [
  {
    id: "connector-ca-leginfo",
    name: "California LegInfo",
    jurisdiction: "California Legislature",
    coverage: "Bill text, status, history actions, compare versions, analyses, and vote records.",
    status: "Ingestion-ready",
    records: ["Bill text", "Bill status", "Bill history", "Compare versions", "Roll call vote"],
    upstreamUrl: "https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml",
  },
  {
    id: "connector-la-council-file",
    name: "Los Angeles Council File Management System",
    jurisdiction: "Los Angeles City Council",
    coverage: "Council file reports, action history, committee actions, filings, ordinances, and related PDFs.",
    status: "Ingestion-ready",
    records: ["Council file", "Meeting minutes", "Staff report", "Public comment"],
    upstreamUrl: "https://cityclerk.lacity.org/lacityclerkconnect/",
  },
  {
    id: "connector-congress",
    name: "Congress.gov",
    jurisdiction: "United States Congress",
    coverage:
      "Federal bills, actions, roll call records, amendments, committee materials. Connector spec written; ingestion lights up when CONGRESS_API_KEY is set.",
    status: "Documented adapter",
    records: ["Bill text", "Bill status", "Hearing transcript", "Roll call vote"],
    adapterEnv: "CONGRESS_API_KEY",
    upstreamUrl: "https://api.congress.gov/",
  },
  {
    id: "connector-la-county-bos",
    name: "LA County Board of Supervisors",
    jurisdiction: "Los Angeles County",
    coverage:
      "County board agendas, statements of proceedings, motion text, and vote records. Adapter spec written against the public agenda system.",
    status: "Documented adapter",
    records: ["Council file", "Meeting minutes", "Staff report", "Roll call vote"],
    upstreamUrl: "https://bos.lacounty.gov/Board-Meeting/Board-Agendas",
  },
  {
    id: "connector-lahsa",
    name: "Los Angeles Homeless Services Authority (LAHSA)",
    jurisdiction: "Los Angeles County",
    coverage:
      "LAHSA commission agendas, strategy reports, point-in-time counts, and contract actions for homelessness policy records.",
    status: "Planned coverage",
    records: ["Meeting minutes", "Staff report", "Public filing"],
    upstreamUrl: "https://www.lahsa.org/about/leadership-governance",
  },
  {
    id: "connector-calfire",
    name: "CAL FIRE incident and prevention",
    jurisdiction: "California",
    coverage:
      "Active wildfire incidents, evacuation orders, fire-prevention reports, and budget actions tagged to fire safety.",
    status: "Planned coverage",
    records: ["Public filing", "Staff report"],
    upstreamUrl: "https://www.fire.ca.gov/incidents",
  },
];

export const askRecordAnswers: AskRecordAnswer[] = [
  {
    id: "ask-summary",
    question: "What is this bill?",
    answer:
      "SB 79 is a California land-use bill about housing development near transit-oriented development stops. The official status page lists it as an inactive bill that has been chaptered.",
    sourceIds: ["src-sb79-status", "src-sb79-text"],
  },
  {
    id: "ask-changed",
    question: "What changed?",
    answer:
      "The important record change is procedural: SB 79 is no longer pending legislation. It was approved by the Governor and chaptered by the Secretary of State as Chapter 512.",
    sourceIds: ["src-sb79-status", "src-sb79-history"],
  },
  {
    id: "ask-next",
    question: "What happens next?",
    answer:
      "No further legislative vote is listed. The next public-record trail should be implementation: agency guidance, local alternative plans, ordinances, or related local files.",
    sourceIds: ["src-sb79-status", "src-sb79-text"],
  },
  {
    id: "ask-voted",
    question: "Who voted?",
    answer:
      "The Senate concurrence vote on September 12, 2025 was 21 ayes, 8 noes, and 11 no vote recorded. The Assembly vote on September 11 was 43 ayes, 19 noes, and 18 no vote recorded.",
    sourceIds: ["src-sb79-votes"],
  },
  {
    id: "ask-missing",
    question: "What is missing?",
    answer:
      "The current index has official bill records but not downstream implementation records or a full computed line diff across all versions.",
    sourceIds: ["src-sb79-compare", "src-sb79-status"],
  },
];

export const localAskAnswers: AskRecordAnswer[] = [
  {
    id: "ask-local-summary",
    question: "What is being decided?",
    answer:
      "Council File 22-0617 concerns the Downtown Los Angeles Community Plan Update 2040, General Plan Amendment, Zone Change, CPIO, and New Zoning Code actions.",
    sourceIds: ["src-la-cf-22-0617"],
  },
  {
    id: "ask-local-next",
    question: "What happens next?",
    answer:
      "The indexed report shows Council action final. The useful next watch is later related files, ordinances, correction reports, or implementation documents.",
    sourceIds: ["src-la-cf-22-0617-actions"],
  },
  {
    id: "ask-local-comment",
    question: "What did public comments show?",
    answer:
      "The report lists Community Impact Statement entries, but the app does not infer sentiment from filings until each underlying document is indexed.",
    sourceIds: ["src-la-cf-22-0617-community-impact"],
  },
];

export const entityProfiles: EntityProfile[] = [
  {
    id: "entity-scott-wiener",
    slug: "senator-scott-wiener",
    kind: "person",
    name: "Senator Scott Wiener",
    role: "Lead author, SB 79",
    jurisdiction: "California Legislature",
    summary:
      "LegInfo lists Senator Scott Wiener as the lead author of SB 79. This profile is a source-linked navigation point, not a candidate score.",
    relatedDecisionIds: ["explore-sb79", "explore-sb79-versions", "explore-sb79-senate-vote"],
    watchedFor: ["Bill status", "Vote records", "Amendments", "Implementation records"],
    sourceIds: ["src-sb79-status", "src-sb79-text"],
    watchTargetId: "watch-sb79",
  },
  {
    id: "entity-la-plum",
    slug: "la-planning-land-use-management",
    kind: "committee",
    name: "LA Planning and Land Use Management Committee",
    role: "Committee action recorded in CF 22-0617",
    jurisdiction: "Los Angeles City Council",
    summary:
      "The City Clerk report records PLUM Committee actions on the Downtown LA Community Plan Update file.",
    relatedDecisionIds: ["explore-la-220617", "explore-la-220617-plum"],
    watchedFor: ["Agenda posts", "Committee actions", "Staff reports", "Council file movement"],
    sourceIds: ["src-la-cf-22-0617-plum", "src-la-cf-22-0617"],
    watchTargetId: "watch-plum",
  },
];

export const topicProfiles: TopicProfile[] = [
  {
    id: "topic-fires",
    slug: "fires",
    name: "Fires",
    summary:
      "Fire-safety and wildfire decisions: city and county fire-department reports, CAL FIRE incident and prevention records, evacuation orders, fire-code ordinances, and budget actions. Coverage is being indexed; the page labels what is and is not yet in the index.",
    relatedItemIds: [],
    watchPrompts: [
      "Fire department status updates",
      "Wildfire incident records",
      "Fire-code ordinances and amendments",
      "Evacuation orders and rescissions",
      "Fire prevention and brush-clearance budget actions",
    ],
    sourceIds: [],
    watchTargetId: "watch-fires",
  },
  {
    id: "topic-homelessness",
    slug: "homelessness",
    name: "Homelessness",
    summary:
      "Homelessness policy decisions: LAHSA reports, county HHAP grant actions, city council motions on encampments and shelter, ordinance updates, audit findings, and state housing-services records. Coverage is being indexed; the page labels what is and is not yet in the index.",
    relatedItemIds: [],
    watchPrompts: [
      "LAHSA reports and strategy filings",
      "County HHAP grant and contract actions",
      "City Council encampment and shelter motions",
      "Audit findings on homelessness spending",
      "State housing services budget records",
    ],
    sourceIds: [],
    watchTargetId: "watch-homelessness",
  },
  {
    id: "topic-crime",
    slug: "crime",
    name: "Crime",
    summary:
      "Public-safety decisions: Police Commission actions, District Attorney charging policies, city council public-safety motions, ordinance changes, court filings on policing, and crime data publications. Coverage is being indexed; the page labels what is and is not yet in the index.",
    relatedItemIds: [],
    watchPrompts: [
      "Police Commission agendas and actions",
      "District Attorney charging policies",
      "City Council public safety motions",
      "Court filings on policing and consent decrees",
      "Crime data publications and audits",
    ],
    sourceIds: [],
    watchTargetId: "watch-crime",
  },
  {
    id: "topic-housing",
    slug: "housing",
    name: "Housing",
    summary:
      "State bills, chaptered laws, implementation records, agency guidance, and local decisions that affect housing development procedures.",
    relatedItemIds: ["explore-sb79", "explore-sb79-versions", "explore-sb79-senate-vote"],
    watchPrompts: [
      "Chaptered bill status",
      "Implementation guidance",
      "Local alternative plans",
      "Vote records",
    ],
    sourceIds: ["src-sb79-status", "src-sb79-text"],
    watchTargetId: "watch-sb79",
  },
  {
    id: "topic-land-use",
    slug: "land-use",
    name: "Land use",
    summary:
      "State land-use statutes, local zoning actions, community plan updates, council files, committee actions, and source trails.",
    relatedItemIds: ["explore-sb79", "explore-la-220617", "explore-la-220617-plum"],
    watchPrompts: [
      "Council file actions",
      "Zoning reports",
      "Local ordinances",
      "Committee records",
    ],
    sourceIds: ["src-sb79-text", "src-la-cf-22-0617"],
    watchTargetId: "watch-land-use",
  },
];

export function getExploreItemsByIds(ids: string[]) {
  return ids
    .map((id) => exploreItems.find((item) => item.id === id))
    .filter((item): item is (typeof exploreItems)[number] => Boolean(item));
}

export function getEntityBySlug(slug: string) {
  return entityProfiles.find((entity) => entity.slug === slug);
}

export function getTopicBySlug(slug: string) {
  return topicProfiles.find((topic) => topic.slug === slug);
}

export function getSourceCount(sourceIds: string[]) {
  return getSourcesByIds(sourceIds).length;
}

export const integrationReadiness = [
  "California LegInfo and Los Angeles Council File records now map into the same SourceRecord schema.",
  "The product distinguishes final status, vote records, action history, source gaps, and downstream implementation records.",
  "Search results return indexed official records and source-linked coverage gaps.",
  "AI answers, when added later, must cite source IDs before rendering.",
  `The current index includes ${sourceRecords.length} source records and ${exploreItems.length} searchable records.`,
];
