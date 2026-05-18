import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #059669, #0284c7)",
          color: "white",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 900, marginBottom: 16 }}>
          SpringHub
        </div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>Jaga Semesta</div>
        <div style={{ fontSize: 20, opacity: 0.7, marginTop: 24 }}>
          Community-Driven Spring Monitoring & Restoration
        </div>
      </div>
    ),
    size,
  );
}
