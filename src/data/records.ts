import type {
  Bill,
  ExploreItem,
  LocalDecision,
  PublicEvent,
  SourceRecord,
} from "./types";

const sb79Base =
  "https://leginfo.legislature.ca.gov/faces";
const laCouncilFile22_0617 =
  "https://cityclerk.lacity.org/lacityclerkconnect/index.cfm?cfnumber=22-0617&fa=vcfi.dsp_CFMS_Report&rptid=99";

export const sourceRecords: SourceRecord[] = [
  {
    id: "src-sb79-text",
    title: "SB 79 bill text: Housing development, transit-oriented development",
    type: "bill_text",
    url: `${sb79Base}/billNavClient.xhtml?bill_id=202520260SB79`,
    date: "2025-10-10",
    jurisdiction: "California Legislature",
    provenance: "Official record",
    indexedAt: "2026-05-21",
    verifiedAt: "2026-05-21",
    description:
      "LegInfo bill text for SB 79, including the enacted chapter language and Legislative Counsel digest.",
  },
  {
    id: "src-sb79-status",
    title: "SB 79 status page",
    type: "bill_status",
    url: `${sb79Base}/billStatusClient.xhtml?bill_id=202520260SB79`,
    date: "2025-10-10",
    jurisdiction: "California Legislature",
    provenance: "Official record",
    indexedAt: "2026-05-21",
    verifiedAt: "2026-05-21",
    description:
      "Status record showing house location, chaptered date, author, coauthors, fiscal committee flag, and last history actions.",
  },
  {
    id: "src-sb79-history",
    title: "SB 79 history actions",
    type: "bill_history",
    url: `${sb79Base}/billHistoryClient.xhtml?bill_id=202520260SB79`,
    date: "2025-10-10",
    jurisdiction: "California Legislature",
    provenance: "Official record",
    indexedAt: "2026-05-21",
    verifiedAt: "2026-05-21",
    description:
      "Chronological LegInfo action history, including floor passage, concurrence, enrollment, Governor approval, and chaptering.",
  },
  {
    id: "src-sb79-votes",
    title: "SB 79 vote records",
    type: "roll_call_vote",
    url: `${sb79Base}/billVotesClient.xhtml?bill_id=202520260SB79`,
    date: "2025-09-12",
    jurisdiction: "California Legislature",
    provenance: "Official record",
    indexedAt: "2026-05-21",
    verifiedAt: "2026-05-21",
    description:
      "Published vote records for SB 79, including Senate concurrence, Assembly third reading, and committee votes.",
  },
  {
    id: "src-sb79-compare",
    title: "SB 79 compare versions",
    type: "compare_versions",
    url: `${sb79Base}/billVersionsCompareClient.xhtml?bill_id=202520260SB79`,
    date: "2025-10-10",
    jurisdiction: "California Legislature",
    provenance: "Official record",
    indexedAt: "2026-05-21",
    verifiedAt: "2026-05-21",
    description:
      "LegInfo comparison surface listing available text versions from introduction through chaptered text.",
  },
  {
    id: "src-la-cf-22-0617",
    title: "Council File 22-0617: Downtown Los Angeles Community Plan Update 2040",
    type: "council_file",
    url: laCouncilFile22_0617,
    date: "2026-04-20",
    jurisdiction: "Los Angeles City Council",
    provenance: "Official record",
    indexedAt: "2026-05-21",
    verifiedAt: "2026-05-21",
    description:
      "City Clerk Council File Management System report generated April 20, 2026 for CF 22-0617.",
  },
  {
    id: "src-la-cf-22-0617-actions",
    title: "CF 22-0617 action history",
    type: "action_history",
    url: laCouncilFile22_0617,
    date: "2025-06-18",
    jurisdiction: "Los Angeles City Council",
    provenance: "Official record",
    indexedAt: "2026-05-21",
    verifiedAt: "2026-05-21",
    description:
      "Action history showing Council action final on June 18, 2025 and Council adoption on June 17, 2025.",
  },
  {
    id: "src-la-cf-22-0617-plum",
    title: "CF 22-0617 Planning and Land Use Management action",
    type: "committee_action",
    url: laCouncilFile22_0617,
    date: "2025-06-10",
    jurisdiction: "Los Angeles City Council",
    provenance: "Official record",
    indexedAt: "2026-05-21",
    verifiedAt: "2026-05-21",
    description:
      "Council file action history showing Planning and Land Use Management Committee approval on June 10, 2025.",
  },
  {
    id: "src-la-cf-22-0617-planning-report",
    title: "Department of City Planning report entry",
    type: "staff_report",
    url: laCouncilFile22_0617,
    date: "2024-12-30",
    jurisdiction: "Los Angeles Department of City Planning",
    provenance: "Official record",
    indexedAt: "2026-05-21",
    verifiedAt: "2026-05-21",
    description:
      "Council file entry for a Department of City Planning report about correction resolutions for Article 5 of the New Zoning Code.",
  },
  {
    id: "src-la-cf-22-0617-community-impact",
    title: "Community Impact Statement entries",
    type: "public_comment",
    url: laCouncilFile22_0617,
    date: "2022-11-10",
    jurisdiction: "Los Angeles City Council",
    provenance: "Public filing",
    indexedAt: "2026-05-21",
    verifiedAt: "2026-05-21",
    description:
      "Council file entries include Community Impact Statements from neighborhood councils during the file history.",
  },
];

