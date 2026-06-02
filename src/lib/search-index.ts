import "server-only";
import { bills, exploreItems, localDecisions } from "@/data/records";
import {
  entityProfiles,
  sourceConnectors,
  topicProfiles,
} from "@/data/product-loop";
import { allFederalReps, slugForRep } from "@/lib/federal-reps";

export type SearchDoc = {
  id: string;
  type:
    | "rep"
    | "senator"
    | "bill"
    | "local"
    | "topic"
    | "person"
    | "committee"
    | "connector"
    | "cause";
  title: string;
  subtitle?: string;
  href: string;
  jurisdiction?: string;
  keywords: string[];
};

export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const rep of allFederalReps()) {
    const slug = slugForRep(rep);
    const chamber = rep.type === "sen" ? "U.S. Senate" : "U.S. House";
    const district =
      rep.type === "sen"
        ? rep.state ?? ""
        : `${rep.state}-${rep.district}`;
    docs.push({
      id: `federal-${slug}`,
      type: rep.type === "sen" ? "senator" : "rep",
      title: rep.name,
      subtitle: `${chamber} · ${district}${rep.party ? " · " + rep.party : ""}`,
      href: `/federal/${slug}`,
      jurisdiction: rep.state ?? undefined,
      keywords: [
        rep.name ?? "",
        rep.state ?? "",
        String(rep.district ?? ""),
        rep.party ?? "",
        chamber,
        district,
        rep.id ?? "",
      ].filter(Boolean),
    });
  }

  for (const bill of bills) {
    docs.push({
      id: `bill-${bill.slug}`,
      type: "bill",
      title: bill.title,
      subtitle: `${bill.jurisdiction} · ${bill.status} · ${bill.sponsor}`,
      href: `/bills/${bill.slug}`,
      jurisdiction: bill.jurisdiction,
      keywords: [bill.title, bill.jurisdiction, bill.status, bill.sponsor, ...bill.topics],
    });
  }

  for (const decision of localDecisions) {
    docs.push({
      id: `local-${decision.slug}`,
      type: "local",
      title: decision.title,
      subtitle: `${decision.jurisdiction} · ${decision.status} · ${decision.departmentOrCommittee}`,
      href: `/local/${decision.slug}`,
      jurisdiction: decision.jurisdiction,
      keywords: [
        decision.title,
        decision.jurisdiction,
        decision.status,
        decision.departmentOrCommittee,
        ...decision.topics,
      ],
    });
  }

  for (const topic of topicProfiles) {
    docs.push({
      id: `topic-${topic.slug}`,
      type: "topic",
      title: topic.name,
      subtitle: `Topic page${topic.relatedItemIds.length > 0 ? ` · ${topic.relatedItemIds.length} records` : " · coverage being indexed"}`,
      href: `/topics/${topic.slug}`,
      keywords: [topic.name, ...topic.watchPrompts],
    });
  }

  for (const entity of entityProfiles) {
    docs.push({
      id: `entity-${entity.slug}`,
      type: entity.kind,
      title: entity.name,
      subtitle: `${entity.role} · ${entity.jurisdiction}`,
      href: `/${entity.kind === "person" ? "people" : "committees"}/${entity.slug}`,
      jurisdiction: entity.jurisdiction,
      keywords: [entity.name, entity.role, entity.jurisdiction, ...entity.watchedFor],
    });
  }

  for (const item of exploreItems) {
    if (item.href.startsWith("/bills/") || item.href.startsWith("/local/")) {
      continue;
    }
    docs.push({
      id: `explore-${item.id}`,
      type: "bill",
      title: item.title,
      subtitle: `${item.jurisdiction} · ${item.type} · ${item.status}`,
      href: item.href,
      jurisdiction: item.jurisdiction,
      keywords: [item.title, item.jurisdiction, item.type, item.status, item.topic],
    });
  }

  for (const connector of sourceConnectors) {
    docs.push({
      id: `connector-${connector.id}`,
      type: "connector",
      title: connector.name,
      subtitle: `${connector.jurisdiction} · ${connector.status}`,
      href: "/sources",
      jurisdiction: connector.jurisdiction,
      keywords: [connector.name, connector.jurisdiction, connector.status, ...connector.records],
    });
  }

  return docs;
}
