"use client";
import CameraViewfinder from "@/components/scanner/CameraViewfinder";

export default function ScanPage() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24, background: "var(--bg-obsidian)",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
          VisageIQ · Biometric Scanner
        </p>
        <h1 style={{
          fontSize: 28, fontWeight: 700,
          background: "linear-gradient(135deg, #06B6D4, #10B981)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          Facial Landmark Capture
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14 }}>
          68-point mesh · Golden ratio analysis · Dimorphism-aware scoring
        </p>
      </div>

      <CameraViewfinder />

      {/* Feature chips */}
      <div style={{ display: "flex", gap: 8, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
        {["TinyFaceDetector", "68 Landmarks", "Client-side only", "No data uploaded"].map(f => (
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
