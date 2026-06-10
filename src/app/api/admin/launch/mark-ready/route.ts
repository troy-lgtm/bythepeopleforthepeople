import { NextResponse, type NextRequest } from "next/server";
import { isValidAdminKey } from "@/lib/admin-auth";
import {
  checklistReady,
  runLaunchChecklist,
} from "@/lib/launch-checklist";
import { getLaunchState, setLaunchState } from "@/lib/launch-state";

export const dynamic = "force-dynamic";

function back(request: NextRequest, key: string, notice: string, tone = "ok") {
  const url = new URL("/admin/launch", request.nextUrl.origin);
  url.searchParams.set("key", key);
  url.searchParams.set("notice", notice);
  url.searchParams.set("tone", tone);
  return NextResponse.redirect(url, 303);
}

/**
 * Launch Center button: record that the product passed internal readiness.
 * Updates launch state only. Emails no one, opens nothing to the public.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const key = String(form?.get("key") ?? "");
  if (!isValidAdminKey(key)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const checks = await runLaunchChecklist();
  if (!checklistReady(checks)) {
    const failing = checks
      .filter((c) => c.required && c.status !== "pass")
      .map((c) => c.label);
    return back(
      request,
      key,
      `Not marked ready. Failing required checks: ${failing.join("; ")}.`,
      "bad",
    );
  }

  const prior = await getLaunchState();
  await setLaunchState({
    ...prior,
    mode: prior.mode === "launched" ? "launched" : "test-ready",
    growthLaunchReadyAt: new Date().toISOString(),
    checklist: checks.map((c) => ({ id: c.id, status: c.status })),
    updatedAt: new Date().toISOString(),
  });

  return back(
    request,
    key,
    "Marked growth launch ready. Launch state updated; nothing was sent and public signups stay closed until the env flags open.",
  );
}