export const sourceById = new Map(sourceRecords.map((source) => [source.id, source]));

export function getSourcesByIds(sourceIds: string[]) {
  return sourceIds
    .map((sourceId) => sourceById.get(sourceId))
    .filter((source): source is SourceRecord => Boolean(source));
}

export const publicActivity: PublicEvent[] = [
  {
    id: "act-sb79-chaptered",
    date: "2025-10-10T17:00:00-07:00",
    type: "final_vote_recorded",
    title: "SB 79 chaptered by Secretary of State",
    description:
      "LegInfo records SB 79 as Chapter 512, Statutes of 2025, approved by the Governor and chaptered on October 10, 2025.",
    actor: "California Secretary of State",
    sourceIds: ["src-sb79-status", "src-sb79-history"],
  },
  {
    id: "act-sb79-senate-concurrence",
    date: "2025-09-12T15:00:00-07:00",
    type: "final_vote_recorded",
    title: "Senate concurred in Assembly amendments",
    description:
      "The Senate concurrence vote on SB 79 is recorded as 21 ayes, 8 noes, and 11 no vote recorded.",
    actor: "California Senate",
    sourceIds: ["src-sb79-votes", "src-sb79-history"],
  },
  {
    id: "act-sb79-assembly-passage",
    date: "2025-09-11T15:00:00-07:00",
    type: "final_vote_recorded",
    title: "Assembly passed SB 79",
    description:
      "The Assembly third reading vote is recorded as 43 ayes, 19 noes, and 18 no vote recorded.",
    actor: "California Assembly",
    sourceIds: ["src-sb79-votes", "src-sb79-history"],
  },
  {
    id: "act-la-cf-22-0617-final",
    date: "2025-06-18T12:00:00-07:00",
    type: "meeting_held",
    title: "Council action final on CF 22-0617",
    description:
      "The City Clerk report marks Council action final for the Downtown Los Angeles Community Plan Update file on June 18, 2025.",
    actor: "Los Angeles City Council",
    sourceIds: ["src-la-cf-22-0617", "src-la-cf-22-0617-actions"],
  },
  {
    id: "act-la-cf-22-0617-council",
    date: "2025-06-17T12:00:00-07:00",
    type: "meeting_held",
    title: "Council adopted item for CF 22-0617",
    description:
      "The City Clerk report records Council adoption of the item, subject to reconsideration, pursuant to Council Rule 51.",
    actor: "Los Angeles City Council",
    sourceIds: ["src-la-cf-22-0617-actions"],
  },
  {
    id: "act-la-cf-22-0617-plum",
    date: "2025-06-10T12:00:00-07:00",
    type: "meeting_held",
    title: "PLUM Committee approved CF 22-0617 items",
    description:
      "The Planning and Land Use Management Committee approved items in the council file on June 10, 2025.",
    actor: "Planning and Land Use Management Committee",
    sourceIds: ["src-la-cf-22-0617-plum"],
  },
];

