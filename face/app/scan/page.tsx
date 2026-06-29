"use client";
import { useEffect } from "react";
import CameraViewfinder from "@/components/scanner/CameraViewfinder";
import { useTelemetry } from "@/lib/context/TelemetryContext";
import { useScan } from "@/lib/context/ScanContext";

export default function ScanPage() {
  const { state: tele } = useTelemetry();
  const { dispatch } = useScan();

  // Reference model follows the sex chosen during onboarding (no manual toggle).
  useEffect(() => {
    dispatch({ type: "SET_DIMORPHISM", payload: tele.sex === "female" ? "female" : "male" });
  }, [tele.sex, dispatch]);

  return (
    <div style={{
      minHeight: "100dvh", width: "100%", maxWidth: "100%", overflowX: "hidden",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "72px 20px 40px", background: "var(--bg-obsidian)",
      boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
          VisageIQ · Step 2 of 2
        </p>
        <h1 style={{
          fontSize: 28, fontWeight: 700,
          background: "linear-gradient(135deg, #06B6D4, #10B981)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          Live Face Scan
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14, maxWidth: 400 }}>
          Just follow the prompts — the camera reads your face live and captures each view on its own.
          No buttons, nothing leaves your device.
        </p>
      </div>

      <CameraViewfinder />

      {/* Feature chips */}
      <div style={{ display: "flex", gap: 8, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
        {["Live auto-capture", "Front · sides · smile", "68 Landmarks", "On-device only"].map(f => (
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
