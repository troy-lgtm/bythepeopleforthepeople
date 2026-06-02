import "server-only";
import { cookies } from "next/headers";

export const WATCHLIST_COOKIE = "btpftp-watchlist";

export async function readWatchlist(): Promise<string[]> {
  const store = await cookies();
  const raw = store.get(WATCHLIST_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((value): value is string => typeof value === "string");
    }
    return [];
  } catch {
    return [];
  }
}
