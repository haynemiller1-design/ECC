"use client";
import CameraViewfinder from "@/components/scanner/CameraViewfinder";

export default function ScanPage() {
  return (
    <div style={{
      minHeight: "100dvh", width: "100%", maxWidth: "100%", overflowX: "hidden",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "72px 20px 40px", background: "var(--bg-obsidian)",
      boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
          VisageIQ · Step 2 of 2
        </p>
        <h1 style={{
          fontSize: 28, fontWeight: 700,
          background: "linear-gradient(135deg, #06B6D4, #10B981)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          Full Face Scan
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14, maxWidth: 380 }}>
          We capture three angles — front, left, and right — for an in-depth structural analysis. Good, even lighting helps. Everything stays on your device.
        </p>
      </div>

      <CameraViewfinder />

      {/* Feature chips */}
      <div style={{ display: "flex", gap: 8, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
        {["3-Angle Capture", "68 Landmarks", "Client-side only", "No data uploaded"].map(f => (
          <span key={f} style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 11,
            border: "1px solid rgba(6,182,212,0.2)",
            background: "rgba(6,182,212,0.06)",
            color: "var(--text-muted)", letterSpacing: "0.06em",
          }}>{f}</span>
        ))}
      </div>
    </div>
  );
}
