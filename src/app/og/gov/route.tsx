import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * "Your government" share card — a true, postable snapshot for one place.
 *
 * Params:
 *   city, state, zip   — place label
 *   district           — e.g. "CA-34" (optional)
 *   reps               — pipe-separated "Name~Role" entries, up to 3
 *   records            — integer: indexed records affecting the area (optional)
 *   format             — "story" → 1080x1920, else 1200x630
 *
 * Every value is passed in by the page from real data — the card never
 * invents anything.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city") ?? "your area";
  const state = url.searchParams.get("state") ?? "";
  const zip = url.searchParams.get("zip") ?? "";
  const district = url.searchParams.get("district") ?? "";
  const records = url.searchParams.get("records");
  const isStory = url.searchParams.get("format") === "story";
  const reps = (url.searchParams.get("reps") ?? "")
    .split("|")
    .filter(Boolean)
    .slice(0, 3)
    .map((entry) => {
      const [name, role] = entry.split("~");
      return { name: name ?? "", role: role ?? "" };
    });

  const W = isStory ? 1080 : 1200;
  const H = isStory ? 1920 : 630;
  const pad = isStory ? 72 : 56;
  const placeSize = isStory ? 76 : 60;
  const repNameSize = isStory ? 46 : 34;
  const repRoleSize = isStory ? 24 : 18;

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
        {/* Civic-green glow */}
        <div
          style={{
            position: "absolute",
            top: isStory ? -260 : -220,
            right: -220,
            width: isStory ? 760 : 660,
            height: isStory ? 760 : 660,
            borderRadius: 9999,
            background:
              "radial-gradient(circle at center, rgba(74,222,128,0.5) 0%, rgba(44,140,125,0.18) 40%, rgba(7,17,31,0) 65%)",
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

        {/* Headline + place */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: `${isStory ? 64 : 40}px ${pad}px 0`,
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
            Your government, by level
          </span>
          <span
            style={{
              fontSize: placeSize,
              lineHeight: 1.0,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginTop: 14,
            }}
          >
            {city}
            {state ? `, ${state}` : ""}
          </span>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            {zip ? <Tag label={zip} /> : null}
            {district ? <Tag label={`District ${district}`} /> : null}
            {records ? <Tag label={`${records} records nearby`} accent /> : null}
          </div>
        </div>

        {/* Reps */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: isStory ? 22 : 14,
            padding: `${isStory ? 64 : 36}px ${pad}px 0`,
            flexGrow: 1,
          }}
        >
          <span
            style={{
              fontSize: isStory ? 22 : 16,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 700,
            }}
          >
            Who represents you
          </span>
          {reps.map((rep, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                borderLeft: "4px solid #4ade80",
                paddingLeft: isStory ? 22 : 16,
              }}
            >
              <span
                style={{
                  fontSize: repNameSize,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                {rep.name}
              </span>
              <span
                style={{
                  fontSize: repRoleSize,
                  color: "rgba(255,255,255,0.62)",
                  marginTop: 2,
                }}
              >
                {rep.role}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
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
            bythepeopleforthepeople.com · nonpartisan · sourced
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: isStory ? "16px 26px" : "12px 20px",
              background: "#4ade80",
              color: "#07111f",
              borderRadius: 999,
              fontSize: isStory ? 22 : 18,
              fontWeight: 800,
            }}
          >
            See your reps →
          </div>
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}

function Tag({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 16px",
        borderRadius: 999,
        background: accent ? "rgba(74,222,128,0.18)" : "rgba(255,255,255,0.07)",
        border: accent
          ? "1px solid rgba(74,222,128,0.5)"
          : "1px solid rgba(216,241,235,0.15)",
        color: accent ? "#4ade80" : "rgba(216,241,235,0.85)",
        fontSize: 16,
        fontWeight: 700,
        fontFamily: "ui-monospace, monospace",
      }}
    >
      {label}
    </span>
  );
}
