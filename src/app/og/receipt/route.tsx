import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getCatalogCause } from "@/lib/cause-catalog";
import { movementTypeLabel } from "@/lib/movement-digest";
import { getMovementEvent } from "@/lib/movement-store";

export const dynamic = "force-dynamic";

/**
 * Civic Receipt OG card. Looks the movement up by id so the image can never
 * drift from the receipt it represents. Neutral civic palette — no partisan
 * colors anywhere.
 *
 *   /og/receipt?id=mv-bill-ca-sb-79-sb79-t5
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const event = id ? await getMovementEvent(decodeURIComponent(id)) : null;

  const title = event?.title ?? "Civic receipt";
  const causeNames = (event?.causeSlugs ?? [])
    .map((slug) => getCatalogCause(slug)?.name)
    .filter(Boolean)
    .slice(0, 2) as string[];
  const typeLabel = event ? movementTypeLabel(event.movementType) : "Movement";
  const date = event?.occurredAt ?? "";
  const source = event?.sourceLabel ?? "Official record";

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
        }}
      >
        {/* Top stripe: brand + government moved stamp */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#07111f",
            padding: "28px 56px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "0.02em",
            }}
          >
            Government moved
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "#7dd3c0",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            Civic receipt
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            padding: "44px 56px",
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <div
              style={{
                display: "flex",
                background: "#175c55",
                color: "#ffffff",
                fontSize: 20,
                fontWeight: 700,
                padding: "8px 18px",
                borderRadius: 999,
              }}
            >
              {typeLabel}
            </div>
            {causeNames.map((name) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  border: "2px solid #d9dde8",
                  background: "#ffffff",
                  color: "#27364f",
                  fontSize: 20,
                  fontWeight: 600,
                  padding: "8px 18px",
                  borderRadius: 999,
                }}
              >
                {name}
              </div>
            ))}
            {date ? (
              <div
                style={{
                  display: "flex",
                  border: "2px solid #d9dde8",
                  background: "#ffffff",
                  color: "#27364f",
                  fontSize: 20,
                  fontWeight: 600,
                  padding: "8px 18px",
                  borderRadius: 999,
                }}
              >
                {date}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 36,
              fontSize: title.length > 70 ? 44 : 54,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              maxWidth: 1020,
            }}
          >
            {title.length > 120 ? `${title.slice(0, 117)}...` : title}
          </div>
        </div>

        {/* Bottom: source + brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #d9dde8",
            background: "#ffffff",
            padding: "24px 56px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 20,
              color: "#40516a",
              maxWidth: 760,
            }}
          >
            Source: {source.length > 70 ? `${source.slice(0, 67)}...` : source}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 700,
              color: "#175c55",
            }}
          >
            By The People
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
