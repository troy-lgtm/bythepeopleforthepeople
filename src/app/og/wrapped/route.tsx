import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * "My civic wrapped" share card — a personal recap. All values passed in
 * from the user's real causes; the card invents nothing.
 *
 * Params: causes, matched, moved, topics (pipe-separated), place, format=story
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const causes = url.searchParams.get("causes") ?? "0";
  const causesNum = Number.parseInt(causes, 10) || 0;
  const matched = url.searchParams.get("matched") ?? "0";
  const moved = url.searchParams.get("moved") ?? "0";
  const place = url.searchParams.get("place") ?? "";
  const isStory = url.searchParams.get("format") === "story";
  const topics = (url.searchParams.get("topics") ?? "")
    .split("|")
    .filter(Boolean)
    .slice(0, 4);

  const W = isStory ? 1080 : 1200;
  const H = isStory ? 1920 : 630;
  const pad = isStory ? 72 : 56;

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
            top: -240,
            left: -200,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background:
              "radial-gradient(circle at center, rgba(74,222,128,0.5) 0%, rgba(44,140,125,0.18) 42%, rgba(7,17,31,0) 66%)",
            display: "flex",
          }}
        />

        {/* Brand */}
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

        {/* Headline */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: `${isStory ? 72 : 44}px ${pad}px 0`,
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
            My civic wrapped
          </span>
          <span
            style={{
              fontSize: isStory ? 84 : 66,
              lineHeight: 1.0,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              marginTop: 14,
            }}
          >
            {causes} cause{causesNum === 1 ? "" : "s"} I track
            {place ? ` in ${place}` : ""}
          </span>
        </div>

        {/* Stats */}
        <div
          style={{
            position: "relative",
            display: "flex",
            gap: isStory ? 28 : 22,
            padding: `${isStory ? 72 : 44}px ${pad}px 0`,
            flexGrow: 1,
          }}
        >
          <Stat big={isStory} value={matched} label="records connected" />
          <Stat big={isStory} value={moved} label="moved since I started" />
        </div>

        {/* Topics + footer */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            padding: `0 ${pad}px ${pad}px`,
          }}
        >
          {topics.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {topics.map((t) => (
                <span
                  key={t}
                  style={{
                    display: "flex",
                    padding: "8px 16px",
                    borderRadius: 999,
                    background: "rgba(74,222,128,0.16)",
                    border: "1px solid rgba(74,222,128,0.45)",
                    color: "#4ade80",
                    fontSize: isStory ? 20 : 17,
                    fontWeight: 700,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: isStory ? 20 : 15,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              bythepeopleforthepeople.com
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
              Make your own →
            </div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}

function Stat({
  value,
  label,
  big,
}: {
  value: string;
  label: string;
  big: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontSize: big ? 96 : 76,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: "#4ade80",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: big ? 24 : 18,
          color: "rgba(255,255,255,0.7)",
          marginTop: 8,
        }}
      >
        {label}
      </span>
    </div>
  );
}
