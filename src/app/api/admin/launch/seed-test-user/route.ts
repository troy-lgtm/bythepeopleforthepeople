import { NextResponse, type NextRequest } from "next/server";
import { isValidAdminKey } from "@/lib/admin-auth";
import { catalogCauseToCause, getCatalogCause } from "@/lib/cause-catalog";
import { launchFlags } from "@/lib/launch-mode";
import { getSubscriber, newToken, upsertSubscriber } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

const SEED_ZIP = "90046";
const SEED_CAUSE_SLUGS = [
  "homelessness",
  "housing",
  "fires",
  "crime",
  "land-use",
];

function back(request: NextRequest, key: string, notice: string, tone = "ok") {
  const url = new URL("/admin/launch", request.nextUrl.origin);
  url.searchParams.set("key", key);
  url.searchParams.set("notice", notice);
  url.searchParams.set("tone", tone);
  return NextResponse.redirect(url, 303);
}

/**
 * Launch Center button: seed the test user's persistent watchlist (same
 * upsert as npm run seed:test-user, but against this deployment's store).
 * Creates exactly one subscriber — the configured test user — and sends
 * nothing.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const key = String(form?.get("key") ?? "");
  if (!isValidAdminKey(key)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const flags = launchFlags();
  const email = flags.testUserEmail;
  const now = new Date().toISOString();
  const causes = SEED_CAUSE_SLUGS.map((slug) => {
    const c = getCatalogCause(slug);
    if (!c) throw new Error(`Catalog cause missing: ${slug}`);
    return catalogCauseToCause(c);
  });

  const existing = await getSubscriber(email);
  await upsertSubscriber({
    email,
    zip: existing?.zip ?? SEED_ZIP,
    causes,
    cadence: existing?.cadence ?? "weekly",
    token: existing?.token ?? newToken(),
    confirmed: true,
    createdAt: existing?.createdAt ?? now,
    confirmedAt: existing?.confirmedAt ?? now,
    lastSentAt: existing?.lastSentAt,
    isTestUser: true,
    source: existing?.source ?? "admin-seed",
  });

  return back(
    request,
    key,
    `Seeded ${email}: ZIP ${existing?.zip ?? SEED_ZIP}, causes ${SEED_CAUSE_SLUGS.join(", ")}, confirmed. Nothing was sent.`,
  );
}
