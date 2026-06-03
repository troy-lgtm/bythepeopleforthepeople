import "server-only";

export type LatLng = { lat: number; lng: number };

/**
 * ZIP centroid → lat/lng via zippopotam.us (no key). Used to look up
 * point-based officials (OpenStates people.geo). Cached 30 days.
 */
export async function geocodeZip(zip: string): Promise<LatLng | null> {
  const trimmed = zip.trim().slice(0, 5);
  if (!/^\d{5}$/.test(trimmed)) return null;
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${trimmed}`, {
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      places?: Array<{ latitude?: string; longitude?: string }>;
    };
    const place = data.places?.[0];
    if (!place?.latitude || !place?.longitude) return null;
    const lat = Number(place.latitude);
    const lng = Number(place.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
