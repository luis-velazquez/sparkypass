import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "SparkyPass — Gamified Texas Master Electrician Exam Prep";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1c1917 0%, #292524 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "24px",
            padding: "8px 20px",
            borderRadius: "999px",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
          }}
        >
          <span style={{ fontSize: "28px" }}>⚡</span>
          <span
            style={{
              color: "#F59E0B",
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            Texas Master Electrician Exam Prep
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "64px",
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            The Only NEC Exam Prep
          </span>
          <span
            style={{
              fontSize: "64px",
              fontWeight: 800,
              color: "#F59E0B",
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            That&apos;s Actually Fun
          </span>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "48px",
            marginTop: "48px",
          }}
        >
          {[
            { value: "500+", label: "Questions" },
            { value: "4", label: "Mini-Games" },
            { value: "2023", label: "NEC" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "40px",
                  fontWeight: 700,
                  color: "#F59E0B",
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontSize: "16px",
                  color: "#A8A29E",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "48px",
            color: "#78716C",
            fontSize: "18px",
          }}
        >
          <span style={{ fontWeight: 700, color: "#D6D3D1", fontSize: "22px" }}>
            SparkyPass
          </span>
          <span>·</span>
          <span>Free 7-Day Trial</span>
          <span>·</span>
          <span>No Credit Card Required</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
