import type { Bill, LocalDecision, TopicProfile } from "@/data/types";

const BASE = "https://bythepeopleforthepeople.com";

export function billLegislationSchema(bill: Bill) {
  const officialUrls = bill.sources.map((s) => s.url);
  const inForce = bill.status === "Chaptered" || bill.status === "Adopted";
  return {
    "@context": "https://schema.org",
    "@type": "Legislation",
    name: bill.title,
    legislationIdentifier: bill.slug,
    legislationJurisdiction: bill.jurisdiction,
    legislationType: "Statute",
    legislationLegalForce: inForce ? "InForce" : "InAdoption",
    legislationDate: bill.lastAction.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? undefined,
    url: `${BASE}/bills/${bill.slug}`,
    sameAs: officialUrls,
    abstract: bill.summary,
    creator: { "@type": "Person", name: bill.sponsor },
    about: bill.topics.map((t) => ({ "@type": "Thing", name: t })),
    isBasedOn: bill.sources.map((s) => ({
      "@type": "CreativeWork",
      name: s.title,
      url: s.url,
      datePublished: s.date,
    })),
  };
}

export function localDecisionSchema(decision: LocalDecision) {
  const officialUrls = decision.sources.map((s) => s.url);
  return {
    "@context": "https://schema.org",
    "@type": "Legislation",
    name: decision.title,
    legislationIdentifier: decision.slug,
    legislationJurisdiction: decision.jurisdiction,
    legislationType: "Ordinance",
    legislationLegalForce: decision.status === "Adopted" ? "InForce" : "InAdoption",
    legislationDate: decision.meetingDate,
    url: `${BASE}/local/${decision.slug}`,
    sameAs: officialUrls,
    abstract: decision.summary,
    creator: { "@type": "GovernmentOrganization", name: decision.departmentOrCommittee },
    about: decision.topics.map((t) => ({ "@type": "Thing", name: t })),
    isBasedOn: decision.sources.map((s) => ({
      "@type": "CreativeWork",
      name: s.title,
      url: s.url,
      datePublished: s.date,
    })),
  };
}

export function topicCollectionSchema(topic: TopicProfile) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${topic.name} | Public-record collection`,
    description: topic.summary,
    url: `${BASE}/topics/${topic.slug}`,
    about: { "@type": "Thing", name: topic.name },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; href: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${BASE}${item.href}`,
    })),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "By The People, For The People",
    url: BASE,
    description:
      "Public-decision intelligence with source provenance on every claim. Nonpartisan, no endorsements, missing-data labeled.",
    publisher: organizationSchema(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE}/explore?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "By The People, For The People",
    url: BASE,
    logo: `${BASE}/icon.svg`,
    description:
      "Nonpartisan public-decision intelligence built around primary records and source trails.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "hello@bythepeopleforthepeople.com",
      contactType: "editorial",
      availableLanguage: ["English"],
    },
  };
}

export function publicEventReportSchema(event: {
  id: string;
  date: string;
  title: string;
  description: string;
  actor: string;
  sourceUrls: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Report",
    name: event.title,
    headline: event.title,
    description: event.description,
    datePublished: event.date,
    dateModified: event.date,
    inLanguage: "en-US",
    isAccessibleForFree: true,
    author: {
      "@type": "GovernmentOrganization",
      name: event.actor,
    },
    publisher: organizationSchema(),
    isBasedOn: event.sourceUrls.map((url) => ({
      "@type": "CreativeWork",
      url,
    })),
    identifier: event.id,
  };
}

export function homePageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "By The People, For The People",
    url: BASE,
    isPartOf: {
      "@type": "WebSite",
      url: BASE,
      name: "By The People, For The People",
    },
    about: [
      { "@type": "Thing", name: "Public records" },
      { "@type": "Thing", name: "Civic accountability" },
      { "@type": "Thing", name: "Government decisions" },
    ],
  };
}
