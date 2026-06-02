export type SourceType =
  | "bill_text"
  | "bill_status"
  | "bill_history"
  | "compare_versions"
  | "amendment_version"
  | "committee_agenda"
  | "committee_action"
  | "roll_call_vote"
  | "hearing_transcript"
  | "public_filing"
  | "meeting_minutes"
  | "action_history"
  | "council_file"
  | "staff_report"
  | "public_comment";

export type PublicEventType =
  | "bill_introduced"
  | "amendment_added"
  | "committee_vote_scheduled"
  | "local_ordinance_updated"
  | "hearing_transcript_published"
  | "final_vote_recorded"
  | "meeting_held"
  | "document_posted";

export type DecisionStatus =
  | "Introduced"
  | "In Committee"
  | "Hearing Scheduled"
  | "Amended"
  | "Passed Committee"
  | "Final Vote Recorded"
  | "Chaptered"
  | "Adopted"
  | "Updated"
  | "Pending";

export type SourceRecord = {
  id: string;
  title: string;
  type: SourceType;
  url: string;
  date: string;
  jurisdiction: string;
  description: string;
  provenance?: "Primary source" | "Official record" | "Public filing" | "Derived summary";
  indexedAt?: string;
  verifiedAt?: string;
  archiveUrl?: string;
};

export type Cause = {
  id: string;
  title: string;
  outcome: string;
  topics: string[];
  jurisdictions: string[];
  watchTermsAny: string[];
  createdAt: string;
  emoji?: string;
  digestCadence?: "daily" | "weekly" | "monthly";
};

export type CorrectionLog = {
  id: string;
  date: string;
  recordHref: string;
  recordTitle: string;
  reportedBy: "User report" | "Internal audit" | "Source change" | "Automated check";
  description: string;
  fix: string;
};

export type PublicEvent = {
  id: string;
  date: string;
  type: PublicEventType;
  title: string;
  description: string;
  actor: string;
  sourceIds: string[];
};

export type VoteMember = {
  name: string;
  districtOrSeat: string;
  vote: "Yes" | "No" | "Abstain" | "Absent" | "NVR";
  entitySlug?: string;
};

export type Vote = {
  id: string;
  date: string;
  chamberOrBody: string;
  motion: string;
  yes: number | null;
  no: number | null;
  abstain: number | null;
  absent: number | null;
  members: VoteMember[];
  sourceIds: string[];
  note?: string;
};

export type Amendment = {
  id: string;
  date: string;
  title: string;
  summary: string;
  removedLanguage: string[];
  addedLanguage: string[];
  sourceIds: string[];
};

export type Stakeholder = {
  id: string;
  name: string;
  type: "Public agency" | "Civic organization" | "Industry group" | "Resident group" | "Labor organization" | "Other";
  publicStatement: string;
  sourceIds: string[];
};

export type VoteMemberLink = {
  slug: string;
  kind: "person" | "committee";
};

export type HearingSegment = {
  id: string;
  date: string;
  title: string;
  speaker: string;
  speakerRole: string;
  summary: string;
  sourceIds: string[];
};

export type Bill = {
  id: string;
  slug: string;
  title: string;
  jurisdiction: string;
  status: DecisionStatus;
  sponsor: string;
  sponsorSlug?: string;
  sponsorContactUrl?: string;
  summary: string;
  currentStage: string;
  lastAction: string;
  nextAction: string;
  nextActionDate?: string;
  publicCommentUrl?: string;
  plainLanguage?: string;
  topics: string[];
  timeline: PublicEvent[];
  amendments: Amendment[];
  votes: Vote[];
  hearings: HearingSegment[];
  stakeholders: Stakeholder[];
  sources: SourceRecord[];
  whatChanged: string[];
  whatHappensNext: string[];
  watchTargetId: string;
};

