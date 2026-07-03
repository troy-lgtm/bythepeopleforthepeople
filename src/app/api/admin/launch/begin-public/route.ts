import { NextResponse, type NextRequest } from "next/server";
import { isValidAdminKey } from "@/lib/admin-auth";
import {
  checklistReady,
  runLaunchChecklist,
} from "@/lib/launch-checklist";
import {
  launchBlockers,
  launchFlags,
  publicLaunchUnlocked,
} from "@/lib/launch-mode";
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
 * The future launch button. Refuses unless EVERY env gate is open
 * (PRIVATE_TEST_MODE=false, GROWTH_LAUNCH_ENABLED=true,
 * ALLOW_PUBLIC_DIGESTS=true, ALLOW_NON_TEST_EMAILS=true) AND the readiness
 * checklist passes. Even then it only updates launch state — it sends
 * nothing. Public digests begin only when real people subscribe and confirm.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const key = String(form?.get("key") ?? "");
  if (!isValidAdminKey(key)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const flags = launchFlags();
  if (!publicLaunchUnlocked(flags)) {
    return back(
      request,
      key,
      `Launch refused. Blocking env flags: ${launchBlockers(flags).join("; ")}. These change in the deployment environment, never from a button.`,
      "bad",
    );
  }

  const checks = await runLaunchChecklist();
  if (!checklistReady(checks)) {
    const failing = checks
      .filter((c) => c.required && c.status !== "pass")
      .map((c) => c.label);
    return back(
      request,
      key,
      `Launch refused. Failing required checks: ${failing.join("; ")}.`,
      "bad",
    );
  }

  const prior = await getLaunchState();
  await setLaunchState({
    ...prior,
    mode: "launched",
    launchedAt: new Date().toISOString(),
    launchedBy: "admin-launch-center",
    checklist: checks.map((c) => ({ id: c.id, status: c.status })),
    updatedAt: new Date().toISOString(),
  });

  return back(
    request,
    key,
    "Public organic launch state recorded. No emails were sent by this action; the growth surfaces are live for organic discovery.",
  );
}
