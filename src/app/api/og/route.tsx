import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const title = searchParams.get("title") || "Idealite";
  const subtitle = searchParams.get("subtitle") || "The Solo Queue is Over";
  const type = searchParams.get("type") || "default"; // "default", "blog", "post"

  // Brand colors from LandingGaming.tsx
  const colors = {
    deepBlue: "#03318c",
    mediumBlue: "#103c96",
    orange: "#f28705",
    gold: "#f2a716",
    cream: "#f2e7c4",
  };

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: colors.deepBlue,
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Decorative border */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            right: "20px",
            bottom: "20px",
            border: `2px solid ${colors.gold}`,
            opacity: 0.3,
            display: "flex",
          }}
        />

        {/* Corner accents */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            width: "40px",
            height: "40px",
            borderTop: `3px solid ${colors.orange}`,
            borderLeft: `3px solid ${colors.orange}`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            width: "40px",
            height: "40px",
            borderTop: `3px solid ${colors.orange}`,
            borderRight: `3px solid ${colors.orange}`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            width: "40px",
            height: "40px",
            borderBottom: `3px solid ${colors.orange}`,
            borderLeft: `3px solid ${colors.orange}`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            width: "40px",
            height: "40px",
            borderBottom: `3px solid ${colors.orange}`,
            borderRight: `3px solid ${colors.orange}`,
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            height: "100%",
            paddingLeft: "40px",
            paddingRight: "40px",
          }}
        >
          {/* Type badge */}
          {type === "blog" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <span
                style={{
                  color: colors.gold,
                  fontSize: "18px",
                  fontWeight: 600,
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                }}
              >
                Blog
              </span>
            </div>
          )}

          {type === "post" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <span
                style={{
                  color: colors.gold,
                  fontSize: "18px",
                  fontWeight: 600,
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                }}
              >
                Article
              </span>
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              color: colors.cream,
              fontSize: type === "post" ? "56px" : "72px",
              fontWeight: 700,
              lineHeight: 1.1,
              margin: 0,
              marginBottom: "24px",
              maxWidth: "900px",
            }}
          >
            {title}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              color: colors.cream,
              fontSize: "28px",
              opacity: 0.8,
              margin: 0,
              maxWidth: "800px",
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: colors.cream,
                fontSize: "32px",
                fontWeight: 800,
                letterSpacing: "2px",
              }}
            >
              IDEALITE
            </span>
            <span
              style={{
                color: colors.orange,
                fontSize: "32px",
                fontWeight: 800,
              }}
            >
              .
            </span>
          </div>

          {/* Tagline */}
          <span
            style={{
              color: colors.gold,
              fontSize: "16px",
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            Level Up Your Learning
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
