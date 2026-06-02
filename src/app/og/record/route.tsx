import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Per-record dynamic OG image.
 *
 * Query params:
 *   title         (required)  — record title
 *   status        (optional)  — short status label, rendered as a dark pill
 *   jurisdiction  (optional)  — rendered as a civic-green pill
 *   type          (optional)  — bill | local | topic | person | committee
 *                                   Drives the eyebrow label and accent.
 *   sources       (optional)  — integer count of indexed source records
 *   nextDate      (optional)  — ISO date YYYY-MM-DD for next milestone
 *   subtitle      (optional)  — short context line under the title
 */
const typeMeta: Record<string, { label: string; accent: string }> = {
  bill: { label: "State bill record", accent: "#2c8c7d" },
  local: { label: "Local council file", accent: "#1f7167" },
  topic: { label: "Topic page", accent: "#a26f19" },
  person: { label: "Person profile", accent: "#07111f" },
  committee: { label: "Committee profile", accent: "#175c55" },
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") ?? "Public-decision record";
  const status = url.searchParams.get("status") ?? "Indexed";
  const jurisdiction = url.searchParams.get("jurisdiction") ?? "Public record";
  const subtitle = url.searchParams.get("subtitle") ?? "";
  const sourcesRaw = url.searchParams.get("sources");
  const sources = sourcesRaw ? Number.parseInt(sourcesRaw, 10) : null;
  const nextDate = url.searchParams.get("nextDate") ?? "";
  const type = url.searchParams.get("type") ?? "bill";
  const meta = typeMeta[type] ?? typeMeta.bill;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fbfaf7",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          color: "#07111f",
          position: "relative",
          padding: 0,
        }}
      >
        {/* Top dark stripe with brand + type stamp */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#07111f",
            color: "white",
            padding: "20px 56px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: meta.accent,
                color: "#07111f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              ★
            </div>
            <span style={{ fontSize: 17, fontWeight: 700 }}>
              By The People, For The People
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: 999,
              fontSize: 11,
              color: "rgba(216,241,235,0.85)",
              fontFamily: "ui-monospace, monospace",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: meta.accent,
                display: "flex",
              }}
            />
            {meta.label}
          </div>
        </div>

        {/* Status + jurisdiction + sources pills */}
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "40px 56px 0",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              background: "#07111f",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "-0.005em",
            }}
          >
            {status}
          </span>
          <span
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              background: "#d8f1eb",
              color: "#175c55",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {jurisdiction}
          </span>
          {sources && sources > 0 ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 14px",
                borderRadius: 999,
                background: "white",
                border: "1px solid #d9dde8",
                color: "#07111f",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {sources} source{sources === 1 ? "" : "s"} indexed
            </span>
          ) : null}
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            padding: "28px 56px 0",
          }}
        >
          <span
            style={{
              fontSize: title.length > 80 ? 48 : title.length > 50 ? 56 : 64,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#07111f",
              maxWidth: 1080,
            }}
          >
            {title}
          </span>
        </div>

        {/* Subtitle */}
        {subtitle ? (
          <div style={{ display: "flex", padding: "16px 56px 0", maxWidth: 1100 }}>
            <span
              style={{
                fontSize: 20,
                lineHeight: 1.4,
                color: "#27364f",
              }}
            >
              {subtitle}
            </span>
          </div>
        ) : null}

        {/* Spacer */}
        <div style={{ display: "flex", flexGrow: 1 }} />

        {/* Footer: proof line + (optional) next date + URL */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0 56px 44px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "16px 20px",
              background: "white",
              borderLeft: `4px solid ${meta.accent}`,
              borderRadius: 6,
              boxShadow: "0 0 0 1px rgba(7,17,31,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontSize: 12,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: meta.accent,
                  fontWeight: 700,
                }}
              >
                Proof
              </span>
              <span style={{ fontSize: 16, color: "#27364f" }}>
                Every claim on this record links to its primary source.
              </span>
            </div>
            {nextDate ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  background: "#fff8eb",
                  border: "1px solid #f5e7c9",
                  borderRadius: 999,
                  fontSize: 12,
                  color: "#a26f19",
                  fontFamily: "ui-monospace, monospace",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Next · {nextDate}
              </div>
            ) : null}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 20,
            }}
          >
            <span
              style={{
                fontSize: 15,
                color: "#40516a",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              bythepeopleforthepeople.com
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 18px",
                background: "#07111f",
                color: "white",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              Open the record →
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
