import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Shareable-quote OG image.
 *
 * Params:
 *   text       (required) — the quote / fact, source-verified
 *   source     (optional) — source title (e.g. "California LegInfo")
 *   sourceUrl  (optional) — official URL
 *   date       (optional) — YYYY-MM-DD verification date
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const text = url.searchParams.get("text") ?? "Quote not provided.";
  const source = url.searchParams.get("source") ?? "By The People, For The People";
  const date = url.searchParams.get("date") ?? "";

  const fontSize = text.length > 220 ? 36 : text.length > 140 ? 44 : 56;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          background: "#fbfaf7",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          color: "#07111f",
          position: "relative",
        }}
      >
        {/* Top dark stripe */}
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
                background: "#4ade80",
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
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(216,241,235,0.85)",
              fontFamily: "ui-monospace, monospace",
              fontWeight: 700,
            }}
          >
            Source-verified quote
          </span>
        </div>

        {/* Main: giant quote */}
        <div
          style={{
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
              gap: 16,
            }}
          >
            <span
              style={{
                fontSize: 100,
                lineHeight: 0.7,
                color: "#4ade80",
                fontFamily: "Georgia, serif",
                fontWeight: 700,
                display: "flex",
                marginTop: -10,
              }}
            >
              &ldquo;
            </span>
            <span
              style={{
                fontSize,
                lineHeight: 1.18,
                fontWeight: 700,
                letterSpacing: "-0.022em",
                color: "#07111f",
                maxWidth: 1030,
              }}
            >
              {text}
            </span>
          </div>
        </div>

        {/* Source + URL */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0 56px 36px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 20px",
              background: "white",
              borderLeft: "4px solid #2c8c7d",
              borderRadius: 6,
              boxShadow: "0 0 0 1px rgba(7,17,31,0.08)",
            }}
          >
            <span
              style={{
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#175c55",
                fontWeight: 700,
              }}
            >
              Source
            </span>
            <span
              style={{
                fontSize: 16,
                color: "#27364f",
                fontWeight: 600,
              }}
            >
              {source}
            </span>
            {date ? (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  fontFamily: "ui-monospace, monospace",
                  color: "#40516a",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                }}
              >
                VERIFIED {date}
              </span>
            ) : null}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 18,
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
                padding: "10px 16px",
                background: "#07111f",
                color: "white",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              See the record →
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
