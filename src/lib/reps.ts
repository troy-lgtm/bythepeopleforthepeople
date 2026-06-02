import "server-only";
import legislatorsData from "@/data/seed/federal-reps.json";

export type FederalRep = {
  id: string | null;
  name: string;
  type: "rep" | "sen" | null;
  state: string | null;
  district: number | string | null;
  party: string | null;
  url: string | null;
  phone: string | null;
  address: string | null;
};

const all = legislatorsData as FederalRep[];

export function getHouseRep(state: string, district: number): FederalRep | null {
  return (
    all.find(
      (l) =>
        l.type === "rep" &&
        l.state === state &&
        Number(l.district) === Number(district),
    ) ?? null
  );
}

export function getSenators(state: string): FederalRep[] {
  return all.filter((l) => l.type === "sen" && l.state === state);
}

export function getRepsForPlace(state: string, district: number) {
  return {
    houseRep: getHouseRep(state, district),
    senators: getSenators(state),
  };
}

export function repCount() {
  return all.length;
}
