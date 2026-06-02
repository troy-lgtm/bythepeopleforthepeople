import "server-only";
import { type FederalRep, getRepsForPlace } from "./reps";
import legislatorsData from "@/data/seed/federal-reps.json";

const all = legislatorsData as FederalRep[];

export function slugForRep(rep: FederalRep): string {
  const last = (rep.name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .pop()
    ?.replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase() ?? "rep";
  const state = (rep.state ?? "").toLowerCase();
  const districtPart =
    rep.type === "sen"
      ? "senate"
      : rep.district == null
        ? "rep"
        : String(rep.district);
  return `${last}-${state}-${districtPart}`;
}

export function allRepSlugs(): Array<{ slug: string }> {
  const seen = new Set<string>();
  const out: Array<{ slug: string }> = [];
  for (const rep of all) {
    const base = slugForRep(rep);
    let slug = base;
    let n = 2;
    while (seen.has(slug)) {
      slug = `${base}-${n++}`;
    }
    seen.add(slug);
    out.push({ slug });
  }
  return out;
}

export function getRepBySlug(slug: string): FederalRep | null {
  const seen = new Set<string>();
  for (const rep of all) {
    const base = slugForRep(rep);
    let s = base;
    let n = 2;
    while (seen.has(s)) {
      s = `${base}-${n++}`;
    }
    seen.add(s);
    if (s === slug) return rep;
  }
  return null;
}

export function allFederalReps(): FederalRep[] {
  return all;
}

export function repsByState(): Record<string, FederalRep[]> {
  const map: Record<string, FederalRep[]> = {};
  for (const rep of all) {
    const state = rep.state ?? "Unknown";
    if (!map[state]) map[state] = [];
    map[state].push(rep);
  }
  for (const list of Object.values(map)) {
    list.sort((a, b) => {
      if (a.type !== b.type) return a.type === "sen" ? -1 : 1;
      if (a.district != null && b.district != null) {
        return Number(a.district) - Number(b.district);
      }
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
  }
  return map;
}

export { getRepsForPlace, type FederalRep };
