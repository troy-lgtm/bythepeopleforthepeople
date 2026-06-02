import "server-only";
import citiesData from "@/data/seed/cities.json";

export type City = {
  slug: string;
  name: string;
  state: string;
  population: number;
  recordsPortal: string | null;
};

const wrapper = citiesData as { cities: City[] };

export function allCities(): City[] {
  return wrapper.cities;
}

export function getCityBySlug(slug: string): City | null {
  return wrapper.cities.find((c) => c.slug === slug) ?? null;
}

export function citiesByState(state: string): City[] {
  return wrapper.cities.filter((c) => c.state === state.toUpperCase());
}
