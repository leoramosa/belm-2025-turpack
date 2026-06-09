import { ImageResponse } from "next/og";

export const alt = "Belm — Skincare y belleza en Perú";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #334155 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            marginBottom: 16,
          }}
        >
          Belm
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            opacity: 0.9,
            maxWidth: 900,
            textAlign: "center",
            lineHeight: 1.35,
          }}
        >
          Skincare, belleza y moda — Perú
        </div>
      </div>
    ),
    { ...size }
  );
}
