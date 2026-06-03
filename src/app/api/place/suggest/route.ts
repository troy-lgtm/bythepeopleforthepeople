import { type NextRequest } from "next/server";
import { jsonOk } from "@/lib/api";
import { searchZips } from "@/lib/place";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  return jsonOk({ suggestions: searchZips(q) });
}
