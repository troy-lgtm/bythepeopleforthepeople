import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-static";

/**
 * Variant: "ISSUES" — bold issue-tiles, civic-green accent.
 * For sharing topic pages or social posts about the top issues.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "56px 64px",
          background: "#07111f",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          color: "white",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: -240,
            left: -200,
            width: 700,
            height: 700,
            borderRadius: 9999,
            background:
              "radial-gradient(circle at center, rgba(74,222,128,0.35) 0%, rgba(7,17,31,0) 60%)",
            display: "flex",
          }}
        />
        <div
          style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#4ade80",
              color: "#07111f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            ★
          </div>
          <span style={{ fontSize: 20, fontWeight: 700 }}>
            By The People, For The People
          </span>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            marginTop: 48,
          }}
        >
          <span
            style={{
              fontSize: 14,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#4ade80",
              fontWeight: 700,
            }}
          >
            Top issues. Real records.
          </span>
          <span
            style={{
              fontSize: 76,
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              marginTop: 16,
            }}
          >
            Fires.
            <br />
            Homelessness.
            <br />
            Crime.
          </span>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            gap: 16,
            marginTop: "auto",
            paddingTop: 32,
          }}
        >
          <IssuePill emoji="🔥" label="Fires" />
          <IssuePill emoji="⛺" label="Homelessness" />
          <IssuePill emoji="🛡" label="Crime" />
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 28,
          }}
        >
          <span
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.78)",
            }}
          >
            Source-anchored. Nonpartisan. Built by the people, for the people.
          </span>
          <span
            style={{
              fontSize: 17,
              color: "#4ade80",
              fontFamily: "ui-monospace, monospace",
              fontWeight: 700,
            }}
          >
            bythepeopleforthepeople.com →
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function IssuePill({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 22px",
        background: "rgba(74,222,128,0.12)",
        borderRadius: 999,
        border: "1px solid rgba(74,222,128,0.4)",
      }}
    >
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: "white",
        }}
      >
        {label}
      </span>
    </div>
  );
}
