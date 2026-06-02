import "server-only";
import { cookies } from "next/headers";
import type { Cause } from "@/data/types";

export const CAUSES_COOKIE = "btpftp-causes";
export const MAX_CAUSES = 10;

export async function readCauses(): Promise<Cause[]> {
  const store = await cookies();
  const raw = store.get(CAUSES_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(0, MAX_CAUSES)
      .filter(isCause)
      .map(normalize);
  } catch {
    return [];
  }
}

export function isCause(value: unknown): value is Cause {
  if (!value || typeof value !== "object") return false;
  const c = value as Partial<Cause>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.outcome === "string" &&
    Array.isArray(c.topics) &&
    Array.isArray(c.jurisdictions) &&
    Array.isArray(c.watchTermsAny) &&
    typeof c.createdAt === "string"
  );
}

export function normalize(c: Cause): Cause {
  return {
    id: c.id.slice(0, 64),
    title: c.title.slice(0, 140),
    outcome: c.outcome.slice(0, 600),
    topics: c.topics
      .filter((t) => typeof t === "string")
      .slice(0, 20)
      .map((t) => t.slice(0, 64)),
    jurisdictions: c.jurisdictions
      .filter((j) => typeof j === "string")
      .slice(0, 20)
      .map((j) => j.slice(0, 64)),
    watchTermsAny: c.watchTermsAny
      .filter((w) => typeof w === "string")
      .slice(0, 40)
      .map((w) => w.slice(0, 64)),
    createdAt: c.createdAt,
    emoji: c.emoji?.slice(0, 8),
    digestCadence: c.digestCadence,
  };
}

export async function readCauseById(id: string): Promise<Cause | null> {
  const causes = await readCauses();
  return causes.find((c) => c.id === id) ?? null;
}
