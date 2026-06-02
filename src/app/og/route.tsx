import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#07111f",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          color: "white",
          position: "relative",
          padding: 0,
        }}
      >
        {/* Civic-green radial glow, contained to bottom-right so it never bleeds into the headline */}
        <div
          style={{
            position: "absolute",
            bottom: -260,
            right: -260,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background:
              "radial-gradient(circle at center, rgba(74,222,128,0.42) 0%, rgba(44,140,125,0.18) 38%, rgba(7,17,31,0) 65%)",
            display: "flex",
          }}
        />
        {/* Subtle grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            opacity: 0.7,
          }}
        />

        {/* HEADER */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "48px 64px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: "#4ade80",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 800,
                color: "#07111f",
              }}
            >
              ★
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                }}
              >
                By The People, For The People
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(216,241,235,0.7)",
                  marginTop: 4,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Public-decision intelligence
              </span>
            </div>
          </div>
          <span
            style={{
              fontSize: 12,
              color: "rgba(216,241,235,0.55)",
              fontFamily: "ui-monospace, monospace",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Verified 2026-05-21
          </span>
        </div>

        {/* MAIN: ultra-tight type composition */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: "0 64px",
            marginTop: 60,
          }}
        >
          <span
            style={{
              fontSize: 13,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "#4ade80",
              fontWeight: 800,
            }}
          >
            Government accountability the public can actually use
          </span>
          <span
            style={{
              fontSize: 116,
              lineHeight: 0.95,
              fontWeight: 800,
              letterSpacing: "-0.045em",
              color: "white",
              marginTop: 22,
            }}
          >
            Public records.
          </span>
          <span
            style={{
              fontSize: 116,
              lineHeight: 0.95,
              fontWeight: 800,
              letterSpacing: "-0.045em",
              marginTop: 6,
              color: "#4ade80",
            }}
          >
            With proof.
          </span>
        </div>

        {/* FOOTER STRIP */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            padding: "0 64px 48px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 660 }}>
            <span
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.82)",
                lineHeight: 1.4,
              }}
            >
              Every claim links to its primary source.
              Nonpartisan. No endorsements.
              Missing data labeled missing.
            </span>
            <span
              style={{
                fontSize: 16,
                color: "rgba(216,241,235,0.7)",
                marginTop: 14,
                fontFamily: "ui-monospace, monospace",
                letterSpacing: "-0.01em",
              }}
            >
              bythepeopleforthepeople.com
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 26px",
              background: "#4ade80",
              color: "#07111f",
              borderRadius: 999,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.01em",
            }}
          >
            Ask the record →
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
