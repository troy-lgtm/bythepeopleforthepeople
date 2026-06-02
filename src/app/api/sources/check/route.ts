import { type NextRequest } from "next/server";
import { sourceRecords } from "@/data/records";
import { jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function pingSource(url: string): Promise<{
  status: number;
  ok: boolean;
  contentType: string | null;
  fetchedAt: string;
  error?: string;
}> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "bythepeopleforthepeople-freshness-check/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    return {
      status: res.status,
      ok: res.ok,
      contentType: res.headers.get("content-type"),
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      status: 0,
      ok: false,
      contentType: null,
      fetchedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const filterId = url.searchParams.get("id");

  const targets = filterId
    ? sourceRecords.filter((s) => s.id === filterId)
    : sourceRecords;

  const checks = await Promise.all(
    targets.map(async (source) => ({
      id: source.id,
      title: source.title,
      url: source.url,
      ...(await pingSource(source.url)),
    })),
  );

  const failing = checks.filter((c) => !c.ok);

  return jsonOk({
    checked: checks.length,
    healthy: checks.length - failing.length,
    failing,
    checks,
  });
}
