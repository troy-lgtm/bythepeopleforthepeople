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
