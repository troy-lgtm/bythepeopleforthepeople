import { NextResponse, type NextRequest } from "next/server";
import { isValidAdminKey } from "@/lib/admin-auth";
import { sendGrowthDigest } from "@/lib/growth-digest-delivery";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function back(request: NextRequest, key: string, notice: string, tone = "ok") {
  const url = new URL("/admin/launch", request.nextUrl.origin);
  url.searchParams.set("key", key);
  url.searchParams.set("notice", notice);
  url.searchParams.set("tone", tone);
  return NextResponse.redirect(url, 303);
}

function describe(label: string, o: { status: string; detail?: string }): string {
  switch (o.status) {
    case "sent":
      return `${label}: sent.`;
    case "not_configured":
      return `${label}: not set up (${o.detail ?? "unset"}).`;
    case "blocked":
      return `${label}: blocked by the guard (${o.detail ?? "blocked"}).`;
    case "failed":
      return `${label}: failed (${o.detail ?? "error"}).`;
    default:
      return `${label}: skipped.`;
  }
}

/** Launch Center button: send the growth digest to the operator now. */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const key = String(form?.get("key") ?? "");
  if (!isValidAdminKey(key)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const run = await sendGrowthDigest({ trigger: "admin", periodDays: 7 });
  const anySent = run.slack.status === "sent" || run.email.status === "sent";
  const notice = `Growth digest "${run.subject}". ${describe("Slack", run.slack)} ${describe("Email", run.email)}`;
  return back(request, key, notice, anySent ? "ok" : "bad");
}
