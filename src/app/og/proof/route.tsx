import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-static";

/**
 * Variant: "PROOF" — receipt-stack feel.
 * Light background, real-quote receipts overlapping like a stack of source docs.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 0,
          background: "#fbfaf7",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          position: "relative",
          color: "#07111f",
        }}
      >
        {/* Left column: headline */}
        <div
          style={{
            width: "58%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#07111f",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              ★
            </div>
            <span style={{ fontSize: 18, fontWeight: 700 }}>
              By The People, For The People
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 14,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#175c55",
                fontWeight: 700,
              }}
            >
              Proof of every claim.
            </span>
            <span
              style={{
                fontSize: 72,
                lineHeight: 0.98,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                marginTop: 18,
                color: "#07111f",
              }}
            >
              The record.
            </span>
            <span
              style={{
                fontSize: 72,
                lineHeight: 0.98,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                marginTop: 4,
                color: "#2c8c7d",
              }}
            >
              Not the spin.
            </span>
            <span
              style={{
                fontSize: 20,
                lineHeight: 1.4,
                color: "#27364f",
                marginTop: 22,
                maxWidth: 540,
              }}
            >
              Nonpartisan civic intelligence. Every fact links to its primary
              source. Missing data labeled missing.
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 22px",
                background: "#07111f",
                color: "white",
                borderRadius: 10,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              Ask the record →
            </div>
            <span style={{ fontSize: 15, color: "#40516a" }}>
              bythepeopleforthepeople.com
            </span>
          </div>
        </div>

        {/* Right column: receipt stack */}
        <div
          style={{
            width: "42%",
            display: "flex",
            position: "relative",
            background:
              "linear-gradient(135deg, #07111f 0%, #172439 100%)",
            overflow: "hidden",
          }}
        >
          <ReceiptCard
            style={{ top: 60, right: 40, transform: "rotate(-3deg)" }}
            type="ROLL CALL VOTE"
            title="SB 79 Senate concurrence"
            body="21 ayes · 8 noes · 11 NVR"
            source="LegInfo · 2025-09-12"
          />
          <ReceiptCard
            style={{ top: 220, right: 80, transform: "rotate(2deg)" }}
            type="COUNCIL FILE"
            title="CF 22-0617 final action"
            body="Council adopted · Downtown LA Plan Update"
            source="LA City Clerk · 2025-06-18"
          />
          <ReceiptCard
            style={{ top: 380, right: 30, transform: "rotate(-1.5deg)" }}
            type="MISSING DATA"
            title="Federal coverage"
            body="Connector documented · awaiting key"
            source="Honestly labeled"
          />
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function ReceiptCard({
  style,
  type,
  title,
  body,
  source,
}: {
  style?: React.CSSProperties;
  type: string;
  title: string;
  body: string;
  source: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        width: 380,
        padding: "16px 20px",
        background: "white",
        borderRadius: 10,
        boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#175c55",
          fontWeight: 700,
        }}
      >
        {type}
      </span>
      <span
        style={{
          fontSize: 19,
          fontWeight: 700,
          color: "#07111f",
          marginTop: 6,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: 15,
          color: "#27364f",
          marginTop: 6,
          fontFamily: "ui-monospace, monospace",
        }}
      >
        {body}
      </span>
      <span
        style={{
          fontSize: 12,
          color: "#40516a",
          marginTop: 8,
          fontFamily: "ui-monospace, monospace",
        }}
      >
        {source}
      </span>
    </div>
  );
}