export type LocalDecision = {
  id: string;
  slug: string;
  title: string;
  jurisdiction: string;
  departmentOrCommittee: string;
  meetingDate: string;
  status: DecisionStatus;
  summary: string;
  motionSummary: string;
  nextMeetingDate?: string;
  nextMeetingTitle?: string;
  publicCommentUrl?: string;
  contactUrl?: string;
  contactEmail?: string;
  plainLanguage?: string;
  topics: string[];
  timeline: PublicEvent[];
  votes: Vote[];
  publicCommentSummary: string;
  relatedDocuments: SourceRecord[];
  sources: SourceRecord[];
  nextProceduralStep: string;
  watchTargetId: string;
};

export type ExploreItem = {
  id: string;
  title: string;
  href: string;
  jurisdiction: string;
  type: "Bill" | "Ordinance" | "Hearing" | "Vote" | "Amendment";
  status: DecisionStatus;
  date: string;
  topic: string;
  summary: string;
  sourceIds: string[];
  watchTargetId: string;
};

export type SearchIntent = {
  id: string;
  label: string;
  query: string;
  description: string;
  resultIds: string[];
};

export type DailyChange = {
  id: string;
  date: string;
  label: string;
  title: string;
  description: string;
  href: string;
  urgency: "Now" | "This week" | "Watching";
  sourceIds: string[];
};

export type LocalSignal = {
  id: string;
  locationLabel: string;
  title: string;
  description: string;
  href: string;
  topic: string;
  sourceIds: string[];
};

export type WatchTarget = {
  id: string;
  title: string;
  href: string;
  type: "Decision" | "Topic" | "Person" | "Committee" | "Jurisdiction";
  alertReason: string;
  sourceIds: string[];
};

export type ShareCardRecord = {
  id: string;
  title: string;
  kicker: string;
  summary: string;
  href: string;
  statLabel: string;
  statValue: string;
  sourceIds: string[];
};

export type AskRecordAnswer = {
  id: string;
  question: string;
  answer: string;
  sourceIds: string[];
};

export type EntityProfile = {
  id: string;
  slug: string;
  kind: "person" | "committee";
  name: string;
  role: string;
  jurisdiction: string;
  summary: string;
  relatedDecisionIds: string[];
  watchedFor: string[];
  sourceIds: string[];
  watchTargetId: string;
};

export type TopicProfile = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  relatedItemIds: string[];
  watchPrompts: string[];
  sourceIds: string[];
  watchTargetId: string;
};

export type MissingDataRecord = {
  id: string;
  title: string;
  status: "Not published" | "Not scheduled" | "Awaiting update" | "Outside indexed coverage";
  description: string;
  expectedSourceType: SourceType;
  relatedHref: string;
  relatedSourceIds: string[];
};

export type UpcomingAction = {
  id: string;
  date: string;
  title: string;
  body: string;
  href: string;
  sourceIds: string[];
};

export type SourceConnector = {
  id: string;
  name: string;
  jurisdiction: string;
  coverage: string;
  status:
    | "Indexed source"
    | "Ingestion-ready"
    | "Documented adapter"
    | "Planned coverage";
  records: string[];
  adapterEnv?: string;
  upstreamUrl?: string;
};

export type RecordAccessItem = {
  id: string;
  recordId: "sb79" | "la-220617" | "global";
  label: string;
  title: string;
  status: string;
  body: string;
  href: string;
  sourceIds: string[];
  proofPoints: string[];
};

export type EvidenceRecord = {
  id: string;
  sourceId: string;
  claim: string;
  locator: string;
  excerpt: string;
  verificationNote: string;
};

export type AnswerIntentRecord = {
  id: string;
  label: string;
  question: string;
  shortAnswer: string;
  detailedAnswer: string;
  status: string;
  href: string;
  actionLabel: string;
  sourceIds: string[];
  evidenceIds: string[];
  relatedResultIds: string[];
};

export type UserNeedRecord = {
  id: string;
  title: string;
  body: string;
  href: string;
  sourceIds: string[];
};
