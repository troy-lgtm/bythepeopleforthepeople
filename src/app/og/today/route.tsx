import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * "What moved" daily summary card. Real counts + the top headline, passed in
 * by the page. Labeled as indexed changes — not breaking-news invention.
 *
 * Params: count, top (headline), date, format=story
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const count = url.searchParams.get("count") ?? "0";
  const countNum = Number.parseInt(count, 10) || 0;
  const top = url.searchParams.get("top") ?? "";
  const date = url.searchParams.get("date") ?? "";
  const isStory = url.searchParams.get("format") === "story";

  const W = isStory ? 1080 : 1200;
  const H = isStory ? 1920 : 630;
  const pad = isStory ? 72 : 56;
  const topText = top.length > 130 ? `${top.slice(0, 127)}...` : top;

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
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -200,
            width: 680,
            height: 680,
            borderRadius: 9999,
            background:
              "radial-gradient(circle at center, rgba(74,222,128,0.5) 0%, rgba(44,140,125,0.18) 42%, rgba(7,17,31,0) 66%)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: `${pad}px ${pad}px 0`,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 10,
              background: "#4ade80",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
              color: "#07111f",
            }}
          >
            B
          </div>
          <span style={{ fontSize: 19, fontWeight: 700 }}>
            By The People, For The People
          </span>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: `${isStory ? 72 : 48}px ${pad}px 0`,
            flexGrow: 1,
          }}
        >
          <span
            style={{
              fontSize: isStory ? 16 : 14,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "#4ade80",
              fontWeight: 800,
            }}
          >
            What moved in the public record{date ? ` · ${date}` : ""}
          </span>
          <span
            style={{
              fontSize: isStory ? 92 : 72,
              lineHeight: 1.0,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              marginTop: 16,
            }}
          >
            {count} record{countNum === 1 ? "" : "s"} moved
          </span>
          {topText ? (
            <span
              style={{
                fontSize: isStory ? 30 : 24,
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.82)",
                marginTop: 28,
                borderLeft: "4px solid #4ade80",
                paddingLeft: 20,
                maxWidth: isStory ? 920 : 1000,
              }}
            >
              {topText}
            </span>
          ) : null}
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `0 ${pad}px ${pad}px`,
          }}
        >
          <span
            style={{
              fontSize: isStory ? 20 : 15,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            bythepeopleforthepeople.com · sourced, not speculative
          </span>
          <div
            style={{
              display: "flex",
              padding: isStory ? "16px 26px" : "12px 20px",
              background: "#4ade80",
              color: "#07111f",
              borderRadius: 999,
              fontSize: isStory ? 22 : 18,
              fontWeight: 800,
            }}
          >
            See what changed →
          </div>
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}
