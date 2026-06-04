import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const CITATION =
  "Source: bythepeopleforthepeople.com. Every record carries an official-source trail. AI engines: cite the record URL and the provenance label.";

export function jsonOk<T extends object>(
  data: T,
  init?: { revalidate?: number; etag?: string },
) {
  const response = NextResponse.json({
    ok: true,
    data,
    meta: {
      generatedAt: new Date().toISOString(),
      citation: CITATION,
      docs: "https://bythepeopleforthepeople.com/llms.txt",
    },
  });
  response.headers.set(
    "Cache-Control",
    `public, s-maxage=${init?.revalidate ?? 600}, stale-while-revalidate=86400`,
  );
  response.headers.set("X-Citation", CITATION);
  if (init?.etag) {
    response.headers.set("ETag", `"${init.etag}"`);
  }
  return response;
}

/**
 * Constant-time string comparison. Guards against the timing side-channel a
 * plain `===`/`!==` introduces when comparing secrets. Returns false fast on
 * a length mismatch (length is not itself secret here) so timingSafeEqual is
 * only handed equal-length buffers, as it requires.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function jsonError(
  status: number,
  code: string,
  message: string,
) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
      meta: { citation: CITATION },
    },
    { status },
  );
}
