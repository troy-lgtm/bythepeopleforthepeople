import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Per-cause OG image.
 *
 * Params:
 *   title       (required) — cause title
 *   outcome     (optional) — the user's outcome statement
 *   emoji       (optional) — single-character emoji
 *   matches     (optional) — integer count of currently matched records
 *   reps        (optional) — integer count of matched reps
 *   jurisdictions (optional) — pipe-separated list, first 3 rendered
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") ?? "Track this cause";
  const outcome = url.searchParams.get("outcome") ?? "";
  const emoji = url.searchParams.get("emoji") ?? "★";
  const matches = url.searchParams.get("matches");
  const reps = url.searchParams.get("reps");
  const jurisdictions = (url.searchParams.get("jurisdictions") ?? "")
    .split("|")
    .filter(Boolean)
    .slice(0, 3);

  const titleSize = title.length > 80 ? 56 : title.length > 50 ? 68 : 80;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          background: "#07111f",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          color: "white",
          position: "relative",
        }}
      >
        {/* Civic-green glow */}
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -220,
            width: 660,
            height: 660,
            borderRadius: 9999,
            background:
              "radial-gradient(circle at center, rgba(74,222,128,0.5) 0%, rgba(44,140,125,0.18) 40%, rgba(7,17,31,0) 65%)",
            display: "flex",
          }}
        />

        {/* HEADER: brand + cause stamp */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "44px 56px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#4ade80",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 800,
                color: "#07111f",
              }}
            >
              B
            </div>
            <span style={{ fontSize: 18, fontWeight: 700 }}>
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
              color: "#4ade80",
              fontFamily: "ui-monospace, monospace",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: "#4ade80",
                display: "flex",
              }}
            />
            A cause someone tracks
          </div>
        </div>

        {/* MAIN: emoji + title */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: "50px 56px 0",
            flexGrow: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 24,
            }}
          >
            <span style={{ fontSize: 100, lineHeight: 0.9 }}>{emoji}</span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: 920,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "#4ade80",
                  fontWeight: 800,
                }}
              >
                Causes important to you
              </span>
              <span
                style={{
                  fontSize: titleSize,
                  lineHeight: 0.98,
                  fontWeight: 800,
                  letterSpacing: "-0.035em",
                  marginTop: 12,
                  color: "white",
                }}
              >
                {title}
              </span>
              {outcome ? (
                <span
                  style={{
                    fontSize: 22,
                    lineHeight: 1.4,
                    color: "rgba(255,255,255,0.78)",
                    marginTop: 18,
                    maxWidth: 900,
                  }}
                >
                  {outcome.length > 220
                    ? outcome.slice(0, 217) + "..."
                    : outcome}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* FOOTER: badges + CTA */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 56px 44px",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            {matches ? (
              <Badge label={`${matches} matched records`} />
            ) : null}
            {reps ? <Badge label={`${reps} matched reps`} /> : null}
            {jurisdictions.map((j) => (
              <Badge key={j} label={j} muted />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 22px",
              background: "#4ade80",
              color: "#07111f",
              borderRadius: 999,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.005em",
            }}
          >
            Track your own →
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function Badge({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 14px",
        borderRadius: 999,
        background: muted ? "rgba(255,255,255,0.06)" : "rgba(74,222,128,0.18)",
        border: muted
          ? "1px solid rgba(216,241,235,0.15)"
          : "1px solid rgba(74,222,128,0.5)",
        color: muted ? "rgba(216,241,235,0.85)" : "#4ade80",
        fontSize: 14,
        fontWeight: 700,
        fontFamily: "ui-monospace, monospace",
      }}
    >
      {label}
    </span>
  );
}
