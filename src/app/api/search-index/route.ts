import { NextResponse } from "next/server";
import { buildSearchIndex } from "@/lib/search-index";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const docs = buildSearchIndex();
  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      count: docs.length,
      docs,
    },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