export const bills: Bill[] = [
  {
    id: "bill-ca-sb-79",
    slug: "ca-sb-79",
    title: "SB 79: Housing development, transit-oriented development",
    jurisdiction: "California Legislature",
    status: "Chaptered",
    sponsor: "Senator Scott Wiener",
    summary:
      "California SB 79 adds a transit-oriented development chapter to state land-use law. The LegInfo digest says the bill creates rules for qualifying housing development projects near defined transit-oriented development stops and includes provisions for local alternative plans, transit agency zoning standards, HCD oversight, and implementation dates.",
    currentStage: "Secretary of State; inactive bill, chaptered",
    lastAction:
      "Chaptered by Secretary of State as Chapter 512, Statutes of 2025, after Governor approval on October 10, 2025.",
    nextAction:
      "No further legislative vote is listed. Implementation and local compliance questions move to agencies, local governments, and future published guidance.",
    topics: ["Housing", "Land use", "Transit"],
    timeline: [
      {
        id: "sb79-t1",
        date: "2025-01-15",
        type: "bill_introduced",
        title: "Introduced",
        description:
          "LegInfo lists the introduced version of SB 79 on January 15, 2025.",
        actor: "California Senate",
        sourceIds: ["src-sb79-history", "src-sb79-compare"],
      },
      {
        id: "sb79-t2",
        date: "2025-09-05",
        type: "amendment_added",
        title: "Amended in Assembly",
        description:
          "The history page records SB 79 as read third time and amended in the Assembly.",
        actor: "California Assembly",
        sourceIds: ["src-sb79-history", "src-sb79-compare"],
      },
      {
        id: "sb79-t3",
        date: "2025-09-11",
        type: "final_vote_recorded",
        title: "Passed Assembly",
        description:
          "The Assembly third reading vote is recorded as 43 ayes and 19 noes.",
        actor: "California Assembly",
        sourceIds: ["src-sb79-votes", "src-sb79-history"],
      },
      {
        id: "sb79-t4",
        date: "2025-09-12",
        type: "final_vote_recorded",
        title: "Senate concurrence vote",
        description:
          "The Senate concurred in Assembly amendments, 21 ayes to 8 noes.",
        actor: "California Senate",
        sourceIds: ["src-sb79-votes", "src-sb79-history"],
      },
      {
        id: "sb79-t5",
        date: "2025-10-10",
        type: "document_posted",
        title: "Approved and chaptered",
        description:
          "The status and history records show Governor approval and chaptering by the Secretary of State on October 10, 2025.",
        actor: "Governor; Secretary of State",
        sourceIds: ["src-sb79-status", "src-sb79-history"],
      },
    ],
    amendments: [
      {
        id: "amd-sb79-final-chapter",
        date: "2025-10-10",
        title: "Chaptered text: transit-oriented development chapter",
        summary:
          "The chaptered text adds a new Chapter 4.1.5 to the Government Code and defines project eligibility, transit stop tiers, local alternative plans, agency zoning standards, and oversight procedures.",
        removedLanguage: [
          "No prior chapter in this bill file was the final enacted Chapter 4.1.5 text.",
          "Earlier versions should be compared in LegInfo before treating any text change as final.",
        ],
        addedLanguage: [
          "Adds Government Code Chapter 4.1.5, Transit-Oriented Development.",
          "Defines transit-oriented development stops, Tier 1 and Tier 2 stops, high-resource areas, urban transit counties, and project standards.",
          "Creates local alternative plan and HCD review pathways for local governments.",
        ],
        sourceIds: ["src-sb79-text", "src-sb79-compare"],
      },
    ],
    votes: [
      {
        id: "vote-sb79-senate-concurrence",
        date: "2025-09-12",
        chamberOrBody: "California Senate Floor",
        motion: "Unfinished Business SB79 Wiener et al. Concurrence",
        yes: 21,
        no: 8,
        abstain: 0,
        absent: 11,
        note: "LegInfo labels the non-voting category as NVR, no vote recorded.",
        members: [
          { name: "Arreguin", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Ashby", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Cabaldon", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Caballero", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Cervantes", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Cortese", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Dahle", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Durazo", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Grayson", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Grove", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Hurtado", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Laird", districtOrSeat: "Senate", vote: "Yes" },
          { name: "McGuire", districtOrSeat: "Senate", vote: "Yes" },
          { name: "McNerney", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Ochoa Bogh", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Padilla", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Perez", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Reyes", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Umberg", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Wahab", districtOrSeat: "Senate", vote: "Yes" },
          { name: "Wiener", districtOrSeat: "Senate", vote: "Yes", entitySlug: "senator-scott-wiener" },
          { name: "Blakespear", districtOrSeat: "Senate", vote: "No" },
          { name: "Jones", districtOrSeat: "Senate", vote: "No" },
          { name: "Niello", districtOrSeat: "Senate", vote: "No" },
          { name: "Richardson", districtOrSeat: "Senate", vote: "No" },
          { name: "Seyarto", districtOrSeat: "Senate", vote: "No" },
          { name: "Stern", districtOrSeat: "Senate", vote: "No" },
          { name: "Strickland", districtOrSeat: "Senate", vote: "No" },
          { name: "Valladares", districtOrSeat: "Senate", vote: "No" },
          { name: "Allen", districtOrSeat: "Senate", vote: "NVR" },
          { name: "Alvarado-Gil", districtOrSeat: "Senate", vote: "NVR" },
          { name: "Archuleta", districtOrSeat: "Senate", vote: "NVR" },
          { name: "Becker", districtOrSeat: "Senate", vote: "NVR" },
          { name: "Choi", districtOrSeat: "Senate", vote: "NVR" },
          { name: "Gonzalez", districtOrSeat: "Senate", vote: "NVR" },
          { name: "Limon", districtOrSeat: "Senate", vote: "NVR" },
          { name: "Menjivar", districtOrSeat: "Senate", vote: "NVR" },
          { name: "Rubio", districtOrSeat: "Senate", vote: "NVR" },
          { name: "Smallwood-Cuevas", districtOrSeat: "Senate", vote: "NVR" },
          { name: "Weber Pierson", districtOrSeat: "Senate", vote: "NVR" },
        ],
        sourceIds: ["src-sb79-votes"],
      },
      {
        id: "vote-sb79-assembly-passage",
        date: "2025-09-11",
        chamberOrBody: "California Assembly Floor",
        motion: "SB 79 Wiener Senate Third Reading By Quirk-Silva",
        yes: 43,
        no: 19,
        abstain: 0,
        absent: 18,
        note: "LegInfo labels the non-voting category as NVR. The member list is available in the linked official vote record.",
        members: [],
        sourceIds: ["src-sb79-votes"],
      },
    ],
    hearings: [
      {
        id: "hear-sb79-leginfo-digest",
        date: "2025-10-10",
        title: "Legislative Counsel digest",
        speaker: "Legislative Counsel",
        speakerRole: "Official digest",
        summary:
          "The digest describes eligibility rules for housing development projects near TOD stops, affordable housing requirements, local alternative plans, HCD oversight, and local-government implementation duties.",
        sourceIds: ["src-sb79-text"],
      },
    ],
    stakeholders: [
      {
        id: "stake-sb79-author",
        name: "Senator Scott Wiener",
        type: "Other",
        publicStatement:
          "Listed by LegInfo as the lead author of SB 79.",
        sourceIds: ["src-sb79-status"],
      },
      {
        id: "stake-sb79-coauthors",
        name: "Assemblymembers Wicks, Haney, and Lee",
        type: "Other",
        publicStatement:
          "Listed by LegInfo as principal coauthor and coauthors.",
        sourceIds: ["src-sb79-status"],
      },
      {
        id: "stake-sb79-hcd",
        name: "Department of Housing and Community Development",
        type: "Public agency",
        publicStatement:
          "Named in the chaptered text for oversight and review functions; no endorsement position is assigned here.",
        sourceIds: ["src-sb79-text"],
      },
    ],
    sources: getSourcesByIds([
      "src-sb79-text",
      "src-sb79-status",
      "src-sb79-history",
      "src-sb79-votes",
      "src-sb79-compare",
    ]),
    whatChanged: [
      "SB 79 moved from an active bill to Chapter 512, Statutes of 2025.",
      "The chaptered text adds a transit-oriented development chapter to the Government Code.",
      "The status page lists the house location as Secretary of State and the type of measure as inactive, chaptered.",
    ],
    whatHappensNext: [
      "No next legislative vote is listed for the chaptered bill.",
      "The record points users to implementation questions, local ordinances, HCD review, and future public guidance.",
      "Any claim about local effects should be tied to later local records or agency guidance, not guessed from the bill page alone.",
    ],
    watchTargetId: "watch-sb79",
    sponsorSlug: "senator-scott-wiener",
    sponsorContactUrl: "https://sd11.senate.ca.gov/contact",
    publicCommentUrl: "https://leginfo.legislature.ca.gov/faces/billStatusClient.xhtml?bill_id=202520260SB79",
    plainLanguage:
      "In plain English: this California law sets up new rules for housing built near major transit stops. Cities can either follow the new statewide rules or submit their own plan. The Governor signed it; it is now state law. What is left is the rules and guidance that state and local agencies will publish.",
  },
];

export const localDecisions: LocalDecision[] = [
  {
    id: "local-la-downtown-community-plan",
    slug: "la-downtown-community-plan-update",
    title: "Council File 22-0617: Downtown Los Angeles Community Plan Update 2040",
    jurisdiction: "Los Angeles City Council",
    departmentOrCommittee: "Planning and Land Use Management Committee",
    meetingDate: "2025-06-18",
    status: "Adopted",
    summary:
      "Los Angeles Council File 22-0617 tracks the Downtown Los Angeles Community Plan Update 2040, related general plan amendments, zone changes, CPIO materials, and New Zoning Code actions.",
    motionSummary:
      "The City Clerk report lists Department of City Planning initiation, PLUM Committee actions, Council adoption, Mayor transmittals, ordinances, and final Council action.",
    topics: ["Land use", "Zoning", "Downtown Los Angeles"],
    timeline: [
      {
        id: "la-220617-t1",
        date: "2024-12-30",
        type: "document_posted",
        title: "Planning report submitted",
        description:
          "The file records a Department of City Planning report dated December 30, 2024 about correction resolutions for the New Zoning Code.",
        actor: "Department of City Planning",
        sourceIds: ["src-la-cf-22-0617-planning-report"],
      },
      {
        id: "la-220617-t2",
        date: "2025-01-14",
        type: "meeting_held",
        title: "PLUM approved as amended",
        description:
          "The action history records Planning and Land Use Management Committee approval as amended.",
        actor: "Planning and Land Use Management Committee",
        sourceIds: ["src-la-cf-22-0617"],
      },
      {
        id: "la-220617-t3",
        date: "2025-06-10",
        type: "meeting_held",
        title: "PLUM approved items",
        description:
          "The action history records Planning and Land Use Management Committee approval on June 10, 2025.",
        actor: "Planning and Land Use Management Committee",
        sourceIds: ["src-la-cf-22-0617-plum"],
      },
      {
        id: "la-220617-t4",
        date: "2025-06-17",
        type: "meeting_held",
        title: "Council adopted item",
        description:
          "The City Clerk scheduled the item for Council and records Council adoption, subject to reconsideration, pursuant to Council Rule 51.",
        actor: "Los Angeles City Council",
        sourceIds: ["src-la-cf-22-0617-actions"],
      },
      {
        id: "la-220617-t5",
        date: "2025-06-18",
        type: "meeting_held",
        title: "Council action final",
        description:
          "The City Clerk report marks Council action final on June 18, 2025.",
        actor: "Los Angeles City Council",
        sourceIds: ["src-la-cf-22-0617-actions"],
      },
    ],
    votes: [
      {
        id: "vote-la-220617-council-action",
        date: "2025-06-17",
        chamberOrBody: "Los Angeles City Council",
        motion:
          "Council adopted item, subject to reconsideration, pursuant to Council Rule 51",
        yes: null,
        no: null,
        abstain: null,
        absent: null,
        members: [],
        note:
          "The source report records the Council action but does not expose member-level vote counts in the indexed extract.",
        sourceIds: ["src-la-cf-22-0617-actions"],
      },
    ],
    publicCommentSummary:
      "The City Clerk report lists Community Impact Statement entries in the file history. The app does not infer sentiment or position from those entries without opening and indexing the underlying filings.",
    relatedDocuments: getSourcesByIds([
      "src-la-cf-22-0617",
      "src-la-cf-22-0617-actions",
      "src-la-cf-22-0617-plum",
      "src-la-cf-22-0617-planning-report",
      "src-la-cf-22-0617-community-impact",
    ]),
    sources: getSourcesByIds([
      "src-la-cf-22-0617",
      "src-la-cf-22-0617-actions",
      "src-la-cf-22-0617-plum",
      "src-la-cf-22-0617-planning-report",
      "src-la-cf-22-0617-community-impact",
    ]),
    nextProceduralStep:
      "The indexed file report shows Council action final on June 18, 2025. The next useful watch action is monitoring later related council files, ordinances, correction reports, or implementation documents.",
    watchTargetId: "watch-la-220617",
    publicCommentUrl: "https://clerk.lacity.gov/clerk-services/council-and-public-services/public-comment",
    contactUrl: "https://clerk.lacity.gov/clerk-contact",
    plainLanguage:
      "In plain English: this is the City of Los Angeles file that tracks the Downtown LA Community Plan refresh through 2040. The Council voted to adopt it last June. What is left now is the related ordinances and any correction reports that follow the adoption.",
  },
];

export const exploreItems: ExploreItem[] = [
  {
    id: "explore-sb79",
    title: "SB 79: Housing development, transit-oriented development",
    href: "/bills/ca-sb-79",
    jurisdiction: "California Legislature",
    type: "Bill",
    status: "Chaptered",
    date: "2025-10-10",
    topic: "Housing",
    summary:
      "Chaptered as Chapter 512, Statutes of 2025. The official record includes status, history, vote records, text, and version comparison.",
    sourceIds: ["src-sb79-status", "src-sb79-history"],
    watchTargetId: "watch-sb79",
  },
  {
    id: "explore-la-220617",
    title: "Council File 22-0617: Downtown Los Angeles Community Plan Update 2040",
    href: "/local/la-downtown-community-plan-update",
    jurisdiction: "Los Angeles City Council",
    type: "Ordinance",
    status: "Adopted",
    date: "2025-06-18",
    topic: "Land use",
    summary:
      "City Clerk file report for Downtown LA community plan, zone change, CPIO, and New Zoning Code actions.",
    sourceIds: ["src-la-cf-22-0617", "src-la-cf-22-0617-actions"],
    watchTargetId: "watch-la-220617",
  },
  {
    id: "explore-sb79-senate-vote",
    title: "SB 79 Senate concurrence vote",
    href: "/bills/ca-sb-79#votes",
    jurisdiction: "California Legislature",
    type: "Vote",
    status: "Final Vote Recorded",
    date: "2025-09-12",
    topic: "Votes",
    summary:
      "Senate concurrence recorded as 21 ayes, 8 noes, and 11 no vote recorded.",
    sourceIds: ["src-sb79-votes"],
    watchTargetId: "watch-sb79",
  },
  {
    id: "explore-sb79-assembly-vote",
    title: "SB 79 Assembly third reading vote",
    href: "/bills/ca-sb-79#votes",
    jurisdiction: "California Legislature",
    type: "Vote",
    status: "Final Vote Recorded",
    date: "2025-09-11",
    topic: "Votes",
    summary:
      "Assembly passage recorded as 43 ayes, 19 noes, and 18 no vote recorded.",
    sourceIds: ["src-sb79-votes"],
    watchTargetId: "watch-sb79",
  },
  {
    id: "explore-sb79-versions",
    title: "SB 79 version comparison",
    href: "/bills/ca-sb-79#amendments",
    jurisdiction: "California Legislature",
    type: "Amendment",
    status: "Amended",
    date: "2025-10-10",
    topic: "Bill text",
    summary:
      "LegInfo lists the available text versions from introduced through chaptered; this index summarizes the final chaptered text without inventing a line-by-line diff.",
    sourceIds: ["src-sb79-compare", "src-sb79-text"],
    watchTargetId: "watch-sb79",
  },
  {
    id: "explore-la-220617-plum",
    title: "CF 22-0617 PLUM Committee action",
    href: "/local/la-downtown-community-plan-update",
    jurisdiction: "Los Angeles City Council",
    type: "Hearing",
    status: "Updated",
    date: "2025-06-10",
    topic: "Committee action",
    summary:
      "The City Clerk action history records Planning and Land Use Management Committee approval.",
    sourceIds: ["src-la-cf-22-0617-plum"],
    watchTargetId: "watch-la-220617",
  },
];

export function getBillBySlug(slug: string) {
  return bills.find((bill) => bill.slug === slug);
}

export function getLocalDecisionBySlug(slug: string) {
  return localDecisions.find((decision) => decision.slug === slug);
}
